import { describe, expect, it } from 'vitest'
import { createGarden, handle } from './index.ts'

const deps = { today: '2026-11-16', random: () => 0 }

describe('Set muted', () => {
  it('silences and un-silences the Garden, changing nothing else', () => {
    const garden = createGarden()
    expect(garden.muted).toBe(false)
    const muted = handle(garden, { type: 'SetMuted', muted: true }, deps)
    expect(muted.garden).toEqual({ ...garden, muted: true })
    expect(muted.events).toEqual([{ type: 'MuteChanged', muted: true }])
    const unmuted = handle(muted.garden, { type: 'SetMuted', muted: false }, deps)
    expect(unmuted.garden).toEqual(garden)
  })
})
