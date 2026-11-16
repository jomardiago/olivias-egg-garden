import { describe, expect, it } from 'vitest'
import type { GardenEvent } from '../../garden/index.ts'
import { celebrate, currentReveal, NO_CELEBRATION, type Celebration, type CelebrationSignal } from './hatchCelebration.ts'

function run(celebration: Celebration, ...signals: CelebrationSignal[]): Celebration {
  return signals.reduce(celebrate, celebration)
}

const hatchingStarEntry: GardenEvent[] = [
  { type: 'StarsAdded', stars: 2, eggStars: 2, hatchTarget: 2 },
  { type: 'EggHatched', characterId: 'twinkle' },
  { type: 'EggChoiceNeeded', familyIds: ['fluffy', 'sparkly', 'splashy'] },
]

/** Plays one reveal from start to finish. */
const WHOLE_REVEAL: CelebrationSignal[] = [{ type: 'timer' }, { type: 'timer' }, { type: 'danceEnd' }, { type: 'tap' }, { type: 'timer' }]

describe('hatch celebration', () => {
  it('nothing plays when no Egg hatched', () => {
    const celebration = run(NO_CELEBRATION, { type: 'events', events: [{ type: 'StarsAdded', stars: 1, eggStars: 1, hatchTarget: 2 }] })
    expect(currentReveal(celebration)).toBeNull()
  })

  it('an Egg hatched event starts with the final crack of that Egg', () => {
    const celebration = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry })
    expect(currentReveal(celebration)).toEqual({ characterId: 'twinkle', familyId: 'sparkly', phase: 'crack' })
  })

  it('plays crack, burst, then the Character dances, then waits for a tap to enter the Garden', () => {
    const phases: string[] = []
    let celebration = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry })
    phases.push(currentReveal(celebration)?.phase ?? 'none')
    for (const signal of WHOLE_REVEAL) {
      celebration = celebrate(celebration, signal)
      phases.push(currentReveal(celebration)?.phase ?? 'none')
    }
    expect(phases).toEqual(['crack', 'burst', 'dance', 'meet', 'enter', 'none'])
  })

  it('taps before the dance has finished do not skip meeting the Character', () => {
    const celebration = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry }, { type: 'tap' }, { type: 'timer' }, { type: 'tap' }, { type: 'timer' }, { type: 'tap' })
    expect(currentReveal(celebration)?.phase).toBe('dance')
  })

  it('a stray timer while waiting to meet the Character does not move on without a tap', () => {
    const celebration = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry }, { type: 'timer' }, { type: 'timer' }, { type: 'danceEnd' }, { type: 'timer' })
    expect(currentReveal(celebration)?.phase).toBe('meet')
  })

  it('if the chosen Egg hatches straight away from carried-over Stars, a second reveal plays', () => {
    let celebration = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry }, ...WHOLE_REVEAL)
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

  it('a hatch arriving mid-reveal waits its turn', () => {
    let celebration = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry }, { type: 'timer' })
    celebration = run(celebration, { type: 'events', events: [{ type: 'EggHatched', characterId: 'mochi' }] })
    expect(currentReveal(celebration)).toEqual({ characterId: 'twinkle', familyId: 'sparkly', phase: 'burst' })
  })
})
