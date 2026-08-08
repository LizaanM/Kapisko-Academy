// Golden-log tests for packages/engine (ADR-0008: deterministic schedules).
import assert from "node:assert/strict";
import { schedule, gate, plan } from "./engine.js";

const DAY = 24 * 60 * 60 * 1000;
const t = (d) => new Date("2026-08-01T09:00:00Z").getTime() + d * DAY;
const ITEM = "oa.ph.g0r.u12.d5";

// A learner passes the same item five days in a row.
const log = [
  { item: ITEM, outcome: 1, ts: t(0) },
  { item: ITEM, outcome: 1, ts: t(1) },
  { item: ITEM, outcome: 1, ts: t(2) },
  { item: ITEM, outcome: 1, ts: t(3) },
  { item: ITEM, outcome: 1, ts: t(4) },
];

// Interval ladder [1,2,4,8,16]; one pass lands the next review a day out.
const s = schedule(log).get(ITEM);
assert.equal(s.passes, 5);
assert.equal(s.streak, 5);
assert.equal(s.interval, 16);
assert.equal(s.due, t(4) + 16 * DAY);

// A failure collapses the streak but keeps the log honest.
const withFail = [...log, { item: ITEM, outcome: 0, ts: t(5) }];
const sf = schedule(withFail).get(ITEM);
assert.equal(sf.streak, 0);
assert.equal(sf.interval, 1);
assert.equal(sf.passes, 5);
assert.equal(sf.fails, 1);

// Mastery gate: 5/5 correct in a 5-item window, threshold 0.9 -> passed & open.
const gc = gate(log, ITEM);
assert.equal(gc.attempts, 5);
assert.equal(gc.passed, true);
assert.equal(gc.open, true);

// Below threshold fails the gate.
const tail = withFail.slice(-5); // [pass,pass,pass,pass,fail]
assert.equal(gate(tail, ITEM, { window: 5 }).attempts, 5);
assert.equal(gate(tail, ITEM, { window: 5 }).passed, false);
assert.equal(gate(tail, ITEM, { window: 5 }).open, false);

// plan keys by id and composes schedule + gate.
const planned = plan(log, [ITEM, "unknown"]);
assert.deepEqual(Object.keys(planned), [ITEM, "unknown"]);
assert.equal(planned[ITEM].schedule.interval, 16);
assert.equal(planned[ITEM].gate.passed, true);
assert.equal(planned.unknown.schedule.passes, 0);
assert.equal(planned.unknown.gate.attempts, 0);

console.log("engine golden log: ok");