/**
 * Character catalog: static content kept separate from Garden state.
 * State refers to Characters and Egg Families only by id.
 *
 * - Data (no React, used by the Garden core): `families.ts`.
 * - Character art: one file per Egg Family in `art/`, looked up through
 *   `characterArt(id)`, so no screen changes when art lands.
 * - Egg art: `art/eggPatterns.tsx`, looked up through `eggPattern(familyId)`.
 *
 * Adding an Egg Family: add it to `LAUNCH_CATALOG`, add `art/<family>.tsx`
 * and register it in `CHARACTER_ART` below, and add its Egg pattern.
 */
import { eggPatterns, PlaceholderEgg } from './art/eggPatterns.tsx'
import { fluffyCharacterArt } from './art/fluffy.tsx'
import { sparklyCharacterArt } from './art/sparkly.tsx'
import { splashyCharacterArt } from './art/splashy.tsx'
import type { CharacterArt, EggPattern, FamilyCharacterArt } from './art/types.ts'

export * from './families.ts'
export type * from './art/types.ts'

const CHARACTER_ART: readonly FamilyCharacterArt[] = [fluffyCharacterArt, sparklyCharacterArt, splashyCharacterArt]

/** The component that draws `characterId` (idle with blinking, dance, silhouette). Every Character in the catalog needs art. */
export function characterArt(characterId: string): CharacterArt {
  for (const family of CHARACTER_ART) {
    const art = family[characterId]
    if (art) return art
  }
  throw new Error(`No art registered for Character "${characterId}"`)
}

/** The component that draws an Egg of `familyId`, with its pattern and fill stage. */
export function eggPattern(familyId: string): EggPattern {
  return eggPatterns[familyId] ?? PlaceholderEgg
}
