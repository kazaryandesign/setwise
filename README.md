# Setwise

A guided Push / Pull / Legs strength-training companion for one lifter. It runs one set at a time: it tells you what's next and how much to lift, logs what you did, runs the rest timer, and nudges you to add weight when you've earned it.

It's an installable web app (PWA). It works offline at the gym, and your history stays on your phone.

## Install on iPhone
1. Open the site in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Launch it from the home-screen icon.

Installing matters for two reasons. It runs full-screen, and iOS keeps a home-screen app's data instead of clearing it after 7 days of inactivity.

**Back up now and then.** Go to Settings → Export backup and save the file to Files or AirDrop it to yourself. The phone is the only place your history lives.

## What it does
- **Today** suggests the next day in the rotation (Push → Pull → Legs), with an estimated time and when you last did it.
- **Overview** lists the session's exercises. Reorder them, or swap one when a machine is taken.
- **Set screen** shows the suggested weight, the target reps and that day's coaching cue. **Done** logs the plan in one tap. On Push, the last set of each exercise switches to a **To failure** mode where you log the reps you hit.
- **Rest timer** starts automatically: Push 2:30, squats 3:00, everything else 2:00, all editable. It has +30s and Skip, chimes and flashes the screen at 0:10 and 0:00, and keeps the screen awake.
- **Summary** shows volume, time and PRs, compares each exercise with last time, and gives next session's weights.
- **History** has a month calendar, a streak, top-set trends and recent sessions.

**Progression rule:** if every set hit its target reps (failure sets count when reps ≥ target), next time adds 5 lb on compound lifts or 2.5 lb on isolation lifts. Assisted machines lose 5 lb of assistance instead. A missed rep means you hold the weight.

### iPhone notes
- Web apps can't vibrate on iPhone. The timer chimes and flashes instead. The chime follows the ringer switch.
- If you leave the app mid-rest, the timer keeps the right time. iOS can't alert you while the app is in the background, though.

## Develop
```bash
npm install
npm run dev          # http://localhost:5173
npm test             # logic unit tests (Vitest)
npm run test:e2e     # full Push session + offline check (Playwright, iPhone viewport)
npm run build        # static site in dist/
```

The stack is Vite, React, TypeScript, Dexie (IndexedDB) and vite-plugin-pwa. The design tokens in `src/styles.css` are ported from the Setwise design canvas.

## Deploy
Every push to `main` builds the site and publishes it to GitHub Pages via `.github/workflows/deploy.yml`. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
