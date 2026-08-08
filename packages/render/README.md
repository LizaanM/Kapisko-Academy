# packages/render

Single content → artefact renderer shared by the web app and print pipeline
(ADR-0010). Reads Markdown + frontmatter from `content/branches/<branch>/`,
emits:

- `apps/web/release/<branch>.json` — the canonical read-model the dashboard fetches
  (unit, days/steps, sound variants, each item with a stable id for the engine).
- `apps/print/release/<unit-id>.html` — a standalone printable lesson-plan document
- `apps/web/release/engine.js` — the retention engine bundled for browser consumers

Deterministic: same content in → same bytes out.

## Usage

```sh
python3 packages/render/render.py [branch]
```

Run after editing `content/`; CI re-runs it (ADR-0009).

## Inputs

- `content/branches/<branch>/phonics/units/<unit>/unit.md`        — type: unit
- `content/branches/<branch>/phonics/units/<unit>/lessons/*.md`   — type: lesson (steps JSON block)
- `content/branches/<branch>/phonics/units/<unit>/variants.md`    — type: sound-variant table

## Layout

packages/render/
    ├── render.py   # content → JSON + HTML (pure stdlib)
    └── README.md

No "print edition" content exists; styling is a renderer concern.