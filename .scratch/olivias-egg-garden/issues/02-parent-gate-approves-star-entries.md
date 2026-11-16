# 02: Parent Gate approves Star Entries

**What to build:** After Olivia taps her Stars, the phone shows the Parent Gate: a times-table question (both numbers 2–9) answered on a number pad. The Star Entry is recorded only when a parent answers correctly. A wrong answer brings up a new question with no lockout, and cancelling records nothing. The Parent Gate is a UI step in front of protected commands; the Garden core doesn't know about it.

**Blocked by:** 01 (First Star Entry hatches the first Egg)

**Status:** ready-for-agent

- [ ] Confirming her Star choice opens the Parent Gate instead of recording straight away.
- [ ] The question is `a × b` with a and b each between 2 and 9, and a new question appears every time the Parent Gate opens.
- [ ] The correct answer sends the Make Star Entry command and the celebration continues.
- [ ] A wrong answer shows a fresh question, with no lockout and no penalty.
- [ ] Cancel closes the Parent Gate, records no Star Entry, and leaves her back at the Garden.
- [ ] The Parent Gate is a reusable component, so the Parent Area (ticket 12) can use the same one.
- [ ] The number pad has large tap targets and the parent-facing text is readable.
