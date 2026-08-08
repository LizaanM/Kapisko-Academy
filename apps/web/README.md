# apps/web

The interactive dashboard shell — a static-first PWA (ADR-0007). The dashboard is a **generated consumer** of `content/`: it fetches the compiled release written by `packages/render` and renders it with vanilla web components — no framework, no build step.

- Content plane → `release/oa.json` + `release/engine.js` (compiled by `packages/render`).
- Learner plane stays in the browser per instance (ADR-0002 / ADR-0007): profiles and the append-only Learning Event log live in `localStorage`, never in this repo. Step completion and card-review answers are events; progress and Mastery Gates are derived from them by the bundled engine.
- Static-first: run `python3 -m http.server` from this directory and open `http://localhost:8000`.
- Regeneration: `python3 packages/render/render.py` rebuilds `release/`.

## Layout

apps/web/
    ├── index.html           # semantic shell, no inline JS
    ├── styles/
    │   ├── tokens.css       # palette, radius, elevation ladder
    │   ├── base.css         # reset, body atmosphere, focus
    │   ├── components.css   # buttons, fields, avatars, variants, gate overlay
    │   └── layout.css       # sidebar, topbar, hero, pathway grid
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
        │   └── snackbar.js      # <kal-snackbar>
        └── main.js              # async bootstrap + wiring

See docs/adr/0002-three-planes.md, docs/adr/0007-static-local-first.md and docs/adr/0010-print-from-renderer.md.