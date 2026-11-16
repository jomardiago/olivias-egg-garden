# 13: Parent Area: name, backup, restore, reset

**What to build:** In the Parent Area, a parent can:
- change the child's name shown in the app
- save a backup file of everything
- restore from a backup file, getting back exactly where they were
- reset everything after a second confirmation

Backups are the only safety net against a lost device (ADR 0001), so the backup and restore round-trip must be dependable.

**Blocked by:** 12 (Parent Area: history, missed days, corrections)

**Status:** ready-for-agent

- [ ] Set child name updates the Garden title and the hatch celebrations. An empty name is rejected.
- [ ] Export backup produces a file the parent can save or share, containing the full Garden state and its schema version.
- [ ] Restore backup validates the file fully. A valid file replaces the state exactly. An invalid, corrupt or unknown-version file is rejected with a clear message and changes nothing.
- [ ] Reset asks for confirmation twice, then returns to a fresh Garden with the first Egg at a Hatch Target of 2.
- [ ] The core tests cover: export then restore giving identical state, invalid backups being rejected with no change, and reset.
