/**
 * The Garden core: the one pure module holding every domain rule.
 * It never reads the clock, randomness, storage or UI. Callers pass
 * a Garden, a Command and the injected dependencies (today, random),
 * and get back the new Garden plus the Events that describe what happened.
 */
import { LAUNCH_CATALOG, type Catalog } from '../catalog/families.ts'

/** A device-local calendar date, formatted `YYYY-MM-DD`. */
export type LocalDate = string

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
  | { type: 'MakeStarEntry'; stars: number }
  /** Pick the next Egg by Egg Family; the Character inside is a random surprise. */
  | { type: 'ChooseEgg'; familyId: string }

export type GardenEvent =
  /** Stars went into the active Egg; `eggStars` is its fill afterwards (capped at the Hatch Target). */
  | { type: 'StarsAdded'; stars: number; eggStars: number; hatchTarget: number }
  | { type: 'ZeroStarDayRecorded' }
  | { type: 'EggHatched'; characterId: string }
  /** The child must pick her next Egg from these Egg Families (catalog order). */
  | { type: 'EggChoiceNeeded'; familyIds: string[] }
  /** A new Egg of `familyId` now rests in the nest, already holding `eggStars` carried-over Stars. */
  | { type: 'EggChosen'; familyId: string; eggStars: number; hatchTarget: number }
  /** The last Character in the catalog has hatched; later Stars are banked for a future Egg Family. */
  | { type: 'CollectionComplete'; bankedStars: number }
  /** After Collection complete, a Star Entry's Stars were banked; `bankedStars` is the new total. */
  | { type: 'StarsBanked'; stars: number; bankedStars: number }
  | { type: 'CommandRejected'; reason: RejectionReason }

export type RejectionReason =
  | 'StarsOutOfRange'
  | 'NotASchoolDay'
  | 'AlreadyEnteredToday'
  | 'AwaitingEggChoice'
  | 'NotAwaitingEggChoice'
  | 'EggFamilyNotAvailable'

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
  return { ...empty, activeEgg: newEgg(empty, familyId, random, catalog) }
}

/** The Hatch Target ladder: 2, then 5, then 8, then 10 for every later Egg. */
const HATCH_TARGET_LADDER = [2, 5, 8] as const
const LATER_HATCH_TARGET = 10

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

/** A new, empty Egg of `familyId` with a Character picked at random from its unhatched ones. */
function newEgg(garden: Garden, familyId: string, random: () => number, catalog: Catalog): Egg {
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
    case 'MakeStarEntry':
      return makeStarEntry(garden, command.stars, deps)
    case 'ChooseEgg':
      return chooseEgg(garden, command.familyId, deps)
  }
}

function chooseEgg(garden: Garden, familyId: string, deps: Deps): Result {
  const waiting = garden.activeEgg
  if (waiting.status !== 'awaitingChoice') return rejected(garden, 'NotAwaitingEggChoice')
  if (!availableEggFamilies(garden, deps.catalog).includes(familyId)) return rejected(garden, 'EggFamilyNotAvailable')
  return placeEgg(garden, familyId, waiting.carriedOverStars, deps)
}

/**
 * Puts a new Egg of `familyId` in the nest with the carried-over Stars
 * already inside; if they meet its Hatch Target it hatches straight away.
 */
function placeEgg(garden: Garden, familyId: string, carriedOverStars: number, deps: Deps): Result {
  const egg = newEgg(garden, familyId, deps.random, deps.catalog ?? LAUNCH_CATALOG)
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

function makeStarEntry(garden: Garden, stars: number, deps: Deps): Result {
  const rejection = starEntryRejection(garden, deps.today, stars, deps.catalog)
  if (rejection) return rejected(garden, rejection)
  const recorded: Garden = {
    ...garden,
    starEntries: [...garden.starEntries, { date: deps.today, stars }],
  }
  return addStars(recorded, stars, deps)
}

/** Whether a Star Entry can be made today; the UI uses it to show or hide the star button. */
export function canMakeStarEntry(garden: Garden, today: LocalDate, catalog: Catalog = LAUNCH_CATALOG): boolean {
  return starEntryRejection(garden, today, 0, catalog) === null
}

/** School Days are Monday to Friday by the device-local calendar date. */
export function isSchoolDay(date: LocalDate): boolean {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)).getUTCDay()
  return weekday >= 1 && weekday <= 5
}

function starEntryRejection(garden: Garden, date: LocalDate, stars: number, catalog: Catalog = LAUNCH_CATALOG): RejectionReason | null {
  if (!Number.isInteger(stars) || stars < 0 || stars > MAX_STARS) return 'StarsOutOfRange'
  if (!isSchoolDay(date)) return 'NotASchoolDay'
  if (garden.starEntries.some((entry) => entry.date === date)) return 'AlreadyEnteredToday'
  // The UI makes her choose her next Egg first, unless there is no Egg left to choose.
  if (garden.activeEgg.status === 'awaitingChoice' && !isCollectionComplete(garden, catalog)) return 'AwaitingEggChoice'
  return null
}

const MAX_STARS = 3

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
      events: [{ type: 'StarsAdded', stars, eggStars: total, hatchTarget: egg.hatchTarget }],
    }
  }
  const hatched = hatch(garden, egg, total - egg.hatchTarget, deps)
  return {
    garden: hatched.garden,
    events: [{ type: 'StarsAdded', stars, eggStars: egg.hatchTarget, hatchTarget: egg.hatchTarget }, ...hatched.events],
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
  const hatchedEvent: GardenEvent = { type: 'EggHatched', characterId: egg.characterId }
  const familyIds = availableEggFamilies(hatchedGarden, deps.catalog)
  const [onlyFamily] = familyIds
  if (familyIds.length === 1 && onlyFamily) {
    const placed = placeEgg(hatchedGarden, onlyFamily, carriedOverStars, deps)
    return { garden: placed.garden, events: [hatchedEvent, ...placed.events] }
  }
  if (familyIds.length === 0) {
    return { garden: hatchedGarden, events: [hatchedEvent, { type: 'CollectionComplete', bankedStars: carriedOverStars }] }
  }
  return { garden: hatchedGarden, events: [hatchedEvent, { type: 'EggChoiceNeeded', familyIds }] }
}
