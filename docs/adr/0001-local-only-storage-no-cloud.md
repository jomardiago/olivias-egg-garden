# Local-only storage, no accounts or cloud sync

The app is a personal, single-child web app installed on one family device. All state (Star Entries, Eggs, hatched Characters, settings) lives only in that device's IndexedDB, with persistent storage requested, and there is no backend, account, or sync. This keeps it free, private, offline-first and maintenance-free for a 5-year-old's reward app. The cost is that clearing the browser data or losing the device loses her Collection, so the parent area offers a manual "Save backup / Restore backup" file as the safety net.

## Considered Options

- **localStorage**: rejected. It is more easily evicted and less suited to structured data.
- **Cloud sync (e.g. Supabase)**: rejected for now. It would survive device loss and allow multi-device use, but it adds an account, a network dependency and ongoing upkeep. Revisit if the family wants the Garden on more than one device.
