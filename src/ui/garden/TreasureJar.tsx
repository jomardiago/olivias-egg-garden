import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { GardenEvent } from '../../garden/index.ts'
import { sound } from '../../sound/index.ts'
import { SlotStar } from '../celebration/SlotStar.tsx'
import '../celebration/celebration.css'
import './treasureJar.css'

type Props = {
  /** Every Star banked so far, including any just banked. */
  bankedStars: number
  /** The last command's events; a Stars banked event plays its celebration once. */
  events: readonly GardenEvent[]
}

const START_DELAY_MS = 300
const FLIGHT_MS = 900
const BETWEEN_STARS_MS = 250
const MAX_VISIBLE_STARS = 12
const JAR_SIZE = 176

/**
 * The golden treasure jar that rests in the nest once the Collection is
 * complete, holding the Stars banked for a future Egg Family. Newly banked
 * Stars fly into it one by one with the star chime, and the jar pops and glows.
 */
export function TreasureJar({ bankedStars, events }: Props) {
  const banked = events.find((e) => e.type === 'StarsBanked')
  const [landed, setLanded] = useState(0)
  const [flying, setFlying] = useState(false)
  const jarRef = useRef<HTMLDivElement>(null)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!banked) return
    setLanded(0)
    const timers: number[] = []
    let t = START_DELAY_MS
    for (let i = 0; i < banked.stars; i++) {
      timers.push(
        window.setTimeout(() => {
          const box = jarRef.current?.getBoundingClientRect()
          if (box) setOrigin({ x: box.left + box.width / 2, y: box.top + box.height / 2 })
          setFlying(true)
        }, t),
      )
      t += FLIGHT_MS
      timers.push(
        window.setTimeout(() => {
          setFlying(false)
          setLanded(i + 1)
          sound.play({ type: 'starLanded', index: i })
        }, t),
      )
      t += BETWEEN_STARS_MS
    }
    return () => timers.forEach(window.clearTimeout)
  }, [banked])

  // Until each new Star has landed, the jar shows only the Stars already in it.
  const alreadyBanked = banked ? bankedStars - banked.stars : bankedStars
  const shown = Math.min(MAX_VISIBLE_STARS, alreadyBanked + landed)

  return (
    <div className="treasure-jar" style={{ '--jar-size': `${JAR_SIZE}px` } as CSSProperties} role="img" aria-label="A golden jar of treasure Stars">
      <div ref={jarRef} key={`jar-${landed}`} className={landed > 0 ? 'treasure-jar__body treasure-jar__body--pop' : 'treasure-jar__body'}>
        <svg viewBox="0 0 120 140" width={JAR_SIZE * 0.86} height={JAR_SIZE} aria-hidden="true">
          <defs>
            <linearGradient id="jar-glass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff8d6" stopOpacity="0.9" />
              <stop offset="0.5" stopColor="#ffe9a0" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffd86b" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="jar-lid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe46b" />
              <stop offset="1" stopColor="#e5a100" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="130" rx="46" ry="8" fill="#000" opacity="0.12" />
          <rect x="34" y="8" width="52" height="16" rx="6" fill="url(#jar-lid)" stroke="#c98a00" strokeWidth="2.5" />
          <path
            d="M40 24 H80 V34 C80 40 100 46 100 66 V114 C100 124 92 130 82 130 H38 C28 130 20 124 20 114 V66 C20 46 40 40 40 34 Z"
            fill="url(#jar-glass)"
            stroke="#e5a100"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M30 70 V110" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </svg>
        <div className="treasure-jar__stars" aria-hidden="true">
          {Array.from({ length: shown }, (_, i) => (
            <span key={i} className="treasure-jar__star" style={{ '--col': i % 4, '--row': Math.floor(i / 4) } as CSSProperties}>
              <SlotStar filled size={22} justFilled={landed > 0 && i === shown - 1} />
            </span>
          ))}
        </div>
        {landed > 0 && <div className="treasure-jar__glow" />}
      </div>

      {flying && origin && (
        <div
          key={`flying-${landed}`}
          className="flying-star"
          style={{ left: origin.x, top: origin.y, '--side': landed % 2 === 0 ? 1 : -1 } as CSSProperties}
          aria-hidden="true"
        >
          <SlotStar filled size={56} />
        </div>
      )}
    </div>
  )
}
