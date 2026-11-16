# 06: Hatch celebration

**What to build:** When an Egg reaches its Hatch Target, Olivia gets a big moment: the Egg cracks open with a burst of light and confetti, and the new Character appears big with its name and her name ("Olivia, meet Twinkle!"). It does its dance, then runs into the Garden, and the Egg choice screen follows.

**Blocked by:** 03 (Egg Families and choosing the next Egg)

**Status:** resolved

- [ ] The Egg hatched event plays the reveal sequence: a final crack, a burst of light, confetti, then the Character.
- [ ] The Character's name and the child's name are shown large, so a parent can read them aloud.
- [ ] The Character plays its tap dance on reveal, using placeholder art until tickets 07–09 land.
- [ ] Tapping continues to an animation of the Character entering the Garden, then the Egg choice screen.
- [ ] If carried-over Stars immediately hatch the chosen Egg, a second reveal plays.
- [ ] The Character catalog's art interface (idle, blink and dance) is what this ticket uses to render a Character.

## Comments

Resolved on branch `integration/egg-garden` (2026-11-16). All tests, type check and build pass.
