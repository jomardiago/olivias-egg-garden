import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { eggPattern } from '../catalog/index.ts'
import { eggStage, type Egg, type GardenEvent } from '../garden/index.ts'
import { sound } from '../sound/index.ts'
import { celebrationFor } from './celebration/celebration.ts'
import { SlotStar } from './celebration/SlotStar.tsx'
import './celebration/celebration.css'

type Props = {
  egg: Pick<Egg, 'familyId' | 'hatchTarget' | 'stars'>
  /** The last command's events; a Stars added or 0-star day event plays its celebration once. */
  events?: readonly GardenEvent[]
  onCelebrationEnd?: () => void
}

const EGG_SIZE = 176
const START_DELAY_MS = 350
const FLIGHT_MS = 900
const BETWEEN_STARS_MS = 300
const SETTLE_MS = 500
const WIGGLE_MS = 1900

/**
 * The active Egg in its family's pattern and fill stage, with an arc of
 * star slots over it showing how full it is, no numbers. After a Star
 * Entry it plays the celebration: each Star flies in and lands with a pop,
 * then the Egg's stage updates; a 0-star day gets a happy wiggle instead.
 * The Garden is already saved by then, so closing mid-way loses nothing.
 */
export function EggView({ egg, events = NO_EVENTS, onCelebrationEnd }: Props) {
  // Worked out once per command, so re-renders never replay it.
  const celebration = useMemo(() => celebrationFor(events), [events])
  const [played, setPlayed] = useState({ celebration, landed: 0, flying: false, done: celebration === null })
  // A new command's celebration starts from the beginning.
  if (played.celebration !== celebration) setPlayed({ celebration, landed: 0, flying: false, done: celebration === null })

  const eggRef = useRef<HTMLDivElement>(null)
  const [flightOrigin, setFlightOrigin] = useState<{ x: number; y: number } | null>(null)
  const onEnd = useRef(onCelebrationEnd)
  onEnd.current = onCelebrationEnd

  useEffect(() => {
    if (!celebration) return
    const timers: number[] = []
    const at = (ms: number, step: () => void) => timers.push(window.setTimeout(step, ms))
    const finish = () => {
      setPlayed((p) => ({ ...p, flying: false, done: true }))
      onEnd.current?.()
    }

    if (celebration.kind === 'zeroStarWiggle') {
      at(WIGGLE_MS, finish)
    } else {
      let t = START_DELAY_MS
      celebration.landings.forEach((_, i) => {
        at(t, () => {
          const box = eggRef.current?.getBoundingClientRect()
          if (box) setFlightOrigin({ x: box.left + box.width / 2, y: box.top + box.height / 2 })
          setPlayed((p) => ({ ...p, flying: true }))
        })
        t += FLIGHT_MS
        at(t, () => {
          setPlayed((p) => ({ ...p, flying: false, landed: i + 1 }))
          // Each Star's chime rises with how full the Egg now is; a new stage adds a wobble or crack.
          const landing = celebration.landings[i]
          const before = i === 0 ? celebration.from : celebration.landings[i - 1]
          sound.play({ type: 'starLanded', index: Math.max(0, (landing?.eggStars ?? 1) - 1) })
          if (landing && before && landing.stage !== before.stage) sound.play({ type: 'eggCrack' }, 0.15)
          else sound.play({ type: 'eggWobble' }, 0.15)
        })
        t += BETWEEN_STARS_MS
      })
      at(t + SETTLE_MS, finish)
    }
    return () => timers.forEach(window.clearTimeout)
  }, [celebration])

  // What to show right now: the fill so far, and the stage before the Stars until they have all landed.
  let filled = egg.stars
  let stage = eggStage(egg.stars, egg.hatchTarget)
  if (celebration?.kind === 'starFlights') {
    const last = celebration.landings[celebration.landings.length - 1] ?? celebration.from
    filled = played.done ? last.eggStars : (celebration.landings[played.landed - 1] ?? celebration.from).eggStars
    stage = played.done ? last.stage : celebration.from.stage
  }
  const wiggling = celebration?.kind === 'zeroStarWiggle' && !played.done
  const justLanded = celebration?.kind === 'starFlights' && played.landed > 0 && !played.done
  const settled = celebration?.kind === 'starFlights' && played.done

  const Pattern = eggPattern(egg.familyId)
  return (
    <div className="egg-view" style={{ '--egg-size': `${EGG_SIZE}px` } as CSSProperties}>
      <div className="egg-view__slots" aria-hidden="true">
        {slotPositions(egg.hatchTarget).map((position, i) => (
          <div key={i} className="egg-view__slot" style={position}>
            <SlotStar filled={i < filled} justFilled={justLanded && i === filled - 1} />
          </div>
        ))}
      </div>

      <div
        ref={eggRef}
        key={`${played.landed}-${played.done}-${wiggling}`}
        className={['egg-view__egg', justLanded && 'egg-view__egg--pop', settled && 'egg-view__egg--tada', wiggling && 'egg-view__egg--happy']
          .filter(Boolean)
          .join(' ')}
      >
        <Pattern familyId={egg.familyId} stage={stage} size={EGG_SIZE} />
        {justLanded && <SparkleBurst />}
        {wiggling && <HappyHearts />}
      </div>

      {played.flying && flightOrigin && (
        <div
          key={played.landed}
          className="flying-star"
          style={{ left: flightOrigin.x, top: flightOrigin.y, '--side': played.landed % 2 === 0 ? 1 : -1 } as CSSProperties}
          aria-hidden="true"
        >
          <SlotStar filled size={56} />
        </div>
      )}
    </div>
  )
}

const NO_EVENTS: readonly GardenEvent[] = []

/** Slots spread evenly along an arc over the Egg, centred on its top. */
function slotPositions(count: number): CSSProperties[] {
  const step = count > 1 ? Math.min(26, 210 / (count - 1)) : 0
  const first = 90 + (step * (count - 1)) / 2
  return Array.from({ length: count }, (_, i) => {
    const angle = ((first - step * i) * Math.PI) / 180
    return { '--slot-x': Math.cos(angle).toFixed(3), '--slot-y': (-Math.sin(angle)).toFixed(3) } as CSSProperties
  })
}

function SparkleBurst() {
  return (
    <div className="sparkle-burst" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} style={{ '--angle': `${i * 36}deg`, '--hue': ['#ffd23f', '#ff9ecf', '#8fdcf0', '#b9a7ff', '#a8e6a1'][i % 5] } as CSSProperties} />
      ))}
    </div>
  )
}

function HappyHearts() {
  return (
    <div className="happy-hearts" aria-hidden="true">
      {['#ff8fbf', '#ffb3d1', '#ffd23f', '#ff8fbf', '#b9a7ff'].map((color, i) => (
        <svg key={i} viewBox="0 0 24 22" width="26" height="24" style={{ '--i': i } as CSSProperties}>
          <path
            d="M12 21 C5 15.5 1 11.6 1 7 C1 3.6 3.6 1 7 1 C9.1 1 11 2.2 12 4 C13 2.2 14.9 1 17 1 C20.4 1 23 3.6 23 7 C23 11.6 19 15.5 12 21 Z"
            fill={color}
            stroke="#fff"
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  )
}
