/**
 * Character catalog: static content kept separate from Garden state.
 * State refers to Characters only by id. Ticket 03 fills in the Egg
 * Families and Characters; tickets 07-09 plug real art in through
 * `CharacterArt`, so no screen changes when art lands.
 */
import type { ComponentType } from 'react'
import { PlaceholderCharacterArt } from './PlaceholderCharacterArt.tsx'

/** How a screen asks for a Character to be drawn. */
export type CharacterArtProps = {
  characterId: string
  /** `idle` bobs and blinks; `dance` plays the Character's tap dance. */
  pose?: 'idle' | 'dance'
  /** Not-yet-hatched silhouette, for the Collection. */
  silhouette?: boolean
  size?: number
}

export type CharacterArt = ComponentType<CharacterArtProps>

export function characterArt(_characterId: string): CharacterArt {
  return PlaceholderCharacterArt
}
