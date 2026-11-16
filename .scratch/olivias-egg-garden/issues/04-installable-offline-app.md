# 04: Installable offline app

**What to build:** A parent can add the app to the phone's home screen. It then opens full-screen like a real app, works fully offline, and asks the browser to keep its data permanently. The project is ready to go into git and onto the parent's *personal* GitHub and Vercel accounts (never the company Vercel account).

**Blocked by:** 01 (First Star Entry hatches the first Egg)

**Status:** ready-for-agent

- [ ] A web app manifest gives the app's name ("Olivia's Egg Garden"), icons (an original egg icon), and full-screen portrait display.
- [ ] A service worker caches the whole app, so after the first visit it loads and works with no network.
- [ ] At first launch the app asks for permanent storage and carries on normally whether or not it's granted.
- [ ] It installs to the home screen on both iOS Safari and Android Chrome.
- [ ] The git repo is initialised, with a sensible `.gitignore` and a first commit.
- [ ] A short README explains how to run it, test it, and deploy it by pushing to a personal GitHub repo and importing that into a personal Vercel account.
