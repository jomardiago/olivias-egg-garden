import { LAUNCH_CATALOG } from '../../catalog/families.ts'
import type { GardenEvent } from '../../garden/index.ts'

/**
 * The order of a Hatch celebration, kept free of React and timers so it
 * can be tested. Each Egg hatched event queues one reveal; reveals play
 * one at a time, so an Egg that hatches straight away from carried-over
 * Stars gets its own reveal after the first one.
 *
 * Phases of one reveal:
 * - `crack`: the Egg shakes and the final crack runs across it (timer).
 * - `burst`: the Egg splits with a burst of light and confetti (timer).
 * - `dance`: the Character appears big with its name and does its dance (dance end).
 * - `meet`: the Character waits, idle, for her tap (tap).
 * - `enter`: the Character runs into the Garden (timer), then the next reveal or nothing.
 */
export type HatchPhase = 'crack' | 'burst' | 'dance' | 'meet' | 'enter'

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

export type Celebration = { readonly queue: readonly Reveal[] }

export const NO_CELEBRATION: Celebration = { queue: [] }

/** The reveal playing now, or null when no celebration is showing. */
export function currentReveal(celebration: Celebration): Reveal | null {
  return celebration.queue[0] ?? null
}

const NEXT_PHASE: Record<HatchPhase, { on: CelebrationSignal['type']; to: HatchPhase | 'done' }> = {
  crack: { on: 'timer', to: 'burst' },
  burst: { on: 'timer', to: 'dance' },
  dance: { on: 'danceEnd', to: 'meet' },
  meet: { on: 'tap', to: 'enter' },
  enter: { on: 'timer', to: 'done' },
}

export function celebrate(celebration: Celebration, signal: CelebrationSignal): Celebration {
  if (signal.type === 'events') {
    const reveals = signal.events.flatMap((event) =>
      event.type === 'EggHatched' ? [{ characterId: event.characterId, familyId: familyOf(event.characterId), phase: 'crack' as const }] : [],
    )
    return reveals.length === 0 ? celebration : { queue: [...celebration.queue, ...reveals] }
  }
  const [current, ...rest] = celebration.queue
  if (!current) return celebration
  const next = NEXT_PHASE[current.phase]
  if (next.on !== signal.type) return celebration
  if (next.to === 'done') return { queue: rest }
  return { queue: [{ ...current, phase: next.to }, ...rest] }
}

function familyOf(characterId: string): string {
  return LAUNCH_CATALOG.find((family) => family.characters.some((c) => c.id === characterId))?.id ?? ''
}
