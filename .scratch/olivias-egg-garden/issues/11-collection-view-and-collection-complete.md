# 11: Collection view and Collection complete

**What to build:** Olivia can open her Collection and see every Character grouped by Egg Family: hatched ones in full colour, and ones not yet hatched as mystery silhouettes. Tapping a hatched one shows it big and dancing. When she has hatched every Character, she gets a big celebration. After that, Star Entries are still recorded and their Stars are banked, so that when an Egg Family is added in a later update, she can choose it and the banked Stars go into its first Egg.

**Blocked by:** 03 (Egg Families and choosing the next Egg)

**Status:** resolved

- [ ] The Collection screen is reachable from the Garden, with Characters grouped by Egg Family under each family's Egg pattern.
- [ ] Hatched Characters show in colour with their name, and unhatched ones show as silhouettes.
- [ ] Tapping a hatched Character shows it large and playing its dance.
- [ ] When the last catalog Character hatches, the core emits Collection complete and a big celebration plays.
- [ ] After that, Make Star Entry is still accepted and its Stars are banked. No Egg is offered.
- [ ] If the catalog later contains an Egg Family with unhatched Characters, the core goes back to awaiting a choice with the banked Stars carried over.
- [ ] The core tests cover: Collection complete, banking after completion, and an added Egg Family becoming choosable with the banked Stars carried over.

## Comments

Resolved on branch `integration/egg-garden` (2026-11-16). All tests, type check and build pass.
