import { describe, expect, it } from 'vitest'
import { chooseWanderTarget, keepInMeadow, type Meadow, type Spot } from './wander.ts'

/** A random function that returns `values` in order, then cycles through them again. */
function cycling(...values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length] ?? 0
}

/** A simple linear-congruential generator, so tests can draw many varied numbers deterministically. */
function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

// A phone-sized meadow: 360 x 420 px, 72 px Characters, the nest's box in the middle.
const NEST = { left: 100, top: 110, right: 260, bottom: 330 }
const PHONE: Meadow = { width: 360, height: 420, characterSize: 72, keepOut: [NEST] }

/** The box a Character standing at `spot` covers: centred on x, feet at y. */
function box(spot: Spot, size: number) {
  return { left: spot.x - size / 2, right: spot.x + size / 2, top: spot.y - size, bottom: spot.y }
}

function insideMeadow(spot: Spot, meadow: Meadow): boolean {
  const b = box(spot, meadow.characterSize)
  return b.left >= 0 && b.top >= 0 && b.right <= meadow.width && b.bottom <= meadow.height
}

function overlapsNest(spot: Spot, size: number): boolean {
  const b = box(spot, size)
  return b.left < NEST.right && b.right > NEST.left && b.top < NEST.bottom && b.bottom > NEST.top
}

describe('choosing where a Character wanders to next', () => {
  it('always picks a spot where the whole Character stays inside the meadow', () => {
    const random = seeded(1)
    for (let i = 0; i < 500; i++) {
      expect(insideMeadow(chooseWanderTarget(PHONE, [], random), PHONE)).toBe(true)
    }
  })

  it('stays inside the meadow even with extreme random numbers', () => {
    for (const r of [0, 0.999999]) {
      expect(insideMeadow(chooseWanderTarget(PHONE, [], () => r), PHONE)).toBe(true)
    }
  })

  it('never walks into the nest', () => {
    const random = seeded(2)
    for (let i = 0; i < 500; i++) {
      expect(overlapsNest(chooseWanderTarget(PHONE, [], random), PHONE.characterSize)).toBe(false)
    }
  })

  it('heads for open grass rather than onto another Character', () => {
    // Bun-Bun stands in the top-left corner; the candidates offered are that corner and the bottom-right corner.
    const bunBun = { x: 36, y: 72 }
    const target = chooseWanderTarget(PHONE, [bunBun], cycling(0, 0, 0.999999, 0.999999))
    expect(target.x).toBeGreaterThan(PHONE.width / 2)
    expect(target.y).toBeGreaterThan(PHONE.height / 2)
  })

  it('keeps a full Garden of 15 Characters from piling up on each other', () => {
    const random = seeded(3)
    const spots: Spot[] = []
    for (let i = 0; i < 15; i++) spots.push(chooseWanderTarget(PHONE, spots, random))
    const closest = Math.min(
      ...spots.flatMap((a, i) => spots.slice(i + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y))),
    )
    expect(closest).toBeGreaterThan(PHONE.characterSize * 0.5)
  })

  it('still stays inside a meadow too small to avoid the nest', () => {
    const tiny: Meadow = { width: 80, height: 80, characterSize: 72, keepOut: [{ left: 0, top: 0, right: 80, bottom: 80 }] }
    const random = seeded(4)
    for (let i = 0; i < 50; i++) expect(insideMeadow(chooseWanderTarget(tiny, [], random), tiny)).toBe(true)
  })

  it('centres the Character in a meadow narrower than the Character', () => {
    const narrow: Meadow = { width: 50, height: 300, characterSize: 72, keepOut: [] }
    expect(chooseWanderTarget(narrow, [], () => 0.9).x).toBe(25)
  })
})

describe('keeping a Character inside the meadow when the screen changes size', () => {
  it('moves a Character that ended up outside back to the nearest spot inside', () => {
    expect(keepInMeadow({ x: 500, y: 600 }, PHONE)).toEqual({ x: 324, y: 420 })
    expect(keepInMeadow({ x: -10, y: 10 }, PHONE)).toEqual({ x: 36, y: 72 })
  })

  it('leaves a Character that is already inside where it is', () => {
    expect(keepInMeadow({ x: 50, y: 400 }, PHONE)).toEqual({ x: 50, y: 400 })
  })
})
