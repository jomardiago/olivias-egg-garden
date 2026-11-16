import { describe, expect, it } from 'vitest'
import { canMakeStarEntry, createGarden, handle, type Command, type Garden, type Result } from './index.ts'

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
  it('given a first Egg with 1 Star, a 3-Star Star Entry hatches it and carries 2 Stars into the next Egg', () => {
    const afterMon = starEntry(createGarden(), MON, 1).garden
    const { garden, events } = starEntry(afterMon, TUE, 3)

    expect(events.map((e) => e.type)).toEqual(['StarsAdded', 'EggHatched'])
    expect(garden.hatchedCharacters).toHaveLength(1)
    expect(garden.activeEgg).toMatchObject({ stars: 2, hatchTarget: 5 })
  })

  it('follows the Hatch Target ladder: 2, then 5, then 8, then 10 for every later Egg', () => {
    let garden = createGarden()
    const targets = [garden.activeEgg.hatchTarget]
    for (const day of SCHOOL_DAYS.slice(0, 9)) {
      const result = starEntry(garden, day, 3)
      garden = result.garden
      if (result.events.some((e) => e.type === 'EggHatched')) targets.push(garden.activeEgg.hatchTarget)
    }

    expect(targets).toEqual([2, 5, 8, 10, 10])
  })

  it('the next Egg holds a different Character from the one that just hatched', () => {
    const { garden } = starEntry(createGarden(), MON, 2)
    const hatched = garden.hatchedCharacters[0]?.characterId

    expect(garden.activeEgg.characterId).not.toBe(hatched)
  })
})
