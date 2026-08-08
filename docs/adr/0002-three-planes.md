# ADR-0002: Three planes stay separate

Status: accepted 2026-08-08

Learner data is private, personal, and legally sensitive — it must never be able to leak out with the curriculum. We defined three planes with hard boundaries:

1. **Curriculum plane** — the plan: scope & sequence, standards alignment, mastery gates.
2. **Content plane** — the material: units, lessons, assets, cards.
3. **Learner plane** — per-child learning events, mastery state, retention schedule.

The **Learner plane is never committed** to this repository (see `.gitignore`), never duplicated into the Content plane, and never cross-referenced by id in lesson content. The curriculum/content planes are open source by design; the learner plane is per-installation and exportable. This is also why learner data is expressed as anonymous **Learning Events**, not profiles.

**Consequences**

- Contributions to content can never touch learner data.
- A school's learner data survives even if the public repo is rewritten.
- Privacy compliance (e.g. GDPR) stays a per-instance concern, not a repo concern.