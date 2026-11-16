import { useState } from 'react'
import { starsRange } from '../garden/index.ts'
import { StarIcon } from './StarIcon.tsx'

type Props = {
  onConfirm: (stars: number) => void
  onCancel: () => void
}

/** Three star shapes: tap one to choose up to it, tap the highest chosen star again to un-choose it. */
export function StarPicker({ onConfirm, onCancel }: Props) {
  const [stars, setStars] = useState(0)

  return (
    <div className="star-picker" role="dialog" aria-label="Choose your Stars">
      <div className="star-picker__stars">
        {starsRange(1).map((n) => (
          <button
            key={n}
            type="button"
            className="star-picker__star"
            aria-pressed={n <= stars}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setStars(n === stars ? n - 1 : n)}
          >
            <StarIcon size={84} filled={n <= stars} />
          </button>
        ))}
      </div>
      <div className="star-picker__actions">
        <button type="button" className="round-button round-button--cancel" aria-label="Cancel" onClick={onCancel}>
          ✕
        </button>
        <button
          type="button"
          className="round-button round-button--confirm"
          aria-label="Confirm"
          onClick={() => onConfirm(stars)}
        >
          ✓
        </button>
      </div>
    </div>
  )
}
