import { StarIcon } from './StarIcon.tsx'

/** The active Egg with a ring of star slots showing how full it is, no numbers. Ticket 05 adds family patterns and fill stages. */
export function EggView({ stars, hatchTarget }: { stars: number; hatchTarget: number }) {
  return (
    <div className="egg">
      <svg width="140" height="176" viewBox="0 0 100 126" role="img" aria-label="Egg">
        <path d="M50 4 C80 4 96 56 96 80 C96 108 76 122 50 122 C24 122 4 108 4 80 C4 56 20 4 50 4 Z" fill="#fff4dc" stroke="#e9cfa0" strokeWidth="3" />
      </svg>
      <div className="egg__slots" aria-hidden="true">
        {Array.from({ length: hatchTarget }, (_, i) => (
          <StarIcon key={i} size={28} filled={i < stars} />
        ))}
      </div>
    </div>
  )
}
