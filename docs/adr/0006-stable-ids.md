# ADR-0006: Stable, branch-prefixed IDs for every learning item

Status: accepted 2026-08-08

Cards, alignment tables, mastery gates and learner events all need to point at content that may be edited, re-titled or republished over decades. IDs are the only stable glue.

Every **Learning Item** carries a human-readable, branch-prefixed ID in the form `{branch}.{discipline}.{grade}.{unit}.{step}`, e.g. `oa.ph.g0r.u12.t13`. IDs are:

- **globally unique** across the monorepo (`oa` vs `sat` prefixes never collide);
- **stable forever** — never renumbered; a retired item keeps its id and is deprecated, not deleted;
- referenced in the Learner plane and by Alignments **by id only**, never by title or content.

A registry of issued IDs is maintained by `tools/audit`, which rejects duplicates and renumbers in CI (ADR-0009).

**Consequences**

- Learner history survives reorganization because events point at ids, not paths.
- Contributors must not invent ids; they allocate from the branch's sequence.
- Cost: renaming something is a "deprecate + new id" operation, never a delete.