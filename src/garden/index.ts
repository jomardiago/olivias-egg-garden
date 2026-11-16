/**
 * The Garden core: the one pure module holding every domain rule.
 * It never reads the clock, randomness, storage or UI. Callers pass
 * a Garden, a Command and the injected dependencies (today, random),
 * and get back the new Garden plus the Events that describe what happened.
 */
import { LAUNCH_CATALOG, type Catalog } from '../catalog/families.ts'

import { dayBefore, isCalendarDate, isSchoolDay, type LocalDate } from './dates.ts'

export { eggStage, type EggStage } from './eggStage.ts'
export { dayBefore, isSchoolDay, utcDate, type LocalDate } from './dates.ts'

export type StarEntry = { date: LocalDate; stars: number }

export type HatchedCharacter = { characterId: string; hatchedOn: LocalDate }

/** An Egg filling with Stars. Its Character was secretly picked when the Egg was chosen. */
export type Egg = {
  status: 'egg'
  familyId: string
  characterId: string
  hatchTarget: number
  stars: number
}

/** After a Hatch: waiting for the child to pick her next Egg, holding the carried-over Stars. */
export type AwaitingEggChoice = {
  status: 'awaitingChoice'
  carriedOverStars: number
}

export type ActiveEgg = Egg | AwaitingEggChoice

export type Garden = {
  schemaVersion: 1
  childName: string
  muted: boolean
  starEntries: StarEntry[]
  hatchedCharacters: HatchedCharacter[]
  eggsHatched: number
  activeEgg: ActiveEgg
}

export type Command =
  /** Parent Area: mute or unmute all sound. */
  | { type: 'SetMuted'; muted: boolean }
  | { type: 'MakeStarEntry'; stars: number }
  /** Pick the next Egg by Egg Family; the Character inside is a random surprise. */
  | { type: 'ChooseEgg'; familyId: string }
  /** Parent Area: a Star Entry for a forgotten past School Day. */
  | { type: 'AddMissedStarEntry'; date: LocalDate; stars: number }
  /** Parent Area: change the Stars of an existing Star Entry. Never un-hatches a Character. */
  | { type: 'CorrectStarEntry'; date: LocalDate; stars: number }
  /** Parent Area: the name shown in the Garden title and the hatch celebrations. */
  | { type: 'SetChildName'; name: string }
  /** Parent Area: replace everything with the Garden saved in a backup file (its text). */
  | { type: 'RestoreBackup'; backup: string }
  /** Parent Area: start over with a fresh Garden. The UI asks for confirmation twice first. */
  | { type: 'Reset' }

export type GardenEvent =
  /** Parent Area: sound was switched off (`muted`) or on. */
  | { type: 'MuteChanged'; muted: boolean }
  /**
   * Stars went into the active Egg: it held `eggStarsBefore`, and `eggStars` is its fill
   * afterwards (capped at the Hatch Target, so overfilling Stars are carried over).
   */
  | { type: 'StarsAdded'; stars: number; eggStarsBefore: number; eggStars: number; hatchTarget: number }
  | { type: 'ZeroStarDayRecorded' }
  /** The full Egg of `familyId` (its Hatch Target is `hatchTarget`) hatched `characterId`. */
  | { type: 'EggHatched'; characterId: string; familyId: string; hatchTarget: number }
  /** The child must pick her next Egg from these Egg Families (catalog order). */
  | { type: 'EggChoiceNeeded'; familyIds: string[] }
  /** A new Egg of `familyId` now rests in the nest, already holding `eggStars` carried-over Stars. */
  | { type: 'EggChosen'; familyId: string; eggStars: number; hatchTarget: number }
  /** A Star Entry's Stars were changed; any Stars this added to the Egg follow as `StarsAdded`. */
  | { type: 'StarEntryCorrected'; date: LocalDate; previousStars: number; stars: number }
  /** The last Character in the catalog has hatched; later Stars are banked for a future Egg Family. */
  | { type: 'CollectionComplete'; bankedStars: number }
  /** After Collection complete, a Star Entry's Stars were banked; `bankedStars` is the new total. */
  | { type: 'StarsBanked'; stars: number; bankedStars: number }
  | { type: 'ChildNameSet'; name: string }
  | { type: 'BackupRestored' }
  | { type: 'GardenReset' }
  | { type: 'CommandRejected'; reason: RejectionReason }

export type RejectionReason =
  | 'StarsOutOfRange'
  | 'NotASchoolDay'
  | 'AlreadyEnteredToday'
  | 'AwaitingEggChoice'
  | 'NotAwaitingEggChoice'
  | 'EggFamilyNotAvailable'
  | 'NotAPastDate'
  | 'InvalidDate'
  /** A past School Day that already has its one Star Entry. */
  | 'AlreadyEntered'
  | 'NoStarEntryOnDate'
  | 'EmptyName'
  /** The backup file is not a readable Garden: not JSON, or its contents do not add up. */
  | 'BackupCorrupt'
  /** The backup file was made by a version of the app this one does not know. */
  | 'BackupUnknownVersion'

export type Deps = {
  /** Today's device-local date. */
  today: LocalDate
  /** Returns a number in [0, 1), like Math.random. */
  random: () => number
  /** The Character catalog; defaults to the launch catalog. Tests may pass their own. */
  catalog?: Catalog
}

export type Result = { garden: Garden; events: GardenEvent[] }

/**
 * A fresh Garden whose first Egg is ready to fill. Its Egg Family and
 * Character are picked with `random` (deterministic by default).
 */
export function createGarden(random: () => number = () => 0, catalog: Catalog = LAUNCH_CATALOG): Garden {
  const empty: Garden = {
    schemaVersion: 1,
    childName: 'Olivia',
    muted: false,
    starEntries: [],
    hatchedCharacters: [],
    eggsHatched: 0,
    activeEgg: { status: 'awaitingChoice', carriedOverStars: 0 },
  }
  const families = availableEggFamilies(empty, catalog)
  const familyId = families[pickIndex(random, families.length)]
  if (!familyId) return empty
  return { ...empty, activeEgg: makeEgg(empty, familyId, random, catalog) }
}

/** The Hatch Target ladder: 2, then 5, then 8, then 10 for every later Egg. */
const HATCH_TARGET_LADDER = [2, 5, 8] as const
const LATER_HATCH_TARGET = 10

/** The most Stars one School Day can earn. */
export const MAX_STARS = 3

/** The Star counts a Star Entry can have, `from` to `MAX_STARS`; the UI lists these as its choices. */
export function starsRange(from = 0): number[] {
  return Array.from({ length: MAX_STARS - from + 1 }, (_, i) => from + i)
}

/** The latest past day a missed Star Entry can be added for: the day before `today`. */
export function latestMissedDay(today: LocalDate): LocalDate {
  return dayBefore(today)
}

/** Whether an Egg is resting in the nest, as opposed to awaiting a choice or the Collection being complete. */
export function hasActiveEgg(garden: Garden): garden is Garden & { activeEgg: Egg } {
  return garden.activeEgg.status === 'egg'
}

/** The Stars banked for a future Egg Family once the Collection is complete; 0 otherwise. */
export function bankedStars(garden: Garden, catalog: Catalog = LAUNCH_CATALOG): number {
  return garden.activeEgg.status === 'awaitingChoice' && isCollectionComplete(garden, catalog) ? garden.activeEgg.carriedOverStars : 0
}

/** The Egg Families the child must choose from now: empty unless awaiting an Egg choice. */
export function choosableEggFamilies(garden: Garden, catalog: Catalog = LAUNCH_CATALOG): string[] {
  return garden.activeEgg.status === 'awaitingChoice' ? availableEggFamilies(garden, catalog) : []
}

function hatchTargetFor(eggsHatched: number): number {
  return HATCH_TARGET_LADDER[eggsHatched] ?? LATER_HATCH_TARGET
}

/** Egg Families that still have unhatched Characters, in catalog order. */
export function availableEggFamilies(garden: Garden, catalog: Catalog = LAUNCH_CATALOG): string[] {
  return catalog.filter((family) => unhatchedCharacters(garden, family.id, catalog).length > 0).map((f) => f.id)
}

/**
 * Every Character in the catalog has hatched: no Egg is offered, and
 * Star Entries bank their Stars (the carried-over Stars) until a catalog
 * update adds an Egg Family, which then makes the Garden await a choice again.
 */
export function isCollectionComplete(garden: Garden, catalog: Catalog = LAUNCH_CATALOG): boolean {
  return garden.activeEgg.status === 'awaitingChoice' && availableEggFamilies(garden, catalog).length === 0
}

function unhatchedCharacters(garden: Garden, familyId: string, catalog: Catalog): string[] {
  const hatched = new Set(garden.hatchedCharacters.map((h) => h.characterId))
  const family = catalog.find((f) => f.id === familyId)
  return (family?.characters ?? []).map((c) => c.id).filter((id) => !hatched.has(id))
}

function pickIndex(random: () => number, length: number): number {
  return Math.min(length - 1, Math.max(0, Math.floor(random() * length)))
}

/** A new, empty Egg of `familyId` (not yet in the nest) with a Character picked at random from its unhatched ones. */
function makeEgg(garden: Garden, familyId: string, random: () => number, catalog: Catalog): Egg {
  const candidates = unhatchedCharacters(garden, familyId, catalog)
  return {
    status: 'egg',
    familyId,
    characterId: candidates[pickIndex(random, candidates.length)] ?? '',
    hatchTarget: hatchTargetFor(garden.eggsHatched),
    stars: 0,
  }
}

export function handle(garden: Garden, command: Command, deps: Deps): Result {
  switch (command.type) {
    case 'SetMuted':
      return { garden: { ...garden, muted: command.muted }, events: [{ type: 'MuteChanged', muted: command.muted }] }
    case 'MakeStarEntry':
      return recordStarEntry(garden, deps.today, command.stars, deps)
    case 'ChooseEgg':
      return chooseEgg(garden, command.familyId, deps)
    case 'AddMissedStarEntry':
      return addMissedStarEntry(garden, command.date, command.stars, deps)
    case 'CorrectStarEntry':
      return correctStarEntry(garden, command.date, command.stars, deps)
    case 'SetChildName':
      return setChildName(garden, command.name)
    case 'RestoreBackup':
      return restoreBackup(garden, command.backup, deps)
    case 'Reset':
      return { garden: createGarden(deps.random, deps.catalog), events: [{ type: 'GardenReset' }] }
  }
}

function setChildName(garden: Garden, name: string): Result {
  const trimmed = name.trim()
  if (trimmed === '') return rejected(garden, 'EmptyName')
  return { garden: { ...garden, childName: trimmed }, events: [{ type: 'ChildNameSet', name: trimmed }] }
}

/** The backup file's text: the whole Garden state, including its schema version. */
export function exportBackup(garden: Garden): string {
  return JSON.stringify(garden, null, 2)
}

function restoreBackup(garden: Garden, backup: string, deps: Deps): Result {
  let parsed: unknown
  try {
    parsed = JSON.parse(backup)
  } catch {
    return rejected(garden, 'BackupCorrupt')
  }
  if (!isRecord(parsed)) return rejected(garden, 'BackupCorrupt')
  if (parsed.schemaVersion !== 1) return rejected(garden, 'BackupUnknownVersion')
  const restored = readGarden(parsed, deps.catalog ?? LAUNCH_CATALOG)
  if (!restored) return rejected(garden, 'BackupCorrupt')
  return { garden: restored, events: [{ type: 'BackupRestored' }] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

/** Fully validates a parsed backup; returns a clean Garden (no extra fields), or null if anything is off. */
function readGarden(data: Record<string, unknown>, catalog: Catalog): Garden | null {
  const { childName, muted, starEntries, hatchedCharacters, eggsHatched } = data
  if (typeof childName !== 'string' || childName.trim() === '') return null
  if (typeof muted !== 'boolean') return null
  if (!isCount(eggsHatched)) return null
  if (!Array.isArray(starEntries) || !Array.isArray(hatchedCharacters)) return null

  const entries: StarEntry[] = []
  const seenDates = new Set<string>()
  for (const entry of starEntries) {
    if (!isRecord(entry) || typeof entry.date !== 'string' || !isCalendarDate(entry.date)) return null
    if (!isSchoolDay(entry.date)) return null
    if (typeof entry.stars !== 'number' || !isValidStars(entry.stars) || seenDates.has(entry.date)) return null
    seenDates.add(entry.date)
    entries.push({ date: entry.date, stars: entry.stars })
  }

  const knownCharacters = new Set(catalog.flatMap((family) => family.characters.map((c) => c.id)))
  const hatched: HatchedCharacter[] = []
  const seenCharacters = new Set<string>()
  for (const item of hatchedCharacters) {
    if (!isRecord(item) || typeof item.characterId !== 'string' || typeof item.hatchedOn !== 'string') return null
    if (!knownCharacters.has(item.characterId) || seenCharacters.has(item.characterId) || !isCalendarDate(item.hatchedOn)) return null
    seenCharacters.add(item.characterId)
    hatched.push({ characterId: item.characterId, hatchedOn: item.hatchedOn })
  }

  if (eggsHatched !== hatched.length) return null

  const activeEgg = readActiveEgg(data.activeEgg, catalog, eggsHatched, seenCharacters)
  if (!activeEgg) return null
  return { schemaVersion: 1, childName: childName.trim(), muted, starEntries: entries, hatchedCharacters: hatched, eggsHatched, activeEgg }
}

function readActiveEgg(value: unknown, catalog: Catalog, eggsHatched: number, hatchedIds: ReadonlySet<string>): ActiveEgg | null {
  if (!isRecord(value)) return null
  if (value.status === 'awaitingChoice') {
    return isCount(value.carriedOverStars) ? { status: 'awaitingChoice', carriedOverStars: value.carriedOverStars } : null
  }
  if (value.status !== 'egg') return null
  const { familyId, characterId, hatchTarget, stars } = value
  if (typeof familyId !== 'string' || typeof characterId !== 'string') return null
  const family = catalog.find((f) => f.id === familyId)
  if (!family || !family.characters.some((c) => c.id === characterId) || hatchedIds.has(characterId)) return null
  if (hatchTarget !== hatchTargetFor(eggsHatched) || !isCount(stars) || stars >= hatchTarget) return null
  return { status: 'egg', familyId, characterId, hatchTarget, stars }
}

function chooseEgg(garden: Garden, familyId: string, deps: Deps): Result {
  const waiting = garden.activeEgg
  if (waiting.status !== 'awaitingChoice') return rejected(garden, 'NotAwaitingEggChoice')
  if (!availableEggFamilies(garden, deps.catalog).includes(familyId)) return rejected(garden, 'EggFamilyNotAvailable')
  return putEggInNest(garden, familyId, waiting.carriedOverStars, deps)
}

/**
 * Makes a new Egg of `familyId` in the nest with the carried-over Stars
 * already inside; if they meet its Hatch Target it hatches straight away.
 */
function putEggInNest(garden: Garden, familyId: string, carriedOverStars: number, deps: Deps): Result {
  const egg = makeEgg(garden, familyId, deps.random, deps.catalog ?? LAUNCH_CATALOG)
  const eggStars = Math.min(carriedOverStars, egg.hatchTarget)
  const chosen: GardenEvent = { type: 'EggChosen', familyId, eggStars, hatchTarget: egg.hatchTarget }
  if (carriedOverStars < egg.hatchTarget) {
    return { garden: { ...garden, activeEgg: { ...egg, stars: carriedOverStars } }, events: [chosen] }
  }
  const hatched = hatch(garden, egg, carriedOverStars - egg.hatchTarget, deps)
  return { garden: hatched.garden, events: [chosen, ...hatched.events] }
}

function rejected(garden: Garden, reason: RejectionReason): Result {
  return { garden, events: [{ type: 'CommandRejected', reason }] }
}

/** ISO `YYYY-MM-DD` dates compare in calendar order as plain strings. */
function addMissedStarEntry(garden: Garden, date: LocalDate, stars: number, deps: Deps): Result {
  if (!isCalendarDate(date)) return rejected(garden, 'InvalidDate')
  if (!(date < deps.today)) return rejected(garden, 'NotAPastDate')
  if (hasStarEntry(garden, date)) return rejected(garden, 'AlreadyEntered')
  return recordStarEntry(garden, date, stars, deps)
}

/**
 * An increase goes in like extra Stars (into the Egg, or onto the
 * carried-over Stars while awaiting a choice). A decrease comes only out
 * of the active Egg or the carried-over Stars, never below 0, and never
 * takes back a hatched Character.
 */
function correctStarEntry(garden: Garden, date: LocalDate, stars: number, deps: Deps): Result {
  if (!isValidStars(stars)) return rejected(garden, 'StarsOutOfRange')
  const entry = garden.starEntries.find((e) => e.date === date)
  if (!entry) return rejected(garden, 'NoStarEntryOnDate')
  const corrected: Garden = {
    ...garden,
    starEntries: garden.starEntries.map((e) => (e.date === date ? { date, stars } : e)),
  }
  const correctedEvent: GardenEvent = { type: 'StarEntryCorrected', date, previousStars: entry.stars, stars }
  const difference = stars - entry.stars
  const egg = corrected.activeEgg
  if (difference > 0 && egg.status === 'egg') {
    const added = addStars(corrected, difference, deps)
    return { garden: added.garden, events: [correctedEvent, ...added.events] }
  }
  const activeEgg: ActiveEgg =
    egg.status === 'egg'
      ? { ...egg, stars: Math.max(0, egg.stars + difference) }
      : { ...egg, carriedOverStars: Math.max(0, egg.carriedOverStars + difference) }
  return { garden: { ...corrected, activeEgg }, events: [correctedEvent] }
}

/** The Star Entries for the Parent Area's history, newest School Day first. */
export function starEntryHistory(garden: Garden): StarEntry[] {
  return [...garden.starEntries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

function hasStarEntry(garden: Garden, date: LocalDate): boolean {
  return garden.starEntries.some((entry) => entry.date === date)
}

function recordStarEntry(garden: Garden, date: LocalDate, stars: number, deps: Deps): Result {
  const rejection = starEntryRejection(garden, date, stars, deps.catalog)
  if (rejection) return rejected(garden, rejection)
  const recorded: Garden = {
    ...garden,
    starEntries: [...garden.starEntries, { date, stars }],
  }
  return addStars(recorded, stars, deps)
}

/** Whether a Star Entry can be made today; the UI uses it to show or hide the star button. */
export function canMakeStarEntry(garden: Garden, today: LocalDate, catalog: Catalog = LAUNCH_CATALOG): boolean {
  return starEntryRejection(garden, today, 0, catalog) === null
}

function starEntryRejection(garden: Garden, date: LocalDate, stars: number, catalog: Catalog = LAUNCH_CATALOG): RejectionReason | null {
  if (!isValidStars(stars)) return 'StarsOutOfRange'
  if (!isSchoolDay(date)) return 'NotASchoolDay'
  if (hasStarEntry(garden, date)) return 'AlreadyEnteredToday'
  // The UI makes her choose her next Egg first, unless there is no Egg left to choose.
  if (garden.activeEgg.status === 'awaitingChoice' && !isCollectionComplete(garden, catalog)) return 'AwaitingEggChoice'
  return null
}

function isValidStars(stars: number): boolean {
  return Number.isInteger(stars) && stars >= 0 && stars <= MAX_STARS
}

function addStars(garden: Garden, stars: number, deps: Deps): Result {
  if (stars === 0) return { garden, events: [{ type: 'ZeroStarDayRecorded' }] }
  const egg = garden.activeEgg
  if (egg.status !== 'egg') {
    // Collection complete: bank the Stars as carried-over Stars for a future Egg Family.
    const bankedStars = egg.carriedOverStars + stars
    return {
      garden: { ...garden, activeEgg: { ...egg, carriedOverStars: bankedStars } },
      events: [{ type: 'StarsBanked', stars, bankedStars }],
    }
  }
  const total = egg.stars + stars
  if (total < egg.hatchTarget) {
    return {
      garden: { ...garden, activeEgg: { ...egg, stars: total } },
      events: [{ type: 'StarsAdded', stars, eggStarsBefore: egg.stars, eggStars: total, hatchTarget: egg.hatchTarget }],
    }
  }
  const hatched = hatch(garden, egg, total - egg.hatchTarget, deps)
  return {
    garden: hatched.garden,
    events: [
      { type: 'StarsAdded', stars, eggStarsBefore: egg.stars, eggStars: egg.hatchTarget, hatchTarget: egg.hatchTarget },
      ...hatched.events,
    ],
  }
}

/**
 * Hatches `egg`, then the next Egg is up to the child: she is asked to
 * choose, unless only one Egg Family has Characters left, whose Egg is
 * then chosen for her.
 */
function hatch(garden: Garden, egg: Egg, carriedOverStars: number, deps: Deps): Result {
  const hatchedGarden: Garden = {
    ...garden,
    hatchedCharacters: [...garden.hatchedCharacters, { characterId: egg.characterId, hatchedOn: deps.today }],
    eggsHatched: garden.eggsHatched + 1,
    activeEgg: { status: 'awaitingChoice', carriedOverStars },
  }
  const hatchedEvent: GardenEvent = { type: 'EggHatched', characterId: egg.characterId, familyId: egg.familyId, hatchTarget: egg.hatchTarget }
  const familyIds = availableEggFamilies(hatchedGarden, deps.catalog)
  const [onlyFamily] = familyIds
  if (familyIds.length === 1 && onlyFamily) {
    const placed = putEggInNest(hatchedGarden, onlyFamily, carriedOverStars, deps)
    return { garden: placed.garden, events: [hatchedEvent, ...placed.events] }
  }
  if (familyIds.length === 0) {
    return { garden: hatchedGarden, events: [hatchedEvent, { type: 'CollectionComplete', bankedStars: carriedOverStars }] }
  }
  return { garden: hatchedGarden, events: [hatchedEvent, { type: 'EggChoiceNeeded', familyIds }] }
}
