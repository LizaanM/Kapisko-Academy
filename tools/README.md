# tools

The command-line gates that validate content. **The same commands run locally and in CI** (ADR-0009).

## Run

    python3 tools/audit.py      # structural integrity: frontmatter, ids, branches
    python3 tools/lint.py       # formatting: BOM, CRLF, trailing whitespace
    python3 tools/validate.py   # schema conformance: model v1 fields and enums

All three exit non-zero on any problem. `tools/audit` is the primary PR gate; the
others run in the same pipeline.

## Contracts checked

- Every Markdown file in `content/branches/<branch>/` starts with `---` frontmatter.
- Required keys: `id`, `type`, `branch`.
- `id` matches `^(oa|sat)\.[a-z0-9]+(\.[a-z0-9]+)*$`, is globally unique, and its
  prefix matches the branch directory it lives in (ADR-0006).
- `type` and `branch` values come from the shared schema in
  `content/meta/schema-version.json` (ADR-0005).

## Adding a gate

Put logic in `kapcheck.py`; each CLI is a thin wrapper. Keep the tools
dependency-free (stdlib only) so any contributor can run them anywhere.