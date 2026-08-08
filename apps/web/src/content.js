// Compiled-release consumer (ADR-0007, ADR-0010).
// `packages/render` compiles Markdown from `content/` into `release/oa.json`.
// This module loads that single read-model plus the bundled engine (`release/engine.js`).
// Nothing here is authored by hand; it is a generated consumer of content.

let engine;

export async function loadEngine() {
  if (engine) return engine;
  // import() resolves against THIS module's URL (src/), so the release sits one
  // directory up at the app root.
  engine = await import("../release/engine.js");
  return engine;
}

export async function loadContent() {
  // fetch() resolves against the document base (apps/web/), so the release is
  // ./release/.
  const res = await fetch("./release/oa.json");
  if (!res.ok) throw new Error(`release not found (HTTP ${res.status}) — run packages/render`);
  return res.json();
}

// Shape the release into the CONTENT read-model the components already speak:
//   { unit, days, variants, profiles? }   (profiles belong to the learner plane)
export function shape(release) {
  return {
    branch: release.branch,
    locale: release.locale,
    unit: release.unit,
    days: release.days,
    variants: release.variants,
  };
}