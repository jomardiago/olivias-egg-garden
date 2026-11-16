import { describe, expect, it } from 'vitest'
import { isCorrectAnswer, newQuestion } from './question.ts'

describe('Parent Gate question', () => {
  it('uses 2 for the lowest random draw and 9 for the highest', () => {
    expect(newQuestion(() => 0)).toEqual({ a: 2, b: 2 })
    expect(newQuestion(() => 0.9999)).toEqual({ a: 9, b: 9 })
  })

  it('accepts the product typed on the number pad and rejects anything else', () => {
    const question = { a: 7, b: 8 }
    expect(isCorrectAnswer(question, '56')).toBe(true)
    expect(isCorrectAnswer(question, '54')).toBe(false)
    expect(isCorrectAnswer(question, '')).toBe(false)
    expect(isCorrectAnswer(question, '056')).toBe(false)
  })
})
