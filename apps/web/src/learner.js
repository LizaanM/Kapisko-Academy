// Learner plane (ADR-0002, ADR-0007): lives ONLY in the browser's localStorage.
// Nothing here is content; nothing here is shared. The repository never sees it.
//
// Storage layout (per deployment instance):
//   kap.learner.v1            -> {profiles: [{id, init, name, meta, colour}]}
//   kap.events.<profileId>    -> append-only [{item, outcome, ts}]

const PROFILE_KEY = "kap.learner.v1";
const eventsKey = (id) => `kap.events.${id}`;

const DEFAULT_PROFILES = [
  { id: "mia", init: "M", name: "Mia", meta: "Age 6 · Phase 2", colour: "peach" },
  { id: "levi", init: "LK", name: "Levi", meta: "Age 5 · Phase 1", colour: "sky" },
  { id: "noah", init: "NK", name: "Noah", meta: "Age 4 · Phase 1", colour: "mint" },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const learner = {
  // Demo instance seeding: the browser IS the learner plane.
  init() {
    if (!localStorage.getItem(PROFILE_KEY)) {
      write(PROFILE_KEY, { profiles: DEFAULT_PROFILES });
    }
  },

  profiles() {
    this.init();
    return read(PROFILE_KEY, { profiles: DEFAULT_PROFILES }).profiles;
  },

  events(profileId) {
    return read(eventsKey(profileId), []);
  },

  // Append-only learning event. Never mutated; only appended.
  record(profileId, item, outcome) {
    const log = this.events(profileId);
    log.push({ item, outcome, ts: Date.now() });
    write(eventsKey(profileId), log);
  },

  // Derived (not stored) per-profile summary, computed by the engine.
  // items = [{id}], carried by a caller that already holds the engine.
  summarize(profileId, steps, engine) {
    const events = this.events(profileId);
    const items = steps.map((s) => s.id);
    const plan = engine.plan(events, items);
    const done = steps.map((s) => {
      const g = plan[s.id] ? plan[s.id].gate : { passed: false };
      const done = events.some((ev) => ev.item === s.id && ev.outcome === 1);
      return { id: s.id, done, passed: g.passed };
    });
    const pct = steps.length ? done.filter((d) => d.done).length / steps.length * 100 : 0;
    return { events, done, pct, plan };
  },
};