import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { characterArt, findCharacter } from '../../catalog/index.ts'
import { chooseWanderTarget, keepInMeadow, type Box, type Meadow as MeadowShape, type Spot } from './wander.ts'

type Props = {
  characterIds: readonly string[]
  /** The Character that has just hatched, which walks out of the nest. */
  justHatchedId?: string
  /** The nest, drawn in the middle of the meadow. */
  children: ReactNode
}

/** Slow, ambling walk in CSS pixels per second. */
const WALK_SPEED = 38
const MIN_WALK_MS = 1400
const MAX_WALK_MS = 9000
/** A dance that never reports its end still finishes after this long. */
const DANCE_FALLBACK_MS = 3200

/**
 * The grassy area where hatched Characters live: they amble to random open
 * spots, pause, and amble on, never into the nest or off screen. Tapping one
 * plays its tap dance.
 */
export function Meadow({ characterIds, justHatchedId, children }: Props) {
  const meadowRef = useRef<HTMLDivElement>(null)
  const nestRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number; height: number; nest: Box } | null>(null)
  // Where each Character is standing or heading, so the others can keep their distance.
  const spots = useRef(new Map<string, Spot>())

  useLayoutEffect(() => {
    const meadow = meadowRef.current
    const nest = nestRef.current
    if (!meadow || !nest) return
    const measure = () => {
      const m = meadow.getBoundingClientRect()
      const n = nest.getBoundingClientRect()
      const pad = 6
      setSize({
        width: Math.round(m.width),
        height: Math.round(m.height),
        nest: { left: n.left - m.left - pad, top: n.top - m.top - pad, right: n.right - m.left + pad, bottom: n.bottom - m.top + pad },
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(meadow)
    observer.observe(nest)
    // Rotating the device: some browsers report it late through the observer.
    addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      removeEventListener('resize', measure)
    }
  }, [])

  const count = characterIds.length
  const meadow = useMemo<MeadowShape | null>(() => {
    if (!size) return null
    let characterSize = Math.min(112, Math.max(64, Math.min(size.width, size.height) * 0.2))
    if (count > 10) characterSize *= 0.78
    else if (count > 6) characterSize *= 0.88
    return { width: size.width, height: size.height, characterSize: Math.round(characterSize), keepOut: [size.nest] }
  }, [size, count])

  const nestFoot = size ? { x: (size.nest.left + size.nest.right) / 2, y: size.nest.bottom } : null

  return (
    <div className="meadow" ref={meadowRef}>
      <div className="meadow__nest" ref={nestRef}>
        {children}
      </div>
      {meadow &&
        nestFoot &&
        characterIds.map((id) => (
          <Wanderer
            key={id}
            characterId={id}
            meadow={meadow}
            spots={spots.current}
            startAt={id === justHatchedId ? keepInMeadow(nestFoot, meadow) : undefined}
          />
        ))}
    </div>
  )
}

type WandererProps = {
  characterId: string
  meadow: MeadowShape
  spots: Map<string, Spot>
  startAt?: Spot
}

type Walk = { to: Spot; ms: number; facing: 1 | -1 }

function Wanderer({ characterId, meadow, spots, startAt }: WandererProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [walk, setWalk] = useState<Walk>(() => {
    const to = startAt ?? chooseWanderTarget(meadow, othersThan(spots, characterId), Math.random)
    spots.set(characterId, to)
    return { to, ms: 0, facing: Math.random() < 0.5 ? 1 : -1 }
  })
  const [walking, setWalking] = useState(false)
  const [dancing, setDancing] = useState(false)
  const [hearts, setHearts] = useState(0)
  const isNew = startAt !== undefined

  useEffect(() => {
    spots.set(characterId, walk.to)
    return () => void spots.delete(characterId)
  }, [spots, characterId, walk.to])

  // Keep everyone inside when the screen changes size or the Characters get smaller.
  useEffect(() => {
    setWalk((w) => {
      const to = keepInMeadow(w.to, meadow)
      if (to.x === w.to.x && to.y === w.to.y) return w
      setWalking(false)
      return { ...w, to, ms: 0 }
    })
  }, [meadow])

  // Amble: pause for a while, then head somewhere new. Paused while dancing; off for reduced motion.
  useEffect(() => {
    if (dancing || prefersReducedMotion()) return
    // A just-hatched Character hurries out of the nest; everyone else dawdles.
    const pause = walk.ms + (isNew && walk.ms === 0 ? 700 : 1200 + Math.random() * 4200)
    const timer = setTimeout(() => {
      const from = walk.to
      const to = chooseWanderTarget(meadow, othersThan(spots, characterId), Math.random)
      const distance = Math.hypot(to.x - from.x, to.y - from.y)
      const ms = Math.round(Math.min(MAX_WALK_MS, Math.max(MIN_WALK_MS, (distance / WALK_SPEED) * 1000)))
      spots.set(characterId, to)
      setWalking(true)
      setWalk({ to, ms, facing: to.x < from.x ? -1 : 1 })
    }, pause)
    return () => clearTimeout(timer)
  }, [walk, dancing, meadow, spots, characterId, isNew])

  useEffect(() => {
    if (!dancing) return
    const timer = setTimeout(() => setDancing(false), DANCE_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [dancing])

  const startDance = () => {
    setHearts((n) => n + 1)
    if (dancing) return
    // Stop right where she tapped, mid-stride, then dance.
    const el = ref.current
    if (el && walking) {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
      const here = keepInMeadow({ x: m.m41 + meadow.characterSize / 2, y: m.m42 + meadow.characterSize }, meadow)
      spots.set(characterId, here)
      setWalk((w) => ({ ...w, to: here, ms: 0 }))
    }
    setWalking(false)
    setDancing(true)
  }

  const Art = characterArt(characterId)
  const { characterSize: size, height } = meadow
  // Further back looks a little smaller; nearer Characters stand in front.
  const depth = 0.86 + 0.14 * (walk.to.y / Math.max(height, 1))

  return (
    <button
      ref={ref}
      type="button"
      className={`wanderer${walking ? ' wanderer--walking' : ''}${startAt ? ' wanderer--new' : ''}`}
      aria-label={findCharacter(characterId)?.name ?? 'Character'}
      style={{
        width: size,
        height: size,
        zIndex: Math.round(walk.to.y),
        transform: `translate(${walk.to.x - size / 2}px, ${walk.to.y - size}px)`,
        transitionDuration: `${walk.ms}ms`,
      }}
      onClick={startDance}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && e.propertyName === 'transform') setWalking(false)
      }}
    >
      <span className="wanderer__body" style={{ transform: `scale(${depth * walk.facing}, ${depth})`, transitionDuration: `${walk.ms}ms` }}>
        <span className="wanderer__step">
          <Art characterId={characterId} pose={dancing ? 'dance' : 'idle'} size={size} onDanceEnd={() => setDancing(false)} />
        </span>
      </span>
      <span className="wanderer__shadow" />
      {hearts > 0 && <Hearts key={hearts} />}
    </button>
  )
}

function Hearts() {
  return (
    <span className="hearts" aria-hidden="true">
      {['#ff7aa2', '#ffb3c7', '#ffd23f'].map((colour, i) => (
        <svg key={i} className={`hearts__heart hearts__heart--${i}`} viewBox="0 0 24 22">
          <path d="M12 21 C-4 10 2 -2 12 5 C22 -2 28 10 12 21 Z" fill={colour} />
        </svg>
      ))}
    </span>
  )
}

function othersThan(spots: Map<string, Spot>, characterId: string): Spot[] {
  return [...spots].filter(([id]) => id !== characterId).map(([, spot]) => spot)
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
