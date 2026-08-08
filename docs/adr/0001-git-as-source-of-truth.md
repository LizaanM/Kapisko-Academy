# ADR-0001: Git is the source of truth for all content

Status: accepted 2026-08-08

The curriculum must scale to thousands of learning items across two independent branches, survive contribution by many authors for years, and never lose its history. We decided the **content corpus lives in Git as versioned text files** — not in a CMS or database.

Content is reviewed through the same pull-request model as code, is forkable, diffable, and reproducible by any installation. Databases are reserved for **runtime user data only** (per-instance learner state), never as the primary store for curriculum material.

**Consequences**

- A `content/` directory is the artifact; everything else derives from it.
- Hosting/distribution cost is effectively zero (static export).
- Any school can pin a specific version/release of a branch.