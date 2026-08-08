# `oa` branch — Cambridge O/A-Level curriculum

Grade R to 12, aligned to Cambridge IGCSE / O-Level / A-Level pathway. Default locale: `en-GB`.

This branch owns **all** of its content. Directory layout (v1):

    oa/
    ├── phonics/            # letter-sounds, sound variants, blending programmes
    │   ├── scope-and-sequence/
    │   └── units/…/and asset packs →  assets/
    ├── literacy/  maths/  scripture/  computing/ …
    └── assets/en-GB/       # audio packs (manifests, never filenames)

Consume the same schema (`content/meta/schema-version.json`), tooling (`tools/audit`) and renderers as `sat` (ADR-0002 of `docs/adr/`). See `docs/adr/0004-two-independent-curricula.md`.