import { useId, type ReactNode } from 'react'
import type { EggPattern, EggPatternProps, EggStage } from './types.ts'
import './eggPatterns.css'

/**
 * Egg art per Egg Family, keyed by family id. Each Egg is a shaded SVG
 * with its family's pattern, and shows its fill stage: still, wobbling,
 * a small crack, then a big crack glowing with light just before a Hatch.
 * A family with no entry falls back to `PlaceholderEgg`.
 */
export const eggPatterns: Readonly<Partial<Record<string, EggPattern>>> = {
  fluffy: (props) => <ShadedEgg {...props} palette={FLUFFY} decoration={<FluffySpots />} />,
  sparkly: (props) => <ShadedEgg {...props} palette={SPARKLY} decoration={<SparklyStars />} />,
  splashy: (props) => <ShadedEgg {...props} palette={SPLASHY} decoration={<SplashyWaves />} />,
}

export function PlaceholderEgg(props: EggPatternProps) {
  return <ShadedEgg {...props} palette={FLUFFY} />
}

type Palette = {
  /** Highlight, body and edge-shade colours of the shell's gradient. */
  light: string
  base: string
  shade: string
  outline: string
  crack: string
}

const FLUFFY: Palette = { light: '#fffdf6', base: '#fff1d2', shade: '#f1d29c', outline: '#e2bd80', crack: '#a7773e' }
const SPARKLY: Palette = { light: '#fbf8ff', base: '#e6dbff', shade: '#b79ef2', outline: '#a387e6', crack: '#6c4fb8' }
const SPLASHY: Palette = { light: '#f4fffd', base: '#c8f3ec', shade: '#7fd3ca', outline: '#5cbdb7', crack: '#2b8a8f' }

const EGG_PATH = 'M50 4 C80 4 96 56 96 80 C96 108 76 122 50 122 C24 122 4 108 4 80 C4 56 20 4 50 4 Z'
const VIEW_WIDTH = 100
const VIEW_HEIGHT = 132

function ShadedEgg({ size = 176, stage = 'still', palette, decoration }: EggPatternProps & { palette: Palette; decoration?: ReactNode }) {
  const id = useId().replace(/:/g, '')
  const shell = `egg-shell-${id}`
  const clip = `egg-clip-${id}`
  const glow = `egg-glow-${id}`

  return (
    <svg
      className={`egg-art egg-art--${stage}`}
      width={(size * VIEW_WIDTH) / VIEW_HEIGHT}
      height={size}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="Egg"
    >
      <defs>
        <radialGradient id={shell} cx="0.38" cy="0.3" r="0.78">
          <stop offset="0" stopColor={palette.light} />
          <stop offset="0.45" stopColor={palette.base} />
          <stop offset="1" stopColor={palette.shade} />
        </radialGradient>
        <clipPath id={clip}>
          <path d={EGG_PATH} />
        </clipPath>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <ellipse className="egg-art__shadow" cx="50" cy="125" rx="34" ry="5" fill="#3b2f55" opacity="0.16" />

      <g className="egg-art__body">
        <path d={EGG_PATH} fill={`url(#${shell})`} />
        <g clipPath={`url(#${clip})`}>
          {decoration}
          {/* Soft shade along the bottom so the Egg looks round. */}
          <ellipse cx="56" cy="128" rx="60" ry="26" fill={palette.shade} opacity="0.35" />
          <Cracks stage={stage} palette={palette} glowFilter={`url(#${glow})`} />
        </g>
        <path d={EGG_PATH} fill="none" stroke={palette.outline} strokeWidth="2.5" />
        {/* Shine. */}
        <ellipse cx="32" cy="34" rx="8" ry="14" transform="rotate(24 32 34)" fill="#fff" opacity="0.7" />
        <circle cx="25" cy="54" r="3" fill="#fff" opacity="0.6" />
        {stage === 'bigCrack' && <LightSparkles />}
      </g>
    </svg>
  )
}

const SMALL_CRACK = 'M66 10 L60 20 L67 25 L59 35 L64 40'
const SMALL_CRACK_BRANCH = 'M67 25 L74 28'
const BIG_CRACK = 'M2 60 L13 52 L21 61 L31 50 L40 60 L50 49 L59 59 L69 48 L78 58 L87 49 L98 56'
const BIG_CRACK_BRANCHES = 'M31 50 L29 42 M59 59 L62 67 M78 58 L76 66 M64 40 L69 48'

function Cracks({ stage, palette, glowFilter }: { stage: EggStage; palette: Palette; glowFilter: string }) {
  if (stage === 'still' || stage === 'wobbling') return null
  const big = stage === 'bigCrack'
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {big && (
        <g className="egg-art__glow" stroke="#ffe066" strokeWidth="9" filter={glowFilter}>
          <path d={BIG_CRACK} />
          <path d={SMALL_CRACK} />
        </g>
      )}
      {/* A light edge under each crack gives it depth. */}
      <g stroke="#fff" strokeWidth="3.2" opacity="0.8" transform="translate(0.8 1.2)">
        <path d={SMALL_CRACK} />
        <path d={SMALL_CRACK_BRANCH} />
        {big && <path d={BIG_CRACK} />}
        {big && <path d={BIG_CRACK_BRANCHES} />}
      </g>
      <g stroke={big ? '#ffb800' : palette.crack} strokeWidth="2.4">
        <path d={SMALL_CRACK} />
        <path d={SMALL_CRACK_BRANCH} />
        {big && <path d={BIG_CRACK} />}
        {big && <path d={BIG_CRACK_BRANCHES} />}
      </g>
    </g>
  )
}

const TWINKLE = 'M0 -6 C0.6 -1.4 1.4 -0.6 6 0 C1.4 0.6 0.6 1.4 0 6 C-0.6 1.4 -1.4 0.6 -6 0 C-1.4 -0.6 -0.6 -1.4 0 -6 Z'

/** Little sparkles of light escaping the big crack. */
function LightSparkles() {
  return (
    <g className="egg-art__light" fill="#ffe680" stroke="#ffb800" strokeWidth="0.6">
      <path d={TWINKLE} transform="translate(10 40) scale(0.9)" />
      <path d={TWINKLE} transform="translate(92 42) scale(1.1)" />
      <path d={TWINKLE} transform="translate(80 18) scale(0.7)" />
    </g>
  )
}

/** Fluffy: pastel polka spots, each with its own little shine. */
function FluffySpots() {
  const spots: [number, number, number, string][] = [
    [30, 30, 7, '#ffc2d6'],
    [62, 22, 5, '#c6e8ff'],
    [76, 50, 9, '#d6f3bf'],
    [44, 56, 8, '#ffe39a'],
    [16, 74, 7, '#e0d0ff'],
    [64, 80, 8, '#ffc2d6'],
    [36, 96, 9, '#c6e8ff'],
    [84, 98, 6, '#ffe39a'],
    [56, 110, 6, '#d6f3bf'],
    [8, 100, 6, '#ffc2d6'],
  ]
  return (
    <g>
      {spots.map(([cx, cy, r, color]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r} fill={color} />
          <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.3} fill="#fff" opacity="0.65" />
        </g>
      ))}
      {/* Tiny dots between the spots, like soft fluff. */}
      <g fill="#f3c98f" opacity="0.6">
        <circle cx="48" cy="36" r="1.4" />
        <circle cx="22" cy="52" r="1.4" />
        <circle cx="86" cy="72" r="1.4" />
        <circle cx="50" cy="80" r="1.4" />
        <circle cx="22" cy="114" r="1.4" />
        <circle cx="74" cy="114" r="1.4" />
      </g>
    </g>
  )
}

const GLITTER_STAR = 'M0 -8 L2.3 -2.3 L8 0 L2.3 2.3 L0 8 L-2.3 2.3 L-8 0 L-2.3 -2.3 Z'

/** Sparkly: golden glitter stars that twinkle, and specks of glitter. */
function SparklyStars() {
  const stars: [number, number, number][] = [
    [34, 32, 1],
    [68, 46, 1.3],
    [24, 76, 0.9],
    [58, 84, 1.1],
    [82, 100, 0.8],
    [40, 108, 0.9],
    [56, 16, 0.6],
  ]
  return (
    <g>
      <g fill="#fff3a6" stroke="#e8b730" strokeWidth="0.8" strokeLinejoin="round">
        {stars.map(([x, y, scale], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
            <path className="egg-art__twinkle" style={{ animationDelay: `${-i * 0.45}s` }} d={GLITTER_STAR} />
          </g>
        ))}
      </g>
      <g fill="#fff">
        {[[46, 46], [80, 70], [14, 56], [36, 66], [74, 116], [20, 98], [64, 106], [86, 82], [50, 64]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.6 : 1.1} opacity="0.9" />
        ))}
      </g>
      <g fill="#ffb3e6" opacity="0.8">
        <circle cx="52" cy="38" r="1.3" />
        <circle cx="28" cy="88" r="1.3" />
        <circle cx="72" cy="62" r="1.3" />
      </g>
    </g>
  )
}

/** Splashy: rolling waves with white foam around the bottom, and bubbles rising above. */
function SplashyWaves() {
  return (
    <g>
      <path d="M0 74 Q10 66 20 74 T40 74 T60 74 T80 74 T100 74 V132 H0 Z" fill="#8fdcf0" />
      <path d="M0 74 Q10 66 20 74 T40 74 T60 74 T80 74 T100 74" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M-6 94 Q4 86 14 94 T34 94 T54 94 T74 94 T94 94 T114 94 V132 H-6 Z" fill="#4fb4dc" />
      <path d="M-6 94 Q4 86 14 94 T34 94 T54 94 T74 94 T94 94 T114 94" fill="none" stroke="#e6fbff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M0 112 Q10 106 20 112 T40 112 T60 112 T80 112 T100 112 V132 H0 Z" fill="#3a93c9" />
      <g fill="#fff" fillOpacity="0.55" stroke="#fff" strokeWidth="1.2">
        <circle cx="30" cy="50" r="4.5" />
        <circle cx="40" cy="36" r="2.6" />
        <circle cx="66" cy="56" r="3.4" />
        <circle cx="60" cy="26" r="2" />
        <circle cx="78" cy="40" r="2.4" />
      </g>
      <g fill="#fff">
        <circle cx="28.5" cy="48.5" r="1.2" />
        <circle cx="65" cy="55" r="0.9" />
      </g>
    </g>
  )
}
