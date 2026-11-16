import type { CharacterArtProps } from './art/types.ts'
import { findCharacter } from './families.ts'

const COLOURS = ['#ffb3c7', '#ffd36e', '#9ee2c9', '#b9a7ff', '#8fd3ff']

function hue(characterId: string): string {
  let sum = 0
  for (const ch of characterId) sum += ch.charCodeAt(0)
  return COLOURS[sum % COLOURS.length] ?? '#ffb3c7'
}

/** A friendly round blob until real Character art arrives. */
export function PlaceholderCharacterArt({ characterId, pose = 'idle', silhouette, size = 72 }: CharacterArtProps) {
  const fill = silhouette ? '#55506a' : hue(characterId)
  return (
    <svg
      className={`character character--${pose}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={silhouette ? 'Mystery Character' : (findCharacter(characterId)?.name ?? 'Character')}
    >
      <ellipse cx="50" cy="58" rx="38" ry="34" fill={fill} />
      <ellipse cx="30" cy="26" rx="10" ry="14" fill={fill} />
      <ellipse cx="70" cy="26" rx="10" ry="14" fill={fill} />
      {!silhouette && (
        <g className="character__face">
          <circle className="character__eye" cx="38" cy="52" r="5" fill="#2b2340" />
          <circle className="character__eye" cx="62" cy="52" r="5" fill="#2b2340" />
          <path d="M40 68 Q50 76 60 68" stroke="#2b2340" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="64" r="5" fill="#ff7aa2" opacity="0.5" />
          <circle cx="70" cy="64" r="5" fill="#ff7aa2" opacity="0.5" />
        </g>
      )}
    </svg>
  )
}
