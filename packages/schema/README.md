# packages/schema — content model & validators

The shared content model all branches must satisfy (ADR-0005). Version pinned in `content/meta/schema-version.json`.

## Contract (v1)

- **Frontmatter** on every Markdown file: `id`, `type`, `branch` (required); additive extras allowed.
- **IDs** match `^(oa|sat)\.[a-z0-9]+(\.[a-z0-9]+)*$` and are globally unique (ADR-0006).
- **type** is one of: `unit | lesson | activity | card | alignment | scope | asset-pack | sound-variant | phoneme`.

Reviewers never hand-parse this; `tools/audit` enforces it locally and in CI.

## Layout (to be implemented)

    packages/schema/
    ├── model/          # frontmatter & content type definitions
    ├── validate/       # TypeScript validators (to run in node or in the renderer)
    └── index.ts        # public entry points

Branches extend only via additive, versioned additions.