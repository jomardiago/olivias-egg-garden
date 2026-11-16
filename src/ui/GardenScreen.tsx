import { useEffect, useState } from 'react'
import { canMakeStarEntry, type Command, type Garden, type GardenEvent, type LocalDate } from '../garden/index.ts'
import { EggView } from './EggView.tsx'
import { GardenScene } from './garden/GardenScene.tsx'
import { Meadow } from './garden/Meadow.tsx'
import { Nest } from './garden/Nest.tsx'
import './garden/garden.css'
import { ParentGate } from './parentGate/ParentGate.tsx'
import { StarIcon } from './StarIcon.tsx'
import { StarPicker } from './StarPicker.tsx'

type Props = {
  garden: Garden
  today: LocalDate
  events: GardenEvent[]
  onCommand: (command: Command) => Promise<unknown>
  onOpenCollection: () => void
  /**
   * Called once the Stars of a Stars added event have all flown into the Egg
   * (its star celebration has finished); a Hatch celebration waits for it.
   */
  onStarsLanded?: () => void
}

export function GardenScreen({ garden, today, events, onCommand, onOpenCollection, onStarsLanded }: Props) {
  const [picking, setPicking] = useState(false)
  const [pendingStars, setPendingStars] = useState<number | null>(null)
  const hatched = events.find((e) => e.type === 'EggHatched')

  return (
    <main className="garden">
      <GardenScene />
      <h1 className="garden__title">{garden.childName}'s Egg Garden</h1>

      <Meadow characterIds={garden.hatchedCharacters.map((c) => c.characterId)} justHatchedId={hatched?.characterId}>
        <Nest hasEgg={garden.activeEgg.status === 'egg'}>
          {garden.activeEgg.status === 'egg' && <EggView egg={garden.activeEgg} events={events} onCelebrationEnd={onStarsLanded} />}
        </Nest>
      </Meadow>

      {/* Big picture buttons along the bottom: the star button in the middle, the Collection button (ticket 11) on its left. */}
      <nav className="garden__dock">
      <button type="button" className="collection-button" aria-label="Open my Collection" onClick={onOpenCollection}>
        📖
      </button>

      {canMakeStarEntry(garden, today) && !picking && pendingStars === null && (
        <button type="button" className="star-button" aria-label="Add today's Stars" onClick={() => setPicking(true)}>
          <StarIcon size={88} filled />
        </button>
      )}
      </nav>

      {picking && (
        <StarPicker
          onCancel={() => setPicking(false)}
          onConfirm={(stars) => {
            setPicking(false)
            setPendingStars(stars)
          }}
        />
      )}

      {pendingStars !== null && (
        <ParentGate
          purpose={`Approve ${pendingStars} Star${pendingStars === 1 ? '' : 's'} for today`}
          onCancel={() => setPendingStars(null)}
          onPass={async () => {
            const stars = pendingStars
            setPendingStars(null)
            await onCommand({ type: 'MakeStarEntry', stars })
          }}
        />
      )}
    </main>
  )
}
