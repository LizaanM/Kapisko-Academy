# apps/web

The interactive dashboard shell — a static-first PWA (ADR-0007). The current `dashboard.html` prototype at repo root is a hand-authored stand-in; its lessons are hardcoded. The production app is a **generated consumer** of `content/`: it loads compiled HTML/JSON from a branch release and renders it.

- Learner plane (events, mastery state) lives locally in the browser (IndexedDB) per instance.
- No server needed to read a branch.

## Layout (planned)

apps/web/
    ├── src/            # shell UI (dashboard, pathway grid, sound tiles)
    └── public/         # built branch releases, sw.js (offline)

See docs/adr/0007-static-local-first.md and docs/adr/0010-print-from-renderer.md.