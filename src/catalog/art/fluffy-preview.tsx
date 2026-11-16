/** Dev-only preview of every Fluffy Character (see fluffy-preview.html). Tap one to see its dance. */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../ui/styles.css'
import { characterArt, findEggFamily } from '../index.ts'

function Tile({ id, size, silhouette }: { id: string; size: number; silhouette?: boolean }) {
  const [pose, setPose] = useState<'idle' | 'dance'>('idle')
  const Art = characterArt(id)
  return (
    <button style={{ background: 'none', border: 'none', padding: 4 }} onClick={() => setPose('dance')}>
      <Art characterId={id} size={size} silhouette={silhouette} pose={pose} onDanceEnd={() => setPose('idle')} />
    </button>
  )
}

function Preview() {
  const only = new URLSearchParams(location.search).get('only')?.split(',')
  const ids = findEggFamily('fluffy')!
    .characters.map((c) => c.id)
    .filter((id) => !only || only.includes(id))
  return (
    <div style={{ padding: 16 }}>
      {[220, 96, 48].map((size) => (
        <div key={size} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end' }}>
          {ids.map((id) => <Tile key={id} id={id} size={size} />)}
        </div>
      ))}
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {ids.map((id) => <Tile key={id} id={id} size={96} silhouette />)}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
