import type { ReactNode } from 'react'
import type { EggPattern, EggPatternProps } from './types.ts'

/**
 * Egg art per Egg Family, keyed by family id. Ticket 05 replaces these
 * simple placeholder patterns with the polished SVG Eggs and fill stages;
 * a family with no entry falls back to `PlaceholderEgg`.
 */
export const eggPatterns: Readonly<Partial<Record<string, EggPattern>>> = {
  fluffy: (props) => <SimpleEgg {...props} fill="#fff4dc" stroke="#e9cfa0" decoration={<FluffySpots />} />,
  sparkly: (props) => <SimpleEgg {...props} fill="#e9e0ff" stroke="#b9a7ff" decoration={<SparklyStars />} />,
  splashy: (props) => <SimpleEgg {...props} fill="#d6f5f1" stroke="#7fd3c9" decoration={<SplashyWaves />} />,
}

export function PlaceholderEgg(props: EggPatternProps) {
  return <SimpleEgg {...props} fill="#fff4dc" stroke="#e9cfa0" />
}

const EGG_PATH = 'M50 4 C80 4 96 56 96 80 C96 108 76 122 50 122 C24 122 4 108 4 80 C4 56 20 4 50 4 Z'

function SimpleEgg({ size = 176, fill, stroke, decoration }: EggPatternProps & { fill: string; stroke: string; decoration?: ReactNode }) {
  return (
    <svg width={(size * 100) / 126} height={size} viewBox="0 0 100 126" role="img" aria-label="Egg">
      <path d={EGG_PATH} fill={fill} stroke={stroke} strokeWidth="3" />
      {decoration}
    </svg>
  )
}

function FluffySpots() {
  return (
    <g opacity="0.8">
      <circle cx="34" cy="44" r="7" fill="#ffc7d9" />
      <circle cx="64" cy="58" r="8" fill="#c9ecff" />
      <circle cx="40" cy="86" r="8" fill="#d9f5c4" />
      <circle cx="70" cy="96" r="6" fill="#ffe7a8" />
    </g>
  )
}

function SparklyStars() {
  const star = 'M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z'
  return (
    <g fill="#fff6b8" stroke="#d7b6ff" strokeWidth="0.8">
      <path d={star} transform="translate(36 46)" />
      <path d={star} transform="translate(66 64) scale(1.2)" />
      <path d={star} transform="translate(40 92) scale(0.9)" />
      <path d={star} transform="translate(68 100) scale(0.7)" />
    </g>
  )
}

function SplashyWaves() {
  return (
    <g fill="none" stroke="#4fb8d8" strokeWidth="4" strokeLinecap="round" opacity="0.7">
      <path d="M16 64 Q26 56 36 64 T56 64 T76 64 T90 62" />
      <path d="M10 88 Q20 80 30 88 T50 88 T70 88 T92 86" />
    </g>
  )
}
