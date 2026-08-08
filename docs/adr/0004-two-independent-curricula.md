# ADR-0004: Two fully independent curricula

Status: accepted 2026-08-08

The `oa` (Cambridge O/A-Level) and `sat` (US AP/SAT) branches serve different exam systems, different grade-point values, and different pedagogical pacing. We chose **fully independent content trees** — nothing is shared between branches by default.

A shared core + overlay model was considered and rejected: it would couple branch release cadences, force cross-branch edits on every curriculum change, and blur which exam standard a given lesson actually serves. The duplication cost is accepted deliberately as the price of independent evolution.

**What IS shared** — by design (see ADR-0003): the schema, the retention engine, the renderers, and the audit tooling. Software is shared; content is not. This keeps the independence cost at the content level only.

**Consequences**

- A Cambridge edit never forces a SAT edit and vice-versa.
- Per-branch release lanes and per-branch audit gates in CI (ADR-0009).
- Content volume is roughly doubled; accepted trade-off.