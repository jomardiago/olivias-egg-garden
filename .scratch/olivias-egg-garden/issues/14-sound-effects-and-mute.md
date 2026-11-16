# 14: Sound effects and mute

**What to build:** The big moments sound as good as they look. Sound effects are synthesized with the Web Audio API, so there are no audio files and it all works offline. A parent can mute all sound from the Parent Area. There is no voice and no music.

**Blocked by:** 05 (Egg fill stages and Star celebration), 06 (Hatch celebration), 12 (Parent Area: history, missed days, corrections)

**Status:** ready-for-agent

- [ ] Synthesized effects for:
  - a star landing (a chime that rises with each Star)
  - the 0-star wiggle
  - Egg wobbles and cracks
  - the hatch fanfare
  - each Character's tap dance (a short sound per Character, or at least per family)
  - the Egg choice tap
  - the Collection complete fanfare
- [ ] Audio starts on the first user tap, as mobile browsers require.
- [ ] A mute setting is stored in the Garden state (Set muted), toggled in the Parent Area, and silences every sound.
- [ ] The sounds are gentle and pleasant at normal phone volume, with nothing harsh or startling.
