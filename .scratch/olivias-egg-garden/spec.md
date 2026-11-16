# Spec: Olivia's Egg Garden

Status: resolved

## Problem Statement

Olivia is 5 and in kindergarten. Every School Day her teacher rewards her with 0 to 3 Stars for how she did. Those Stars come home, and then nothing happens with them: there is no lasting place where they add up, and nothing she can look forward to. Her parent wants the Stars to *feel* like they build towards something, and to make "I got stars today!" something she wants to tell them about. She can't read yet, so any solution has to work with pictures, touch and sound alone. It also has to be fair: she shouldn't be able to give herself Stars she didn't earn.

## Solution

A personal web app installed on the family phone's home screen. It works offline and keeps all data on the device. The home screen is her **Garden**, where the **Characters** she has hatched wander around and her current **Egg** sits in a nest.

On each School Day (Monday to Friday) she taps the big star button, taps in the 0 to 3 Stars she earned, and hands the phone to a parent. The parent passes the **Parent Gate** by answering a times-table question. Then she gets the celebration: each Star flies into the Egg with a chime, and the Egg wobbles and cracks as it fills. When the Egg reaches its **Hatch Target**, it **Hatches** with a big reveal. A named Character comes out and runs into the Garden, and she picks her next Egg from the **Egg Families** that still have Characters left. Stars beyond the Hatch Target carry over into the next Egg, so nothing she earns is ever lost. Nothing bad ever happens: an Egg never dies or shrinks on low-star days, and a hatched Character is never taken back.

Behind the Parent Gate, a **Parent Area** lets a parent:
- add a missed day or fix an entry
- see the Star Entry history
- change the child's name
- mute sound
- save and restore a backup file
- reset everything

## User Stories

### Daily Star Entry

1. As Olivia, I want a big, obvious star button on my Garden, so that I know where to go when I come home with stars.
2. As Olivia, I want to tap star shapes to choose 0, 1, 2 or 3 Stars, so that I can enter my stars without reading numbers.
3. As Olivia, I want to tap a star again to un-choose it before I hand the phone over, so that I can fix my own mistake.
4. As Olivia, I want to be able to enter a day with 0 Stars, so that my day still counts even if it was a hard one.
5. As Olivia, I want to be stopped from choosing more than 3 Stars, so that I always enter a real amount.
6. As a parent, I want every Star Entry to need my approval, so that Olivia can only add Stars she actually earned.
7. As a parent, I want to be able to cancel a Star Entry at the Parent Gate, so that a wrong amount never gets recorded.
8. As Olivia, I want the star button to disappear once today's stars are in, so that I understand today is done.
9. As Olivia, I want the star button to be hidden on Saturdays and Sundays, so that I don't ask for weekend stars.
10. As a parent, I want only one Star Entry per School Day, so that the same day can't be entered twice.
11. As a parent, I want a holiday to be just a day with no Star Entry, so that I don't have to keep a holiday calendar.

### Celebration and the Egg

12. As Olivia, I want each Star to fly into my Egg one by one with a chime, so that adding stars feels exciting.
13. As Olivia, I want my Egg to look different as it fills up (still, then wobbling, then a small crack, then a big crack), so that I can see it getting closer to hatching.
14. As Olivia, I want a gentle, happy wiggle from my Egg on a 0-star day, so that I never feel punished.
15. As Olivia, I want to see how full my Egg is without numbers, so that I know how close it is to hatching.
16. As Olivia, I want my first Egg to hatch after just 2 Stars, so that I see what hatching is on my very first day.
17. As a parent, I want Hatch Targets to follow a ladder (2, then 5, then 8, then 10 for every Egg after that), so that hatches start quickly and then settle at about one a week.
18. As Olivia, I want Stars beyond what my Egg needs to go into my next Egg, so that I never lose Stars.
19. As Olivia, I want my Egg to never break, shrink or go away, so that it always feels safe.

### Hatching

20. As Olivia, I want a big hatch moment with cracking, a burst of light, confetti and a fanfare, so that hatching feels like a real event.
21. As Olivia, I want to see the new Character's face and name, and watch it do its little dance, so that I get to meet it.
22. As Olivia, I want my name shown on the hatch celebration, so that it feels like it's mine.
23. As Olivia, I want the new Character to run into my Garden after hatching, so that I know where it lives now.
24. As a parent, I want to be able to read the Character's name out loud from the hatch screen, so that I can share the moment with her.

### Choosing the next Egg

25. As Olivia, I want to pick my next Egg from a few Eggs with different patterns, so that I feel it's my choice.
26. As Olivia, I want each Egg Family's pattern to hint at what kind of Character is inside, so that I can choose the kind I want.
27. As Olivia, I want the exact Character inside to be a surprise, so that hatching stays exciting.
28. As Olivia, I want Eggs of families I've completed to stop showing up, so that I always hatch someone new.
29. As Olivia, I want the last remaining family's Egg to just appear when it's the only choice, so that I'm not given a pointless choice.
30. As Olivia, I want the app to bring me back to choosing my Egg if I closed it before choosing, so that I never lose my turn.
31. As Olivia, I want my carried-over Stars to already be inside my new Egg when I pick it, so that I see I got to keep them.

### The Garden

32. As Olivia, I want my Garden to be the first thing I see when I open the app, so that I'm greeted by my Characters.
33. As Olivia, I want my hatched Characters to wander, bob and blink in the Garden, so that they feel alive.
34. As Olivia, I want to tap a Character and have it do its own special dance and sound, so that each one has a personality.
35. As Olivia, I want my current Egg sitting in a nest in the middle of the Garden, so that I always see it.
36. As Olivia, I want to tap my Egg and have it wiggle, so that I can play with it even on days without stars.
37. As Olivia, I want the Garden title to show my name, so that it's my Garden.

### Collection

38. As Olivia, I want a Collection view with every Character grouped by Egg Family, so that I can see what I have.
39. As Olivia, I want Characters I haven't hatched yet to show as mystery silhouettes, so that I know there's more to find.
40. As Olivia, I want to tap a hatched Character in the Collection to see it big and dancing, so that I can admire it.
41. As Olivia, I want a big celebration when I've hatched every Character, so that finishing the Collection feels special.
42. As a parent, I want Star Entries to still be recorded after the Collection is complete, and the Stars kept, so that nothing is lost when new Egg Families are added later.
43. As Olivia, I want new Egg Families to appear for choosing when they're added in an update, so that the Garden keeps growing.

### Parent Gate

44. As a parent, I want the Parent Gate to ask a single-digit times-table question (both numbers between 2 and 9) answered on a number pad, so that a 5-year-old can't pass it but I can, instantly.
45. As a parent, I want a new question each time, so that Olivia can't memorise the answer.
46. As a parent, I want a wrong answer to simply give a new question, with no lockout, so that a typo doesn't block me.
47. As a parent, I want the same Parent Gate in front of both Star Entry approval and the Parent Area, so that there's one simple rule.

### Parent Area

48. As a parent, I want to add a Star Entry for a past School Day that has none, so that a forgotten day can be made up.
49. As a parent, I want adding a missed day to trigger the normal celebration and any hatch it causes, so that Olivia still gets her moment.
50. As a parent, I want to change the Stars of an existing Star Entry, so that I can correct a mistake.
51. As a parent, I want corrections that add Stars to work like extra Stars going into the Egg, so that a fix in her favour counts fully.
52. As a parent, I want corrections that remove Stars to take them only from the current Egg, never below empty, and never take back a hatched Character, so that a fix can't make her lose a Character.
53. As a parent, I want to be unable to make Star Entries for future days or weekends, so that the history stays honest.
54. As a parent, I want a history list of Star Entries by date, so that I can see how her weeks went.
55. As a parent, I want to change the child's name shown in the app, so that it's right (and I can fix a typo).
56. As a parent, I want a mute switch for all sound, so that the app can be quiet in public or at bedtime.
57. As a parent, I want to save a backup file of everything, so that a lost or reset phone doesn't wipe out her Collection.
58. As a parent, I want to restore from a backup file and get back exactly where we were, so that the backup is actually useful.
59. As a parent, I want a clear error and nothing changed if I pick an invalid backup file, so that a wrong file can't damage our data.
60. As a parent, I want a reset-everything option behind a second confirmation, so that I can start over without doing it by accident.
61. As a parent, I want the Parent Area to use normal readable text, so that I can use it quickly.

### Device, install and reliability

62. As a parent, I want to add the app to my phone's home screen and have it open full-screen like a real app, so that it feels like an app to Olivia.
63. As a parent, I want the app to work fully offline once installed, so that it works anywhere.
64. As a parent, I want all data to stay only on the device, with no account or sign-up, so that her information stays private (see ADR 0001).
65. As a parent, I want the app to ask the browser to keep its data permanently, so that the phone doesn't clear it when space runs low.
66. As a parent, I want progress saved immediately after every action, so that closing the app mid-celebration doesn't lose anything.
67. As a parent, I want the app designed for a phone in portrait and scaling up nicely on a tablet, so that it works on whatever device we use.
68. As Olivia, I want big tap targets and no text I need to read, so that I can use the app myself.
69. As a parent, I want the app to cost nothing to run, so that it's a free family app.
70. As a parent, I want to deploy it from my own personal hosting account, so that it's independent of my work accounts.

## Implementation Decisions

### Architecture

- **Garden core (the one deep module).** A pure module with no knowledge of UI, storage, sound or the real clock. It takes the current Garden state and a command and returns the new state plus a list of events. All the domain rules live here: School Day rules, one Star Entry per School Day, the Hatch Target ladder, carry-over, hatching, Egg Family availability, correction rules and backup validation. The rest of the app is thin around it.
- **Injected dependencies.** Today's date and a random-choice function are passed into the core, never read inside it, so the core is deterministic.
- **Character catalog.** Static content kept separate from state. It lists the Egg Families, their Characters, each Character's name, and which art and dance each one uses. State refers to Characters only by stable ids, so adding an Egg Family later is a catalog change with no change to state shape.
- **Storage adapter.** A thin layer that loads the Garden state from IndexedDB at startup and saves the whole state after every command. At first launch it asks for permanent storage. No logic beyond load and save. This follows ADR 0001: local only, no cloud, no accounts.
- **UI.** React + TypeScript + Vite. It sends commands to the core, renders the returned state, and turns the returned events into animations and sound. It has no domain logic of its own.
- **Sound.** Sound effects are synthesized with the Web Audio API, so there are no audio files and the app stays small and works offline. Audio starts on the first user tap, as mobile browsers require. A global mute setting lives in state. There is no voice and no music.
- **Art.** Each Character is an original SVG with CSS or SVG animation: an idle bob, blinking, and a unique tap dance. The art should be polished and charming, not minimal, because the goal is to wow a 5-year-old. Eggs are SVG with a family pattern and four visual fill stages.
- **Install and offline.** A web app manifest plus a service worker that caches the whole app, so it installs to the home screen, opens full-screen and works offline.
- **Hosting.** A static build deployed to the parent's *personal* Vercel account by importing their personal GitHub repo. Never use the company Vercel account.

### Garden state (conceptual shape)

- **Child name** and **muted** flag.
- **Star Entries**: one per School Day, each with a date (device-local calendar date) and Stars (0–3).
- **Hatched Characters**: an ordered list of Character ids, each with the date it hatched.
- **Eggs hatched count**: used to look up the next Hatch Target on the ladder.
- **Active Egg**: either an Egg (its Egg Family, the Character secretly chosen for it when it was picked, its Hatch Target, and the Stars in it) or *awaiting choice* with a count of carried-over Stars waiting to go into the next Egg.
- **Banked Stars** after the Collection is complete. These are Stars waiting for a future Egg Family; they are the same thing as carried-over Stars while awaiting a choice.
- A **schema version** number, for backups and future migrations.

### Commands the core accepts

- **Make Star Entry** (today, Stars 0–3). Rejected if today is not a School Day, if today already has a Star Entry, if the Stars are out of range, or if the state is awaiting an Egg choice (the UI makes her choose first).
- **Add missed Star Entry** (past date, Stars). Same rules, for a past School Day with no entry. Future dates and weekends are rejected.
- **Correct Star Entry** (date, new Stars). An increase adds the difference to the current Egg, or to carried-over Stars, and may cause a hatch. A decrease removes the difference from the current Egg's Stars, or from carried-over Stars, but never below 0. Hatched Characters are never removed.
- **Choose Egg** (Egg Family). Allowed only while awaiting a choice and only for a family with unhatched Characters. The Character is picked at random from that family's unhatched Characters at this moment. The Hatch Target comes from the ladder. Carried-over Stars go in immediately, and if they already meet the target the Egg hatches straight away.
- **Set child name**, **Set muted**.
- **Export backup**: returns a serialized snapshot including the schema version.
- **Restore backup** (snapshot): validates it fully and either replaces the state or is rejected with no change.
- **Reset**: returns to a fresh Garden. The UI asks for confirmation twice before sending it.

### Events the core emits (consumed by the UI for animation/sound)

- Stars added (how many, and the Egg's new fill)
- 0-star day recorded
- Egg hatched (which Character)
- Egg choice needed (which Egg Families are available)
- Egg chosen
- Collection complete
- Command rejected (with a reason)

### Rules (precise)

- **School Day**: Monday to Friday, by the device's local calendar date.
- **Hatch Target ladder**: the 1st Egg needs 2 Stars, the 2nd 5, the 3rd 8, and the 4th and every later Egg 10.
- **Egg fill stages**: still (under 1/3 full), wobbling (1/3 or more), small crack (2/3 or more), and big crack, which is shown just before a hatch.
- **At most one hatch per command**: because entries are capped at 3 and every Hatch Target after the first is at least 5, a single entry or correction can cause at most one hatch.
- **Collection complete**: when the last Character in the catalog hatches, the core emits Collection complete. Later Star Entries are still recorded and their Stars are banked. When a later catalog update adds an Egg Family, the state becomes awaiting a choice again, with the banked Stars carried over.

### Launch catalog: 15 Characters in 3 Egg Families

- **Fluffy** (cream Egg with pastel spots), baby animals: Bun-Bun the bunny, Pip the chick, Mochi the kitten, Hazel the hedgehog, Pudding the puppy.
- **Sparkly** (lavender Egg with glitter stars), magical creatures: Twinkle the unicorn, Ember the baby dragon, Glimmer the fairy fox, Puff the cloud sprite, Pippa the pegasus.
- **Splashy** (aqua Egg with waves), sea creatures: Bubbles the octopus, Shelly the turtle, Finn the narwhal, Coral the seahorse, Waddles the penguin.

### Parent Gate

- It asks a times-table question with both numbers between 2 and 9, answered on a number pad. A wrong answer gives a fresh question, with no lockout.
- The UI handles it before sending a protected command to the core. The core doesn't know about the Parent Gate.
- It guards Star Entry approval and entry into the Parent Area.

## Testing Decisions

- **One seam: the Garden core's public interface.** Tests send commands to it and check the returned state and events, with a fake "today" and a scripted random choice. They never check internal helpers or how the state is laid out internally, only behaviour you can see through commands, state and events.
- **A good test** describes a scenario in the glossary's words. For example: "given a first Egg with 1 Star, a 3-Star Star Entry hatches it and leaves 2 carried-over Stars awaiting an Egg choice". It should keep passing through any internal refactor.
- **Behaviours to cover:**
  - the Hatch Target ladder
  - carry-over, including carried-over Stars that meet a new Egg's target straight away
  - 0-star entries
  - one Star Entry per School Day
  - weekend and future-date rejection
  - adding missed days, including one that causes a hatch
  - corrections up and down, including the floor at 0 and never un-hatching
  - commands rejected while awaiting an Egg choice
  - Egg Families dropping out once complete, and the single-family case
  - the random pick only ever choosing unhatched Characters
  - Collection complete, then banked Stars
  - backup export then restore giving identical state
  - invalid backups being rejected with no change
  - reset
- **Not unit-tested:** the storage adapter (load and save only), the Parent Gate question generator, the SVG art, animation and sound. These are checked by running the app.
- **Tooling:** Vitest.
- **Prior art:** none. This is a new project, and these tests set the pattern.

## Out of Scope

- Cloud sync, accounts, multiple devices or multiple children (see ADR 0001).
- A spoken voice or background music.
- App store distribution and native builds.
- Rare or special Eggs, and any Hatch Target above 10.
- Reminders, notifications or streaks.
- A holiday calendar.
- Any negative effect on the Egg for low-star or missed days.
- Adding new Egg Families after launch. The catalog is built to allow it, but new art is future work.
- Languages other than English for the Parent Area.

## Further Notes

- Terms come from the root glossary (`GLOSSARY.md`): Star, School Day, Star Entry, Parent Gate, Parent Area, Egg, Egg Family, Hatch Target, Hatch, Character, Collection, Garden.
- ADR 0001 (local-only storage, no cloud) applies. Backup files are the only safety net against data loss, so the backup and restore round-trip must be dependable.
- The emotional brief matters as much as the rules. Every Star should feel celebrated, and nothing should ever feel like a loss.

## Comments

Resolved on branch `integration/egg-garden` (2026-11-16). All tests, type check and build pass.
