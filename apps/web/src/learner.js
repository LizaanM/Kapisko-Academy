// Learner plane (ADR-0002, ADR-0007): lives ONLY in the browser's localStorage.
// Nothing here is content; nothing here is shared. The repository never sees it.
//
// Clean slate: a fresh instance starts with ZERO learners and ZERO events.
// The onboarding flow (kal-onboarding) is the only way a profile is born.
//
// Storage layout (per deployment instance):
//   kap.learner.v1            -> {profiles: [{id, init, name, meta, colour}]}
//   kap.events.<profileId>    -> append-only [{item, outcome, ts}]

const PROFILE_KEY = "kap.learner.v1";
const eventsKey = (id) => `kap.events.${id}`;
// Guardian password (one per deployment instance). Kept as a salted hash, never
// in plain text. It gates grown-up actions: removing a learner, teacher
// settings. Children never type it. (ADR-0002: learner plane, browser-local.)
const GUARDIAN_KEY = "kap.guardian.v1";
const PALETTE = ["peach", "sky", "mint", "lilac", "rose"];
// Demo profiles seeded by an earlier build (pre-clean-slate). They are NOT
// learner-plane data (ADR-0002) and must never survive an upgrade.
const LEGACY_IDS = ["mia", "levi", "noah"];

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

// Mirror-and-debounce: copy the whole kap.* learner plane to the local
// instance server (/api/state). Its PRESENCE is the "this instance has been
// used" signal that ./reset clears; the browser localStorage stays the
// authority. Works only while served by apps/web/server.py — a plain static
// server returns 404, which we silently ignore.
let mirrorTimer = 0;
function mirrorPush() {
  if (mirrorTimer) return;
  mirrorTimer = setTimeout(async () => {
    mirrorTimer = 0;
    try {
      const state = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.indexOf("kap.") === 0) state[key] = localStorage.getItem(key);
      }
      const res = await fetch("api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) return;
    } catch {
      /* not served by the instance server — refresh mirror later */
    }
  }, 300);
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export const learner = {
  // Idempotent; never seeds demo data. Also expunges the demo profiles that an
  // earlier build seeded under the same key, so upgrading lands on a clean slate.
  init() {
    const data = read(PROFILE_KEY, { profiles: [] });
    const kept = data.profiles.filter((p) => !LEGACY_IDS.includes(p.id));
    if (kept.length !== data.profiles.length) {
      data.profiles = kept;
      write(PROFILE_KEY, data);
    }
  },

  // Add a learner. Returns the created profile and persists it to the plane.
  addProfile({ name, meta = "", colour = "" }) {
    this.init();
    const data = read(PROFILE_KEY, { profiles: [] });
    const id = `learner-${Date.now().toString(36)}`;
    const used = data.profiles.map((p) => p.colour).filter(Boolean);
    const pool = PALETTE.filter((c) => !used.includes(c));
    const profile = {
      id,
      init: initials(name),
      name: name.trim(),
      meta,
      colour: colour || pool[0] || PALETTE[Math.floor(Math.random() * PALETTE.length)],
    };
    data.profiles.push(profile);
    write(PROFILE_KEY, data);
    mirrorPush();
    return profile;
  },

  profiles() {
    this.init();
    return read(PROFILE_KEY, { profiles: [] }).profiles;
  },

  events(profileId) {
    return read(eventsKey(profileId), []);
  },

  // Append-only learning event. Never mutated; only appended.
  record(profileId, item, outcome) {
    const log = this.events(profileId);
    log.push({ item, outcome, ts: Date.now() });
    write(eventsKey(profileId), log);
    mirrorPush();
  },

  // Derived (not stored) per-profile summary, computed by the engine.
  // items = [{id}], carried by a caller that already holds the engine.
  summarize(profileId, steps, engine) {
    const events = this.events(profileId);
    if (!engine || !engine.plan) return { events, done: [], pct: 0, plan: {} };
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

  // --- Guardian password (one per instance; grown-up gate) ---

  setGuardian(password) {
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return this._hash(password, salt).then((hash) => {
      write(GUARDIAN_KEY, { salt, hash });
      mirrorPush();
      return true;
    });
  },

  hasGuardian() {
    return !!read(GUARDIAN_KEY, null);
  },

  // Verify a password against the stored hash. Resolves true if no guardian is
  // set yet (fresh instances have nothing to guard).
  check(password) {
    const guard = read(GUARDIAN_KEY, null);
    if (!guard) return Promise.resolve(true);
    return this._hash(password, guard.salt).then((h) => h === guard.hash);
  },

  // Remove a learner and its whole event log. GATED: the caller must have
  // already verified the guardian password via check().
  removeProfile(id) {
    this.init();
    const data = read(PROFILE_KEY, { profiles: [] });
    const next = data.profiles.filter((p) => p.id !== id);
    if (next.length !== data.profiles.length) {
      data.profiles = next;
      write(PROFILE_KEY, data);
      localStorage.removeItem(eventsKey(id));
      mirrorPush();
    }
    return data.profiles;
  },

  async _hash(password, salt) {
    const bytes = new TextEncoder().encode(`${salt}:${password}`);
    const h = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(h))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },
};