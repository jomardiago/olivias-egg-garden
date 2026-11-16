import { describe, expect, it } from 'vitest'
import { createGarden, exportBackup, handle, type Command, type Garden, type Result } from './index.ts'

const MON = '2026-11-16'

function send(garden: Garden, command: Command, today = MON): Result {
  return handle(garden, command, { today, random: () => 0 })
}

describe('Set child name', () => {
  it('changes the name shown in the app', () => {
    const { garden, events } = send(createGarden(), { type: 'SetChildName', name: 'Mia' })

    expect(garden.childName).toBe('Mia')
    expect(events).toEqual([{ type: 'ChildNameSet', name: 'Mia' }])
  })

  it.each(['', '   '])('an empty name (%j) is rejected and changes nothing', (name) => {
    const before = createGarden()
    const { garden, events } = send(before, { type: 'SetChildName', name })

    expect(events).toEqual([{ type: 'CommandRejected', reason: 'EmptyName' }])
    expect(garden).toEqual(before)
  })

  it('trims surrounding spaces', () => {
    expect(send(createGarden(), { type: 'SetChildName', name: '  Mia ' }).garden.childName).toBe('Mia')
  })
})

/** A Garden with history: Star Entries, a hatched Character, a renamed child, and muted. */
function playedGarden(): Garden {
  let garden = send(createGarden(), { type: 'SetChildName', name: 'Mia' }).garden
  garden = send(garden, { type: 'MakeStarEntry', stars: 3 }, '2026-11-16').garden // hatches the first Egg
  garden = send(garden, { type: 'ChooseEgg', familyId: 'fluffy' }, '2026-11-16').garden
  garden = send(garden, { type: 'MakeStarEntry', stars: 1 }, '2026-11-17').garden
  return { ...garden, muted: true }
}

describe('Backup and restore', () => {
  it('exporting then restoring gives an identical state', () => {
    const played = playedGarden()
    expect(played.hatchedCharacters).toHaveLength(1)

    const file = exportBackup(played)
    const { garden, events } = send(createGarden(), { type: 'RestoreBackup', backup: file })

    expect(garden).toEqual(played)
    expect(events).toEqual([{ type: 'BackupRestored' }])
  })

  it('the backup file is JSON that carries the schema version', () => {
    expect(JSON.parse(exportBackup(createGarden()))).toMatchObject({ schemaVersion: 1 })
  })
})

describe('Restore backup rejects bad files', () => {
  const good = JSON.parse(exportBackup(playedGarden())) as Record<string, unknown>
  const withField = (field: string, value: unknown) => JSON.stringify({ ...good, [field]: value })

  const bad: [string, string, string][] = [
    ['not JSON at all', 'hello, this is not a backup', 'BackupCorrupt'],
    ['truncated JSON', exportBackup(playedGarden()).slice(0, 40), 'BackupCorrupt'],
    ['a JSON array', '[]', 'BackupCorrupt'],
    ['JSON null', 'null', 'BackupCorrupt'],
    ['an unknown schema version', withField('schemaVersion', 2), 'BackupUnknownVersion'],
    ['no schema version', JSON.stringify({ ...good, schemaVersion: undefined }), 'BackupUnknownVersion'],
    ['an empty child name', withField('childName', '  '), 'BackupCorrupt'],
    ['muted that is not a boolean', withField('muted', 'yes'), 'BackupCorrupt'],
    ['a Star Entry with 4 Stars', withField('starEntries', [{ date: '2026-11-16', stars: 4 }]), 'BackupCorrupt'],
    ['a Star Entry on an impossible date', withField('starEntries', [{ date: '2026-02-30', stars: 1 }]), 'BackupCorrupt'],
    [
      'two Star Entries for the same day',
      withField('starEntries', [
        { date: '2026-11-16', stars: 1 },
        { date: '2026-11-16', stars: 2 },
      ]),
      'BackupCorrupt',
    ],
    ['a hatched Character that is not in the catalog', withField('hatchedCharacters', [{ characterId: 'nope', hatchedOn: '2026-11-16' }]), 'BackupCorrupt'],
    ['a negative hatched count', withField('eggsHatched', -1), 'BackupCorrupt'],
    ['an Egg of an unknown Egg Family', withField('activeEgg', { status: 'egg', familyId: 'nope', characterId: 'x', hatchTarget: 2, stars: 0 }), 'BackupCorrupt'],
    ['an Egg with more Stars than its Hatch Target', withField('activeEgg', { status: 'egg', familyId: 'fluffy', characterId: 'x', hatchTarget: 2, stars: 5 }), 'BackupCorrupt'],
    ['a missing active Egg', withField('activeEgg', undefined), 'BackupCorrupt'],
  ]

  it.each(bad)('%s is rejected and changes nothing', (_name, backup, reason) => {
    const before = playedGarden()
    const { garden, events } = send(before, { type: 'RestoreBackup', backup })

    expect(events).toEqual([{ type: 'CommandRejected', reason }])
    expect(garden).toEqual(before)
  })
})

describe('Reset', () => {
  it('returns to a fresh Garden with the first Egg at a Hatch Target of 2', () => {
    const { garden, events } = send(playedGarden(), { type: 'Reset' })

    expect(garden).toEqual(createGarden())
    expect(garden.activeEgg).toMatchObject({ status: 'egg', hatchTarget: 2, stars: 0 })
    expect(garden.starEntries).toEqual([])
    expect(garden.hatchedCharacters).toEqual([])
    expect(events).toEqual([{ type: 'GardenReset' }])
  })
})
