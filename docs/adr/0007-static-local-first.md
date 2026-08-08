# ADR-0007: Static-first runtime, local-first learner data, per-instance

Status: accepted 2026-08-08

Learners must use Kapisko for free at broad scale (single homes to whole schools), offline, and without a centralized database holding children's data. We chose:

- **Static-first delivery**: content renders to a static web app (PWA) and print artifacts. No server is required to read a branch.
- **Local-first learner plane**: the learner event log lives in the browser (IndexedDB) on the instance; export/import is the backup mechanism.
- **Per-instance model**: each school/home runs its own copy; there is no cross-instance learner data flow.

The learner plane shape (append-only events) is chosen so a future optional self-hosted sync server could be layered in without changing the event model (ADR-0008). A hosted multi-tenant SaaS was considered and rejected now: it concentrates cost, privacy exposure and lock-in.

**Consequences**

- Running the platform = `git pull` + static build + serve; no ops surface.
- Offline-by-default; sync problems become instance problems, never repo problems.
- Later hosting ambitions must preserve the local-first contract.