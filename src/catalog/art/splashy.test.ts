// @vitest-environment happy-dom
import { createElement } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { characterArt, findEggFamily } from '../index.ts'
import { PlaceholderCharacterArt as PlaceholderCharacterArtForTests } from '../PlaceholderCharacterArt.tsx'
import type { CharacterArtProps } from './types.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const SPLASHY = findEggFamily('splashy')?.characters ?? []

let container: HTMLElement
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

describe('Splashy Character art', () => {
  it('has the five sea creatures', () => {
    expect(SPLASHY.map((c) => c.id)).toEqual(['bubbles', 'shelly', 'finn', 'coral', 'waddles'])
  })

  for (const { id, name } of SPLASHY) {
    describe(name, () => {
      it('has its own art instead of the placeholder', () => {
        expect(characterArt(id)).not.toBe(PlaceholderCharacterArtForTests)
      })

      it('draws itself at the requested size, named for screen readers', () => {
        const svg = render({ characterId: id, size: 240 })
        expect(svg.getAttribute('width')).toBe('240')
        expect(svg.getAttribute('height')).toBe('240')
        expect(svg.getAttribute('viewBox')).toBeTruthy()
        expect(svg.getAttribute('aria-label')).toBe(name)
      })

      it('has eyes that blink now and then', () => {
        const svg = render({ characterId: id })
        expect(svg.querySelectorAll('.character__eye').length).toBeGreaterThan(0)
        let blinked = false
        for (let i = 0; i < 200 && !blinked; i++) {
          act(() => vi.advanceTimersByTime(50))
          blinked = svg.classList.contains('character--blink')
        }
        expect(blinked).toBe(true)
      })

      it('as a silhouette is a faceless one-colour mystery shape', () => {
        const svg = render({ characterId: id, silhouette: true })
        expect(svg.getAttribute('aria-label')).toBe('Mystery Character')
        expect(svg.textContent ?? '').not.toContain(name)
        expect(svg.querySelectorAll('.character__eye').length).toBe(0)
        const fills = new Set(
          [...svg.querySelectorAll('[fill]')].map((el) => el.getAttribute('fill')).filter((f) => f !== 'none'),
        )
        expect(fills.size).toBe(1)
      })

      it('dances for one to two seconds, then says the dance is over', () => {
        const onDanceEnd = vi.fn()
        const svg = render({ characterId: id, pose: 'dance', onDanceEnd })
        expect(svg.classList.contains(`character--dance`)).toBe(true)
        act(() => vi.advanceTimersByTime(999))
        expect(onDanceEnd).not.toHaveBeenCalled()
        act(() => vi.advanceTimersByTime(1001))
        expect(onDanceEnd).toHaveBeenCalledTimes(1)
      })

      it('does not report a dance end while idle', () => {
        const onDanceEnd = vi.fn()
        render({ characterId: id, onDanceEnd })
        act(() => vi.advanceTimersByTime(5000))
        expect(onDanceEnd).not.toHaveBeenCalled()
      })
    })
  }
})
