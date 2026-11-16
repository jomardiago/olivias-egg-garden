import { describe, expect, it } from 'vitest'
import { createSound, cuesForEvents, hatchPhaseCue, type AudioContextLike, type SoundCue } from './sound.ts'

type FakeParam = { values: number[]; setValueAtTime(v: number, t: number): void; linearRampToValueAtTime(v: number, t: number): void; exponentialRampToValueAtTime(v: number, t: number): void }
type FakeOscillator = { frequency: FakeParam; started: boolean; type: string; connect(n: unknown): void; start(t?: number): void; stop(t?: number): void }

function param(): FakeParam {
  const values: number[] = []
  const record = (v: number) => void values.push(v)
  return { values, setValueAtTime: record, linearRampToValueAtTime: record, exponentialRampToValueAtTime: record }
}

/** A recording stand-in for the browser's AudioContext. */
function fakeContext(state: 'running' | 'suspended' = 'running') {
  const oscillators: FakeOscillator[] = []
  const gains: { gain: FakeParam }[] = []
  const ctx = {
    state,
    currentTime: 0,
    resumed: false,
    destination: {},
    resume() {
      ctx.resumed = true
      ctx.state = 'running'
      return Promise.resolve()
    },
    createOscillator() {
      const osc: FakeOscillator = { frequency: param(), started: false, type: 'sine', connect() {}, start() { osc.started = true }, stop() {} }
      oscillators.push(osc)
      return osc
    },
    createGain() {
      const g = { gain: param(), connect() {} }
      gains.push(g)
      return g
    },
  }
  return { ctx: ctx as unknown as AudioContextLike & { resumed: boolean }, oscillators, gains }
}

function setup(state: 'running' | 'suspended' = 'running') {
  const fake = fakeContext(state)
  let created = 0
  const sound = createSound({ createContext: () => (created++, fake.ctx) })
  return { sound, fake, created: () => created }
}

const startedCount = (oscillators: FakeOscillator[]) => oscillators.filter((o) => o.started).length
const firstPitch = (osc: FakeOscillator | undefined) => osc?.frequency.values[0] ?? 0

const ALL_CUES: SoundCue[] = [
  { type: 'starLanded', index: 0 },
  { type: 'zeroStar' },
  { type: 'eggWobble' },
  { type: 'eggCrack' },
  { type: 'hatchFanfare' },
  { type: 'dance', characterId: 'bunny-1' },
  { type: 'eggChoice' },
  { type: 'collectionComplete' },
  { type: 'whoosh' },
]

describe('sound', () => {
  it('stays silent, and creates no audio context, until the first user tap unlocks it', () => {
    const { sound, fake, created } = setup()
    sound.play({ type: 'eggChoice' })
    expect(created()).toBe(0)
    expect(fake.oscillators).toHaveLength(0)
  })

  it('plays every cue once unlocked', () => {
    for (const cue of ALL_CUES) {
      const { sound, fake } = setup()
      sound.unlock()
      sound.play(cue)
      expect(startedCount(fake.oscillators), cue.type).toBeGreaterThan(0)
    }
  })

  it('resumes a suspended context when unlocked, as mobile browsers require', () => {
    const { sound, fake } = setup('suspended')
    sound.unlock()
    expect(fake.ctx.resumed).toBe(true)
  })

  it('reuses one audio context however often it is unlocked', () => {
    const { sound, created } = setup()
    sound.unlock()
    sound.unlock()
    expect(created()).toBe(1)
  })

  it('plays nothing at all while muted, then plays again when unmuted', () => {
    const { sound, fake } = setup()
    sound.unlock()
    sound.setMuted(true)
    for (const cue of ALL_CUES) sound.play(cue)
    expect(startedCount(fake.oscillators)).toBe(0)
    sound.setMuted(false)
    sound.play({ type: 'eggChoice' })
    expect(startedCount(fake.oscillators)).toBeGreaterThan(0)
  })

  it('does not even unlock the audio engine while muted', () => {
    const { sound, created } = setup()
    sound.setMuted(true)
    sound.unlock()
    sound.play({ type: 'eggChoice' })
    expect(created()).toBe(0)
  })

  it('does not throw when audio is unavailable', () => {
    const sound = createSound({ createContext: () => { throw new Error('no audio') } })
    expect(() => { sound.unlock(); sound.play({ type: 'eggChoice' }) }).not.toThrow()
  })

  it('makes each landing Star chime higher than the one before', () => {
    const pitches = [0, 1, 2, 3, 4].map((index) => {
      const { sound, fake } = setup()
      sound.unlock()
      sound.play({ type: 'starLanded', index })
      return firstPitch(fake.oscillators[0])
    })
    for (let i = 1; i < pitches.length; i++) expect(pitches[i]!).toBeGreaterThan(pitches[i - 1]!)
  })

  it('gives different Characters different dance sounds', () => {
    const pitchOf = (characterId: string) => {
      const { sound, fake } = setup()
      sound.unlock()
      sound.play({ type: 'dance', characterId })
      return fake.oscillators.map((o) => firstPitch(o)).join(',')
    }
    const sounds = new Set(['bun-bun', 'pip', 'mochi', 'hazel', 'pudding'].map(pitchOf))
    expect(sounds.size).toBeGreaterThan(2)
    expect(pitchOf('bunny-1')).toBe(pitchOf('bunny-1'))
  })

  it('stays gentle: every tone is soft and not shrill', () => {
    for (const cue of ALL_CUES) {
      const { sound, fake } = setup()
      sound.unlock()
      sound.play(cue)
      for (const g of fake.gains) expect(Math.max(...g.gain.values), cue.type).toBeLessThanOrEqual(0.4)
      for (const o of fake.oscillators) {
        expect(o.type, cue.type).not.toBe('square')
        expect(o.type, cue.type).not.toBe('sawtooth')
        for (const f of o.frequency.values) expect(f, cue.type).toBeLessThanOrEqual(2400)
      }
    }
  })
})

describe('cues for the Garden core events', () => {
  it('chirps for a 0-star day and for choosing an Egg', () => {
    expect(cuesForEvents([{ type: 'ZeroStarDayRecorded' }])).toEqual([{ type: 'zeroStar' }])
    expect(cuesForEvents([{ type: 'EggChosen', familyId: 'bunny', eggStars: 0, hatchTarget: 5 }])).toEqual([{ type: 'eggChoice' }])
  })

  it('leaves the hatch to the Hatch celebration, even when the chosen Egg hatches straight away', () => {
    const events = [
      { type: 'EggChosen', familyId: 'bunny', eggStars: 2, hatchTarget: 2 },
      { type: 'EggHatched', characterId: 'bunny-1' },
    ] as const
    expect(cuesForEvents(events)).toEqual([])
  })

  it('leaves the Star flights to the Egg and ignores events with no sound', () => {
    expect(cuesForEvents([{ type: 'StarsAdded', stars: 2, eggStars: 2, hatchTarget: 5 }, { type: 'MuteChanged', muted: true }])).toEqual([])
  })
})

describe('Hatch celebration phases', () => {
  it('cracks, fanfares, plays the Character’s dance sound, and whooshes as it runs off', () => {
    expect(hatchPhaseCue('crack', 'bunny-1')).toEqual({ type: 'eggCrack' })
    expect(hatchPhaseCue('burst', 'bunny-1')).toEqual({ type: 'hatchFanfare' })
    expect(hatchPhaseCue('dance', 'bunny-1')).toEqual({ type: 'dance', characterId: 'bunny-1' })
    expect(hatchPhaseCue('enter', 'bunny-1')).toEqual({ type: 'whoosh' })
    expect(hatchPhaseCue('meet', 'bunny-1')).toBeNull()
  })
})
