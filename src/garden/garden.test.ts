import { describe, expect, it } from 'vitest'
import { LAUNCH_CATALOG } from '../catalog/families.ts'
import { availableEggFamilies, canMakeStarEntry, createGarden, handle, isCollectionComplete, type Command, type Egg, type Garden, type GardenEvent, type Result } from './index.ts'

// 2026-11-16 is a Monday; these are consecutive School Days of that week and the next.
const MON = '2026-11-16'
const TUE = '2026-11-17'
const SAT = '2026-11-21'
const SUN = '2026-11-22'
// Three weeks of School Days, Monday 16 November to Friday 4 December 2026.
const SCHOOL_DAYS = [
  '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20',
  '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27',
  '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04',
]

function send(garden: Garden, command: Command, today: string): Result {
  return handle(garden, command, { today, random: () => 0 })
}

function starEntry(garden: Garden, today: string, stars: number): Result {
  return send(garden, { type: 'MakeStarEntry', stars }, today)
}

/** A random function that returns `values` in order, then keeps returning the last one. */
function scripted(...values: number[]): () => number {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)] ?? 0
}

function chooseEgg(garden: Garden, familyId: string, random: () => number = () => 0): Result {
  return handle(garden, { type: 'ChooseEgg', familyId }, { today: MON, random })
}

/** School Days from Monday 16 November 2026 onwards, enough for every Egg in the catalog. */
function* schoolDays(): Generator<string> {
  const day = new Date(Date.UTC(2026, 10, 16))
  for (;;) {
    const weekday = day.getUTCDay()
    if (weekday >= 1 && weekday <= 5) yield day.toISOString().slice(0, 10)
    day.setUTCDate(day.getUTCDate() + 1)
  }
}

/**
 * Makes 3-Star Star Entries on successive School Days; after each Hatch,
 * chooses the next family in `choices` (random always 0). Stops after the
 * Hatch that follows the last choice, returning that command's events.
 */
function hatchAll(start: Garden, choices: string[]): { garden: Garden; lastEvents: GardenEvent[] } {
  const days = schoolDays()
  const pending = [...choices]
  let garden = start
  for (;;) {
    const { garden: next, events } = starEntry(garden, days.next().value as string, 3)
    garden = next
    if (!events.some((e) => e.type === 'EggHatched')) continue
    const familyId = pending.shift()
    if (familyId === undefined) return { garden, lastEvents: events }
    garden = chooseEgg(garden, familyId).garden
  }
}

function eggOf(garden: Garden): Egg {
  if (garden.activeEgg.status !== 'egg') throw new Error(`expected an Egg, got ${garden.activeEgg.status}`)
  return garden.activeEgg
}

describe('Make Star Entry', () => {
  it('a 2-Star Star Entry on the first School Day hatches the first Egg', () => {
    const { garden, events } = starEntry(createGarden(), MON, 2)

    expect(events).toContainEqual(expect.objectContaining({ type: 'EggHatched' }))
    expect(garden.hatchedCharacters).toHaveLength(1)
    expect(garden.hatchedCharacters[0]?.hatchedOn).toBe(MON)
  })

  it('Stars below the Hatch Target go into the Egg without hatching it', () => {
    const { garden, events } = starEntry(createGarden(), MON, 1)

    expect(events).toEqual([{ type: 'StarsAdded', stars: 1, eggStars: 1, hatchTarget: 2 }])
    expect(garden.activeEgg).toMatchObject({ stars: 1, hatchTarget: 2 })
    expect(garden.hatchedCharacters).toEqual([])
    expect(garden.starEntries).toEqual([{ date: MON, stars: 1 }])
  })
})

describe('Rejected Star Entries change nothing', () => {
  it.each([SAT, SUN])('a Star Entry on a weekend day (%s) is rejected', (weekendDay) => {
    const before = createGarden()
    const { garden, events } = starEntry(before, weekendDay, 2)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'NotASchoolDay' }])
    expect(garden).toEqual(before)
  })

  it('a second Star Entry on the same School Day is rejected', () => {
    const before = starEntry(createGarden(), MON, 1).garden
    const { garden, events } = starEntry(before, MON, 1)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'AlreadyEnteredToday' }])
    expect(garden).toEqual(before)
  })

  it('a 0-star day still counts as the one Star Entry for that School Day', () => {
    const before = starEntry(createGarden(), MON, 0).garden
    const { events } = starEntry(before, MON, 2)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'AlreadyEnteredToday' }])
  })

  it.each([-1, 4, 1.5, Number.NaN])('Stars of %s are rejected; Stars must be 0 to 3', (stars) => {
    const before = createGarden()
    const { garden, events } = starEntry(before, MON, stars)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'StarsOutOfRange' }])
    expect(garden).toEqual(before)
  })
})

describe('Whether a Star Entry can be made today', () => {
  it('only on a School Day that has no Star Entry yet', () => {
    const afterMon = starEntry(createGarden(), MON, 1).garden

    expect(canMakeStarEntry(createGarden(), MON)).toBe(true)
    expect(canMakeStarEntry(createGarden(), SAT)).toBe(false)
    expect(canMakeStarEntry(afterMon, MON)).toBe(false)
    expect(canMakeStarEntry(afterMon, TUE)).toBe(true)
  })
})

describe('0-star days', () => {
  it('a 0-Star Star Entry is recorded, leaves the Egg as it was and is never a loss', () => {
    const afterMon = starEntry(createGarden(), MON, 1).garden
    const { garden, events } = starEntry(afterMon, TUE, 0)

    expect(events).toEqual([{ type: 'ZeroStarDayRecorded' }])
    expect(garden.starEntries).toEqual([
      { date: MON, stars: 1 },
      { date: TUE, stars: 0 },
    ])
    expect(garden.activeEgg).toEqual(afterMon.activeEgg)
  })
})

describe('Hatch and carry-over', () => {
  it('given a first Egg with 1 Star, a 3-Star Star Entry hatches it and the 2 carried-over Stars go into the chosen Egg', () => {
    const afterMon = starEntry(createGarden(), MON, 1).garden
    const afterHatch = starEntry(afterMon, TUE, 3).garden
    const { garden, events } = chooseEgg(afterHatch, 'sparkly')

    expect(events).toEqual([{ type: 'EggChosen', familyId: 'sparkly', eggStars: 2, hatchTarget: 5 }])
    expect(garden.hatchedCharacters).toHaveLength(1)
    expect(garden.activeEgg).toMatchObject({ status: 'egg', familyId: 'sparkly', stars: 2, hatchTarget: 5 })
  })

  it('follows the Hatch Target ladder: 2, then 5, then 8, then 10 for every later Egg', () => {
    let garden = createGarden()
    const targets = [eggOf(garden).hatchTarget]
    for (const day of SCHOOL_DAYS.slice(0, 9)) {
      garden = starEntry(garden, day, 3).garden
      if (garden.activeEgg.status === 'awaitingChoice') {
        garden = chooseEgg(garden, 'splashy').garden
        targets.push(eggOf(garden).hatchTarget)
      }
    }

    expect(targets).toEqual([2, 5, 8, 10, 10])
  })
})

describe('Choosing the next Egg', () => {
  it('given a first Egg with 1 Star, a 3-Star Star Entry hatches it and leaves 2 carried-over Stars awaiting an Egg choice', () => {
    const afterMon = starEntry(createGarden(), MON, 1).garden
    const { garden, events } = starEntry(afterMon, TUE, 3)

    expect(events.map((e) => e.type)).toEqual(['StarsAdded', 'EggHatched', 'EggChoiceNeeded'])
    expect(events).toContainEqual({ type: 'EggChoiceNeeded', familyIds: ['fluffy', 'sparkly', 'splashy'] })
    expect(garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 2 })
  })

  it('a Star Entry is rejected while awaiting an Egg choice, and the star button is hidden', () => {
    const before = starEntry(createGarden(), MON, 2).garden
    const { garden, events } = starEntry(before, TUE, 1)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'AwaitingEggChoice' }])
    expect(garden).toEqual(before)
    expect(canMakeStarEntry(before, TUE)).toBe(false)
  })

  it('Choose Egg is rejected when no Egg choice is awaited', () => {
    const before = createGarden()
    const { garden, events } = chooseEgg(before, 'fluffy')

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'NotAwaitingEggChoice' }])
    expect(garden).toEqual(before)
  })

  it('the Character inside is picked with the random function from the family\'s unhatched Characters only', () => {
    // The first Egg (random 0) is Fluffy's Bun-Bun; once she has hatched, Fluffy's unhatched Characters are Pip, Mochi, Hazel, Pudding.
    const afterHatch = starEntry(createGarden(), MON, 2).garden
    expect(afterHatch.hatchedCharacters.map((h) => h.characterId)).toEqual(['bun-bun'])

    expect(eggOf(chooseEgg(afterHatch, 'fluffy', scripted(0)).garden).characterId).toBe('pip')
    expect(eggOf(chooseEgg(afterHatch, 'fluffy', scripted(0.5)).garden).characterId).toBe('hazel')
    expect(eggOf(chooseEgg(afterHatch, 'fluffy', scripted(0.99)).garden).characterId).toBe('pudding')
    expect(eggOf(chooseEgg(afterHatch, 'sparkly', scripted(0)).garden).characterId).toBe('twinkle')
  })

  it('a fully hatched Egg Family is no longer offered and cannot be chosen', () => {
    const { garden, lastEvents } = hatchAll(createGarden(), ['fluffy', 'fluffy', 'fluffy', 'fluffy'])

    expect(garden.hatchedCharacters.map((h) => h.characterId)).toEqual(['bun-bun', 'pip', 'mochi', 'hazel', 'pudding'])
    expect(lastEvents).toContainEqual({ type: 'EggChoiceNeeded', familyIds: ['sparkly', 'splashy'] })
    expect(chooseEgg(garden, 'fluffy').events).toEqual([{ type: 'CommandRejected', reason: 'EggFamilyNotAvailable' }])
  })

  it('when only one Egg Family has Characters left, its Egg is chosen automatically', () => {
    const { garden, lastEvents } = hatchAll(createGarden(), [
      ...Array<string>(4).fill('fluffy'),
      ...Array<string>(5).fill('sparkly'),
    ])

    expect(lastEvents.map((e) => e.type)).toEqual(['StarsAdded', 'EggHatched', 'EggChosen'])
    expect(lastEvents).toContainEqual(expect.objectContaining({ type: 'EggChosen', familyId: 'splashy' }))
    expect(eggOf(garden)).toMatchObject({ familyId: 'splashy', characterId: 'bubbles', hatchTarget: 10 })
  })

  it('carried-over Stars that already meet the chosen Egg\'s Hatch Target hatch it straight away', () => {
    const afterHatch = starEntry(createGarden(), MON, 2).garden
    const before: Garden = { ...afterHatch, activeEgg: { status: 'awaitingChoice', carriedOverStars: 6 } }
    const { garden, events } = chooseEgg(before, 'splashy', scripted(0))

    expect(events).toEqual([
      { type: 'EggChosen', familyId: 'splashy', eggStars: 5, hatchTarget: 5 },
      { type: 'EggHatched', characterId: 'bubbles' },
      { type: 'EggChoiceNeeded', familyIds: ['fluffy', 'sparkly', 'splashy'] },
    ])
    expect(garden.hatchedCharacters.map((h) => h.characterId)).toEqual(['bun-bun', 'bubbles'])
    expect(garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 1 })
  })

  it('an Egg Family added to the catalog is offered and choosable with no change to the Garden', () => {
    const catalog = [
      ...LAUNCH_CATALOG,
      { id: 'spiky', name: 'Spiky', pattern: 'Green Egg with soft spikes.', characters: [{ id: 'cactus', name: 'Prickles', kind: 'cactus' }] },
    ]
    const before = handle(createGarden(), { type: 'MakeStarEntry', stars: 2 }, { today: MON, random: () => 0, catalog }).garden
    const deps = { today: MON, random: () => 0, catalog }

    expect(availableEggFamilies(before, catalog)).toEqual(['fluffy', 'sparkly', 'splashy', 'spiky'])
    expect(eggOf(handle(before, { type: 'ChooseEgg', familyId: 'spiky' }, deps).garden).characterId).toBe('cactus')
  })

  it('Choose Egg is rejected for an Egg Family that does not exist', () => {
    const before = starEntry(createGarden(), MON, 2).garden
    const { garden, events } = chooseEgg(before, 'spiky')

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'EggFamilyNotAvailable' }])
    expect(garden).toEqual(before)
  })
})

describe('Collection complete', () => {
  // A tiny catalog: one Egg Family with a single Character, so the first Hatch completes the Collection.
  const tiny = [{ id: 'fluffy', name: 'Fluffy', pattern: 'Cream Egg.', characters: [{ id: 'bun-bun', name: 'Bun-Bun', kind: 'bunny' }] }]
  const withSpiky = [
    ...tiny,
    { id: 'spiky', name: 'Spiky', pattern: 'Green Egg with soft spikes.', characters: [{ id: 'cactus', name: 'Prickles', kind: 'cactus' }] },
  ]
  const deps = (today: string, catalog = tiny) => ({ today, random: () => 0, catalog })
  const entry = (garden: Garden, today: string, stars: number, catalog = tiny) =>
    handle(garden, { type: 'MakeStarEntry', stars }, deps(today, catalog))

  it('hatching the last Character in the catalog completes the Collection', () => {
    const { garden, events } = entry(createGarden(() => 0, tiny), MON, 3)

    expect(events).toEqual([
      { type: 'StarsAdded', stars: 3, eggStars: 2, hatchTarget: 2 },
      { type: 'EggHatched', characterId: 'bun-bun' },
      { type: 'CollectionComplete', bankedStars: 1 },
    ])
    expect(isCollectionComplete(garden, tiny)).toBe(true)
    expect(isCollectionComplete(garden, withSpiky)).toBe(false)
  })

  it('after Collection complete, Star Entries are still recorded and their Stars are banked, with no Egg offered', () => {
    const complete = entry(createGarden(() => 0, tiny), MON, 3).garden
    const { garden, events } = entry(complete, TUE, 2)

    expect(events).toEqual([{ type: 'StarsBanked', stars: 2, bankedStars: 3 }])
    expect(garden.starEntries).toEqual([
      { date: MON, stars: 3 },
      { date: TUE, stars: 2 },
    ])
    expect(garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 3 })
    expect(canMakeStarEntry(complete, TUE, tiny)).toBe(true)
    expect(canMakeStarEntry(garden, TUE, tiny)).toBe(false)
    expect(availableEggFamilies(garden, tiny)).toEqual([])
  })

  it('a 0-Star Star Entry after Collection complete is recorded as a 0-star day', () => {
    const complete = entry(createGarden(() => 0, tiny), MON, 3).garden
    const { garden, events } = entry(complete, TUE, 0)

    expect(events).toEqual([{ type: 'ZeroStarDayRecorded' }])
    expect(garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 1 })
  })

  it('an Egg Family added in a later catalog update is awaiting a choice, and the banked Stars go into its first Egg', () => {
    const complete = entry(createGarden(() => 0, tiny), MON, 3).garden
    const banked = entry(complete, TUE, 2).garden

    // After the update she must choose first: a Star Entry waits for her Egg choice.
    expect(availableEggFamilies(banked, withSpiky)).toEqual(['spiky'])
    expect(entry(banked, '2026-11-18', 1, withSpiky).events).toEqual([{ type: 'CommandRejected', reason: 'AwaitingEggChoice' }])

    const { garden, events } = handle(banked, { type: 'ChooseEgg', familyId: 'spiky' }, deps(MON, withSpiky))
    expect(events).toEqual([{ type: 'EggChosen', familyId: 'spiky', eggStars: 3, hatchTarget: 5 }])
    expect(eggOf(garden)).toMatchObject({ familyId: 'spiky', characterId: 'cactus', stars: 3, hatchTarget: 5 })
  })
})
