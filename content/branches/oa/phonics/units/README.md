# `oa` phonics — units

Per unit (ADR-0005: one file per unit/lesson, cards batched per unit):

    units/u12-ee/
    ├── unit.md            # type: unit — id, focus sound, variants table
    ├── variants.md        # type: sound-variant — the spellings table (base + variants)
    └── lessons/
        ├── monday.md      # type: lesson — frontmatter + prose + `steps` JSON block
        └── ...            # one lesson per day

Every lesson frontmatter carries machine metadata the renderer reads: `day`,
`spell`, `variant`, `focus`, `accent`, `mins`. The `steps` JSON block mirrors
the explicit-instruction template (warm → hear/say → new → blend/read →
write/gate).

`packages/render` compiles these into `apps/web/release/oa.json`;
`tools/audit` enforces the v1 schema over all of it.