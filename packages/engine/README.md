# packages/engine

The pure, deterministic **Retention Engine** / scheduler (ADR-0008).

- **Input**: append-only learning events `(item-id, outcome, timestamp)`.
- **Output**: next schedule + mastery state (FSRS-4 based, per-branch settings).
- **Never writes** the event log — it only derives state from it.

Consumed by `apps/web`, the Anki bridge, and any offline planner. Because it is pure, engine upgrades are re-renders, not migrations.

## Layout (planned)

packages/engine/
    ├── fsrs.ts        # core scheduling math, no IO
    ├── gate.ts        # mastery gate rules (the 90% rule is config data)
    └── index.ts

Rules for gate thresholds and intervals come from **content** (per-branch, per-lesson), not from app code.