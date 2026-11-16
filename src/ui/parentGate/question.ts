/** A Parent Gate times-table question: `a × b`, both numbers between 2 and 9. */
export type Question = { a: number; b: number }

/** `random` returns a number in [0, 1), like Math.random. */
export function newQuestion(random: () => number): Question {
  const pick = () => 2 + Math.floor(random() * 8)
  return { a: pick(), b: pick() }
}

/** `typed` is the digits entered on the number pad. */
export function isCorrectAnswer({ a, b }: Question, typed: string): boolean {
  return typed === String(a * b)
}
