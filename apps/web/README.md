# apps/web

The interactive dashboard shell — a static-first PWA (ADR-0007). The dashboard is a **generated consumer** of `content/`: it fetches the compiled release written by `packages/render` and renders it with vanilla web components — no framework, no build step.

- Content plane → `release/oa.json` + `release/engine.js` (compiled by `packages/render`).
- Learner plane stays in the browser per instance (ADR-0002 / ADR-0007): profiles and the append-only Learning Event log live in `localStorage`, never in this repo. Step completion and card-review answers are events; progress and Mastery Gates are derived from them by the bundled engine.
- Clean slate: a fresh instance has **zero learners** and starts on the first-run welcome overlay (`<kal-onboarding>`) — it plays `assets/audio/welcome.wav` as a live audio wave, then "Get Started" opens the Add-a-learner form. That flow is the only way a profile is born; nothing is ever seeded.
- Static-first: run `./serve` from the repository root (or `python3 -m http.server` from this directory) and open `http://localhost:8000`. The plain `http.server` is fine for browsing; `./serve` additionally provides `/api/state`, which `./reset` relies on.
- Launch: `./launch [port]` starts the server in the background if it isn't already running, then opens the app in your default browser at the right port.
- Reset: `./reset` forgets this deployment instance's used-state (deletes the `~/.kapisko/state-<hash>.json` mirror outside the repo). The next app boot then clears its `kap.*` localStorage keys and returns to the welcome overlay. Learner data itself never leaves the browser profile.
- Regeneration: `python3 packages/render/render.py` rebuilds `release/`.

## Layout

apps/web/
    ├── index.html           # semantic shell, no inline JS
    ├── styles/
    │   ├── tokens.css       # palette, radius, elevation ladder
    │   ├── base.css         # reset, body atmosphere, focus
    │   ├── components.css   # buttons, fields, avatars, variants, gate overlay
    │   └── layout.css       # sidebar, topbar, hero, pathway grid
    ├── assets/audio/            # first-run welcome message (static media)
    ├── server.py            # instance server: static files + /api/state reset hook
    ├── release/             # generated (never hand-edited)
    │   ├── oa.json          # compiled read-model for branch `oa`
    │   └── engine.js        # retention scheduler, bundled for the browser
    └── src/
        ├── content.js       # loads release + engine, shapes the read-model
        ├── learner.js       # learner plane: localStorage event log + summaries
        ├── icons.js         # inline SVG icon set
        ├── store.js         # tiny observable store (content, engine, profile)
        ├── components/
        │   ├── profiles.js      # <kal-profile-list>, <kal-strip>, <kal-top-avatar>
        │   ├── week-pathway.js  # <kal-week-pathway> — 5-day grid + mastery gate
        │   ├── card-box.js      # <kal-card-box> — sound-variant review / gate
        │   ├── onboarding.js    # <kal-onboarding> — first-run welcome + add learner
        │   └── snackbar.js      # <kal-snackbar>
        └── main.js              # async bootstrap + wiring

See docs/adr/0002-three-planes.md, docs/adr/0007-static-local-first.md and docs/adr/0010-print-from-renderer.md.