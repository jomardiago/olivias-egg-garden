import { useState } from 'react'
import { characterArt, eggPattern, LAUNCH_CATALOG, type Catalog } from '../catalog/index.ts'
import type { Garden } from '../garden/index.ts'
import './collection.css'

type Props = {
  garden: Garden
  onClose: () => void
  catalog?: Catalog
}

/**
 * Every Character, grouped by Egg Family under its Egg pattern: hatched
 * ones in colour with their name, the rest as mystery silhouettes.
 * Tapping a hatched Character shows it big and dancing.
 */
export function CollectionScreen({ garden, onClose, catalog = LAUNCH_CATALOG }: Props) {
  const [featured, setFeatured] = useState<string | null>(null)
  const hatched = new Set(garden.hatchedCharacters.map((h) => h.characterId))

  return (
    <main className="collection">
      <header className="collection__header">
        <button type="button" className="collection__back" aria-label="Back to the Garden" onClick={onClose}>
          ←
        </button>
        <h1 className="garden__title">{garden.childName}'s Collection</h1>
      </header>

      {catalog.map((family) => {
        const Pattern = eggPattern(family.id)
        return (
          <section key={family.id} className="collection__family" aria-label={`${family.name} Egg Family`}>
            <div className="collection__egg">
              <Pattern familyId={family.id} size={72} />
            </div>
            <ul className="collection__characters">
              {family.characters.map((character) => {
                const Art = characterArt(character.id)
                const isHatched = hatched.has(character.id)
                return (
                  <li key={character.id}>
                    {isHatched ? (
                      <button
                        type="button"
                        className="collection__character"
                        aria-label={`${character.name} the ${character.kind}`}
                        onClick={() => setFeatured(character.id)}
                      >
                        <Art characterId={character.id} size={64} />
                        <span className="collection__name">{character.name}</span>
                      </button>
                    ) : (
                      <div className="collection__character collection__character--mystery">
                        <Art characterId={character.id} size={64} silhouette />
                        <span className="collection__name" aria-hidden="true">?</span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {featured && <FeaturedCharacter characterId={featured} catalog={catalog} onClose={() => setFeatured(null)} />}
    </main>
  )
}

function FeaturedCharacter({ characterId, catalog, onClose }: { characterId: string; catalog: Catalog; onClose: () => void }) {
  const [dance, setDance] = useState(0)
  const Art = characterArt(characterId)
  const name = catalog.flatMap((f) => f.characters).find((c) => c.id === characterId)?.name ?? ''
  return (
    <div className="collection__featured" role="dialog" aria-label={name} onClick={onClose}>
      <div onClick={(e) => { e.stopPropagation(); setDance((n) => n + 1) }}>
        <Art key={dance} characterId={characterId} pose="dance" size={260} onDanceEnd={() => undefined} />
      </div>
      <p className="collection__featured-name">{name}</p>
    </div>
  )
}
