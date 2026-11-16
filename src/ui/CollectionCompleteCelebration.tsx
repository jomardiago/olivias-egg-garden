import { characterArt } from '../catalog/index.ts'
import type { Garden } from '../garden/index.ts'
import './collection.css'

const CONFETTI_COLOURS = ['#ff7aa2', '#ffd36e', '#9ee2c9', '#b9a7ff', '#8fd3ff']

/** The big celebration when every Character has hatched: all of them dance together under a shower of confetti. */
export function CollectionCompleteCelebration({ garden, onDone }: { garden: Garden; onDone: () => void }) {
  return (
    <div className="collection-complete" role="dialog" aria-label="Collection complete!" onClick={onDone}>
      <div className="collection-complete__confetti" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
              animationDelay: `${(i % 10) * 0.25}s`,
            }}
          />
        ))}
      </div>
      <div className="collection-complete__trophy" aria-hidden="true">🏆</div>
      <h1 className="collection-complete__title">{garden.childName}, you found them all!</h1>
      <div className="collection-complete__characters">
        {garden.hatchedCharacters.map(({ characterId }) => {
          const Art = characterArt(characterId)
          return <Art key={characterId} characterId={characterId} pose="dance" size={56} />
        })}
      </div>
    </div>
  )
}
