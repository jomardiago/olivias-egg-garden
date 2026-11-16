import { describe, expect, it } from 'vitest'
import { createGarden, type Garden, type GardenEvent } from '../../garden/index.ts'
import { celebrate, currentScene, gardenAsShown, NO_CELEBRATION, type Celebration, type CelebrationSignal } from './hatchCelebration.ts'

function run(celebration: Celebration, ...signals: CelebrationSignal[]): Celebration {
  return signals.reduce(celebrate, celebration)
}

const hatchingStarEntry: GardenEvent[] = [
  { type: 'StarsAdded', stars: 2, eggStarsBefore: 0, eggStars: 2, hatchTarget: 2 },
  { type: 'EggHatched', characterId: 'twinkle', familyId: 'sparkly', hatchTarget: 2 },
  { type: 'EggChoiceNeeded', familyIds: ['fluffy', 'sparkly', 'splashy'] },
]

/** A hatching Star Entry whose Stars have finished flying into the Egg. */
const landed: CelebrationSignal[] = [{ type: 'events', events: hatchingStarEntry }, { type: 'starsLanded' }]

/** Plays one hatch scene from start to finish. */
const WHOLE_SCENE: CelebrationSignal[] = [{ type: 'starsLanded' }, { type: 'timer' }, { type: 'timer' }, { type: 'danceEnd' }, { type: 'tap' }, { type: 'timer' }]

describe('hatch celebration', () => {
  it('nothing plays when no Egg hatched', () => {
    const celebration = run(NO_CELEBRATION, { type: 'events', events: [{ type: 'StarsAdded', stars: 1, eggStarsBefore: 0, eggStars: 1, hatchTarget: 2 }] })
    expect(currentScene(celebration)).toBeNull()
  })

  it('an Egg hatched event starts with the final crack of that Egg', () => {
    const celebration = run(NO_CELEBRATION, ...landed)
    expect(currentScene(celebration)).toEqual({ characterId: 'twinkle', familyId: 'sparkly', hatchTarget: 2, phase: 'crack' })
  })

  it('plays crack, burst, then the Character dances, then waits for a tap to enter the Garden', () => {
    const phases: string[] = []
    let celebration = run(NO_CELEBRATION, ...landed)
    phases.push(currentScene(celebration)?.phase ?? 'none')
    for (const signal of WHOLE_SCENE.slice(1)) {
      celebration = celebrate(celebration, signal)
      phases.push(currentScene(celebration)?.phase ?? 'none')
    }
    expect(phases).toEqual(['crack', 'burst', 'dance', 'meet', 'enter', 'none'])
  })

  it('taps before the dance has finished do not skip meeting the Character', () => {
    const celebration = run(NO_CELEBRATION, ...landed, { type: 'tap' }, { type: 'timer' }, { type: 'tap' }, { type: 'timer' }, { type: 'tap' })
    expect(currentScene(celebration)?.phase).toBe('dance')
  })

  it('a stray timer while waiting to meet the Character does not move on without a tap', () => {
    const celebration = run(NO_CELEBRATION, ...landed, { type: 'timer' }, { type: 'timer' }, { type: 'danceEnd' }, { type: 'timer' })
    expect(currentScene(celebration)?.phase).toBe('meet')
  })

  it('if the chosen Egg hatches straight away from carried-over Stars, a second scene plays', () => {
    let celebration = run(NO_CELEBRATION, ...landed, ...WHOLE_SCENE)
    expect(currentScene(celebration)).toBeNull()
    celebration = run(celebration, {
      type: 'events',
      events: [
        { type: 'EggChosen', familyId: 'splashy', eggStars: 5, hatchTarget: 5 },
        { type: 'EggHatched', characterId: 'finn', familyId: 'splashy', hatchTarget: 5 },
        { type: 'EggChoiceNeeded', familyIds: ['fluffy', 'sparkly', 'splashy'] },
      ],
    })
    expect(currentScene(celebration)).toEqual({ characterId: 'finn', familyId: 'splashy', hatchTarget: 5, phase: 'crack' })
  })

  it('two hatches from one command play one after the other', () => {
    let celebration = run(NO_CELEBRATION, {
      type: 'events',
      events: [
        { type: 'StarsAdded', stars: 3, eggStarsBefore: 7, eggStars: 10, hatchTarget: 10 },
        { type: 'EggHatched', characterId: 'pip', familyId: 'fluffy', hatchTarget: 10 },
        { type: 'EggChosen', familyId: 'splashy', eggStars: 10, hatchTarget: 10 },
        { type: 'EggHatched', characterId: 'coral', familyId: 'splashy', hatchTarget: 10 },
      ],
    })
    expect(currentScene(celebration)?.characterId).toBe('pip')
    celebration = run(celebration, ...WHOLE_SCENE)
    expect(currentScene(celebration)).toEqual({ characterId: 'coral', familyId: 'splashy', hatchTarget: 10, phase: 'crack' })
    celebration = run(celebration, ...WHOLE_SCENE)
    expect(currentScene(celebration)).toBeNull()
  })

  it('when Stars fly into the Egg first, the hatch scene waits for them to land', () => {
    let celebration = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry }, { type: 'timer' }, { type: 'tap' })
    expect(currentScene(celebration)?.phase).toBe('waitForStars')
    celebration = run(celebration, { type: 'starsLanded' })
    expect(currentScene(celebration)?.phase).toBe('crack')
  })

  describe('the Garden behind the celebration', () => {
    const afterHatch: Garden = {
      ...createGarden(),
      hatchedCharacters: [{ characterId: 'pip', hatchedOn: '2026-11-13' }, { characterId: 'twinkle', hatchedOn: '2026-11-16' }],
      eggsHatched: 2,
      activeEgg: { status: 'awaitingChoice', carriedOverStars: 1 },
    }
    const fullEgg = { status: 'egg', familyId: 'sparkly', characterId: 'twinkle', stars: 2, hatchTarget: 2 }
    const hatchStarted = run(NO_CELEBRATION, { type: 'events', events: hatchingStarEntry })

    it('while the Stars fly in, the full Egg is still in its nest and the Character is still a surprise', () => {
      const shown = gardenAsShown(afterHatch, hatchStarted)
      expect(shown.activeEgg).toEqual(fullEgg)
      expect(shown.hatchedCharacters.map((c) => c.characterId)).toEqual(['pip'])
    })

    it('the full Egg stays in its nest through the crack and the burst, until the Character appears', () => {
      let celebration = run(hatchStarted, { type: 'starsLanded' })
      expect(currentScene(celebration)?.phase).toBe('crack')
      expect(gardenAsShown(afterHatch, celebration).activeEgg).toEqual(fullEgg)

      celebration = run(celebration, { type: 'timer' })
      expect(currentScene(celebration)?.phase).toBe('burst')
      expect(gardenAsShown(afterHatch, celebration).activeEgg).toEqual(fullEgg)

      celebration = run(celebration, { type: 'timer' })
      expect(currentScene(celebration)?.phase).toBe('dance')
      expect(gardenAsShown(afterHatch, celebration).activeEgg).toEqual(afterHatch.activeEgg)
    })

    it('an Egg hatching straight from carried-over Stars is also shown in the nest while it cracks', () => {
      const chosenAndHatched: GardenEvent[] = [
        { type: 'EggChosen', familyId: 'splashy', eggStars: 5, hatchTarget: 5 },
        { type: 'EggHatched', characterId: 'finn', familyId: 'splashy', hatchTarget: 5 },
      ]
      const celebration = run(NO_CELEBRATION, { type: 'events', events: chosenAndHatched })
      expect(gardenAsShown(afterHatch, celebration).activeEgg).toEqual({ status: 'egg', familyId: 'splashy', characterId: 'finn', stars: 5, hatchTarget: 5 })
    })

    it('the Character only joins the Garden once it has run in', () => {
      let celebration = run(NO_CELEBRATION, ...landed, { type: 'timer' }, { type: 'timer' }, { type: 'danceEnd' }, { type: 'tap' })
      expect(gardenAsShown(afterHatch, celebration).hatchedCharacters).toHaveLength(1)
      celebration = run(celebration, { type: 'timer' })
      expect(gardenAsShown(afterHatch, celebration)).toEqual(afterHatch)
    })
  })

  it('a hatch arriving mid-scene waits its turn', () => {
    let celebration = run(NO_CELEBRATION, ...landed, { type: 'timer' })
    celebration = run(celebration, { type: 'events', events: [{ type: 'EggHatched', characterId: 'mochi', familyId: 'fluffy', hatchTarget: 5 }] })
    expect(currentScene(celebration)).toEqual({ characterId: 'twinkle', familyId: 'sparkly', hatchTarget: 2, phase: 'burst' })
  })
})
