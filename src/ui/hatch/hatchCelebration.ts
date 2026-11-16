import type { Garden, GardenEvent } from '../../garden/index.ts'

/**
 * The order of a Hatch celebration, kept free of React and timers so it
 * can be tested. Each Egg hatched event queues one hatch scene; scenes play
 * one at a time, so an Egg that hatches straight away from carried-over
 * Stars gets its own scene after the first one.
 *
 * Phases of one scene:
 * - `waitForStars`: the Garden is still showing the Stars flying into the Egg (stars landed).
 * - `crack`: the Egg shakes and the final crack runs across it (timer).
 * - `burst`: the Egg splits with a burst of light and confetti (timer).
 * - `dance`: the Character appears big with its name and does its dance (dance end).
 * - `meet`: the Character waits, idle, for her tap (tap).
 * - `enter`: the Character runs into the Garden (timer), then the next scene or nothing.
 */
export type HatchPhase = 'waitForStars' | 'crack' | 'burst' | 'dance' | 'meet' | 'enter'

export type HatchScene = { characterId: string; familyId: string; hatchTarget: number; phase: HatchPhase }

export type CelebrationSignal =
  /** What the Garden core returned for the last command. */
  | { type: 'events'; events: readonly GardenEvent[] }
  /** The current phase's animation has run its course. */
  | { type: 'timer' }
  /** The Character's dance finished. */
  | { type: 'danceEnd' }
  /** The child tapped the screen. */
  | { type: 'tap' }
  /** The Garden's Stars-added animation has finished: the Egg is full. */
  | { type: 'starsLanded' }

export type Celebration = { readonly queue: readonly HatchScene[] }

export const NO_CELEBRATION: Celebration = { queue: [] }

/** The hatch scene playing now, or null when no celebration is showing. */
export function currentScene(celebration: Celebration): HatchScene | null {
  return celebration.queue[0] ?? null
}

const NEXT_PHASE: Record<HatchPhase, { on: CelebrationSignal['type']; to: HatchPhase | 'done' }> = {
  waitForStars: { on: 'starsLanded', to: 'crack' },
  crack: { on: 'timer', to: 'burst' },
  burst: { on: 'timer', to: 'dance' },
  dance: { on: 'danceEnd', to: 'meet' },
  meet: { on: 'tap', to: 'enter' },
  enter: { on: 'timer', to: 'done' },
}

export function celebrate(celebration: Celebration, signal: CelebrationSignal): Celebration {
  if (signal.type === 'events') {
    let starsFlying = signal.events.some((event) => event.type === 'StarsAdded')
    const scenes = signal.events.flatMap((event): HatchScene[] => {
      if (event.type !== 'EggHatched') return []
      // Only the Egg the Stars flew into waits for them; an Egg hatched from carried-over Stars cracks straight away.
      const phase: HatchPhase = starsFlying ? 'waitForStars' : 'crack'
      starsFlying = false
      return [{ characterId: event.characterId, familyId: event.familyId, hatchTarget: event.hatchTarget, phase }]
    })
    return scenes.length === 0 ? celebration : { queue: [...celebration.queue, ...scenes] }
  }
  const [current, ...rest] = celebration.queue
  if (!current) return celebration
  const next = NEXT_PHASE[current.phase]
  if (next.on !== signal.type) return celebration
  if (next.to === 'done') return { queue: rest }
  return { queue: [{ ...current, phase: next.to }, ...rest] }
}

/** The phases in which the hatching Egg is still resting in its nest, full and cracked, behind the celebration. */
const EGG_IN_NEST: readonly HatchPhase[] = ['waitForStars', 'crack', 'burst']

/**
 * The Garden as it should look behind the celebration: Characters still to
 * hatch are kept out of sight until they run in, and until the burst the
 * hatching Egg stays in its nest, full and big-cracked, for the Stars to
 * land in and then crack.
 */
export function gardenAsShown(garden: Garden, celebration: Celebration): Garden {
  const current = currentScene(celebration)
  if (!current) return garden
  const pending = new Set(celebration.queue.map((scene) => scene.characterId))
  const shown: Garden = { ...garden, hatchedCharacters: garden.hatchedCharacters.filter((c) => !pending.has(c.characterId)) }
  if (!EGG_IN_NEST.includes(current.phase)) return shown
  return {
    ...shown,
    activeEgg: {
      status: 'egg',
      familyId: current.familyId,
      characterId: current.characterId,
      stars: current.hatchTarget,
      hatchTarget: current.hatchTarget,
    },
  }
}
