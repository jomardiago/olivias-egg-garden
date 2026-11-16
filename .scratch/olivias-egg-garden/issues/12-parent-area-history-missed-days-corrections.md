# 12: Parent Area: history, missed days, corrections

**What to build:** A parent gets into the Parent Area through the Parent Gate, using normal readable text. They can:
- see the Star Entry history by date
- add a Star Entry for a past School Day she forgot
- correct the Stars of an existing entry

Adding a missed day works like a normal entry: Olivia gets the celebration, and a Hatch if it causes one. A correction can never take back a Character she has hatched.

**Blocked by:** 02 (Parent Gate approves Star Entries)

**Status:** ready-for-agent

- [ ] A discreet Parent Area entry point in the Garden opens the Parent Gate first.
- [ ] The history lists Star Entries newest first, with the date and Stars.
- [ ] Add missed Star Entry (past date, 0–3 Stars) is accepted only for a past School Day with no entry. Future dates, weekends and already-entered days are rejected.
- [ ] Adding a missed day emits the same events as a normal entry, so the celebration and any Hatch play.
- [ ] Correct Star Entry (date, new Stars):
  - An increase adds the difference to the active Egg, or to carried-over Stars, and may cause a Hatch.
  - A decrease removes the difference from the active Egg, or from carried-over Stars, never below 0.
  - Hatched Characters are never removed.
- [ ] While awaiting an Egg choice, a correction only changes the carried-over Stars, and any Hatch waits until she chooses an Egg. Adding a missed day is rejected until she chooses, the same as a normal Star Entry (per the spec).
- [ ] The core tests cover: adding a missed day (including one that causes a Hatch), rejection of future, weekend and duplicate dates, corrections up and down, the floor at 0, and never un-hatching.
