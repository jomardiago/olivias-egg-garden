import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { findCharacter } from '../families.ts'
import type { CharacterArt, CharacterArtProps, FamilyCharacterArt } from './types.ts'
import './fluffy.css'

/**
 * Fluffy Egg Family art (ticket 07): Bun-Bun the bunny, Pip the chick,
 * Mochi the kitten, Hazel the hedgehog and Pudding the puppy.
 *
 * Every Character shares one shell (`FluffyCharacter`) that owns the SVG
 * frame, blinking, the dance timer and the silhouette. Each drawing is a
 * function of a `Paint`, so the silhouette is the same shapes painted in
 * one colour with the face left out.
 */

const SILHOUETTE = '#55506a'
const EYE = '#3a2a4a'
const BLUSH = '#ff9bb8'

/** How long each tap dance lasts. The CSS reads it through `--fluffy-dance`. */
const DANCE_MS: Readonly<Record<string, number>> = {
  'bun-bun': 1400,
  pip: 1300,
  mochi: 1300,
  hazel: 1600,
  pudding: 1500,
}

type Paint = {
  sil: boolean
  /** A flat colour, or the silhouette colour. */
  c: (colour: string) => string
  /** A gradient defined in `defs`, or the silhouette colour. */
  g: (name: string) => string
  id: (name: string) => string
}

type Drawing = {
  defs: (p: Paint) => ReactNode
  body: (p: Paint) => ReactNode
}

function useBlinking(): boolean {
  const [shut, setShut] = useState(false)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const blink = (thenAgain: boolean) => {
      setShut(true)
      timer = setTimeout(() => {
        setShut(false)
        timer = thenAgain ? setTimeout(() => blink(false), 160) : wait()
      }, 140)
    }
    const wait = () => setTimeout(() => blink(Math.random() < 0.25), 2200 + Math.random() * 3300)
    timer = wait()
    return () => clearTimeout(timer)
  }, [])
  return shut
}

function useDance(characterId: string, pose: CharacterArtProps['pose'], onDanceEnd?: () => void): boolean {
  const [dancing, setDancing] = useState(pose === 'dance')
  const onEnd = useRef(onDanceEnd)
  onEnd.current = onDanceEnd
  useEffect(() => {
    if (pose !== 'dance') {
      setDancing(false)
      return
    }
    setDancing(true)
    const timer = setTimeout(() => {
      setDancing(false)
      onEnd.current?.()
    }, DANCE_MS[characterId] ?? 1400)
    return () => clearTimeout(timer)
  }, [characterId, pose])
  return dancing
}

function FluffyCharacter({ characterId, pose = 'idle', silhouette = false, size = 72, onDanceEnd, drawing }: CharacterArtProps & { drawing: Drawing }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const blinking = useBlinking()
  const dancing = useDance(characterId, pose, onDanceEnd)
  const [phase] = useState(() => `${(-Math.random() * 3).toFixed(2)}s`)

  const p: Paint = {
    sil: silhouette,
    c: (colour) => (silhouette ? SILHOUETTE : colour),
    g: (name) => (silhouette ? SILHOUETTE : `url(#${uid}-${name})`),
    id: (name) => `${uid}-${name}`,
  }
  const classes = ['character', 'fluffy', `fluffy--${characterId}`, dancing ? 'fluffy--dance' : 'fluffy--idle']
  if (blinking && !silhouette) classes.push('fluffy--blinking')
  if (silhouette) classes.push('fluffy--silhouette')
  const style = { '--fluffy-phase': phase, '--fluffy-dance': `${DANCE_MS[characterId] ?? 1400}ms` } as CSSProperties

  return (
    <svg
      className={classes.join(' ')}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={silhouette ? 'Mystery Character' : (findCharacter(characterId)?.name ?? 'Character')}
    >
      {!silhouette && <defs>{drawing.defs(p)}</defs>}
      {!silhouette && <ellipse className="fluffy__shadow" cx="100" cy="190" rx="50" ry="7" fill="#3a2a4a" opacity="0.13" />}
      <g className="fluffy__body">{drawing.body(p)}</g>
    </svg>
  )
}

function Eye({ x, y, rx = 8.5, ry = 10.5 }: { x: number; y: number; rx?: number; ry?: number }) {
  return (
    <g className="fluffy__eye">
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={EYE} />
      <circle cx={x + rx * 0.35} cy={y - ry * 0.38} r={rx * 0.42} fill="#fff" />
      <circle cx={x - rx * 0.38} cy={y + ry * 0.4} r={rx * 0.2} fill="#fff" opacity="0.85" />
    </g>
  )
}

function Cheeks({ y, dx = 34, rx = 9, ry = 5.5 }: { y: number; dx?: number; rx?: number; ry?: number }) {
  return (
    <g fill={BLUSH} opacity="0.55">
      <ellipse cx={100 - dx} cy={y} rx={rx} ry={ry} />
      <ellipse cx={100 + dx} cy={y} rx={rx} ry={ry} />
    </g>
  )
}

function radial(id: string, inner: string, outer: string, cx = '40%', cy = '35%') {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r="75%">
      <stop offset="0%" stopColor={inner} />
      <stop offset="100%" stopColor={outer} />
    </radialGradient>
  )
}

/* ---------- Bun-Bun the bunny: one tall ear, one floppy ear, a daisy ---------- */

const bunBun: Drawing = {
  defs: (p) => (
    <>
      {radial(p.id('fur'), '#ffffff', '#f1e2d6')}
      {radial(p.id('ear'), '#ffd6e2', '#ffb1c8', '50%', '30%')}
    </>
  ),
  body: (p) => {
    const line = p.c('#e2c8b9')
    return (
      <>
        {/* cotton tail peeking out */}
        <circle cx="146" cy="168" r="13" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        {/* ears */}
        <g className="fluffy__ear fluffy__ear--up">
          <ellipse cx="76" cy="36" rx="14" ry="33" transform="rotate(-12 76 36)" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
          {!p.sil && <ellipse cx="76" cy="39" rx="7" ry="24" transform="rotate(-12 76 39)" fill={p.g('ear')} />}
        </g>
        <g className="fluffy__ear fluffy__ear--flop">
          <ellipse cx="140" cy="62" rx="13" ry="31" transform="rotate(108 140 62)" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
          {!p.sil && <ellipse cx="142" cy="63" rx="6.5" ry="22" transform="rotate(108 142 63)" fill={p.g('ear')} />}
        </g>
        {/* body, arms, feet */}
        <ellipse cx="100" cy="150" rx="42" ry="36" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        {!p.sil && <ellipse cx="100" cy="156" rx="25" ry="22" fill="#fffdf9" />}
        <ellipse cx="78" cy="181" rx="17" ry="9.5" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        <ellipse cx="122" cy="181" rx="17" ry="9.5" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        {!p.sil && (
          <g fill="#ffc2d4">
            <ellipse cx="78" cy="182" rx="5" ry="3.5" />
            <ellipse cx="122" cy="182" rx="5" ry="3.5" />
          </g>
        )}
        <ellipse cx="80" cy="146" rx="9" ry="12" transform="rotate(20 80 146)" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        <ellipse cx="120" cy="146" rx="9" ry="12" transform="rotate(-20 120 146)" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        {/* head with a fluffy tuft */}
        <ellipse cx="100" cy="98" rx="50" ry="44" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        <path d="M88 58 Q90 46 98 54 Q102 42 108 54 Q116 48 114 60 Z" fill={p.g('fur')} stroke={line} strokeWidth="2.5" strokeLinejoin="round" />
        {!p.sil && (
          <>
            {/* daisy by the tall ear */}
            <g transform="translate(62 62)">
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="0" cy="-7" rx="4.5" ry="7" transform={`rotate(${a})`} fill="#ffd1e0" stroke="#ffb1c8" strokeWidth="1" />
              ))}
              <circle r="4.5" fill="#ffd95e" />
            </g>
            <g className="fluffy__face">
              <Eye x={81} y={100} />
              <Eye x={119} y={100} />
              <Cheeks y={116} dx={33} />
              <path d="M94 110 Q100 106 106 110 Q103 116 100 116 Q97 116 94 110 Z" fill="#ff8fb0" />
              <path d="M100 116 Q100 122 94 123 M100 116 Q100 122 106 123" stroke={EYE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <rect x="97.5" y="121" width="5" height="5" rx="1.5" fill="#fff" stroke="#e2c8b9" strokeWidth="1" />
              <g stroke="#e2c8b9" strokeWidth="1.5" strokeLinecap="round">
                <path d="M70 108 L56 105 M70 112 L56 114" />
                <path d="M130 108 L144 105 M130 112 L144 114" />
              </g>
            </g>
          </>
        )}
      </>
    )
  },
}

/* ---------- Pip the chick: a round sunny ball still wearing its eggshell hat ---------- */

const pip: Drawing = {
  defs: (p) => (
    <>
      {radial(p.id('down'), '#fff3a8', '#ffc93c')}
      {radial(p.id('wing'), '#ffe57a', '#f6b52e')}
      {radial(p.id('shell'), '#fffdf6', '#f6e6c4')}
    </>
  ),
  body: (p) => {
    const line = p.c('#eba92a')
    const orange = p.c('#ff9f43')
    return (
      <>
        {/* feet */}
        <g fill={orange} stroke={p.c('#ef8a2a')} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M72 186 Q78 176 82 176 Q86 176 92 186 Q86 183 82 186 Q78 183 72 186 Z" />
          <path d="M108 186 Q114 176 118 176 Q122 176 128 186 Q122 183 118 186 Q114 183 108 186 Z" />
        </g>
        {/* wings */}
        <g className="fluffy__wing fluffy__wing--left">
          <ellipse cx="42" cy="128" rx="15" ry="26" transform="rotate(28 42 128)" fill={p.g('wing')} stroke={line} strokeWidth="2.5" />
        </g>
        <g className="fluffy__wing fluffy__wing--right">
          <ellipse cx="158" cy="128" rx="15" ry="26" transform="rotate(-28 158 128)" fill={p.g('wing')} stroke={line} strokeWidth="2.5" />
        </g>
        {/* round body */}
        <ellipse cx="100" cy="120" rx="60" ry="58" fill={p.g('down')} stroke={line} strokeWidth="2.5" />
        {!p.sil && <ellipse cx="100" cy="146" rx="34" ry="26" fill="#fff6c2" opacity="0.8" />}
        {/* little fluff curl poking out under the hat */}
        <path d="M128 70 Q140 60 136 50 Q146 58 138 72 Z" fill={p.g('down')} stroke={line} strokeWidth="2" strokeLinejoin="round" />
        {/* eggshell hat with pastel spots, like the Fluffy Egg */}
        <g transform="rotate(-12 100 60)">
          <path
            d="M62 72 Q62 26 100 24 Q138 26 138 72 L130 64 L121 74 L111 63 L100 74 L89 63 L79 74 L70 64 Z"
            fill={p.g('shell')}
            stroke={p.c('#e9cfa0')}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {!p.sil && (
            <g opacity="0.85">
              <circle cx="84" cy="44" r="6" fill="#ffc7d9" />
              <circle cx="110" cy="38" r="5" fill="#c9ecff" />
              <circle cx="122" cy="56" r="4.5" fill="#d9f5c4" />
            </g>
          )}
        </g>
        {!p.sil && (
          <g className="fluffy__face">
            <Eye x={78} y={110} rx={9} ry={11} />
            <Eye x={122} y={110} rx={9} ry={11} />
            <Cheeks y={128} dx={40} rx={10} ry={6} />
            <path d="M88 124 Q100 116 112 124 Q100 140 88 124 Z" fill={orange} stroke="#ef8a2a" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M89 124 Q100 128 111 124" stroke="#ef8a2a" strokeWidth="1.5" fill="none" />
          </g>
        )}
      </>
    )
  },
}

/* ---------- Mochi the kitten: peachy tabby with a curly tail and a bell ---------- */

const mochi: Drawing = {
  defs: (p) => (
    <>
      {radial(p.id('fur'), '#ffe6cc', '#f9bf8a')}
      {radial(p.id('ear'), '#ffd6e2', '#ffadc5', '50%', '60%')}
      {radial(p.id('bell'), '#fff3a0', '#f2b829', '35%', '30%')}
    </>
  ),
  body: (p) => {
    const line = p.c('#e49d62')
    const stripe = '#f0a46a'
    return (
      <>
        {/* curly tail */}
        <g className="fluffy__tail">
          <path d="M128 172 Q174 176 172 136 Q170 108 150 112" stroke={line} strokeWidth="17" fill="none" strokeLinecap="round" />
          <path d="M128 172 Q174 176 172 136 Q170 108 150 112" stroke={p.g('fur')} strokeWidth="12" fill="none" strokeLinecap="round" />
          {!p.sil && (
            <>
              <path d="M163 166 L170 160 M171 146 L178 146 M170 126 L176 122" stroke={stripe} strokeWidth="4" strokeLinecap="round" />
              <circle cx="151" cy="112" r="6" fill="#fff8f0" />
            </>
          )}
        </g>
        {/* body and paws */}
        <ellipse cx="100" cy="152" rx="40" ry="33" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        {!p.sil && <ellipse cx="100" cy="158" rx="22" ry="20" fill="#fff8f0" />}
        <ellipse cx="82" cy="181" rx="13" ry="9" fill={p.c('#fff8f0')} stroke={line} strokeWidth="2.5" />
        <ellipse cx="118" cy="181" rx="13" ry="9" fill={p.c('#fff8f0')} stroke={line} strokeWidth="2.5" />
        {!p.sil && (
          <g stroke={line} strokeWidth="1.5" strokeLinecap="round">
            <path d="M78 178 V184 M86 178 V184 M114 178 V184 M122 178 V184" />
          </g>
        )}
        {/* ears */}
        <g className="fluffy__ear fluffy__ear--left">
          <path d="M54 80 Q48 36 60 28 Q72 30 94 58 Z" fill={p.g('fur')} stroke={line} strokeWidth="2.5" strokeLinejoin="round" />
          {!p.sil && <path d="M60 70 Q58 44 63 40 Q70 42 84 58 Z" fill={p.g('ear')} />}
        </g>
        <g className="fluffy__ear fluffy__ear--right">
          <path d="M146 80 Q152 36 140 28 Q128 30 106 58 Z" fill={p.g('fur')} stroke={line} strokeWidth="2.5" strokeLinejoin="round" />
          {!p.sil && <path d="M140 70 Q142 44 137 40 Q130 42 116 58 Z" fill={p.g('ear')} />}
        </g>
        {/* head */}
        <ellipse cx="100" cy="98" rx="56" ry="45" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        {!p.sil && (
          <>
            <path d="M92 56 Q93 64 94 68 M100 54 V68 M108 56 Q107 64 106 68" stroke={stripe} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M46 92 L58 94 M47 102 L58 102 M154 92 L142 94 M153 102 L142 102" stroke={stripe} strokeWidth="4" strokeLinecap="round" />
          </>
        )}
        {/* pink collar with a golden bell */}
        <path d="M66 134 Q100 148 134 134" stroke={p.c('#ff7fa8')} strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="100" cy="146" r="7.5" fill={p.g('bell')} stroke={p.c('#d99a1e')} strokeWidth="1.5" />
        {!p.sil && (
          <>
            <path d="M94 147 H106" stroke="#d99a1e" strokeWidth="1.5" />
            <circle cx="97.5" cy="143.5" r="1.8" fill="#fff" />
            <g className="fluffy__face">
              <Eye x={78} y={98} rx={9.5} ry={11.5} />
              <Eye x={122} y={98} rx={9.5} ry={11.5} />
              <Cheeks y={118} dx={38} />
              <ellipse cx="92" cy="117" rx="11" ry="8" fill="#fff8f0" />
              <ellipse cx="108" cy="117" rx="11" ry="8" fill="#fff8f0" />
              <path d="M95.5 109 H104.5 Q100 115 100 115 Q100 115 95.5 109 Z" fill="#ff8fb0" stroke="#ff8fb0" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M100 115 Q100 120 95 121 Q91 121 90 118 M100 115 Q100 120 105 121 Q109 121 110 118" stroke={EYE} strokeWidth="2" fill="none" strokeLinecap="round" />
              <g stroke="#d8a37a" strokeWidth="1.4" strokeLinecap="round">
                <path d="M80 114 L60 110 M80 119 L60 121" />
                <path d="M120 114 L140 110 M120 119 L140 121" />
              </g>
            </g>
          </>
        )}
      </>
    )
  },
}

/* ---------- Hazel the hedgehog: soft spikes all round, hugging a hazelnut ---------- */

function spikes(cx: number, cy: number, tip: [number, number], base: [number, number], count: number, offset = 0): string {
  const start = Math.PI - 0.55
  const end = 2 * Math.PI + 0.55
  const step = (end - start) / count
  const at = (a: number, [rx, ry]: [number, number]) => `${(cx + rx * Math.cos(a)).toFixed(1)} ${(cy + ry * Math.sin(a)).toFixed(1)}`
  let d = `M${cx} ${cy} L${at(start, base)}`
  for (let i = 0; i < count; i++) {
    const a = start + step * (i + 0.5) + offset
    d += ` L${at(a, tip)} L${at(start + step * (i + 1), base)}`
  }
  return `${d} Z`
}

const HAZEL_BACK = spikes(100, 112, [84, 78], [62, 56], 15, 0.1)
const HAZEL_FRONT = spikes(100, 114, [74, 68], [56, 50], 14)

const hazel: Drawing = {
  defs: (p) => (
    <>
      {radial(p.id('spikes'), '#c99a72', '#94653f', '50%', '60%')}
      {radial(p.id('face'), '#fff3e2', '#f7d9b6', '45%', '40%')}
      {radial(p.id('nut'), '#e0a066', '#b26a2e', '35%', '35%')}
    </>
  ),
  body: (p) => {
    const line = p.c('#7d5238')
    const face = p.g('face')
    const faceLine = p.c('#e2b98e')
    return (
      <>
        <path d={HAZEL_BACK} fill={p.c('#8a5c3b')} stroke={p.c('#8a5c3b')} strokeWidth="5" strokeLinejoin="round" />
        <path d={HAZEL_FRONT} fill={p.g('spikes')} stroke={line} strokeWidth="2.5" strokeLinejoin="round" />
        {/* little round ears */}
        <circle cx="62" cy="84" r="10" fill={face} stroke={faceLine} strokeWidth="2.5" />
        <circle cx="138" cy="84" r="10" fill={face} stroke={faceLine} strokeWidth="2.5" />
        {!p.sil && (
          <>
            <circle cx="62" cy="84" r="5" fill="#ffc2d4" />
            <circle cx="138" cy="84" r="5" fill="#ffc2d4" />
          </>
        )}
        {/* feet, face and tummy */}
        <ellipse cx="78" cy="183" rx="14" ry="8.5" fill={p.c('#b98058')} stroke={line} strokeWidth="2" />
        <ellipse cx="122" cy="183" rx="14" ry="8.5" fill={p.c('#b98058')} stroke={line} strokeWidth="2" />
        <path d="M54 120 Q54 76 100 76 Q146 76 146 120 Q146 178 100 178 Q54 178 54 120 Z" fill={face} stroke={faceLine} strokeWidth="2.5" />
        {/* the hazelnut, held in two little paws */}
        <g className="fluffy__nut">
          <path d="M88 156 Q88 176 100 178 Q112 176 112 156 Z" fill={p.g('nut')} stroke={p.c('#8c4f20')} strokeWidth="2" strokeLinejoin="round" />
          <path d="M84 158 Q86 146 100 146 Q114 146 116 158 Q108 154 100 156 Q92 154 84 158 Z" fill={p.c('#8a5a2b')} stroke={p.c('#6b421c')} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M100 146 Q101 140 104 138" stroke={p.c('#6b421c')} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {!p.sil && <ellipse cx="94" cy="164" rx="2.5" ry="4.5" fill="#fff" opacity="0.5" />}
        </g>
        <ellipse cx="84" cy="164" rx="8" ry="6.5" fill={p.c('#b98058')} stroke={line} strokeWidth="2" />
        <ellipse cx="116" cy="164" rx="8" ry="6.5" fill={p.c('#b98058')} stroke={line} strokeWidth="2" />
        {!p.sil && (
          <g className="fluffy__face">
            <Eye x={80} y={112} />
            <Eye x={120} y={112} />
            <Cheeks y={130} dx={34} />
            <g className="fluffy__nose">
              <ellipse cx="100" cy="127" rx="15" ry="11" fill="#fff6ea" />
              <ellipse cx="100" cy="123" rx="7" ry="5.5" fill="#4a2f2a" />
              <circle cx="98" cy="121.5" r="1.8" fill="#fff" />
            </g>
            <path d="M93 133 Q100 139 107 133" stroke={EYE} strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        )}
      </>
    )
  },
}

/* ---------- Pudding the puppy: caramel pup with long floppy ears and a waggy tail ---------- */

const pudding: Drawing = {
  defs: (p) => (
    <>
      {radial(p.id('fur'), '#ffe0b0', '#efb06c')}
      {radial(p.id('ear'), '#c88654', '#9c5f34', '40%', '30%')}
      {radial(p.id('tag'), '#fff2a0', '#f1b52a', '35%', '30%')}
    </>
  ),
  body: (p) => {
    const line = p.c('#c98a4f')
    return (
      <>
        {/* waggy tail */}
        <g className="fluffy__tail">
          <path d="M132 162 Q160 156 160 126" stroke={line} strokeWidth="15" fill="none" strokeLinecap="round" />
          <path d="M132 162 Q160 156 160 126" stroke={p.g('fur')} strokeWidth="10" fill="none" strokeLinecap="round" />
        </g>
        {/* body and paws */}
        <ellipse cx="100" cy="154" rx="41" ry="32" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        {!p.sil && <ellipse cx="100" cy="160" rx="22" ry="20" fill="#fff1dc" />}
        <ellipse cx="81" cy="181" rx="14" ry="9.5" fill={p.c('#fff1dc')} stroke={line} strokeWidth="2.5" />
        <ellipse cx="119" cy="181" rx="14" ry="9.5" fill={p.c('#fff1dc')} stroke={line} strokeWidth="2.5" />
        {!p.sil && (
          <g fill="#ffc2d4">
            <ellipse cx="81" cy="182" rx="4.5" ry="3" />
            <ellipse cx="119" cy="182" rx="4.5" ry="3" />
          </g>
        )}
        {/* head */}
        <ellipse cx="100" cy="94" rx="52" ry="46" fill={p.g('fur')} stroke={line} strokeWidth="2.5" />
        {/* a little swirl of whipped-cream fur on top */}
        <path d="M92 52 Q94 38 106 42 Q116 46 108 54 Q102 48 100 52 Z" fill={p.c('#fff1dc')} stroke={line} strokeWidth="2" strokeLinejoin="round" />
        {/* long floppy ears */}
        <g className="fluffy__ear fluffy__ear--left">
          <path d="M60 64 Q30 66 30 108 Q30 138 50 134 Q66 128 66 92 Z" fill={p.g('ear')} stroke={p.c('#875028')} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
        <g className="fluffy__ear fluffy__ear--right">
          <path d="M140 64 Q170 66 170 108 Q170 138 150 134 Q134 128 134 92 Z" fill={p.g('ear')} stroke={p.c('#875028')} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
        {/* blue collar with a bone tag */}
        <path d="M64 130 Q100 146 136 130" stroke={p.c('#6fb7ff')} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path
          d="M91 140 a4 4 0 1 1 4 -3 h10 a4 4 0 1 1 4 3 a4 4 0 1 1 -4 3 h-10 a4 4 0 1 1 -4 -3 Z"
          fill={p.g('tag')}
          stroke={p.c('#d99a1e')}
          strokeWidth="1.5"
        />
        {!p.sil && (
          <g className="fluffy__face">
            <ellipse cx="123" cy="90" rx="16" ry="14" fill="#e59a58" opacity="0.75" />
            <Eye x={79} y={92} />
            <Eye x={121} y={92} />
            <Cheeks y={112} dx={36} />
            <ellipse cx="100" cy="116" rx="26" ry="18" fill="#fff1dc" />
            <ellipse cx="100" cy="107" rx="9.5" ry="6.5" fill="#4a2f2a" />
            <ellipse cx="97" cy="105" rx="3" ry="1.8" fill="#fff" opacity="0.8" />
            <path d="M100 113 V118 M89 117 Q94 123 100 118 Q106 123 111 117" stroke={EYE} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M96 121 Q96 131 101 131 Q106 131 106 121 Q101 124 96 121 Z" fill="#ff8fa8" stroke="#ef6f8f" strokeWidth="1.2" />
          </g>
        )}
      </>
    )
  },
}

function artFor(drawing: Drawing): CharacterArt {
  return function FluffyArt(props: CharacterArtProps) {
    return <FluffyCharacter {...props} drawing={drawing} />
  }
}

export const fluffyCharacterArt: FamilyCharacterArt = {
  'bun-bun': artFor(bunBun),
  pip: artFor(pip),
  mochi: artFor(mochi),
  hazel: artFor(hazel),
  pudding: artFor(pudding),
}
