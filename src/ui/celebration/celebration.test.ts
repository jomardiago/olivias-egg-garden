import { describe, expect, it } from 'vitest'
import { celebrationFor } from './celebration.ts'

describe('Star celebration', () => {
  it('a 0-star day recorded plays a happy wiggle', () => {
    expect(celebrationFor([{ type: 'ZeroStarDayRecorded' }])).toEqual({ kind: 'zeroStarWiggle' })
  })

  it('2 Stars added to an Egg holding 1 of 5 fly in one by one, and it starts wobbling', () => {
    expect(celebrationFor([{ type: 'StarsAdded', stars: 2, eggStarsBefore: 1, eggStars: 3, hatchTarget: 5 }])).toEqual({
      kind: 'starFlights',
      hatchTarget: 5,
      from: { eggStars: 1, stage: 'still' },
      landings: [
        { eggStars: 2, stage: 'wobbling' },
        { eggStars: 3, stage: 'wobbling' },
      ],
    })
  })

  it('Stars that fill the Egg end on the big crack, and extra Stars still each fly in', () => {
    // First Egg holding 1 of 2, then a 3-Star Star Entry: it Hatches with 2 carried over.
    const events = [
      { type: 'StarsAdded', stars: 3, eggStarsBefore: 1, eggStars: 2, hatchTarget: 2 },
      { type: 'EggHatched', characterId: 'pip', familyId: 'fluffy', hatchTarget: 2 },
    ] as const
    expect(celebrationFor(events)).toEqual({
      kind: 'starFlights',
      hatchTarget: 2,
      from: { eggStars: 1, stage: 'wobbling' },
      landings: [
        { eggStars: 2, stage: 'bigCrack' },
        { eggStars: 2, stage: 'bigCrack' },
        { eggStars: 2, stage: 'bigCrack' },
      ],
    })
  })

  it('choosing an Egg or a rejected command plays no Star celebration', () => {
    expect(celebrationFor([{ type: 'EggChosen', familyId: 'fluffy', eggStars: 0, hatchTarget: 5 }])).toBeNull()
    expect(celebrationFor([{ type: 'CommandRejected', reason: 'AlreadyEnteredToday' }])).toBeNull()
  })
})
