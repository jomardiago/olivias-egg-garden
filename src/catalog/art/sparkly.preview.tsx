// Dev-only preview of the Sparkly family art (see sparkly.preview.html). Tap a Character to make it dance.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { characterArt, findEggFamily } from '../index.ts'

const characters = findEggFamily('sparkly')!.characters

function Tappable({ id, size }: { id: string; size: number }) {
  const [dancing, setDancing] = useState(false)
  const Art = characterArt(id)
  return (
    <button type="button" onClick={() => setDancing(true)}>
      <Art characterId={id} size={size} pose={dancing ? 'dance' : 'idle'} onDanceEnd={() => setDancing(false)} />
    </button>
  )
}

function Preview() {
  return (
    <>
      {[220, 72].map((size) => (
        <div className="row" key={size}>
          {characters.map((c) => (
            <figure key={c.id}>
              <Tappable id={c.id} size={size} />
              <figcaption>{c.name}</figcaption>
            </figure>
          ))}
        </div>
      ))}
      <div className="row">
        {characters.map((c) => {
          const Art = characterArt(c.id)
          return <Art key={c.id} characterId={c.id} size={120} silhouette />
        })}
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
