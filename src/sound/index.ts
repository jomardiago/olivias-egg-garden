import { createSound, type AudioContextLike } from './sound.ts'

export { cuesForEvents, hatchPhaseCue, type SoundCue } from './sound.ts'

/** The app's one sound player, using the browser's Web Audio. */
export const sound = createSound({
  createContext: () => {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    return new Context() as unknown as AudioContextLike
  },
})
