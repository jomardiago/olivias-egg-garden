import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestPersistentStorage } from './gardenStore.ts'

function stubStorage(storage: Partial<StorageManager> | undefined) {
  vi.stubGlobal('navigator', { storage })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requestPersistentStorage', () => {
  it('asks the browser to persist when not yet persisted', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    stubStorage({ persisted: vi.fn().mockResolvedValue(false), persist })

    await requestPersistentStorage()

    expect(persist).toHaveBeenCalledOnce()
  })

  it('carries on when the browser refuses', async () => {
    stubStorage({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    })

    await expect(requestPersistentStorage()).resolves.toBeUndefined()
  })

  it('carries on when the request throws', async () => {
    stubStorage({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockRejectedValue(new Error('denied')),
    })

    await expect(requestPersistentStorage()).resolves.toBeUndefined()
  })

  it('carries on when the browser has no storage API', async () => {
    stubStorage(undefined)

    await expect(requestPersistentStorage()).resolves.toBeUndefined()
  })

  it('does not ask again when already persisted', async () => {
    const persist = vi.fn()
    stubStorage({ persisted: vi.fn().mockResolvedValue(true), persist })

    await requestPersistentStorage()

    expect(persist).not.toHaveBeenCalled()
  })
})
