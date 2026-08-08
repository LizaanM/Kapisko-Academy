# ADR-0005: Content formats and granularity

Status: accepted 2026-08-08

Contributors are teachers, not developers. We chose a **layered format**:

- **Markdown + YAML front-matter** for human-authored lessons, units and scope & sequence (prose must stay diffable by humans).
- **Strict YAML/JSON schema** for machine-consumed data: alignment tables, card containers, asset manifests.
- Granularity of **one file per unit/lesson**, cards batched per unit into a container. Coarse enough for review, fine enough for independent PRs.

All files carry a machine-validated front-matter header (id, type, status) enforced by `tools/audit`. Assets (e.g. `letter_sounds_uk/*`) are referenced **through manifests keyed by stable id**, never by filename — filenames are not part of the contract.

**Consequences**

- A single shared **content model** (`packages/schema`) version 1 is the contract both branches must satisfy.
- Schema extensions are additive; breaking changes bump the model version and ship a migration tool.
- Large binary assets stay out of review diffs (manifest references + Git LFS/CDN).