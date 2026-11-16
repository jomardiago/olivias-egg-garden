/**
 * Where hatched Characters wander in the Garden. Pure geometry with an
 * injected random function, so the Garden screen stays thin and this is
 * testable on its own.
 *
 * A Character's spot is where its feet are: centred on `x`, standing on `y`,
 * so it covers `x ± size/2` across and `y - size` to `y` down, in CSS pixels
 * inside the meadow.
 */
export type Spot = { x: number; y: number }

export type Box = { left: number; top: number; right: number; bottom: number }

export type Meadow = {
  width: number
  height: number
  characterSize: number
  /** Areas no Character may stand in, such as the nest. */
  keepOut: readonly Box[]
}

/** How many random spots are weighed before picking the one with the most room around it. */
const CANDIDATES = 14
const MAX_TRIES = 400

/**
 * Picks where a Character walks to next: a random spot inside the meadow,
 * clear of the keep-out areas, preferring open grass away from where the
 * other Characters are standing or heading (`others`).
 */
export function chooseWanderTarget(meadow: Meadow, others: readonly Spot[], random: () => number): Spot {
  let best: Spot | null = null
  let bestScore = -Infinity
  let clear = 0
  // Keep drawing until enough clear spots have been weighed; give up on a meadow with (almost) no clear grass.
  for (let tries = 0; clear < CANDIDATES && tries < MAX_TRIES; tries++) {
    const spot = randomSpot(meadow, random)
    const isBlocked = blocked(spot, meadow)
    if (!isBlocked) clear++
    const score = room(spot, others) - (isBlocked ? 1e9 : 0)
    if (score > bestScore) {
      best = spot
      bestScore = score
    }
  }
  return best ?? keepInMeadow({ x: 0, y: 0 }, meadow)
}

/** The nearest spot to `spot` where the whole Character is inside the meadow (for when the screen changes size). */
export function keepInMeadow(spot: Spot, meadow: Meadow): Spot {
  const { minX, maxX, minY, maxY } = range(meadow)
  return { x: clamp(spot.x, minX, maxX), y: clamp(spot.y, minY, maxY) }
}

function range({ width, height, characterSize: size }: Meadow) {
  const half = size / 2
  // A meadow smaller than a Character: centre it rather than poke out on one side.
  const minX = width >= size ? half : width / 2
  const maxX = width >= size ? width - half : width / 2
  const minY = height >= size ? size : height
  return { minX, maxX, minY, maxY: height }
}

function randomSpot(meadow: Meadow, random: () => number): Spot {
  const { minX, maxX, minY, maxY } = range(meadow)
  return { x: minX + random() * (maxX - minX), y: minY + random() * (maxY - minY) }
}

/** Distance to the nearest other Character; open grass scores higher. */
function room(spot: Spot, others: readonly Spot[]): number {
  let nearest = Infinity
  for (const other of others) nearest = Math.min(nearest, Math.hypot(spot.x - other.x, spot.y - other.y))
  return nearest === Infinity ? 0 : nearest
}

function blocked(spot: Spot, { characterSize: size, keepOut }: Meadow): boolean {
  const left = spot.x - size / 2
  const right = spot.x + size / 2
  const top = spot.y - size
  return keepOut.some((b) => left < b.right && right > b.left && top < b.bottom && spot.y > b.top)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
