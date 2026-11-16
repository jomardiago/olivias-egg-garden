import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { characterArt, eggPattern, findCharacter } from '../../catalog/index.ts'
import type { CelebrationSignal, HatchPhase, HatchScene } from './hatchCelebration.ts'
import './hatchCelebration.css'

type Props = {
  scene: HatchScene
  childName: string
  onSignal: (signal: CelebrationSignal) => void
  /**
   * Fires once as each phase begins, for effects that follow the hatch
   * (crack crunch on `crack`, fanfare on `burst`, whoosh on `enter`).
   */
  onPhaseStart?: (phase: HatchPhase, scene: HatchScene) => void
}

/** How long the timed phases last, in ms. `dance` is a fallback in case the art never reports its dance ending. */
const PHASE_MS: Partial<Record<HatchPhase, number>> = { crack: 1700, burst: 1000, dance: 2800, enter: 1400 }

const CONFETTI_COLOURS = ['#ff6fa8', '#ffd23f', '#5ee0b5', '#8f7bff', '#5cc8ff', '#ff9f43']
const CONFETTI_COUNT = 56

/**
 * The full-screen Hatch moment: the Egg's final crack, a burst of light and
 * confetti, then the new Character big with its name and the child's name,
 * dancing. A tap sends it running into the Garden.
 */
export function HatchCelebration({ scene, childName, onSignal, onPhaseStart }: Props) {
  const { phase, characterId, familyId } = scene
  const Art = characterArt(characterId)
  const Egg = eggPattern(familyId)
  const name = findCharacter(characterId)?.name ?? 'your new friend'
  const [size] = useState(() => Math.round(Math.min(window.innerWidth * 0.7, window.innerHeight * 0.42, 340)))

  useEffect(() => {
    onPhaseStart?.(phase, scene)
    const ms = PHASE_MS[phase]
    if (ms === undefined) return
    const signal: CelebrationSignal = phase === 'dance' ? { type: 'danceEnd' } : { type: 'timer' }
    const timer = window.setTimeout(() => onSignal(signal), ms)
    return () => window.clearTimeout(timer)
    // Restart only when the phase (or the scene) changes.
  }, [phase, characterId])

  const confetti = useMemo(() => makeConfetti(characterId), [characterId])
  const hatched = phase !== 'crack'
  const shown = phase === 'dance' || phase === 'meet' || phase === 'enter'

  return (
    <div
      className={`hatch hatch--${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label={shown ? `${childName}, meet ${name}!` : 'Your Egg is hatching!'}
      onClick={() => onSignal({ type: 'tap' })}
    >
      <div className="hatch__sky" aria-hidden="true">
        {SPARKLES.map((s, i) => (
          <span key={i} className="hatch__sparkle" style={s} />
        ))}
      </div>

      {hatched && <div className="hatch__rays" aria-hidden="true" />}
      {hatched && <div className="hatch__flash" aria-hidden="true" />}

      <div className="hatch__stage">
        {!shown && (
          <div className="hatch__egg" aria-hidden="true">
            <div className="hatch__egg-half hatch__egg-half--top">
              <Egg familyId={familyId} stage="bigCrack" size={260} />
            </div>
            <div className="hatch__egg-half hatch__egg-half--bottom">
              <Egg familyId={familyId} stage="bigCrack" size={260} />
            </div>
            <svg className="hatch__crack" viewBox="0 0 100 126" aria-hidden="true">
              <polyline points={CRACK_POINTS} />
            </svg>
          </div>
        )}

        {shown && (
          <div className="hatch__character">
            <Art
              characterId={characterId}
              pose={phase === 'dance' ? 'dance' : 'idle'}
              size={size}
              onDanceEnd={() => onSignal({ type: 'danceEnd' })}
            />
          </div>
        )}
      </div>

      {hatched && (
        <div className="hatch__confetti" aria-hidden="true">
          {confetti.map((style, i) => (
            <span key={i} className="hatch__confetti-piece" style={style} />
          ))}
        </div>
      )}

      {shown && (
        <h1 className="hatch__names">
          <span className="hatch__child">{childName},</span>
          <span className="hatch__meet">meet</span>
          <span className="hatch__name">
            {[...`${name}!`].map((letter, i) => (
              <span key={i} className="hatch__letter" style={{ '--i': i } as CSSProperties}>
                {letter}
              </span>
            ))}
          </span>
        </h1>
      )}

      {phase === 'meet' && <TapHint />}
    </div>
  )
}

/** A pulsing ring with a star: "tap me", no reading needed. */
function TapHint() {
  return (
    <div className="hatch__tap" aria-hidden="true">
      <span className="hatch__tap-ring" />
      <span className="hatch__tap-ring hatch__tap-ring--late" />
      <svg viewBox="0 0 24 24" width="44" height="44">
        <path
          d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z"
          fill="#ffd23f"
          stroke="#e0a800"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// A zig-zag across the Egg's middle, in the Egg art's 100x126 viewBox.
const CRACK_POINTS = '4,62 16,52 28,66 40,50 52,66 64,52 76,66 88,52 96,60'

/** Stable per-Character confetti so a re-render doesn't reshuffle it mid-flight. */
function makeConfetti(seedText: string): CSSProperties[] {
  let seed = [...seedText].reduce((sum, ch) => sum * 31 + ch.charCodeAt(0), 7) >>> 0
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angle = (i / CONFETTI_COUNT) * Math.PI * 2 + rand() * 0.4
    const distance = 30 + rand() * 30
    return {
      '--dx': `${Math.cos(angle) * distance}vmax`,
      '--dy': `${Math.sin(angle) * distance}vmax`,
      '--rot': `${Math.round(rand() * 720 - 360)}deg`,
      '--delay': `${Math.round(rand() * 180)}ms`,
      '--fall': `${(1.6 + rand() * 1.4).toFixed(2)}s`,
      background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
      borderRadius: i % 3 === 0 ? '50%' : '2px',
      width: `${8 + Math.round(rand() * 8)}px`,
      height: `${10 + Math.round(rand() * 10)}px`,
    } as CSSProperties
  })
}

const SPARKLES: CSSProperties[] = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  animationDelay: `${(i % 6) * 0.35}s`,
  '--s': 0.5 + (i % 4) * 0.25,
}) as CSSProperties)
