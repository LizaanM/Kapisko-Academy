# ADR-0003: Single monorepo

Status: accepted 2026-08-08

Content and code move in lockstep: a schema change and the content that uses it must land together. We chose a **single monorepo** holding `content/`, `packages/` (schema, retention engine, renderers), `apps/` (web dashboard, print), and `tools/` (audit, lint, validation CLIs) — one issue tracker, one PR pipeline, one release process.

A separate content-only repo would split licensing, review queues and releases without paying for itself at this scale. If content ever outgrows a single repo, `content/branches/<branch>/` is already an independent subtree, so a split is a mechanical step rather than a redesign (ADR-0004).

**Consequences**

- One review gate covers both content and the tooling that consumes it.
- Content↔code version compatibility is guaranteed at commit time.
- Repo grows large over time; large binary assets are handled via manifests + Git LFS / CDN (ADR-0005), not inline commits.