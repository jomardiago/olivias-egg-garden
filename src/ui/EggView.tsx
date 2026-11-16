import { eggPattern } from '../catalog/index.ts'
import type { Egg } from '../garden/index.ts'
import { StarIcon } from './StarIcon.tsx'

/** The active Egg in its family's pattern, with a ring of star slots showing how full it is, no numbers. Ticket 05 adds fill stages. */
export function EggView({ egg }: { egg: Egg }) {
  const Pattern = eggPattern(egg.familyId)
  return (
    <div className="egg">
      <Pattern familyId={egg.familyId} size={176} />
      <div className="egg__slots" aria-hidden="true">
        {Array.from({ length: egg.hatchTarget }, (_, i) => (
          <StarIcon key={i} size={28} filled={i < egg.stars} />
        ))}
      </div>
    </div>
  )
}
