import { describe, expect, it } from 'vitest'
import { createGarden, handle, starEntryHistory, type Command, type Garden, type Result } from './index.ts'

// 2026-11-16 is a Monday.
const MON = '2026-11-16'
const TUE = '2026-11-17'
const WED = '2026-11-18'
const THU = '2026-11-19'
const SAT = '2026-11-14'
const SUN = '2026-11-15'

function send(garden: Garden, command: Command, today: string): Result {
  return handle(garden, command, { today, random: () => 0 })
}

function starEntry(garden: Garden, today: string, stars: number): Result {
  return send(garden, { type: 'MakeStarEntry', stars }, today)
}

function addMissed(garden: Garden, date: string, stars: number, today: string): Result {
  return send(garden, { type: 'AddMissedStarEntry', date, stars }, today)
}

describe('Add missed Star Entry', () => {
  it('a forgotten past School Day is recorded and its Stars go into the Egg, like a normal Star Entry', () => {
    const { garden, events } = addMissed(createGarden(), MON, 1, WED)

    expect(events).toEqual([{ type: 'StarsAdded', stars: 1, eggStars: 1, hatchTarget: 2 }])
    expect(garden.starEntries).toEqual([{ date: MON, stars: 1 }])
    expect(garden.activeEgg).toMatchObject({ status: 'egg', stars: 1 })
  })

  it.each([THU, WED])('a date that is not in the past (%s, today being Wednesday) is rejected and changes nothing', (date) => {
    const before = createGarden()
    const { garden, events } = addMissed(before, date, 2, WED)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'NotAPastDate' }])
    expect(garden).toEqual(before)
  })

  it.each([SAT, SUN])('a weekend day (%s) is rejected and changes nothing', (date) => {
    const before = createGarden()
    const { garden, events } = addMissed(before, date, 2, WED)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'NotASchoolDay' }])
    expect(garden).toEqual(before)
  })

  it('a School Day that already has a Star Entry is rejected and changes nothing', () => {
    const before = starEntry(createGarden(), MON, 1).garden
    const { garden, events } = addMissed(before, MON, 3, WED)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'AlreadyEntered' }])
    expect(garden).toEqual(before)
  })

  it.each(['', 'yesterday', '2026-02-30', '2026-11-1'])('a date that is not a real calendar date (%j) is rejected', (date) => {
    const before = createGarden()
    const { garden, events } = addMissed(before, date, 1, WED)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'InvalidDate' }])
    expect(garden).toEqual(before)
  })

  it.each([-1, 4, 1.5])('Stars of %s are rejected; Stars must be 0 to 3', (stars) => {
    const before = createGarden()
    const { events } = addMissed(before, MON, stars, WED)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'StarsOutOfRange' }])
  })

  it('is rejected while awaiting an Egg choice, the same as a normal Star Entry', () => {
    const before = starEntry(createGarden(), TUE, 2).garden
    const { garden, events } = addMissed(before, MON, 1, WED)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'AwaitingEggChoice' }])
    expect(garden).toEqual(before)
  })

  it('a missed day that fills the Egg hatches it, with the same events as a normal Star Entry', () => {
    const afterTue = starEntry(createGarden(), TUE, 1).garden
    const { garden, events } = addMissed(afterTue, MON, 3, WED)

    expect(events.map((e) => e.type)).toEqual(['StarsAdded', 'EggHatched', 'EggChoiceNeeded'])
    expect(garden.hatchedCharacters).toEqual([{ characterId: 'bun-bun', hatchedOn: WED }])
    expect(garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 2 })
  })
})

function correct(garden: Garden, date: string, stars: number, today: string = THU): Result {
  return send(garden, { type: 'CorrectStarEntry', date, stars }, today)
}

describe('Correct Star Entry', () => {
  it('raising an entry adds the difference to the active Egg', () => {
    const before = starEntry(createGarden(), MON, 0).garden
    const { garden, events } = correct(before, MON, 1)

    expect(events).toEqual([
      { type: 'StarEntryCorrected', date: MON, previousStars: 0, stars: 1 },
      { type: 'StarsAdded', stars: 1, eggStars: 1, hatchTarget: 2 },
    ])
    expect(garden.starEntries).toEqual([{ date: MON, stars: 1 }])
    expect(garden.activeEgg).toMatchObject({ status: 'egg', stars: 1 })
  })

  it('raising an entry so the Egg reaches its Hatch Target hatches it', () => {
    const before = starEntry(createGarden(), MON, 1).garden
    const { garden, events } = correct(before, MON, 3)

    expect(events.map((e) => e.type)).toEqual(['StarEntryCorrected', 'StarsAdded', 'EggHatched', 'EggChoiceNeeded'])
    expect(garden.hatchedCharacters).toEqual([{ characterId: 'bun-bun', hatchedOn: THU }])
    expect(garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 1 })
  })

  it('lowering an entry removes the difference from the active Egg', () => {
    const afterHatch = starEntry(createGarden(), MON, 2).garden
    const before = starEntry(chooseSplashy(afterHatch), TUE, 3).garden
    const { garden, events } = correct(before, TUE, 1)

    expect(events).toEqual([{ type: 'StarEntryCorrected', date: TUE, previousStars: 3, stars: 1 }])
    expect(garden.starEntries).toEqual([
      { date: MON, stars: 2 },
      { date: TUE, stars: 1 },
    ])
    expect(garden.activeEgg).toMatchObject({ status: 'egg', familyId: 'splashy', stars: 1 })
  })

  it('lowering an entry never takes the Egg below 0 and never takes back a hatched Character', () => {
    // Monday's 3 Stars hatched the first Egg; its 1 carried-over Star went into the next Egg.
    const afterHatch = starEntry(createGarden(), MON, 3).garden
    const before = chooseSplashy(afterHatch)
    const { garden } = correct(before, MON, 0)

    expect(garden.starEntries).toEqual([{ date: MON, stars: 0 }])
    expect(garden.hatchedCharacters).toEqual(before.hatchedCharacters)
    expect(garden.activeEgg).toMatchObject({ status: 'egg', familyId: 'splashy', stars: 0 })
  })

  it('while awaiting an Egg choice, raising an entry only adds to the carried-over Stars', () => {
    const before = starEntry(createGarden(), MON, 2).garden // hatches the first Egg, 0 carried over
    const { garden, events } = correct(before, MON, 3)

    expect(events).toEqual([{ type: 'StarEntryCorrected', date: MON, previousStars: 2, stars: 3 }])
    expect(garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 1 })
    expect(garden.hatchedCharacters).toEqual(before.hatchedCharacters)
  })

  it('carried-over Stars raised past the next Hatch Target wait for her choice, then hatch the chosen Egg straight away', () => {
    let garden = starEntry(createGarden(), MON, 0).garden
    garden = starEntry(garden, TUE, 0).garden
    garden = starEntry(garden, WED, 2).garden // hatches the first Egg, 0 carried over
    garden = correct(garden, MON, 3).garden
    const corrected = correct(garden, TUE, 3)

    expect(corrected.events.map((e) => e.type)).toEqual(['StarEntryCorrected'])
    expect(corrected.garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 6 })
    expect(corrected.garden.hatchedCharacters).toHaveLength(1)

    const { events } = send(corrected.garden, { type: 'ChooseEgg', familyId: 'splashy' }, THU)
    expect(events.map((e) => e.type)).toEqual(['EggChosen', 'EggHatched', 'EggChoiceNeeded'])
  })

  it('while awaiting an Egg choice, lowering an entry takes only from the carried-over Stars, never below 0', () => {
    const before = starEntry(createGarden(), MON, 3).garden // 1 carried over
    const { garden } = correct(before, MON, 0)

    expect(garden.activeEgg).toEqual({ status: 'awaitingChoice', carriedOverStars: 0 })
    expect(garden.hatchedCharacters).toEqual(before.hatchedCharacters)
  })

  it('a date with no Star Entry is rejected and changes nothing', () => {
    const before = starEntry(createGarden(), MON, 1).garden
    const { garden, events } = correct(before, TUE, 2)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'NoStarEntryOnDate' }])
    expect(garden).toEqual(before)
  })

  it.each([-1, 4, 2.5])('new Stars of %s are rejected; Stars must be 0 to 3', (stars) => {
    const before = starEntry(createGarden(), MON, 1).garden
    const { garden, events } = correct(before, MON, stars)

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'StarsOutOfRange' }])
    expect(garden).toEqual(before)
  })
})

describe('Star Entry history', () => {
  it('lists Star Entries newest first, including missed days added later', () => {
    let garden = starEntry(createGarden(), TUE, 1).garden
    garden = starEntry(garden, WED, 0).garden
    garden = addMissed(garden, MON, 3, THU).garden

    expect(starEntryHistory(garden)).toEqual([
      { date: WED, stars: 0 },
      { date: TUE, stars: 1 },
      { date: MON, stars: 3 },
    ])
  })
})

function chooseSplashy(garden: Garden): Garden {
  return send(garden, { type: 'ChooseEgg', familyId: 'splashy' }, MON).garden
}
