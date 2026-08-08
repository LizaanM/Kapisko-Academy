# ADR-0009: CI dogfoods the same tools contributors run locally

Status: accepted 2026-08-08

For an open curriculum the review bar must be identical whether a contribution comes from a one-school pull request or a large change. We therefore made **one set of checks** — `tools/audit`, `tools/lint`, `tools/validate` — the gate both locally and in CI.

CI runs the same binaries contributors run pre-push, scoped **per branch** so a heavy `sat` content change never blocks an `oa` release lane. The audit gate enforces id registry integrity (ADR-0006), content schema conformance (ADR-0005), and semantic checks (no duplicates, no orphan refs).

**Consequences**

- A contributor's local failure-free run is a strong signal the PR will pass.
- CI cost scales with content size only, because each branch is audited independently.
- The tools are simple, dependency-light CLI programs (Python) that teachers can run anywhere.