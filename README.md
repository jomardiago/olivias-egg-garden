# Olivia's Egg Garden

A personal sticker-chart web app: gold stars for school days hatch Eggs into Characters in Olivia's Garden. It installs to a phone's home screen, works fully offline and keeps all data on the device (see `docs/adr/0001-local-only-storage-no-cloud.md`).

## Run it

Needs Node.js 20 or newer.

```sh
npm install
npm run dev        # dev server at http://localhost:5173
```

The service worker only runs in a production build. To try install and offline locally:

```sh
npm run build
npm run preview    # http://localhost:4173
```

## Test it

```sh
npm test           # unit tests (Vitest)
npm run build      # type-check and production build
```

## Icons

The app icon is `public/egg-icon.svg`. After editing it, run `npm run icons` to regenerate the PNG icons and favicon in `public/`, then commit them.

## Deploy it (personal accounts only)

Hosting is a static build on the parent's **personal** Vercel account, linked to a **personal** GitHub repo. Never use a company GitHub organisation or company Vercel team.

1. Create an empty private repo on your personal GitHub account (no README or `.gitignore`).
2. Push this project to it:
   ```sh
   git remote add origin https://github.com/<your-username>/olivias-egg-garden.git
   git push -u origin main
   ```
3. Sign in to [vercel.com](https://vercel.com) with your personal account and check the scope picker at the top left shows your personal account, not a team.
4. Choose **Add New → Project**, import the GitHub repo, and keep the detected settings (framework Vite, build `npm run build`, output `dist`). Click **Deploy**.
5. Every later push to `main` redeploys automatically.

## Install on the phone

Open the Vercel URL once while online, then:

- **iPhone / iPad (Safari):** Share → **Add to Home Screen**.
- **Android (Chrome):** menu ⋮ → **Install app** (or **Add to Home screen**).

After that first visit the app opens full-screen from the home screen and works with no network. Updates are picked up automatically the next time it opens online.
