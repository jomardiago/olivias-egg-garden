import type { ComponentType } from 'react'

/**
 * How a screen asks for a Character to be drawn. One component per
 * Character renders every state:
 * - `idle` (default): a gentle bob or breathe, plus blinking at random
 *   intervals, which the art handles itself.
 * - `dance`: the Character's own 1-2 second tap dance, then back to idle.
 *   `onDanceEnd` fires when it finishes.
 * - `silhouette`: the not-yet-hatched mystery shape for the Collection.
 */
export type CharacterArtProps = {
  characterId: string
  pose?: 'idle' | 'dance'
  silhouette?: boolean
  /** Rendered width and height in CSS pixels; art must stay crisp from Garden size to full-screen. */
  size?: number
  onDanceEnd?: () => void
}

export type CharacterArt = ComponentType<CharacterArtProps>

/** A family's Character art, keyed by Character id. A Character with no entry falls back to the placeholder. */
export type FamilyCharacterArt = Readonly<Partial<Record<string, CharacterArt>>>

/** The four visual fill stages of an Egg (ticket 05). */
export type EggStage = 'still' | 'wobbling' | 'smallCrack' | 'bigCrack'

/** How a screen asks for an Egg Family's Egg to be drawn. */
export type EggPatternProps = {
  familyId: string
  stage?: EggStage
  /** Rendered height in CSS pixels. */
  size?: number
}

export type EggPattern = ComponentType<EggPatternProps>
