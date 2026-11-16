// @vitest-environment happy-dom
import { createElement } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { characterArt, findEggFamily } from '../index.ts'
import type { CharacterArtProps } from './types.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const FLUFFY = findEggFamily('fluffy')!.characters

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.useRealTimers()
})

function draw(props: CharacterArtProps) {
  const Art = characterArt(props.characterId)
  act(() => root.render(createElement(Art, props)))
  return host.querySelector('svg')!
}

describe('Fluffy Character art', () => {
  it.each(FLUFFY.map((c) => [c.id, c.name]))('draws %s as its own named picture', (id, name) => {
    const svg = draw({ characterId: id })
    expect(svg.getAttribute('aria-label')).toBe(name)
    expect(svg.classList.contains(`fluffy--${id}`)).toBe(true)
  })

  it.each(FLUFFY.map((c) => [c.id]))('draws %s at the requested size', (id) => {
    const svg = draw({ characterId: id, size: 240 })
    expect(svg.getAttribute('width')).toBe('240')
    expect(svg.getAttribute('height')).toBe('240')
  })

  it.each(FLUFFY.map((c) => [c.id]))('hides who %s is in silhouette: no name and no face', (id) => {
    const svg = draw({ characterId: id, silhouette: true })
    expect(svg.getAttribute('aria-label')).toBe('Mystery Character')
    expect(svg.querySelector('.fluffy__eye')).toBeNull()
    const paints = new Set<string>()
    svg.querySelectorAll('[fill], [stroke]').forEach((el) => {
      for (const attr of ['fill', 'stroke']) {
        const v = el.getAttribute(attr)
        if (v && v !== 'none') paints.add(v)
      }
    })
    expect(paints.size).toBe(1)
  })

  it.each(FLUFFY.map((c) => [c.id]))('%s calls onDanceEnd once its dance finishes, not before', (id) => {
    const onDanceEnd = vi.fn()
    draw({ characterId: id, pose: 'dance', onDanceEnd })
    act(() => vi.advanceTimersByTime(900))
    expect(onDanceEnd).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1200))
    expect(onDanceEnd).toHaveBeenCalledTimes(1)
  })

  it('does not call onDanceEnd while idle', () => {
    const onDanceEnd = vi.fn()
    draw({ characterId: 'bun-bun', onDanceEnd })
    act(() => vi.advanceTimersByTime(5000))
    expect(onDanceEnd).not.toHaveBeenCalled()
  })

  it('blinks now and then while idle', () => {
    const svg = draw({ characterId: 'mochi' })
    expect(svg.classList.contains('fluffy--blinking')).toBe(false)
    let blinks = 0
    let wasShut = false
    for (let t = 0; t < 20000; t += 40) {
      act(() => vi.advanceTimersByTime(40))
      const shut = host.querySelector('svg')!.classList.contains('fluffy--blinking')
      if (shut && !wasShut) blinks++
      wasShut = shut
    }
    expect(blinks).toBeGreaterThanOrEqual(3)
    expect(blinks).toBeLessThanOrEqual(20)
  })
})
