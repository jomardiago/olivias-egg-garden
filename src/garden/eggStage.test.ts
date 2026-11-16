import { describe, expect, it } from 'vitest'
import { eggStage } from './index.ts'

describe('Egg fill stages', () => {
  it('an empty Egg is still', () => {
    expect(eggStage(0, 5)).toBe('still')
  })

  it('an Egg under a third full is still', () => {
    expect(eggStage(3, 10)).toBe('still')
  })

  it('an Egg a third full or more is wobbling', () => {
    expect(eggStage(4, 10)).toBe('wobbling')
    expect(eggStage(1, 3)).toBe('wobbling')
  })

  it('an Egg two thirds full or more has a small crack', () => {
    expect(eggStage(7, 10)).toBe('smallCrack')
    expect(eggStage(6, 9)).toBe('smallCrack')
  })

  it('a full Egg, just before its Hatch, has a big crack', () => {
    expect(eggStage(10, 10)).toBe('bigCrack')
    expect(eggStage(2, 2)).toBe('bigCrack')
  })

  it('the first Egg (Hatch Target 2) wobbles after 1 Star', () => {
    expect(eggStage(1, 2)).toBe('wobbling')
  })

  it('the second Egg (Hatch Target 5) goes still, wobbling, wobbling, small crack, then big crack', () => {
    expect([0, 1, 2, 3, 4, 5].map((stars) => eggStage(stars, 5))).toEqual([
      'still', 'still', 'wobbling', 'wobbling', 'smallCrack', 'bigCrack',
    ])
  })
})
