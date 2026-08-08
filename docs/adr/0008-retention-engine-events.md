# ADR-0008: Retention engine is event-driven and deterministic

Status: accepted 2026-08-08

Retention scheduling (spaced repetition, interleaving) is the pedagogical core; its behavior must be identical across every consumer (web app, Anki bridge, print planners) and stable across upgrades.

The **Retention Engine** (`packages/engine`) is a pure, deterministic function:

- **Input**: the append-only **Learning Event** log `(item-id, outcome, timestamp)`.
- **Output**: the next schedule and access of an item (FSRS-family scheduling, per-branch settings).
- It **never writes the event log** — it only reads it and derives state.

Because state is derived and never stored, patching the engine cannot corrupt learner history; a new engine version simply recomputes the same schedule deterministically for the same log. This is the same contract as ADR-0002 (learner plane = events) and ADR-0007 (local-first).

**Consequences**

- Engine upgrades are pure re-renders; no data migration.
- The engine is unit-testable against golden logs and shared by all consumers as a single package.
- Any date/time dilation must be defined in the engine package (e.g. ten-minute session, whole week holiday), not in apps.