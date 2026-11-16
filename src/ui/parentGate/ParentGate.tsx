import { useState } from 'react'
import { isCorrectAnswer, newQuestion, type Question } from './question.ts'
import './parentGate.css'

type Props = {
  /** Called once a parent answers correctly. Send the protected command from here. */
  onPass: () => void
  /** Called when the parent backs out. Nothing protected should happen. */
  onCancel: () => void
  /** Short parent-facing line explaining what passing will do. */
  purpose?: string
  random?: () => number
}

const MAX_DIGITS = 2
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * The Parent Gate: a times-table question answered on a number pad.
 * Mount it fresh each time it opens to get a new question. A wrong answer
 * swaps in a new question with no lockout.
 */
export function ParentGate({ onPass, onCancel, purpose = 'Grown-ups only', random = Math.random }: Props) {
  const [question, setQuestion] = useState<Question>(() => newQuestion(random))
  const [typed, setTyped] = useState('')
  const [wrong, setWrong] = useState(false)

  const press = (digit: string) => {
    setWrong(false)
    setTyped((t) => (t.length < MAX_DIGITS ? t + digit : t))
  }

  const submit = () => {
    if (typed === '') return
    if (isCorrectAnswer(question, typed)) {
      onPass()
      return
    }
    setQuestion(newQuestion(random))
    setTyped('')
    setWrong(true)
  }

  return (
    <div className="parent-gate" role="dialog" aria-modal="true" aria-label="Parent Gate">
      <div className="parent-gate__panel">
        <p className="parent-gate__purpose">{purpose}</p>
        <p className="parent-gate__question" aria-live="polite">
          {question.a} × {question.b} = <span className="parent-gate__typed">{typed || '?'}</span>
        </p>
        <p className="parent-gate__hint" aria-live="polite">
          {wrong ? 'Not quite. Here is a new one.' : 'Type the answer'}
        </p>

        <div className="parent-gate__pad">
          {KEYS.map((k) => (
            <button key={k} type="button" className="parent-gate__key" onClick={() => press(k)}>
              {k}
            </button>
          ))}
          <button
            type="button"
            className="parent-gate__key parent-gate__key--muted"
            aria-label="Delete"
            onClick={() => setTyped((t) => t.slice(0, -1))}
          >
            ⌫
          </button>
          <button type="button" className="parent-gate__key" onClick={() => press('0')}>
            0
          </button>
          <button
            type="button"
            className="parent-gate__key parent-gate__key--ok"
            aria-label="OK"
            disabled={typed === ''}
            onClick={submit}
          >
            OK
          </button>
        </div>

        <button type="button" className="parent-gate__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
