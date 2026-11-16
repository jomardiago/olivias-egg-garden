import { describe, expect, it } from 'vitest'
import { createGarden, type Garden, type GardenEvent } from '../../garden/index.ts'
import { celebrate, currentReveal, gardenAsShown, NO_CELEBRATION, type Celebration, type CelebrationSignal } from './hatchCelebration.ts'

function run(celebration: Celebration, ...signals: CelebrationSignal[]): Celebration {
  return signals.reduce(celebrate, celebration)
}

const hatchingStarEntry: GardenEvent[] = [
  { type: 'StarsAdded', stars: 2, eggStars: 2, hatchTarget: 2 },
  { type: 'EggHatched', characterId: 'twinkle' },
  { type: 'EggChoiceNeeded', familyIds: ['fluffy', 'sparkly', 'splashy'] },
]

/** A hatching Star Entry whose Stars have finished flying into the Egg. */
const landed: CelebrationSignal[] = [{ type: 'events', events: hatchingStarEntry }, { type: 'starsLanded' }]

/** Plays one reveal from start to finish. */
const WHOLE_REVEAL: CelebrationSignal[] = [{ type: 'starsLanded' }, { type: 'timer' }, { type: 'timer' }, { type: 'danceEnd' }, { type: 'tap' }, { type: 'timer' }]

describe('hatch celebration', () => {
  it('nothing plays when no Egg hatched', () => {
    const celebration = run(NO_CELEBRATION, { type: 'events', events: [{ type: 'StarsAdded', stars: 1, eggStars: 1, hatchTarget: 2 }] })
    expect(currentReveal(celebration)).toBeNull()
  })

  it('an Egg hatched event starts with the final crack of that Egg', () => {
    const celebration = run(NO_CELEBRATION, ...landed)
    expect(currentReveal(celebration)).toEqual({ characterId: 'twinkle', familyId: 'sparkly', phase: 'crack' })
  })

  it('plays crack, burst, then the Character dances, then waits for a tap to enter the Garden', () => {
    const phases: string[] = []
    let celebration = run(NO_CELEBRATION, ...landed)
    phases.push(currentReveal(celebration)?.phase ?? 'none')
    for (const signal of WHOLE_REVEAL.slice(1)) {
      celebration = celebrate(celebration, signal)
      phases.push(currentReveal(celebration)?.phase ?? 'none')
    }
    expect(phases).toEqual(['crack', 'burst', 'dance', 'meet', 'enter', 'none'])
  })

  it('taps before the dance has finished do not skip meeting the Character', () => {
    const celebration = run(NO_CELEBRATION, ...landed, { type: 'tap' }, { type: 'timer' }, { type: 'tap' }, { type: 'timer' }, { type: 'tap' })
    expect(currentReveal(celebration)?.phase).toBe('dance')
  })

  it('a stray timer while waiting to meet the Character does not move on without a tap', () => {
    const celebration = run(NO_CELEBRATION, ...landed, { type: 'timer' }, { type: 'timer' }, { type: 'danceEnd' }, { type: 'timer' })
    expect(currentReveal(celebration)?.phase).toBe('meet')
  })

  it('if the chosen Egg hatches straight away from carried-over Stars, a second reveal plays', () => {
    let celebration = run(NO_CELEBRATION, ...landed, ...WHOLE_REVEAL)
    expect(currentReveal(celebration)).toBeNull()
    celebration = run(celebration, {
      type: 'events',
      events: [
        { type: 'EggChosen', familyId: 'splashy', eggStars: 5, hatchTarget: 5 },
        { type: 'EggHatched', characterId: 'finn' },
        { type: 'EggChoiceNeeded', familyIds: ['fluffy', 'sparkly', 'splashy'] },
      ],
    })
    expect(currentReveal(celebration)).toEqual({ characterId: 'finn', familyId: 'splashy', phase: 'crack' })
  })

  it('two hatches from one command play one after the other', () => {
    let celebration = run(NO_CELEBRATION, {
      type: 'events',
      events: [
        { type: 'StarsAdded', stars: 3, eggStars: 10, hatchTarget: 10 },
        { type: 'EggHatched', characterId: 'pip' },
        { type: 'EggChosen', familyId: 'splashy', eggStars: 10, hatchTarget: 10 },
        { type: 'EggHatched', characterId: 'coral' },
      ],
    })
    expect(currentReveal(celebration)?.characterId).toBe('pip')
    celebration = run(celebration, ...WHOLE_REVEAL)
    expect(currentReveal(celebration)).toEqual({ characterId: 'coral', familyId: 'splashy', phase: 'crack' })
    celebration = run(celebration, ...WHOLE_REVEAL)
    expect(currentReveal(celebration)).toBeNull()
  })

  it('when Stars fly into the Egg first, the reveal waits for them to land', () => {
    let celebration = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry }, { type: 'timer' }, { type: 'tap' })
    expect(currentReveal(celebration)?.phase).toBe('waitForStars')
    celebration = run(celebration, { type: 'starsLanded' })
    expect(currentReveal(celebration)?.phase).toBe('crack')
  })

  describe('the Garden behind the celebration', () => {
    const afterHatch: Garden = {
      ...createGarden(),
      hatchedCharacters: [{ characterId: 'pip', hatchedOn: '2026-11-13' }, { characterId: 'twinkle', hatchedOn: '2026-11-16' }],
      eggsHatched: 2,
      activeEgg: { status: 'awaitingChoice', carriedOverStars: 1 },
    }

    it('while the Stars fly in, the full Egg is still in its nest and the Character is still a surprise', () => {
      const shown = gardenAsShown(afterHatch, run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry }), hatchingStarEntry)
      expect(shown.activeEgg).toEqual({ status: 'egg', familyId: 'sparkly', characterId: 'twinkle', stars: 2, hatchTarget: 2 })
      expect(shown.hatchedCharacters.map((c) => c.characterId)).toEqual(['pip'])
    })

    it('the Character only joins the Garden once it has run in', () => {
      let celebration = run(NO_CELEBRATION, ...landed, { type: 'timer' }, { type: 'timer' }, { type: 'danceEnd' }, { type: 'tap' })
      expect(gardenAsShown(afterHatch, celebration, hatchingStarEntry).hatchedCharacters).toHaveLength(1)
      celebration = run(celebration, { type: 'timer' })
      expect(gardenAsShown(afterHatch, celebration, hatchingStarEntry)).toEqual(afterHatch)
    })
  })

  it('a hatch arriving mid-reveal waits its turn', () => {
    let celebration = run(NO_CELEBRATION, ...landed, { type: 'timer' })
    celebration = run(celebration, { type: 'events', events: [{ type: 'EggHatched', characterId: 'mochi' }] })
    expect(currentReveal(celebration)).toEqual({ characterId: 'twinkle', familyId: 'sparkly', phase: 'burst' })
  })
})
