import { useCallback, useEffect, useRef, useState } from 'react'
import { availableEggFamilies, createGarden, handle, type Command, type Garden, type GardenEvent } from '../garden/index.ts'
import { loadGarden, requestPersistentStorage, saveGarden } from '../storage/gardenStore.ts'
import { CollectionCompleteCelebration } from './CollectionCompleteCelebration.tsx'
import { CollectionScreen } from './CollectionScreen.tsx'
import { EggChoiceScreen } from './EggChoiceScreen.tsx'
import { GardenScreen } from './GardenScreen.tsx'
import { todayLocal } from './today.ts'

/**
 * Wires the UI to the Garden core: every command goes through `handle`,
 * the new Garden is saved before anything is shown, and the returned
 * events drive what the screens animate.
 */
export function App() {
  const [garden, setGarden] = useState<Garden | null>(null)
  const [events, setEvents] = useState<GardenEvent[]>([])
  const gardenRef = useRef<Garden | null>(null)
  const [view, setView] = useState<'garden' | 'collection'>('garden')
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    void (async () => {
      const loaded = await loadGarden()
      if (!loaded) await requestPersistentStorage()
      const initial = loaded ?? createGarden(Math.random)
      gardenRef.current = initial
      setGarden(initial)
    })()
  }, [])

  const send = useCallback(async (command: Command) => {
    const current = gardenRef.current
    if (!current) return
    const result = handle(current, command, { today: todayLocal(), random: Math.random })
    await saveGarden(result.garden)
    gardenRef.current = result.garden
    setGarden(result.garden)
    setEvents(result.events)
    if (result.events.some((e) => e.type === 'CollectionComplete')) setCelebrating(true)
  }, [])

  if (!garden) return <div className="loading" aria-busy="true" />

  // Also covers reopening the app after closing it before choosing.
  const choosable = garden.activeEgg.status === 'awaitingChoice' ? availableEggFamilies(garden) : []
  if (choosable.length > 0) {
    return <EggChoiceScreen childName={garden.childName} familyIds={choosable} onCommand={send} />
  }

  if (view === 'collection') return <CollectionScreen garden={garden} onClose={() => setView('garden')} />

  return (
    <>
      <GardenScreen garden={garden} today={todayLocal()} events={events} onCommand={send} onOpenCollection={() => setView('collection')} />
      {celebrating && <CollectionCompleteCelebration garden={garden} onDone={() => setCelebrating(false)} />}
    </>
  )
}
