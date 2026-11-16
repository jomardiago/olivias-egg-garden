/**
 * Dev-only preview of the Splashy Characters (open /splashy-preview.html
 * under `npm run dev`). Not part of the app build: index.html is the only entry.
 */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { characterArt, findEggFamily } from '../index.ts'
import '../../ui/styles.css'

function Preview() {
  const [dancing, setDancing] = useState<Record<string, boolean>>({})
  const characters = findEggFamily('splashy')?.characters ?? []
  return (
    <div style={{ padding: 16, background: '#cdeeff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {[240, 72].map((size) => (
        <div key={size} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'end', marginBottom: 24 }}>
          {characters.map(({ id, name }) => {
            const Art = characterArt(id)
            return (
              <button
                key={id}
                type="button"
                style={{ background: 'none', border: 'none', textAlign: 'center' }}
                onClick={() => setDancing((d) => ({ ...d, [`${id}${size}`]: true }))}
              >
                <Art
                  characterId={id}
                  size={size}
                  pose={dancing[`${id}${size}`] ? 'dance' : 'idle'}
                  onDanceEnd={() => setDancing((d) => ({ ...d, [`${id}${size}`]: false }))}
                />
                <div>{name}</div>
              </button>
            )
          })}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 16 }}>
        {characters.map(({ id }) => {
          const Art = characterArt(id)
          return <Art key={id} characterId={id} size={120} silhouette />
        })}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
