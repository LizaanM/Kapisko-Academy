# packages/engine

The pure, deterministic **Retention Engine** / scheduler (ADR-0008).

- **Input**: append-only learning events `(item-id, outcome, timestamp)`.
- **Output**: next schedule + mastery state (FSRS-family, collapsed to a small
  interval ladder in v1).
- **Never writes** the event log — it only derives state from it. Same log in,
  same schedule out, on every consumer.

Consumed by `apps/web`, the Anki bridge, and any offline planner. Because it is
pure, engine upgrades are re-renders, never migrations (ADR-0008).

## API

```js
import { schedule, gate, plan } from "./engine.js";

const events = [
  { item: "oa.ph.g0r.u12.d5", outcome: 1, ts: 1690938000000 },
  // ...
];

schedule(events, { intervals: [1, 2, 4, 8, 16] }); // Map<item, {interval, due, streak, ...}>
gate(events, item, { threshold: 0.9, window: 5 });  // {attempts, pct, passed, open}
plan(events, [item1, item2, ...]);                   // {id: {schedule, gate}}
```

- `schedule`: ladder position comes from the current pass streak; a failure
  collapses the streak but keeps the log honest.
- `gate`: the 90% rule — latest independent assessments must reach the
  threshold to pass; `open` is `false` after a miss.
- Everything is deterministic over the event log; no hidden state.

## Tests

```sh
node test.mjs   # or: npm test
```

Golden-log assertions cover interval advancement, streak collapse, and gate
open/pass semantics.

Rules for gate thresholds and intervals come from **content** (per-branch,
per-lesson), not from app code.

## Layout

packages/engine/
    ├── engine.js       # pure scheduler + gate math, no IO
    ├── test.mjs        # golden-log tests
    └── package.json    # @kapisko/engine (ESM)