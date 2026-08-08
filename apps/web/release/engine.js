// Retention Engine — pure, deterministic scheduler (ADR-0008).
//
// Reads the append-only Learning Event log `(item-id, outcome, timestamp)`
// and derives the next schedule and mastery state for an item. It NEVER
// writes the log and has no I/O of any kind — same log, same schedule,
// every consumer (web app, Anki bridge, print planners).
//
// Scheduling is FSRS-family, collapsed to a small ladder for v1:
//   pass  -> interval advances through {1, 2, 4, 8, 16} days
//   fail  -> interval resets to 1 day
// A Mastery Gate requires independent accuracy >= threshold (default 0.9,
// the "90% rule") across the latest assessments, and is "open" while the
// item has un-reviewed passes.

const INTERVALS_DAYS = [1, 2, 4, 8, 16];
export const DEFAULT_THRESHOLD = 0.9;

function byTs(events) {
  return events.slice().sort((a, b) => a.ts - b.ts);
}

// Keep only the latest assessment run for each item, then the most recent
// pass-streak governs the interval ladder position.
export function schedule(events, opts = {}) {
  const intervals = opts.intervals || INTERVALS_DAYS;
  const log = byTs(events);
  const per = new Map();
  for (const ev of log) {
    per.set(ev.item, ev);
  }
  const out = new Map();
  for (const ev of log) {
    const prev = out.get(ev.item);
    if (!prev) {
      out.set(ev.item, {
        item: ev.item,
        interval: 1,
        due: ev.ts,
        passes: ev.outcome ? 1 : 0,
        fails: ev.outcome ? 0 : 1,
        streak: ev.outcome ? 1 : 0,
      });
      continue;
    }
    const streak = ev.outcome ? prev.streak + 1 : 0;
    const idx = Math.min(streak, intervals.length - 1);
    out.set(ev.item, {
      item: ev.item,
      interval: intervals[idx],
      due: ev.ts + intervals[idx] * 24 * 60 * 60 * 1000,
      passes: prev.passes + (ev.outcome ? 1 : 0),
      fails: prev.fails + (ev.outcome ? 0 : 1),
      streak,
    });
  }
  return out;
}

// Mastery Gate: latest `window` assessments of the item, accuracy >= threshold
// and a minimum number of assessments must have been attempted.
export function gate(events, item, opts = {}) {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const window = opts.window ?? 5;
  const log = byTs(events).filter((ev) => ev.item === item);
  const latest = log.slice(-window);
  if (latest.length < (opts.minAttempts ?? 1)) {
    return { item, attempts: latest.length, passed: false, pct: 0, open: false };
  }
  const passes = latest.filter((ev) => ev.outcome).length;
  const pct = passes / latest.length;
  return {
    item,
    attempts: latest.length,
    passes,
    pct,
    passed: pct >= threshold,
    open: !(latest[latest.length - 1].outcome === 0),
  };
}

// Aggregate: for every item in `items`, derive schedule + gate, keyed by id.
export function plan(events, items, opts = {}) {
  const sched = schedule(events, opts);
  const result = {};
  for (const item of items) {
    result[item] = {
      schedule: sched.get(item) || {
        item,
        interval: 1,
        due: null,
        passes: 0,
        fails: 0,
        streak: 0,
      },
      gate: gate(events, item, opts),
    };
  }
  return result;
}
