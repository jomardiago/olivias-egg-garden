import { eggStage, type EggStage, type GardenEvent } from '../../garden/index.ts'

export type EggFill = { eggStars: number; stage: EggStage }

/**
 * What the Egg plays after a command's events:
 * - `starFlights`: one Star flies in per Star, each landing filling the
 *   Egg a little more (capped at the Hatch Target, so a full Egg ends on
 *   its big crack and any extra Stars fly in to be carried over).
 * - `zeroStarWiggle`: a gentle, happy wiggle for a 0-star day.
 */
export type Celebration =
  | { kind: 'starFlights'; hatchTarget: number; from: EggFill; landings: EggFill[] }
  | { kind: 'zeroStarWiggle' }

/**
 * The Star celebration for `events`, or null if there is nothing to play.
 * `eggStarsBefore` is the Egg's fill before the command; it can be left out
 * unless the Egg hatched, since otherwise the Stars added event gives it exactly.
 */
export function celebrationFor(events: readonly GardenEvent[], eggStarsBefore?: number): Celebration | null {
  if (events.some((e) => e.type === 'ZeroStarDayRecorded')) return { kind: 'zeroStarWiggle' }
  const added = events.find((e) => e.type === 'StarsAdded')
  if (!added) return null
  const { hatchTarget } = added
  const before = Math.max(0, eggStarsBefore ?? added.eggStars - added.stars)
  const fill = (eggStars: number): EggFill => ({ eggStars, stage: eggStage(eggStars, hatchTarget) })
  return {
    kind: 'starFlights',
    hatchTarget,
    from: fill(before),
    landings: Array.from({ length: added.stars }, (_, i) => fill(Math.min(before + i + 1, hatchTarget))),
  }
}
