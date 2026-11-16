# 03: Egg Families and choosing the next Egg

**What to build:** After a Hatch, Olivia picks her next Egg from the Egg Families that still have unhatched Characters. The Character inside is a random surprise from that family. This ticket adds the Character catalog (static content kept separate from state, with 15 Characters in 3 Egg Families and placeholder art for now) and the "awaiting Egg choice" state in the Garden core.

**Blocked by:** 01 (First Star Entry hatches the first Egg)

**Status:** resolved

- [ ] The catalog lists these Egg Families with stable ids, names and pattern descriptions:
  - **Fluffy**: Bun-Bun the bunny, Pip the chick, Mochi the kitten, Hazel the hedgehog, Pudding the puppy.
  - **Sparkly**: Twinkle the unicorn, Ember the baby dragon, Glimmer the fairy fox, Puff the cloud sprite, Pippa the pegasus.
  - **Splashy**: Bubbles the octopus, Shelly the turtle, Finn the narwhal, Coral the seahorse, Waddles the penguin.
- [ ] State refers to Characters only by id, so adding an Egg Family later is just a catalog change.
- [ ] After a Hatch, the core is *awaiting Egg choice* and keeps the carried-over Stars. It emits an Egg choice needed event listing the available Egg Families.
- [ ] Choose Egg is accepted only while awaiting a choice and only for a family with unhatched Characters.
- [ ] The Character is picked at random, using the injected random function, from that family's unhatched Characters only.
- [ ] The Hatch Target comes from the ladder. Carried-over Stars go in immediately, and if they already meet the target the Egg hatches straight away.
- [ ] Make Star Entry is rejected while awaiting a choice.
- [ ] Fully hatched families are not offered. When only one family has Characters left, its Egg is chosen automatically.
- [ ] The UI shows an Egg choice screen with one big Egg per available family. If the app was closed while awaiting a choice, it opens on that screen.
- [ ] The core tests, with a scripted random function, cover: the random pick only choosing unhatched Characters, carry-over into the chosen Egg (including an immediate hatch), the single-family case, families dropping out once complete, and rejection while awaiting a choice.

## Comments

Resolved on branch `integration/egg-garden` (2026-11-16). All tests, type check and build pass.
