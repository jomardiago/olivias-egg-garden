/**
 * Storage adapter (ADR 0001: local only). Loads the whole Garden from
 * IndexedDB at startup and saves the whole Garden after every command.
 * No domain logic lives here.
 */
import { openDB, type IDBPDatabase } from 'idb'
import type { Garden } from '../garden/index.ts'

const DB_NAME = 'olivias-egg-garden'
const STORE = 'garden'
const KEY = 'current'

let dbPromise: Promise<IDBPDatabase> | null = null

function openGardenDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE)
    },
  })
  return dbPromise
}

export async function loadGarden(): Promise<Garden | null> {
  return ((await (await openGardenDb()).get(STORE, KEY)) as Garden | undefined) ?? null
}

export async function saveGarden(garden: Garden): Promise<void> {
  await (await openGardenDb()).put(STORE, garden, KEY)
}

/** Asks the browser to keep the data permanently; carries on whether or not it's granted. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist()
    }
  } catch {
    // Not supported or refused: the app works the same either way.
  }
}
