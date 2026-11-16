import { LAUNCH_CATALOG } from '../../catalog/families.ts'
import type { Garden, GardenEvent } from '../../garden/index.ts'

/**
 * The order of a Hatch celebration, kept free of React and timers so it
 * can be tested. Each Egg hatched event queues one reveal; reveals play
 * one at a time, so an Egg that hatches straight away from carried-over
 * Stars gets its own reveal after the first one.
 *
 * Phases of one reveal:
 * - `waitForStars`: the Garden is still showing the Stars flying into the Egg (stars landed).
 * - `crack`: the Egg shakes and the final crack runs across it (timer).
 * - `burst`: the Egg splits with a burst of light and confetti (timer).
 * - `dance`: the Character appears big with its name and does its dance (dance end).
 * - `meet`: the Character waits, idle, for her tap (tap).
 * - `enter`: the Character runs into the Garden (timer), then the next reveal or nothing.
 */
export type HatchPhase = 'waitForStars' | 'crack' | 'burst' | 'dance' | 'meet' | 'enter'

export type Reveal = { characterId: string; familyId: string; phase: HatchPhase }

export type CelebrationSignal =
  /** What the Garden core returned for the last command. */
  | { type: 'events'; events: readonly GardenEvent[] }
  /** The current phase's animation has run its course. */
  | { type: 'timer' }
  /** The Character's dance finished. */
  | { type: 'danceEnd' }
  /** The child tapped the screen. */
  | { type: 'tap' }
  /** The Garden's Stars-added animation (ticket 05) has finished: the Egg is full. */
  | { type: 'starsLanded' }

export type Celebration = { readonly queue: readonly Reveal[] }

export const NO_CELEBRATION: Celebration = { queue: [] }

/** The reveal playing now, or null when no celebration is showing. */
export function currentReveal(celebration: Celebration): Reveal | null {
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
    const reveals = signal.events.flatMap((event): Reveal[] => {
      if (event.type !== 'EggHatched') return []
      // Only the Egg the Stars flew into waits for them; an Egg hatched from carried-over Stars cracks straight away.
      const phase: HatchPhase = starsFlying ? 'waitForStars' : 'crack'
      starsFlying = false
      return [{ characterId: event.characterId, familyId: familyOf(event.characterId), phase }]
    })
    return reveals.length === 0 ? celebration : { queue: [...celebration.queue, ...reveals] }
  }
  const [current, ...rest] = celebration.queue
  if (!current) return celebration
  const next = NEXT_PHASE[current.phase]
  if (next.on !== signal.type) return celebration
  if (next.to === 'done') return { queue: rest }
  return { queue: [{ ...current, phase: next.to }, ...rest] }
}

/**
 * The Garden as it should look behind the celebration: Characters still to
 * be revealed are kept out of sight until they run in, and while the Stars
 * are still flying the full Egg stays in its nest for them to land in.
 * `events` are the ones that started the celebration.
 */
export function gardenAsShown(garden: Garden, celebration: Celebration, events: readonly GardenEvent[]): Garden {
  const current = currentReveal(celebration)
  if (!current) return garden
  const pending = new Set(celebration.queue.map((reveal) => reveal.characterId))
  const shown: Garden = { ...garden, hatchedCharacters: garden.hatchedCharacters.filter((c) => !pending.has(c.characterId)) }
  const starsAdded = events.find((event) => event.type === 'StarsAdded')
  if (current.phase !== 'waitForStars' || !starsAdded) return shown
  return {
    ...shown,
    activeEgg: {
      status: 'egg',
      familyId: current.familyId,
      characterId: current.characterId,
      stars: starsAdded.eggStars,
      hatchTarget: starsAdded.hatchTarget,
    },
  }
}

function familyOf(characterId: string): string {
  return LAUNCH_CATALOG.find((family) => family.characters.some((c) => c.id === characterId))?.id ?? ''
}
