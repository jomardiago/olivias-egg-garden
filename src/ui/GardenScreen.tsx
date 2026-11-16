import { useState } from 'react'
import { characterArt } from '../catalog/index.ts'
import { canMakeStarEntry, type Command, type Garden, type GardenEvent, type LocalDate } from '../garden/index.ts'
import { EggView } from './EggView.tsx'
import { ParentGate } from './parentGate/ParentGate.tsx'
import { StarIcon } from './StarIcon.tsx'
import { StarPicker } from './StarPicker.tsx'

type Props = {
  garden: Garden
  today: LocalDate
  events: GardenEvent[]
  onCommand: (command: Command) => Promise<void>
  onOpenCollection: () => void
}

export function GardenScreen({ garden, today, events, onCommand, onOpenCollection }: Props) {
  const [picking, setPicking] = useState(false)
  const [pendingStars, setPendingStars] = useState<number | null>(null)
  const hatched = events.find((e) => e.type === 'EggHatched')

  return (
    <main className="garden">
      <h1 className="garden__title">{garden.childName}'s Egg Garden</h1>

      <section className="garden__characters" aria-label="Hatched Characters">
        {garden.hatchedCharacters.map(({ characterId }) => {
          const Art = characterArt(characterId)
          return (
            <div key={characterId} className={hatched?.characterId === characterId ? 'just-hatched' : undefined}>
              <Art characterId={characterId} />
            </div>
          )
        })}
      </section>

      <section className="garden__nest" aria-label="Egg">
        {garden.activeEgg.status === 'egg' && <EggView egg={garden.activeEgg} events={events} />}
      </section>

      {canMakeStarEntry(garden, today) && !picking && pendingStars === null && (
        <button type="button" className="star-button" aria-label="Add today's Stars" onClick={() => setPicking(true)}>
          <StarIcon size={88} filled />
        </button>
      )}

      <button type="button" className="collection-button" aria-label="Open my Collection" onClick={onOpenCollection}>
        📖
      </button>

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
