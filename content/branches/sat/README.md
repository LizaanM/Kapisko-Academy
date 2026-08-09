# `sat` branch — US AP/SAT curriculum

Reception (Grade R) to year 13, aligned to the US AP / SAT pathway. Default locale: `en-US`.

This branch owns **all** of its content. Skeleton in place; content will mirror the shape of `oa` but is fully independent (ADR-0004):

    sat/
    ├── phonics/
    │   ├── scope-and-sequence/
    │   └── units/
    ├── literacy/  maths/  scripture/  computing/ …
    └── assets/en-US/       # audio packs (manifests, never filenames)

Uses the same schema, tools and renderers as `oa`. See `docs/adr/0004-two-independent-curricula.md`.
