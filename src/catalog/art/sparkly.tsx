import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { findCharacter } from '../families.ts'
import type { CharacterArt, CharacterArtProps, FamilyCharacterArt } from './types.ts'
import './sparkly.css'

/**
 * Sparkly Egg Family art (ticket 08): Twinkle the unicorn, Ember the baby
 * dragon, Glimmer the fairy fox, Puff the cloud sprite and Pippa the pegasus.
 *
 * Every Character is drawn on a 200x200 canvas by a `Design`; `SparklyFrame`
 * gives them the shared behaviour: random blinking, the idle float, the
 * timed tap dance (CSS keyframes in `sparkly.css`, `onDanceEnd` from a timer
 * so it still fires when animations are switched off), and the flat
 * silhouette for the Collection.
 */

const INK = '#3a2a56'
const SILHOUETTE = '#5b5475'

type Paint = {
  /** Eyes closed for a blink. */
  blink: boolean
  /** `url(#…)` for a gradient defined in this instance's `defs`. */
  url: (name: string) => string
  /** The id to give a gradient so `url(name)` finds it. */
  def: (name: string) => string
}

type Design = {
  characterId: string
  /** Length of the tap dance; keep in step with its keyframes in sparkly.css. */
  danceMs: number
  defs: (p: Paint) => ReactNode
  draw: (p: Paint) => ReactNode
  /** Twinkling stars around the Character: [x, y, size]. */
  sparkles: readonly (readonly [number, number, number])[]
}

// ---------------------------------------------------------------------------
// Shared behaviour

function useBlink(enabled: boolean): boolean {
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(
        () => {
          setClosed(true)
          timer = setTimeout(() => {
            setClosed(false)
            schedule()
          }, 140)
        },
        1800 + Math.random() * 4200,
      )
    }
    schedule()
    return () => clearTimeout(timer)
  }, [enabled])
  return closed
}

function SparklyFrame({ design, characterId, pose = 'idle', silhouette = false, size = 72, onDanceEnd }: CharacterArtProps & { design: Design }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const blinking = useBlink(!silhouette)
  const onDanceEndRef = useRef(onDanceEnd)
  onDanceEndRef.current = onDanceEnd

  const dancing = pose === 'dance' && !silhouette
  useEffect(() => {
    if (!dancing) return
    const timer = setTimeout(() => onDanceEndRef.current?.(), design.danceMs)
    return () => clearTimeout(timer)
  }, [dancing, design.danceMs])

  const def = (name: string) => `${uid}-${name}`
  const paint: Paint = { blink: blinking, def, url: (name) => `url(#${def(name)})` }
  const state = silhouette ? 'silhouette' : dancing ? 'dance' : 'idle'

  return (
    <svg
      className={`sparkly sparkly--${characterId} sparkly--${state}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={silhouette ? 'Mystery Character' : (findCharacter(characterId)?.name ?? 'Character')}
    >
      <defs>
        <filter id={def('silhouette')}>
          <feFlood floodColor={SILHOUETTE} />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        {design.defs(paint)}
      </defs>
      <ellipse className="sparkly__shadow" cx="100" cy="190" rx="52" ry="7" fill="#3a2a56" opacity="0.14" />
      <g className="sparkly__actor" filter={silhouette ? `url(#${def('silhouette')})` : undefined}>
        {design.draw(paint)}
      </g>
      {!silhouette && (
        <g className="sparkly__sparkles">
          {design.sparkles.map(([x, y, s], i) => (
            <Sparkle key={i} x={x} y={y} s={s} fill={i % 2 ? '#ffffff' : '#fff1a8'} delay={i * 0.7} />
          ))}
        </g>
      )}
    </svg>
  )
}

function makeArt(design: Design): CharacterArt {
  function SparklyCharacter(props: CharacterArtProps) {
    return <SparklyFrame {...props} design={design} />
  }
  SparklyCharacter.displayName = `Sparkly(${design.characterId})`
  return SparklyCharacter
}

// ---------------------------------------------------------------------------
// Shared drawing pieces

/** A big shiny cartoon eye, or a happy closed curve mid-blink. */
function Eye({ x, y, r, closed, lashes }: { x: number; y: number; r: number; closed: boolean; lashes?: 'left' | 'right' }) {
  const side = lashes === 'left' ? -1 : 1
  return (
    <g className="sparkly__eye">
      {closed ? (
        <path d={`M${x - r} ${y} Q${x} ${y + r * 0.8} ${x + r} ${y}`} stroke={INK} strokeWidth={r * 0.32} strokeLinecap="round" fill="none" />
      ) : (
        <>
          <ellipse cx={x} cy={y} rx={r * 0.86} ry={r} fill={INK} />
          <ellipse cx={x} cy={y + r * 0.45} rx={r * 0.58} ry={r * 0.38} fill="#8a67d6" opacity="0.85" />
          <circle cx={x - r * 0.3} cy={y - r * 0.36} r={r * 0.36} fill="#fff" />
          <circle cx={x + r * 0.34} cy={y + r * 0.22} r={r * 0.15} fill="#fff" />
        </>
      )}
      {lashes && (
        <path
          d={`M${x + side * r * 0.8} ${y - r * 0.5} l${side * r * 0.5} ${-r * 0.4} M${x + side * r * 0.9} ${y - r * 0.05} l${side * r * 0.6} ${-r * 0.1}`}
          stroke={INK}
          strokeWidth={r * 0.2}
          strokeLinecap="round"
        />
      )}
    </g>
  )
}

function Cheeks({ y, dx, colour = '#ff8fbd' }: { y: number; dx: number; colour?: string }) {
  return (
    <g opacity="0.55">
      <ellipse cx={100 - dx} cy={y} rx="9" ry="5.5" fill={colour} />
      <ellipse cx={100 + dx} cy={y} rx="9" ry="5.5" fill={colour} />
    </g>
  )
}

function sparklePath(x: number, y: number, s: number): string {
  const k = s * 0.18
  return `M${x} ${y - s} Q${x + k} ${y - k} ${x + s} ${y} Q${x + k} ${y + k} ${x} ${y + s} Q${x - k} ${y + k} ${x - s} ${y} Q${x - k} ${y - k} ${x} ${y - s}Z`
}

function Sparkle({ x, y, s, fill, delay = 0, className = 'sparkly__sparkle' }: { x: number; y: number; s: number; fill: string; delay?: number; className?: string }) {
  return <path className={className} d={sparklePath(x, y, s)} fill={fill} style={{ animationDelay: `${delay}s` }} />
}

/** A puffy curl of hair: a ball with a soft highlight. */
function Curl({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.38} ry={r * 0.24} fill="#fff" opacity="0.45" />
    </g>
  )
}

function Heart({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d={`M${x} ${y + s * 0.9} C${x - s * 1.4} ${y} ${x - s * 0.9} ${y - s} ${x} ${y - s * 0.35} C${x + s * 0.9} ${y - s} ${x + s * 1.4} ${y} ${x} ${y + s * 0.9}Z`}
      fill={fill}
    />
  )
}

/** Mirror a path drawn on the left half to the right half of the 200-wide canvas. */
function Mirrored({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <g transform="translate(200 0) scale(-1 1)">
      <g className={className}>{children}</g>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Twinkle the unicorn: pearly white with a rainbow of puffy curls and a golden horn.

const RAINBOW = { pink: '#ff9ecb', peach: '#ffc493', lemon: '#ffe680', mint: '#90e4c8', sky: '#93cfff', lilac: '#c6a3ff' }

const twinkle: Design = {
  characterId: 'twinkle',
  danceMs: 1600,
  sparkles: [
    [30, 40, 7],
    [176, 70, 6],
    [26, 150, 5],
  ],
  defs: ({ def }) => (
    <>
      <radialGradient id={def('pearl')} cx="40%" cy="30%" r="80%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#f4ecff" />
        <stop offset="1" stopColor="#dccbf7" />
      </radialGradient>
      <linearGradient id={def('horn')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff8cc" />
        <stop offset="0.5" stopColor="#ffd86b" />
        <stop offset="1" stopColor="#f3a63b" />
      </linearGradient>
      <radialGradient id={def('muzzle')} cx="50%" cy="35%" r="70%">
        <stop offset="0" stopColor="#fff6fb" />
        <stop offset="1" stopColor="#ffd6ea" />
      </radialGradient>
    </>
  ),
  draw: ({ url, blink }) => (
    <>
      <g className="tw-tail">
        <Curl x={148} y={160} r={13} fill={RAINBOW.pink} />
        <Curl x={162} y={147} r={12} fill={RAINBOW.peach} />
        <Curl x={170} y={132} r={11} fill={RAINBOW.lemon} />
        <Curl x={169} y={117} r={10} fill={RAINBOW.mint} />
        <Curl x={160} y={106} r={8} fill={RAINBOW.sky} />
      </g>
      {/* body and legs */}
      <ellipse cx="62" cy="172" rx="17" ry="13" fill="#e3d6f8" />
      <ellipse cx="138" cy="172" rx="17" ry="13" fill="#e3d6f8" />
      <ellipse cx="100" cy="152" rx="46" ry="32" fill={url('pearl')} />
      <rect x="77" y="150" width="19" height="36" rx="9.5" fill={url('pearl')} />
      <rect x="104" y="150" width="19" height="36" rx="9.5" fill={url('pearl')} />
      <rect x="77" y="175" width="19" height="11" rx="5" fill="#ffb0d2" />
      <rect x="104" y="175" width="19" height="11" rx="5" fill="#ffb0d2" />
      {/* mane behind the head */}
      <Curl x={54} y={72} r={15} fill={RAINBOW.pink} />
      <Curl x={47} y={95} r={14} fill={RAINBOW.lilac} />
      <Curl x={51} y={117} r={13} fill={RAINBOW.mint} />
      <Curl x={61} y={136} r={11} fill={RAINBOW.sky} />
      <Curl x={147} y={72} r={13} fill={RAINBOW.peach} />
      <Curl x={153} y={93} r={11} fill={RAINBOW.pink} />
      {/* ears */}
      <path d="M62 64 Q50 30 72 20 Q86 38 84 58 Z" fill={url('pearl')} />
      <path d="M66 57 Q59 36 71 29 Q79 41 78 55 Z" fill="#ffc2dc" />
      <path d="M138 64 Q150 30 128 20 Q114 38 116 58 Z" fill={url('pearl')} />
      <path d="M134 57 Q141 36 129 29 Q121 41 122 55 Z" fill="#ffc2dc" />
      <ellipse cx="100" cy="88" rx="51" ry="45" fill={url('pearl')} />
      {/* horn */}
      <g className="tw-horn">
        <path d="M89 50 L100 4 L111 50 Q100 57 89 50 Z" fill={url('horn')} />
        <path d="M91 42 Q101 46 109 38 M93 31 Q101 34 107 27 M96 20 Q101 22 105 16" stroke="#e8962f" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.75" />
        <path d="M96 46 L100 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </g>
      {/* forelock */}
      <Curl x={63} y={60} r={12} fill={RAINBOW.sky} />
      <Curl x={74} y={50} r={14} fill={RAINBOW.pink} />
      <Curl x={90} y={46} r={11} fill={RAINBOW.peach} />
      <Curl x={111} y={46} r={11} fill={RAINBOW.mint} />
      <Curl x={127} y={51} r={14} fill={RAINBOW.lilac} />
      <Curl x={139} y={61} r={11} fill={RAINBOW.lemon} />
      {/* face */}
      <ellipse cx="100" cy="111" rx="30" ry="19" fill={url('muzzle')} />
      <ellipse cx="91" cy="106" rx="2.6" ry="2" fill="#e49cc0" />
      <ellipse cx="109" cy="106" rx="2.6" ry="2" fill="#e49cc0" />
      <path d="M91 116 Q100 124 109 116" stroke="#8a4a6b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Eye x={76} y={85} r={11} closed={blink} lashes="left" />
      <Eye x={124} y={85} r={11} closed={blink} lashes="right" />
      <Cheeks y={103} dx={37} />
      <g className="tw-burst">
        <Sparkle x={100} y={4} s={14} fill="#fff1a8" className="tw-burst__star" />
        <Sparkle x={74} y={14} s={8} fill={RAINBOW.pink} className="tw-burst__star" delay={0.1} />
        <Sparkle x={128} y={12} s={9} fill={RAINBOW.sky} className="tw-burst__star" delay={0.2} />
        <Sparkle x={60} y={36} s={6} fill={RAINBOW.mint} className="tw-burst__star" delay={0.3} />
        <Sparkle x={142} y={34} s={7} fill={RAINBOW.lilac} className="tw-burst__star" delay={0.15} />
      </g>
    </>
  ),
}

// ---------------------------------------------------------------------------
// Ember the baby dragon: warm coral, cream tummy, wiggly wings and a heart-tipped tail.

const ember: Design = {
  characterId: 'ember',
  danceMs: 1700,
  sparkles: [
    [28, 60, 6],
    [178, 96, 5],
    [36, 168, 5],
  ],
  defs: ({ def }) => (
    <>
      <radialGradient id={def('scales')} cx="40%" cy="30%" r="80%">
        <stop offset="0" stopColor="#ffb994" />
        <stop offset="0.55" stopColor="#ff8a6b" />
        <stop offset="1" stopColor="#ef6459" />
      </radialGradient>
      <radialGradient id={def('belly')} cx="50%" cy="30%" r="75%">
        <stop offset="0" stopColor="#fff6dc" />
        <stop offset="1" stopColor="#ffd89c" />
      </radialGradient>
      <linearGradient id={def('wing')} x1="1" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ffb08f" />
        <stop offset="1" stopColor="#ffd9a8" />
      </linearGradient>
      <radialGradient id={def('flame')} cx="50%" cy="70%" r="70%">
        <stop offset="0" stopColor="#fff6b0" />
        <stop offset="0.5" stopColor="#ffc94d" />
        <stop offset="1" stopColor="#ff8b3d" />
      </radialGradient>
    </>
  ),
  draw: ({ url, blink }) => {
    const wing = (
      <>
        <path d="M70 122 C50 90 26 86 16 100 C27 103 29 111 25 118 C36 117 40 125 37 132 C48 129 58 133 66 138 Z" fill={url('wing')} />
        <path d="M66 126 Q44 106 22 102 M62 130 Q46 120 30 120" stroke="#f08a6c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    )
    return (
      <>
        <g className="em-wing-l">{wing}</g>
        <Mirrored className="em-wing-l">{wing}</Mirrored>
        <g className="em-tail">
          <path d="M126 170 Q166 180 170 142" stroke={url('scales')} strokeWidth="16" fill="none" strokeLinecap="round" />
          <path d="M170 120 Q184 132 177 141 Q172 146 170 146 Q168 146 163 141 Q156 132 170 120 Z" fill="#ffd166" />
        </g>
        {/* body */}
        <ellipse cx="100" cy="150" rx="41" ry="37" fill={url('scales')} />
        <ellipse cx="100" cy="157" rx="26" ry="26" fill={url('belly')} />
        <path d="M80 147 Q100 152 120 147 M77 159 Q100 164 123 159 M81 171 Q100 176 119 171" stroke="#f2c27f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="66" cy="146" rx="9" ry="13" fill={url('scales')} transform="rotate(25 66 146)" />
        <ellipse cx="134" cy="146" rx="9" ry="13" fill={url('scales')} transform="rotate(-25 134 146)" />
        <ellipse cx="78" cy="182" rx="17" ry="9" fill={url('scales')} />
        <ellipse cx="122" cy="182" rx="17" ry="9" fill={url('scales')} />
        <g fill="#fff3dc">
          <circle cx="70" cy="185" r="2.6" />
          <circle cx="78" cy="187" r="2.6" />
          <circle cx="86" cy="185" r="2.6" />
          <circle cx="114" cy="185" r="2.6" />
          <circle cx="122" cy="187" r="2.6" />
          <circle cx="130" cy="185" r="2.6" />
        </g>
        {/* head crest, horns and ear fins */}
        <path d="M86 50 Q91 30 98 46 Z M94 46 Q100 24 106 46 Z M102 46 Q109 30 114 50 Z" fill="#ffd166" />
        <path d="M70 60 Q56 36 64 22 Q72 40 84 52 Z" fill="#fff1d4" />
        <path d="M130 60 Q144 36 136 22 Q128 40 116 52 Z" fill="#fff1d4" />
        <path d="M56 84 Q32 74 34 60 Q48 64 60 74 Z" fill={url('wing')} />
        <path d="M144 84 Q168 74 166 60 Q152 64 140 74 Z" fill={url('wing')} />
        <ellipse cx="100" cy="84" rx="47" ry="40" fill={url('scales')} />
        <g fill="#ffc8ad" opacity="0.8">
          <circle cx="100" cy="60" r="3.5" />
          <circle cx="91" cy="64" r="2.4" />
          <circle cx="109" cy="64" r="2.4" />
        </g>
        {/* face */}
        <ellipse cx="100" cy="103" rx="27" ry="17" fill="#ffc6a6" />
        <ellipse cx="92" cy="98" rx="2.8" ry="2.2" fill="#c9574a" />
        <ellipse cx="108" cy="98" rx="2.8" ry="2.2" fill="#c9574a" />
        <path d="M88 108 Q100 117 112 108" stroke="#8c3b33" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M103 111 L105.5 116.5 L108 110" fill="#fff" />
        <Eye x={80} y={78} r={10.5} closed={blink} />
        <Eye x={120} y={78} r={10.5} closed={blink} />
        <Cheeks y={96} dx={36} colour="#ff6f8f" />
        {/* the tiny harmless spark she puffs when she dances */}
        <g transform="translate(100 108)">
          <g className="em-puff">
            <circle cx="-14" cy="-6" r="9" fill="#f3eeff" />
            <circle cx="14" cy="-10" r="7" fill="#f3eeff" />
            <circle cx="0" cy="-18" r="8" fill="#f3eeff" />
            <path d="M0 -40 Q13 -22 8 -10 Q0 -2 -8 -10 Q-13 -22 0 -40 Z" fill={url('flame')} />
            <path d="M0 -26 Q6 -17 3 -11 Q0 -8 -3 -11 Q-6 -17 0 -26 Z" fill="#fffbe0" />
            <path d={sparklePath(-22, -36, 6)} fill="#ffe680" />
            <path d={sparklePath(22, -40, 5)} fill="#ffb3d1" />
          </g>
        </g>
      </>
    )
  },
}

// ---------------------------------------------------------------------------
// Glimmer the fairy fox: peachy fur, see-through rainbow wings, a lilac-tipped
// tail and a little star gem on her forehead.

const glimmer: Design = {
  characterId: 'glimmer',
  danceMs: 1600,
  sparkles: [
    [24, 40, 6],
    [182, 86, 6],
    [40, 176, 4],
  ],
  defs: ({ def }) => (
    <>
      <radialGradient id={def('fur')} cx="40%" cy="30%" r="80%">
        <stop offset="0" stopColor="#ffcdb0" />
        <stop offset="0.55" stopColor="#ffa47f" />
        <stop offset="1" stopColor="#f2846c" />
      </radialGradient>
      <linearGradient id={def('tip')} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#e2c8ff" />
        <stop offset="1" stopColor="#a98bff" />
      </linearGradient>
      <linearGradient id={def('wing')} x1="1" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#d6f2ff" />
        <stop offset="0.5" stopColor="#efd6ff" />
        <stop offset="1" stopColor="#ffd6ec" />
      </linearGradient>
    </>
  ),
  draw: ({ url, blink }) => {
    const wing = (
      <>
        <path d="M82 118 C54 66 16 66 20 96 C22 116 54 124 82 122 Z" fill={url('wing')} stroke="#fff" strokeWidth="2.5" opacity="0.88" />
        <path d="M82 128 C58 132 38 152 50 163 C62 170 78 148 84 132 Z" fill={url('wing')} stroke="#fff" strokeWidth="2.5" opacity="0.88" />
        <path d="M78 116 Q52 90 32 86" stroke="#fff" strokeWidth="2" fill="none" opacity="0.9" strokeLinecap="round" />
        <circle cx="38" cy="94" r="3" fill="#fff" />
        <circle cx="58" cy="150" r="2.5" fill="#fff" />
      </>
    )
    return (
      <>
        <g className="gl-wing-l">{wing}</g>
        <Mirrored className="gl-wing-l">{wing}</Mirrored>
        <g className="gl-tail">
          <path d="M116 174 C152 184 184 160 176 120 C170 92 148 88 144 104 C158 122 152 152 114 160 Z" fill={url('fur')} />
          <path d="M176 120 C170 92 148 88 144 104 C149 110 152 118 153 126 C162 130 171 128 176 120 Z" fill={url('tip')} />
          <path d={sparklePath(163, 100, 7)} fill="#fff" />
        </g>
        {/* body */}
        <ellipse cx="98" cy="152" rx="37" ry="33" fill={url('fur')} />
        <rect x="76" y="150" width="17" height="34" rx="8.5" fill={url('fur')} />
        <rect x="104" y="150" width="17" height="34" rx="8.5" fill={url('fur')} />
        <ellipse cx="84.5" cy="182" rx="11" ry="7" fill="#fff4ec" />
        <ellipse cx="112.5" cy="182" rx="11" ry="7" fill="#fff4ec" />
        <path d="M80 130 Q98 148 116 130 Q118 160 98 170 Q78 160 80 130 Z" fill="#fff8f2" />
        {/* ears */}
        <path d="M60 72 L48 16 Q78 26 90 54 Z" fill={url('fur')} />
        <path d="M64 64 L57 30 Q74 38 82 56 Z" fill="#ffc0dc" />
        <path d="M48 16 Q58 19 64 24 L52 32 Z" fill={url('tip')} />
        <path d="M140 72 L152 16 Q122 26 110 54 Z" fill={url('fur')} />
        <path d="M136 64 L143 30 Q126 38 118 56 Z" fill="#ffc0dc" />
        <path d="M152 16 Q142 19 136 24 L148 32 Z" fill={url('tip')} />
        {/* head with cheek tufts and a white face */}
        <path d="M52 92 L32 104 L56 110 Z" fill={url('fur')} />
        <path d="M148 92 L168 104 L144 110 Z" fill={url('fur')} />
        <path d="M100 44 C136 44 152 70 153 90 C154 108 134 124 100 125 C66 124 46 108 47 90 C48 70 64 44 100 44 Z" fill={url('fur')} />
        <path d="M100 86 C88 86 72 88 60 98 C52 106 58 118 76 120 C88 122 96 118 100 114 C104 118 112 122 124 120 C142 118 148 106 140 98 C128 88 112 86 100 86 Z" fill="#fff8f2" />
        <g className="gl-gem">
          <path d="M100 56 L103.5 63.5 L111.5 64.2 L105.4 69.5 L107.3 77.3 L100 73 L92.7 77.3 L94.6 69.5 L88.5 64.2 L96.5 63.5 Z" fill="#fff3a0" stroke="#ffc94d" strokeWidth="1.6" strokeLinejoin="round" />
        </g>
        {/* face */}
        <path d="M94 104 Q100 99 106 104 Q100 111 94 104 Z" fill={INK} />
        <path d="M91 111 Q95.5 116 100 111 Q104.5 116 109 111" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <Eye x={79} y={90} r={10.5} closed={blink} lashes="left" />
        <Eye x={121} y={90} r={10.5} closed={blink} lashes="right" />
        <Cheeks y={110} dx={34} />
        <g className="gl-trail">
          <Sparkle x={40} y={40} s={8} fill="#fff1a8" className="gl-trail__star" />
          <Sparkle x={166} y={46} s={7} fill="#d6c2ff" className="gl-trail__star" delay={0.15} />
          <Sparkle x={178} y={150} s={6} fill="#ffc0dc" className="gl-trail__star" delay={0.3} />
          <Sparkle x={22} y={130} s={6} fill="#bfe8ff" className="gl-trail__star" delay={0.45} />
        </g>
      </>
    )
  },
}

// ---------------------------------------------------------------------------
// Puff the cloud sprite: a squishy little cloud with a curl on top who
// pops out a rainbow when she dances.

const PUFFS: readonly (readonly [number, number, number])[] = [
  [100, 112, 46],
  [58, 126, 30],
  [142, 126, 30],
  [38, 142, 18],
  [162, 142, 18],
  [76, 84, 28],
  [124, 86, 26],
  [100, 72, 28],
  [80, 146, 25],
  [120, 146, 25],
]

const puff: Design = {
  characterId: 'puff',
  danceMs: 1500,
  sparkles: [
    [30, 52, 7],
    [172, 50, 6],
    [178, 168, 4],
  ],
  defs: ({ def }) => (
    <radialGradient id={def('cloud')} gradientUnits="userSpaceOnUse" cx="84" cy="70" r="120">
      <stop offset="0" stopColor="#ffffff" />
      <stop offset="0.55" stopColor="#f0f4ff" />
      <stop offset="1" stopColor="#c9d6ff" />
    </radialGradient>
  ),
  draw: ({ url, blink }) => (
    <>
      <g className="pf-rainbow" fill="none" strokeLinecap="round" strokeWidth="8">
        <path d="M22 140 A78 78 0 0 1 178 140" stroke={RAINBOW.pink} />
        <path d="M30 140 A70 70 0 0 1 170 140" stroke={RAINBOW.peach} />
        <path d="M38 140 A62 62 0 0 1 162 140" stroke={RAINBOW.lemon} />
        <path d="M46 140 A54 54 0 0 1 154 140" stroke={RAINBOW.mint} />
        <path d="M54 140 A46 46 0 0 1 146 140" stroke={RAINBOW.sky} />
      </g>
      <g className="pf-body">
        <g fill="#c4cffb">
          {PUFFS.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r + 2.5} />
          ))}
        </g>
        <g fill={url('cloud')}>
          {PUFFS.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
        <path d="M100 46 Q90 32 101 26 Q113 24 110 35" stroke="#c4cffb" strokeWidth="6" fill="none" strokeLinecap="round" />
        <ellipse cx="78" cy="74" rx="12" ry="7" fill="#fff" opacity="0.9" />
        <g className="pf-arm-l">
          <ellipse cx="24" cy="120" rx="10" ry="8" fill="#fff" stroke="#c4cffb" strokeWidth="2.5" />
        </g>
        <g className="pf-arm-r">
          <ellipse cx="176" cy="120" rx="10" ry="8" fill="#fff" stroke="#c4cffb" strokeWidth="2.5" />
        </g>
        {/* face */}
        <Eye x={82} y={108} r={10} closed={blink} />
        <Eye x={118} y={108} r={10} closed={blink} />
        <path d="M92 122 Q100 134 108 122 Z" fill="#ff7c9e" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
        <Cheeks y={124} dx={33} />
      </g>
      <g className="pf-drops">
        <path d="M70 172 q4 6 0 9 q-4 -3 0 -9Z" fill={RAINBOW.sky} />
        <path d="M100 178 q4 6 0 9 q-4 -3 0 -9Z" fill={RAINBOW.lilac} />
        <path d="M130 172 q4 6 0 9 q-4 -3 0 -9Z" fill={RAINBOW.pink} />
      </g>
    </>
  ),
}

// ---------------------------------------------------------------------------
// Pippa the pegasus: blush pink with big feathery wings, a periwinkle bob and
// a crown of tiny daisies.

const pippa: Design = {
  characterId: 'pippa',
  danceMs: 1800,
  sparkles: [
    [100, 12, 6],
    [186, 150, 5],
    [14, 150, 5],
  ],
  defs: ({ def }) => (
    <>
      <radialGradient id={def('coat')} cx="40%" cy="30%" r="80%">
        <stop offset="0" stopColor="#fff2f8" />
        <stop offset="0.55" stopColor="#ffd4e7" />
        <stop offset="1" stopColor="#f6b2d1" />
      </radialGradient>
      <linearGradient id={def('mane')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a6dcff" />
        <stop offset="1" stopColor="#a99cff" />
      </linearGradient>
      <linearGradient id={def('wing')} x1="1" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#e6e0ff" />
      </linearGradient>
    </>
  ),
  draw: ({ url, blink }) => {
    const wing = (
      <>
        <path
          d="M78 134 C62 96 32 72 6 78 C12 84 14 89 12 94 C20 96 23 102 19 108 C28 110 31 116 27 122 C38 124 42 129 42 136 C54 136 66 138 78 144 Z"
          fill={url('wing')}
          stroke="#cfc3ff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M70 128 Q48 100 20 88 M68 134 Q46 116 26 108 M68 140 Q52 130 36 126" stroke="#d9d0ff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    )
    const daisy = (x: number, y: number, petal: string) => (
      <g key={`${x}-${y}`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx={x + 5 * Math.cos((a * Math.PI) / 180)} cy={y + 5 * Math.sin((a * Math.PI) / 180)} r="4" fill={petal} />
        ))}
        <circle cx={x} cy={y} r="3.4" fill="#ffd24d" />
      </g>
    )
    return (
      <>
        <g className="pp-wing-l">{wing}</g>
        <Mirrored className="pp-wing-l">{wing}</Mirrored>
        <g className="pp-tail">
          <Curl x={150} y={160} r={11} fill={url('mane')} />
          <Curl x={161} y={149} r={10} fill={url('mane')} />
          <Curl x={166} y={136} r={8} fill={url('mane')} />
        </g>
        {/* body and legs */}
        <rect x="58" y="150" width="17" height="34" rx="8.5" fill="#f4bfd8" />
        <rect x="125" y="150" width="17" height="34" rx="8.5" fill="#f4bfd8" />
        <ellipse cx="100" cy="148" rx="44" ry="30" fill={url('coat')} />
        <rect x="80" y="152" width="17" height="34" rx="8.5" fill={url('coat')} />
        <rect x="103" y="152" width="17" height="34" rx="8.5" fill={url('coat')} />
        <rect x="58" y="176" width="17" height="10" rx="5" fill="#ffd66e" />
        <rect x="125" y="176" width="17" height="10" rx="5" fill="#ffd66e" />
        <rect x="80" y="177" width="17" height="10" rx="5" fill="#ffd66e" />
        <rect x="103" y="177" width="17" height="10" rx="5" fill="#ffd66e" />
        {/* mane behind the head */}
        <Curl x={55} y={78} r={15} fill={url('mane')} />
        <Curl x={50} y={100} r={14} fill={url('mane')} />
        <Curl x={57} y={121} r={12} fill={url('mane')} />
        <Curl x={145} y={78} r={15} fill={url('mane')} />
        <Curl x={150} y={100} r={14} fill={url('mane')} />
        <Curl x={143} y={121} r={12} fill={url('mane')} />
        {/* ears */}
        <path d="M64 68 Q54 38 74 30 Q86 44 84 62 Z" fill={url('coat')} />
        <path d="M68 61 Q62 43 73 37 Q79 47 78 59 Z" fill="#ffb3d1" />
        <path d="M136 68 Q146 38 126 30 Q114 44 116 62 Z" fill={url('coat')} />
        <path d="M132 61 Q138 43 127 37 Q121 47 122 59 Z" fill="#ffb3d1" />
        <ellipse cx="100" cy="90" rx="49" ry="43" fill={url('coat')} />
        {/* forelock and daisy crown */}
        <Curl x={78} y={56} r={13} fill={url('mane')} />
        <Curl x={100} y={52} r={14} fill={url('mane')} />
        <Curl x={122} y={56} r={13} fill={url('mane')} />
        <g className="pp-crown">
          {daisy(70, 50, '#fff')}
          {daisy(88, 41, '#ffc2dc')}
          {daisy(112, 41, '#fff')}
          {daisy(130, 50, '#ffc2dc')}
        </g>
        {/* face */}
        <ellipse cx="100" cy="112" rx="29" ry="18" fill="#ffe8f2" />
        <ellipse cx="91" cy="108" rx="2.6" ry="2" fill="#e48fb5" />
        <ellipse cx="109" cy="108" rx="2.6" ry="2" fill="#e48fb5" />
        <path d="M92 117 Q100 124 108 117" stroke="#8a4a6b" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Eye x={78} y={88} r={11} closed={blink} lashes="left" />
        <Eye x={122} y={88} r={11} closed={blink} lashes="right" />
        <Cheeks y={106} dx={36} />
        <g fill="#f59cc4">
          <circle cx="60" cy="98" r="1.6" />
          <circle cx="66" cy="96" r="1.6" />
          <circle cx="140" cy="98" r="1.6" />
          <circle cx="134" cy="96" r="1.6" />
        </g>
        <g className="pp-hearts">
          <g className="pp-heart">
            <Heart x={30} y={60} s={8} fill="#ff8fbd" />
          </g>
          <g className="pp-heart" style={{ animationDelay: '0.25s' }}>
            <Heart x={170} y={52} s={9} fill="#c6a3ff" />
          </g>
          <g className="pp-heart" style={{ animationDelay: '0.5s' }}>
            <Heart x={160} y={20} s={6} fill="#ffb3d1" />
          </g>
        </g>
      </>
    )
  },
}

const DESIGNS: readonly Design[] = [twinkle, ember, glimmer, puff, pippa]

export const sparklyCharacterArt: FamilyCharacterArt = Object.fromEntries(DESIGNS.map((d) => [d.characterId, makeArt(d)]))
