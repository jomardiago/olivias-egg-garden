# 05: Egg fill stages and Star celebration

**What to build:** Olivia's Egg looks like its Egg Family (Fluffy is cream with pastel spots, Sparkly is lavender with glitter stars, Splashy is aqua with waves) and changes as it fills. After an approved Star Entry, each Star flies into the Egg one by one, and a 0-star day gets a happy little wiggle. There are no numbers anywhere she has to read.

**Blocked by:** 03 (Egg Families and choosing the next Egg)

**Status:** ready-for-agent

- [ ] Each Egg Family has its own SVG Egg pattern.
- [ ] The Egg has four fill stages: still (under 1/3 full), wobbling (1/3 or more), small crack (2/3 or more), and big crack, shown just before a Hatch.
- [ ] The Stars added event plays one star flying into the Egg per Star, with a little pop as each lands, and the Egg's stage updates afterwards.
- [ ] The 0-star day recorded event plays a gentle, happy wiggle, with nothing sad.
- [ ] How full the Egg is can be seen without numbers (for example a ring of star slots filling up).
- [ ] The animation runs only after the state is saved, so closing the app mid-animation loses nothing.
