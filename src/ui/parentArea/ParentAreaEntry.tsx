import { useState } from 'react'
import { ParentGate } from '../parentGate/ParentGate.tsx'
import './parentArea.css'

type Props = {
  /** Called once a parent has passed the Parent Gate. */
  onOpen: () => void
}

/**
 * The discreet way into the Parent Area: a small, faint corner button
 * that opens the Parent Gate first. Nothing a 5-year-old is drawn to.
 */
export function ParentAreaEntry({ onOpen }: Props) {
  const [gating, setGating] = useState(false)

  return (
    <>
      <button type="button" className="parent-area-entry" aria-label="Parent Area" onClick={() => setGating(true)}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm7.43-2.53a7.8 7.8 0 0 0 0-1.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.4 7.4 0 0 0-1.68-.97l-.36-2.54A.5.5 0 0 0 14.14 2h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.6.24-1.17.57-1.68.97l-2.39-.96a.5.5 0 0 0-.6.22L2.86 8.51a.5.5 0 0 0 .12.64l2.03 1.58a7.8 7.8 0 0 0 0 1.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.22.38.3.6.22l2.39-.96c.51.4 1.08.73 1.68.97l.36 2.54c.04.24.25.42.49.42h3.84c.24 0 .45-.18.49-.42l.36-2.54c.6-.24 1.17-.57 1.68-.97l2.39.96c.22.08.48 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z"
          />
        </svg>
      </button>
      {gating && (
        <ParentGate
          purpose="Open the Parent Area"
          onCancel={() => setGating(false)}
          onPass={() => {
            setGating(false)
            onOpen()
          }}
        />
      )}
    </>
  )
}
