/**
 * Sound effects, synthesized with the Web Audio API (no audio files, so it
 * all works offline). Gentle on purpose: sine and triangle tones only, soft
 * attacks and releases, a low master volume, nothing shrill. No voice, no music.
 *
 * Audio starts on the first user tap (`unlock`), as mobile browsers require,
 * and a muted Garden plays nothing and never even starts the audio engine.
 */
import type { GardenEvent } from '../garden/index.ts'

/** The slice of the browser's AudioContext this module uses; tests pass a fake. */
export type AudioContextLike = {
  state: string
  currentTime: number
  destination: unknown
  resume(): Promise<void>
  createOscillator(): {
    type: string
    frequency: ParamLike
    connect(node: unknown): void
    start(when?: number): void
    stop(when?: number): void
  }
  createGain(): { gain: ParamLike; connect(node: unknown): void }
}

type ParamLike = {
  setValueAtTime(value: number, time: number): void
  linearRampToValueAtTime(value: number, time: number): void
  exponentialRampToValueAtTime(value: number, time: number): void
}

export type SoundCue =
  /** A Star lands in the Egg; `index` is its place in the Egg (0 = first), and each one chimes higher. */
  | { type: 'starLanded'; index: number }
  | { type: 'zeroStar' }
  | { type: 'eggWobble' }
  | { type: 'eggCrack' }
  | { type: 'hatchFanfare' }
  | { type: 'dance'; characterId: string }
  | { type: 'eggChoice' }
  | { type: 'collectionComplete' }
  | { type: 'whoosh' }

export type Sound = {
  /** Call from a user tap: creates and resumes the audio engine. */
  unlock(): void
  setMuted(muted: boolean): void
  /** Plays `cue` after `delaySeconds`; does nothing while muted or before the first tap. */
  play(cue: SoundCue, delaySeconds?: number): void
}

export function createSound({ createContext }: { createContext: () => AudioContextLike }): Sound {
  let ctx: AudioContextLike | null = null
  let muted = false

  return {
    unlock() {
      if (muted) return
      try {
        ctx ??= createContext()
        if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
      } catch {
        ctx = null // no audio on this device: stay silent
      }
    },
    setMuted(value) {
      muted = value
    },
    play(cue, delaySeconds = 0) {
      if (muted || !ctx) return
      try {
        if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
        const master = ctx.createGain()
        master.gain.setValueAtTime(MASTER_VOLUME, ctx.currentTime)
        master.connect(ctx.destination)
        for (const note of notesFor(cue)) tone(ctx, master, ctx.currentTime + delaySeconds, note)
      } catch {
        // A sound that cannot play is never worth breaking the celebration.
      }
    },
  }
}

const MASTER_VOLUME = 0.35

type Note = {
  /** Seconds after the cue starts. */
  at: number
  freq: number
  /** Pitch the tone glides to by its end, if any. */
  glideTo?: number
  duration: number
  /** Peak volume, 0 to 1 (before the master volume). */
  peak: number
  wave?: 'sine' | 'triangle'
}

function tone(ctx: AudioContextLike, out: unknown, start: number, note: Note) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  const begin = start + note.at
  const end = begin + note.duration
  osc.type = note.wave ?? 'sine'
  osc.frequency.setValueAtTime(note.freq, begin)
  if (note.glideTo) osc.frequency.exponentialRampToValueAtTime(note.glideTo, end)
  // Soft attack, long smooth release: never a click.
  env.gain.setValueAtTime(0.0001, begin)
  env.gain.linearRampToValueAtTime(note.peak, begin + Math.min(0.03, note.duration / 4))
  env.gain.exponentialRampToValueAtTime(0.0001, end)
  osc.connect(env)
  env.connect(out)
  osc.start(begin)
  osc.stop(end + 0.05)
}

// A pentatonic scale (C D E G A, two octaves) so any mix of notes sounds happy together.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760]
const note = (i: number) => SCALE[Math.min(Math.max(i, 0), SCALE.length - 1)] ?? SCALE[0]!

function notesFor(cue: SoundCue): Note[] {
  switch (cue.type) {
    case 'starLanded': {
      const f = note(cue.index)
      return [
        { at: 0, freq: f, duration: 0.7, peak: 0.4 },
        { at: 0, freq: f * 2, duration: 0.35, peak: 0.12 }, // a sparkle on top
      ]
    }
    case 'zeroStar':
      // A friendly little two-note "boing", falling and rising: cheerful, not sad.
      return [
        { at: 0, freq: 392, glideTo: 330, duration: 0.25, peak: 0.4, wave: 'triangle' },
        { at: 0.22, freq: 440, glideTo: 523.25, duration: 0.3, peak: 0.4, wave: 'triangle' },
      ]
    case 'eggWobble':
      return [
        { at: 0, freq: 330, glideTo: 392, duration: 0.18, peak: 0.35, wave: 'triangle' },
        { at: 0.2, freq: 392, glideTo: 330, duration: 0.18, peak: 0.35, wave: 'triangle' },
      ]
    case 'eggCrack':
      // Soft pops falling in pitch, like a shell tapping, then a bright little sparkle.
      return [
        { at: 0, freq: 300, glideTo: 150, duration: 0.09, peak: 0.4, wave: 'triangle' },
        { at: 0.18, freq: 360, glideTo: 180, duration: 0.09, peak: 0.4, wave: 'triangle' },
        { at: 0.34, freq: 420, glideTo: 200, duration: 0.1, peak: 0.4, wave: 'triangle' },
        { at: 0.5, freq: note(5), duration: 0.5, peak: 0.25 },
      ]
    case 'hatchFanfare':
      // A rising major arpeggio ending on a held, shimmering chord.
      return [
        ...[0, 2, 3, 5].map((n, i) => ({ at: i * 0.13, freq: note(n), duration: 0.5, peak: 0.4 })),
        { at: 0.55, freq: note(1), duration: 1.4, peak: 0.28 },
        { at: 0.55, freq: note(3), duration: 1.4, peak: 0.28 },
        { at: 0.55, freq: note(5), duration: 1.4, peak: 0.28 },
        { at: 0.55, freq: note(7), duration: 1.4, peak: 0.16 },
      ]
    case 'dance':
      return danceNotes(cue.characterId)
    case 'eggChoice':
      return [
        { at: 0, freq: note(2), duration: 0.25, peak: 0.4 },
        { at: 0.09, freq: note(4), duration: 0.4, peak: 0.4 },
      ]
    case 'collectionComplete':
      // The hatch fanfare, then a longer, higher, twinkling run.
      return [
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((n, i) => ({ at: i * 0.12, freq: note(n), duration: 0.6, peak: 0.38 })),
        ...[1, 3, 5, 7].map((n) => ({ at: 1.1, freq: note(n), duration: 2, peak: 0.24 })),
        ...[9, 8, 9, 7].map((n, i) => ({ at: 1.2 + i * 0.28, freq: note(n), duration: 0.5, peak: 0.12 })),
      ]
    case 'whoosh':
      return [{ at: 0, freq: 220, glideTo: 520, duration: 0.45, peak: 0.2 }]
  }
}

/**
 * Each Character's own tap-dance sound: a short, bouncy four-note phrase
 * whose notes and rhythm come from its id, so a Character always sounds like itself.
 */
function danceNotes(characterId: string): Note[] {
  let seed = [...characterId].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 17)
  const next = (n: number) => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed % n
  }
  const wave = next(2) === 0 ? 'sine' : 'triangle'
  const step = 0.11 + next(3) * 0.03
  const start = next(4)
  return Array.from({ length: 4 }, (_, i) => ({ at: i * step, freq: note(start + next(5)), duration: 0.25, peak: 0.4, wave }))
}

/** The sounds for the Garden core's events; the Star flights, hatch and Collection complete are played by their own screens. */
export function cuesForEvents(events: readonly GardenEvent[]): SoundCue[] {
  const hatched = events.some((e) => e.type === 'EggHatched')
  const cues: SoundCue[] = []
  for (const event of events) {
    if (event.type === 'ZeroStarDayRecorded') cues.push({ type: 'zeroStar' })
    // When the chosen Egg hatches straight away, the Hatch celebration has the sound.
    if (event.type === 'EggChosen' && !hatched) cues.push({ type: 'eggChoice' })
  }
  return cues
}

/** The sound to start as each phase of the Hatch celebration begins. */
export function hatchPhaseCue(phase: string, characterId: string): SoundCue | null {
  switch (phase) {
    case 'crack':
      return { type: 'eggCrack' }
    case 'burst':
      return { type: 'hatchFanfare' }
    case 'dance':
      return { type: 'dance', characterId }
    case 'enter':
      return { type: 'whoosh' }
    default:
      return null
  }
}
