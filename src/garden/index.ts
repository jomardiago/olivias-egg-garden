/**
 * The Garden core: the one pure module holding every domain rule.
 * It never reads the clock, randomness, storage or UI. Callers pass
 * a Garden, a Command and the injected dependencies (today, random),
 * and get back the new Garden plus the Events that describe what happened.
 */

/** A device-local calendar date, formatted `YYYY-MM-DD`. */
export type LocalDate = string

export type StarEntry = { date: LocalDate; stars: number }

export type HatchedCharacter = { characterId: string; hatchedOn: LocalDate }

export type ActiveEgg = {
  status: 'egg'
  characterId: string
  hatchTarget: number
  stars: number
}

export type Garden = {
  schemaVersion: 1
  childName: string
  muted: boolean
  starEntries: StarEntry[]
  hatchedCharacters: HatchedCharacter[]
  eggsHatched: number
  activeEgg: ActiveEgg
}

export type Command = { type: 'MakeStarEntry'; stars: number }

export type GardenEvent =
  /** Stars went into the active Egg; `eggStars` is its fill afterwards (capped at the Hatch Target). */
  | { type: 'StarsAdded'; stars: number; eggStars: number; hatchTarget: number }
  | { type: 'ZeroStarDayRecorded' }
  | { type: 'EggHatched'; characterId: string }
  | { type: 'CommandRejected'; reason: RejectionReason }

export type RejectionReason = 'StarsOutOfRange' | 'NotASchoolDay' | 'AlreadyEnteredToday'

export type Deps = {
  /** Today's device-local date. */
  today: LocalDate
  /** Returns a number in [0, 1), like Math.random. */
  random: () => number
}

export type Result = { garden: Garden; events: GardenEvent[] }

export function createGarden(): Garden {
  return {
    schemaVersion: 1,
    childName: 'Olivia',
    muted: false,
    starEntries: [],
    hatchedCharacters: [],
    eggsHatched: 0,
    activeEgg: newEgg(0, 0),
  }
}

/** The Hatch Target ladder: 2, then 5, then 8, then 10 for every later Egg. */
const HATCH_TARGET_LADDER = [2, 5, 8] as const
const LATER_HATCH_TARGET = 10

function hatchTargetFor(eggsHatched: number): number {
  return HATCH_TARGET_LADDER[eggsHatched] ?? LATER_HATCH_TARGET
}

function newEgg(eggsHatched: number, carriedOverStars: number): ActiveEgg {
  return {
    status: 'egg',
    characterId: `placeholder-${eggsHatched + 1}`,
    hatchTarget: hatchTargetFor(eggsHatched),
    stars: carriedOverStars,
  }
}

export function handle(garden: Garden, command: Command, deps: Deps): Result {
  const rejection = starEntryRejection(garden, deps.today, command.stars)
  if (rejection) return { garden, events: [{ type: 'CommandRejected', reason: rejection }] }
  const recorded: Garden = {
    ...garden,
    starEntries: [...garden.starEntries, { date: deps.today, stars: command.stars }],
  }
  return addStars(recorded, command.stars, deps.today)
}

/** Whether a Star Entry can be made today; the UI uses it to show or hide the star button. */
export function canMakeStarEntry(garden: Garden, today: LocalDate): boolean {
  return starEntryRejection(garden, today, 0) === null
}

/** School Days are Monday to Friday by the device-local calendar date. */
export function isSchoolDay(date: LocalDate): boolean {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)).getUTCDay()
  return weekday >= 1 && weekday <= 5
}

function starEntryRejection(garden: Garden, date: LocalDate, stars: number): RejectionReason | null {
  if (!Number.isInteger(stars) || stars < 0 || stars > MAX_STARS) return 'StarsOutOfRange'
  if (!isSchoolDay(date)) return 'NotASchoolDay'
  if (garden.starEntries.some((entry) => entry.date === date)) return 'AlreadyEnteredToday'
  return null
}

const MAX_STARS = 3

function addStars(garden: Garden, stars: number, today: LocalDate): Result {
  if (stars === 0) return { garden, events: [{ type: 'ZeroStarDayRecorded' }] }
  const egg = garden.activeEgg
  const total = egg.stars + stars
  if (total < egg.hatchTarget) {
    return {
      garden: { ...garden, activeEgg: { ...egg, stars: total } },
      events: [{ type: 'StarsAdded', stars, eggStars: total, hatchTarget: egg.hatchTarget }],
    }
  }
  const eggsHatched = garden.eggsHatched + 1
  return {
    garden: {
      ...garden,
      hatchedCharacters: [...garden.hatchedCharacters, { characterId: egg.characterId, hatchedOn: today }],
      eggsHatched,
      // Until Egg choosing exists (ticket 03), the next Egg is created automatically.
      activeEgg: newEgg(eggsHatched, total - egg.hatchTarget),
    },
    events: [
      { type: 'StarsAdded', stars, eggStars: egg.hatchTarget, hatchTarget: egg.hatchTarget },
      { type: 'EggHatched', characterId: egg.characterId },
    ],
  }
}
