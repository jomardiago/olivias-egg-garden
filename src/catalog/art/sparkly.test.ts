// @vitest-environment happy-dom
import { createElement } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { characterArt, findEggFamily, type CharacterArtProps } from '../index.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const SPARKLY = findEggFamily('sparkly')!.characters

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

function render(props: CharacterArtProps) {
  const Art = characterArt(props.characterId)
  act(() => root.render(createElement(Art, props)))
  return container.querySelector('svg')!
}

describe('Sparkly family art', () => {
  it.each(SPARKLY.map((c) => [c.id, c.name]))('%s has its own art, labelled with its name', (id, name) => {
    expect(() => characterArt(id)).not.toThrow()
    const svg = render({ characterId: id, size: 120 })
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBe(name)
    expect(svg.getAttribute('width')).toBe('120')
    expect(svg.getAttribute('height')).toBe('120')
  })

  it.each(SPARKLY.map((c) => [c.id, c.name]))('%s silhouette is a mystery that keeps its name secret', (id, name) => {
    const svg = render({ characterId: id, silhouette: true })
    expect(svg.getAttribute('aria-label')).toBe('Mystery Character')
    expect(container.innerHTML).not.toContain(name)
  })

  it.each(SPARKLY.map((c) => [c.id]))('%s dances for 1-2 seconds, then calls onDanceEnd once', (id) => {
    const onDanceEnd = vi.fn()
    render({ characterId: id, pose: 'dance', onDanceEnd })
    act(() => vi.advanceTimersByTime(999))
    expect(onDanceEnd).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1001))
    expect(onDanceEnd).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(5000))
    expect(onDanceEnd).toHaveBeenCalledTimes(1)
  })

  it('does not call onDanceEnd while idle', () => {
    const onDanceEnd = vi.fn()
    render({ characterId: 'ember', pose: 'idle', onDanceEnd })
    act(() => vi.advanceTimersByTime(10000))
    expect(onDanceEnd).not.toHaveBeenCalled()
  })
})
