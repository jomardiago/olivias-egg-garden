import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { findCharacter } from '../families.ts'
import type { CharacterArt, CharacterArtProps, FamilyCharacterArt } from './types.ts'
import './splashy.css'

/**
 * Splashy Egg Family art (ticket 09): Bubbles the octopus, Shelly the
 * turtle, Finn the narwhal, Coral the seahorse and Waddles the penguin.
 *
 * Every Character is drawn on a 200x200 viewBox so it stays crisp at any
 * size. Idle and dance motion is CSS (transforms only, so it stays cheap
 * with many Characters on screen); blinking and the dance timer live here.
 */

/** How long every Splashy tap dance lasts; matches the CSS dance animations. */
const DANCE_MS = 1600
const INK = '#2b2340'
const SILHOUETTE = '#55506a'

/** Paint helper: real colour normally, the one mystery colour as a silhouette. */
type Paint = (colour: string) => string

type DrawProps = { paint: Paint; silhouette: boolean; uid: string }

function useBlink(enabled: boolean): boolean {
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout>
    const scheduleOpen = (thenDouble: boolean) => {
      timer = setTimeout(() => {
        setClosed(false)
        if (thenDouble) timer = setTimeout(() => close(false), 160)
        else scheduleClose()
      }, 140)
    }
    const close = (maybeDouble: boolean) => {
      setClosed(true)
      scheduleOpen(maybeDouble && Math.random() < 0.25)
    }
    const scheduleClose = () => {
      timer = setTimeout(() => close(true), 1800 + Math.random() * 3200)
    }
    scheduleClose()
    return () => clearTimeout(timer)
  }, [enabled])
  return enabled && closed
}

function useDanceEnd(dancing: boolean, onDanceEnd: (() => void) | undefined) {
  const latest = useRef(onDanceEnd)
  useEffect(() => {
    latest.current = onDanceEnd
  })
  useEffect(() => {
    if (!dancing) return
    const timer = setTimeout(() => latest.current?.(), DANCE_MS)
    return () => clearTimeout(timer)
  }, [dancing])
}

function splashyArt(id: string, draw: (props: DrawProps) => ReactNode): CharacterArt {
  function SplashyCharacter({ characterId, pose = 'idle', silhouette = false, size = 72, onDanceEnd }: CharacterArtProps) {
    const uid = `splashy${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
    const blinking = useBlink(!silhouette)
    useDanceEnd(pose === 'dance', onDanceEnd)
    const paint: Paint = (colour) => (silhouette ? SILHOUETTE : colour)
    const classes = ['character', 'splashy', `splashy--${id}`, `character--${pose}`]
    if (blinking) classes.push('character--blink')
    if (silhouette) classes.push('character--silhouette')
    return (
      <svg
        className={classes.join(' ')}
        width={size}
        height={size}
        viewBox="0 0 200 200"
        role="img"
        aria-label={silhouette ? 'Mystery Character' : (findCharacter(characterId)?.name ?? 'Character')}
      >
        <g className="splashy__all">{draw({ paint, silhouette, uid })}</g>
      </svg>
    )
  }
  SplashyCharacter.displayName = `SplashyArt(${id})`
  return SplashyCharacter
}

// ---------- Shared face parts ----------

function Eye({ x, y, r = 10, lashes = false }: { x: number; y: number; r?: number; lashes?: boolean }) {
  return (
    <g className="character__eye">
      {lashes && (
        <path
          d={`M${x + r * 0.5} ${y - r * 1.05} l${r * 0.35} ${-r * 0.5} M${x + r * 0.9} ${y - r * 0.7} l${r * 0.5} ${-r * 0.3}`}
          stroke={INK}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
      )}
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.18} fill={INK} />
      <circle cx={x + r * 0.32} cy={y - r * 0.42} r={r * 0.42} fill="#fff" />
      <circle cx={x - r * 0.38} cy={y + r * 0.45} r={r * 0.17} fill="#fff" />
    </g>
  )
}

function Cheek({ x, y, r = 8 }: { x: number; y: number; r?: number }) {
  return <ellipse cx={x} cy={y} rx={r} ry={r * 0.62} fill="#ff6f9f" opacity={0.45} />
}

function Smile({ d }: { d: string }) {
  return <path d={d} stroke={INK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
}

/** A few bubbles drifting up beside a Character; hidden in silhouettes. */
function Bubbles({ at }: { at: readonly [number, number][] }) {
  return (
    <g className="splashy__bubbles">
      {at.map(([x, y], i) => (
        <g key={i} className="splashy__bubble" style={{ '--i': i } as CSSProperties}>
          <circle cx={x} cy={y} r={6 - i * 1.3} fill="#e8fbff" fillOpacity={0.35} stroke="#9fe3f2" strokeWidth={2} />
          <circle cx={x - 1.8} cy={y - 1.8} r={1.4} fill="#fff" />
        </g>
      ))}
    </g>
  )
}

function Gradient({ id, stops, radial = false }: { id: string; stops: string[]; radial?: boolean }) {
  const children = stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)
  return radial ? (
    <radialGradient id={id} cx="0.38" cy="0.3" r="0.8">
      {children}
    </radialGradient>
  ) : (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {children}
    </linearGradient>
  )
}

// ---------- Bubbles the octopus ----------

const BUBBLES_ARMS = [
  'M64 116 C50 132 32 146 28 164 C25 178 40 184 44 172',
  'M78 124 C72 144 62 160 64 174 C66 186 80 186 80 176',
  'M93 128 C92 148 86 164 92 178 C96 188 108 184 104 174',
  'M107 128 C108 148 114 164 108 178 C104 188 92 184 96 174',
  'M122 124 C128 144 138 160 136 174 C134 186 120 186 120 176',
  'M136 116 C150 132 168 146 172 164 C175 178 160 184 156 172',
]

function drawBubbles({ paint, silhouette, uid }: DrawProps) {
  const body = silhouette ? SILHOUETTE : `url(#${uid}-b)`
  return (
    <>
      {!silhouette && (
        <defs>
          <Gradient id={`${uid}-b`} radial stops={['#ffd3ec', '#ff8fca', '#e766ac']} />
        </defs>
      )}
      {!silhouette && <Bubbles at={[[168, 46], [178, 30], [170, 14]]} />}
      <g className="bubbles__arms">
        {BUBBLES_ARMS.map((d, i) => (
          <g key={i} className="bubbles__arm" style={{ '--i': i, '--dir': i < 3 ? -1 : 1 } as CSSProperties}>
            <path d={d} stroke={paint('#c9509a')} strokeWidth={22} strokeLinecap="round" fill="none" />
            <path d={d} stroke={paint('#f27dbc')} strokeWidth={17} strokeLinecap="round" fill="none" />
            {!silhouette && (
              <path
                d={d}
                stroke="#ffd6ec"
                strokeWidth={5.5}
                strokeDasharray="0 11"
                strokeLinecap="round"
                fill="none"
                transform="translate(0 3)"
              />
            )}
          </g>
        ))}
      </g>
      <g className="bubbles__head">
        <path
          d="M34 90 C34 42 66 20 100 20 C134 20 166 42 166 90 C166 118 146 134 100 134 C54 134 34 118 34 90 Z"
          fill={body}
          stroke={paint('#c9509a')}
          strokeWidth={3.5}
        />
        {!silhouette && (
          <>
            <ellipse cx={70} cy={46} rx={17} ry={9} fill="#fff" opacity={0.55} transform="rotate(-28 70 46)" />
            <circle cx={50} cy={64} r={3.5} fill="#fff" opacity={0.55} />
            <circle cx={128} cy={42} r={7} fill="#ffc2e3" />
            <circle cx={145} cy={60} r={4.5} fill="#ffc2e3" />
            <circle cx={116} cy={30} r={3.5} fill="#ffc2e3" />
            {/* A little sea-flower clip */}
            <g transform="translate(58 30)">
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx={0} cy={-7} rx={5} ry={7} fill="#fff27a" stroke="#f2b632" strokeWidth={1.5} transform={`rotate(${a})`} />
              ))}
              <circle r={4.5} fill="#ff9b52" />
            </g>
            <Eye x={78} y={88} r={11} />
            <Eye x={122} y={88} r={11} />
            <Cheek x={60} y={106} />
            <Cheek x={140} y={106} />
            <path d="M88 104 Q100 120 112 104 Q100 108 88 104 Z" fill="#c2345f" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <ellipse cx={100} cy={111} rx={5} ry={3} fill="#ff8fab" />
          </>
        )}
      </g>
    </>
  )
}

// ---------- Shelly the turtle ----------

function hexagon(cx: number, cy: number, r: number): string {
  const pts = [0, 1, 2, 3, 4, 5].map((k) => {
    const a = (Math.PI / 3) * k + Math.PI / 6
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a) * 0.85).toFixed(1)}`
  })
  return pts.join(' ')
}

function drawShelly({ paint, silhouette, uid }: DrawProps) {
  const shell = silhouette ? SILHOUETTE : `url(#${uid}-s)`
  const skin = silhouette ? SILHOUETTE : `url(#${uid}-k)`
  return (
    <>
      {!silhouette && (
        <defs>
          <Gradient id={`${uid}-s`} radial stops={['#c5f59a', '#7fd46f', '#3fa868']} />
          <Gradient id={`${uid}-k`} radial stops={['#d4fbe9', '#93e6c7', '#57c2a0']} />
        </defs>
      )}
      {!silhouette && <Bubbles at={[[30, 70], [22, 50], [32, 32]]} />}
      <g className="shelly__body">
        <path d="M34 150 C22 150 14 158 18 164 C24 160 30 158 38 158 Z" fill={skin} stroke={paint('#3f9f82')} strokeWidth={3} />
        <g className="shelly__leg" style={{ '--i': 0 } as CSSProperties}>
          <ellipse cx={58} cy={170} rx={17} ry={12} fill={skin} stroke={paint('#3f9f82')} strokeWidth={3} />
        </g>
        <g className="shelly__leg" style={{ '--i': 1 } as CSSProperties}>
          <ellipse cx={126} cy={172} rx={17} ry={12} fill={skin} stroke={paint('#3f9f82')} strokeWidth={3} />
        </g>
        <path
          d="M26 150 C26 90 62 58 98 58 C136 58 170 90 170 150 Z"
          fill={shell}
          stroke={paint('#2f8a56')}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
        {!silhouette && (
          <g fill="#d7f9a8" stroke="#4aa865" strokeWidth={2.5} strokeLinejoin="round">
            <polygon points={hexagon(98, 104, 21)} />
            <polygon points={hexagon(58, 122, 15)} />
            <polygon points={hexagon(138, 122, 15)} />
            <polygon points={hexagon(120, 76, 12)} />
            <polygon points={hexagon(98, 138, 9)} />
          </g>
        )}
        <rect x={18} y={142} width={160} height={20} rx={10} fill={paint('#ffe28a')} stroke={paint('#e0a93b')} strokeWidth={3} />
        {!silhouette && (
          <>
            <g fill="#ffcf5c">
              {[38, 62, 86, 110, 134, 158].map((x) => (
                <circle key={x} cx={x} cy={152} r={3.2} />
              ))}
            </g>
            <ellipse cx={64} cy={78} rx={14} ry={7} fill="#fff" opacity={0.45} transform="rotate(-35 64 78)" />
            {/* A starfish friend riding on the shell */}
            <path
              d="M136 82 L139.5 90 L148 90.5 L141.5 96 L144 104 L136 99.5 L128 104 L130.5 96 L124 90.5 L132.5 90 Z"
              fill="#ff9eb8"
              stroke="#e8628a"
              strokeWidth={2}
              strokeLinejoin="round"
              transform="translate(-60 -16) rotate(-14 136 94)"
            />
          </>
        )}
        <g className="shelly__head">
          <circle cx={164} cy={104} r={32} fill={skin} stroke={paint('#3f9f82')} strokeWidth={3.5} />
          {!silhouette && (
            <>
              <ellipse cx={154} cy={86} rx={10} ry={5} fill="#fff" opacity={0.55} transform="rotate(-25 154 86)" />
              <Eye x={152} y={102} r={9} />
              <Eye x={178} y={102} r={9} />
              <Cheek x={144} y={118} r={6.5} />
              <Cheek x={188} y={117} r={6.5} />
              <Smile d="M158 117 Q165 125 172 117" />
            </>
          )}
        </g>
      </g>
    </>
  )
}

// ---------- Finn the narwhal ----------

function drawFinn({ paint, silhouette, uid }: DrawProps) {
  const body = silhouette ? SILHOUETTE : `url(#${uid}-f)`
  return (
    <>
      {!silhouette && (
        <defs>
          <Gradient id={`${uid}-f`} radial stops={['#d2ecff', '#93c6ff', '#6a9ef0']} />
          <linearGradient id={`${uid}-h`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#ffe6a0" />
            <stop offset="1" stopColor="#fff8dc" />
          </linearGradient>
        </defs>
      )}
      {!silhouette && <Bubbles at={[[118, 42], [128, 26], [118, 12]]} />}
      <g className="finn__body">
        <g className="finn__tail">
          <path
            d="M146 118 C162 110 170 96 170 80 C160 70 150 58 160 50 C168 46 174 56 176 64 C180 54 190 46 196 54 C200 64 188 76 178 82 C176 102 168 122 150 134 Z"
            fill={body}
            stroke={paint('#4b7fd2')}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
        </g>
        <path
          d="M52 92 L14 34 C12 30 16 28 19 31 L66 82 Z"
          fill={silhouette ? SILHOUETTE : `url(#${uid}-h)`}
          stroke={paint('#e0b14f')}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {!silhouette && (
          <g stroke="#e8be5c" strokeWidth={2.4} strokeLinecap="round">
            <path d="M24 46 L32 42" />
            <path d="M31 57 L41 51" />
            <path d="M39 68 L50 61" />
            <path d="M47 79 L58 72" />
          </g>
        )}
        <path
          d="M36 122 C36 84 74 66 110 70 C144 74 166 98 166 124 C166 150 142 166 104 166 C64 166 36 152 36 122 Z"
          fill={body}
          stroke={paint('#4b7fd2')}
          strokeWidth={3.5}
        />
        {!silhouette && (
          <>
            <path d="M44 134 C58 158 104 166 146 150 C120 146 74 146 44 134 Z" fill="#f0f8ff" />
            <ellipse cx={74} cy={86} rx={16} ry={7} fill="#fff" opacity={0.55} transform="rotate(-20 74 86)" />
            <g fill="#5d8fe0" opacity={0.55}>
              <circle cx={118} cy={86} r={4} />
              <circle cx={132} cy={96} r={3} />
              <circle cx={108} cy={98} r={2.6} />
              <circle cx={140} cy={82} r={2.4} />
            </g>
          </>
        )}
        <g className="finn__flipper">
          <path d="M100 140 C104 160 120 170 130 164 C132 154 118 142 100 140 Z" fill={paint('#7caef5')} stroke={paint('#4b7fd2')} strokeWidth={3} />
        </g>
        {!silhouette && (
          <>
            <Eye x={62} y={112} r={10} />
            <Eye x={92} y={112} r={10} />
            <Cheek x={50} y={130} r={7} />
            <Cheek x={104} y={130} r={7} />
            <Smile d="M70 128 Q77 136 84 128" />
          </>
        )}
      </g>
    </>
  )
}

// ---------- Coral the seahorse ----------

function drawCoral({ paint, silhouette, uid }: DrawProps) {
  const body = silhouette ? SILHOUETTE : `url(#${uid}-c)`
  const line = paint('#e05a5f')
  return (
    <>
      {!silhouette && (
        <defs>
          <Gradient id={`${uid}-c`} radial stops={['#ffd7c4', '#ff9d8a', '#f26b73']} />
        </defs>
      )}
      {!silhouette && <Bubbles at={[[160, 40], [170, 24], [162, 10]]} />}
      <g className="coral__body">
        <g className="coral__fin">
          <path
            d="M72 94 C48 88 36 104 40 128 C50 128 62 124 72 120 Z"
            fill={paint('#ffd36e')}
            stroke={paint('#e9a93a')}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {!silhouette && (
            <g stroke="#f0b548" strokeWidth={2} strokeLinecap="round">
              <path d="M70 100 L50 98" />
              <path d="M70 108 L44 110" />
              <path d="M70 116 L46 122" />
            </g>
          )}
        </g>
        <g className="coral__tail">
          <path
            d="M90 146 C90 172 72 188 56 182 C40 176 42 154 58 152 C70 150 74 164 64 168"
            stroke={line}
            strokeWidth={22}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M90 146 C90 172 72 188 56 182 C40 176 42 154 58 152 C70 150 74 164 64 168"
            stroke={silhouette ? SILHOUETTE : '#ff8f84'}
            strokeWidth={16}
            strokeLinecap="round"
            fill="none"
          />
          {!silhouette && (
            <path
              d="M90 146 C90 172 72 188 56 182 C40 176 42 154 58 152"
              stroke="#ffc9b3"
              strokeWidth={4}
              strokeDasharray="1 9"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
        <path
          d="M88 66 C66 80 60 118 72 142 C80 160 104 160 112 140 C122 116 120 92 112 76 Z"
          fill={body}
          stroke={line}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
        {!silhouette && (
          <>
            <path d="M104 86 C116 100 118 122 108 144 C100 132 98 104 104 86 Z" fill="#ffe7d4" />
            <g stroke="#f7a98f" strokeWidth={2.6} strokeLinecap="round">
              <path d="M102 100 L114 98" />
              <path d="M102 112 L116 111" />
              <path d="M102 124 L114 125" />
              <path d="M101 136 L110 138" />
            </g>
          </>
        )}
        {/* Crest bumps */}
        <circle cx={90} cy={30} r={8} fill={paint('#ffd36e')} stroke={paint('#e9a93a')} strokeWidth={2.5} />
        <circle cx={104} cy={23} r={8} fill={paint('#ffd36e')} stroke={paint('#e9a93a')} strokeWidth={2.5} />
        <circle cx={118} cy={26} r={7} fill={paint('#ffd36e')} stroke={paint('#e9a93a')} strokeWidth={2.5} />
        <path
          d="M128 52 L156 56 C168 58 168 74 156 75 L128 78 Z"
          fill={body}
          stroke={line}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
        <circle cx={106} cy={56} r={31} fill={body} stroke={line} strokeWidth={3.5} />
        {!silhouette && (
          <>
            <ellipse cx={92} cy={40} rx={11} ry={6} fill="#fff" opacity={0.55} transform="rotate(-30 92 40)" />
            {/* A sea-anemone flower behind the crest */}
            <g transform="translate(80 44)">
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <ellipse key={a} cx={0} cy={-7} rx={4.5} ry={7.5} fill="#ff7fb3" stroke="#e0508e" strokeWidth={1.4} transform={`rotate(${a})`} />
              ))}
              <circle r={4} fill="#fff27a" />
            </g>
            <Eye x={116} y={54} r={11} lashes />
            <Cheek x={122} y={74} r={7} />
            <Smile d="M132 71 Q138 76 144 71" />
          </>
        )}
      </g>
    </>
  )
}

// ---------- Waddles the penguin ----------

function drawWaddles({ paint, silhouette, uid }: DrawProps) {
  const body = silhouette ? SILHOUETTE : `url(#${uid}-p)`
  return (
    <>
      {!silhouette && (
        <defs>
          <Gradient id={`${uid}-p`} radial stops={['#7aa2e0', '#3f63a8', '#26396b']} />
          <Gradient id={`${uid}-t`} stops={['#ffffff', '#e5f2ff']} />
        </defs>
      )}
      {!silhouette && <Bubbles at={[[172, 52], [182, 34], [174, 18]]} />}
      <g className="waddles__body">
        <g className="waddles__foot" style={{ '--i': 0 } as CSSProperties}>
          <path d="M60 182 C60 172 74 170 84 174 C92 178 92 188 82 188 L66 188 C60 188 58 186 60 182 Z" fill={paint('#ffa53d')} stroke={paint('#e07e1c')} strokeWidth={3} />
        </g>
        <g className="waddles__foot" style={{ '--i': 1 } as CSSProperties}>
          <path d="M140 182 C140 172 126 170 116 174 C108 178 108 188 118 188 L134 188 C140 188 142 186 140 182 Z" fill={paint('#ffa53d')} stroke={paint('#e07e1c')} strokeWidth={3} />
        </g>
        <g className="waddles__flipper waddles__flipper--l">
          <path d="M44 96 C24 112 18 138 26 150 C36 148 46 132 50 112 Z" fill={body} stroke={paint('#1f2f5a')} strokeWidth={3} strokeLinejoin="round" />
        </g>
        <g className="waddles__flipper waddles__flipper--r">
          <path d="M156 96 C176 112 182 138 174 150 C164 148 154 132 150 112 Z" fill={body} stroke={paint('#1f2f5a')} strokeWidth={3} strokeLinejoin="round" />
        </g>
        <path d="M96 30 C90 14 104 6 110 16 C104 14 100 20 104 28 Z" fill={body} stroke={paint('#1f2f5a')} strokeWidth={2.5} strokeLinejoin="round" />
        <path
          d="M100 26 C146 26 168 72 166 122 C164 164 138 184 100 184 C62 184 36 164 34 122 C32 72 54 26 100 26 Z"
          fill={body}
          stroke={paint('#1f2f5a')}
          strokeWidth={3.5}
        />
        {!silhouette && (
          <>
            <path
              d="M100 68 C112 50 146 52 146 86 C146 104 152 122 148 142 C142 168 122 178 100 178 C78 178 58 168 52 142 C48 122 54 104 54 86 C54 52 88 50 100 68 Z"
              fill={`url(#${uid}-t)`}
            />
            <ellipse cx={70} cy={46} rx={14} ry={7} fill="#fff" opacity={0.4} transform="rotate(-35 70 46)" />
            <Eye x={80} y={90} r={10} />
            <Eye x={120} y={90} r={10} />
            <Cheek x={66} y={110} r={8} />
            <Cheek x={134} y={110} r={8} />
            <path d="M88 104 Q100 97 112 104 Q100 120 88 104 Z" fill="#ffa53d" stroke="#e07e1c" strokeWidth={2.5} strokeLinejoin="round" />
          </>
        )}
        {/* Cosy scarf */}
        <path d="M46 124 Q100 146 154 124 L156 140 Q100 162 44 140 Z" fill={paint('#ff6f91')} stroke={paint('#d94670')} strokeWidth={3} strokeLinejoin="round" />
        <g className="waddles__scarf-end">
          <path d="M118 140 L136 136 L142 168 L124 172 Z" fill={paint('#ff6f91')} stroke={paint('#d94670')} strokeWidth={3} strokeLinejoin="round" />
        </g>
        {!silhouette && (
          <g stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.8}>
            <path d="M62 136 L66 142" />
            <path d="M80 141 L83 148" />
            <path d="M100 143 L100 150" />
            <path d="M126 152 L138 150" />
            <path d="M128 162 L140 160" />
          </g>
        )}
      </g>
    </>
  )
}

export const splashyCharacterArt: FamilyCharacterArt = {
  bubbles: splashyArt('bubbles', drawBubbles),
  shelly: splashyArt('shelly', drawShelly),
  finn: splashyArt('finn', drawFinn),
  coral: splashyArt('coral', drawCoral),
  waddles: splashyArt('waddles', drawWaddles),
}
