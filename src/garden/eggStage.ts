import type { EggStage } from '../catalog/art/types.ts'

export type { EggStage }

/**
 * Which of the four fill stages an Egg holding `stars` of its `hatchTarget`
 * shows: still (under 1/3 full), wobbling (1/3 or more), small crack
 * (2/3 or more), and big crack once full, just before it Hatches.
 */
export function eggStage(stars: number, hatchTarget: number): EggStage {
  if (stars >= hatchTarget) return 'bigCrack'
  // Whole-number comparisons, so a third of 9 is exactly 3.
  if (stars * 3 >= hatchTarget * 2) return 'smallCrack'
  if (stars * 3 >= hatchTarget) return 'wobbling'
  return 'still'
}
