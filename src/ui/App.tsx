import { useCallback, useEffect, useRef, useState } from 'react'
import { availableEggFamilies, createGarden, handle, type Command, type Garden, type GardenEvent } from '../garden/index.ts'
import { loadGarden, requestPersistentStorage, saveGarden } from '../storage/gardenStore.ts'
import { CollectionCompleteCelebration } from './CollectionCompleteCelebration.tsx'
import { CollectionScreen } from './CollectionScreen.tsx'
import { EggChoiceScreen } from './EggChoiceScreen.tsx'
import { GardenScreen } from './GardenScreen.tsx'
import { ParentArea } from './parentArea/ParentArea.tsx'
import { ParentAreaEntry } from './parentArea/ParentAreaEntry.tsx'
import { todayLocal } from './today.ts'

/**
 * Wires the UI to the Garden core: every command goes through `handle`,
 * the new Garden is saved before anything is shown, and the returned
 * events drive what the screens animate.
 */
export function App() {
  const [garden, setGarden] = useState<Garden | null>(null)
  const [events, setEvents] = useState<GardenEvent[]>([])
  const [parentAreaOpen, setParentAreaOpen] = useState(false)
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

  const send = useCallback(async (command: Command): Promise<GardenEvent[]> => {
    const current = gardenRef.current
    if (!current) return []
    const result = handle(current, command, { today: todayLocal(), random: Math.random })
    await saveGarden(result.garden)
    gardenRef.current = result.garden
    setGarden(result.garden)
    setEvents(result.events)
    if (result.events.some((e) => e.type === 'CollectionComplete')) setCelebrating(true)
    return result.events
  }, [])

  if (!garden) return <div className="loading" aria-busy="true" />

  // Closes by itself after a missed day or a raised correction, so the celebration and any Hatch play on the child's screens.
  if (parentAreaOpen) {
    return <ParentArea garden={garden} today={todayLocal()} onCommand={send} onClose={() => setParentAreaOpen(false)} />
  }

  const sendCommand = async (command: Command) => {
    await send(command)
  }

  // Also covers reopening the app after closing it before choosing.
  const choosable = garden.activeEgg.status === 'awaitingChoice' ? availableEggFamilies(garden) : []
  if (choosable.length === 0 && view === 'collection') return <CollectionScreen garden={garden} onClose={() => setView('garden')} />

  const screen =
    choosable.length > 0 ? (
      <EggChoiceScreen childName={garden.childName} familyIds={choosable} onCommand={sendCommand} />
    ) : (
      <GardenScreen garden={garden} today={todayLocal()} events={events} onCommand={sendCommand} onOpenCollection={() => setView('collection')} />
    )

  return (
    <>
      {screen}
      <ParentAreaEntry onOpen={() => setParentAreaOpen(true)} />
      {celebrating && <CollectionCompleteCelebration garden={garden} onDone={() => setCelebrating(false)} />}
    </>
  )
}
