# 01: First Star Entry hatches the first Egg

**What to build:** The end-to-end tracer. Olivia opens the app to a bare Garden, taps the star button, taps 0–3 star shapes and confirms. On her first School Day, a 2-Star entry hatches her first Egg into a placeholder Character that then appears in the Garden. Everything survives an app reload. This ticket sets up the project (React + TypeScript + Vite, Vitest) and the Garden core: the one pure module that holds all the domain rules, with today's date and the random choice passed in. It also adds the thin IndexedDB storage adapter, which saves the whole state after every command. See the spec, `.scratch/olivias-egg-garden/spec.md`, and ADR 0001.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] The project builds and runs locally, and the test suite runs with Vitest.
- [ ] The Garden core accepts a Make Star Entry command and returns the new state plus events (Stars added, 0-star day recorded, Egg hatched, command rejected).
- [ ] School Day rules: Monday to Friday by device-local date. An entry on a Saturday or Sunday is rejected, and so is a second entry on the same School Day.
- [ ] Stars must be 0–3. Anything else is rejected.
- [ ] Hatch Target ladder: the 1st Egg needs 2 Stars, the 2nd 5, the 3rd 8, and every later Egg 10.
- [ ] Stars beyond the Hatch Target carry over. A single command causes at most one hatch.
- [ ] For now the next Egg is created automatically with a placeholder Character; ticket 03 replaces this with choosing.
- [ ] The Garden screen shows a big star button (hidden on weekends and once today's Star Entry exists), the active Egg with how full it is, and the hatched Characters as placeholders.
- [ ] The state is saved to IndexedDB after every command and loaded at startup, and a reload keeps everything.
- [ ] The core tests, written against the public command interface with a fake "today", cover: the ladder, carry-over, 0-star entries, one entry per School Day, and weekend rejection.

## Comments

Resolved on branch `integration/egg-garden` (2026-11-16). All tests, type check and build pass.
