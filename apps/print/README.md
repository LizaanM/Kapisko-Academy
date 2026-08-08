# apps/print

The print pipeline producing PDFs (worksheets, lesson plans, booklets) from the same renderer as the web app (ADR-0010).

- Renders `content/` → HTML (via `packages/render`) → PDF using paged-media CSS.
- Run in CI to emit per-release PDFs (ADR-0009, ADR-0010).
- Deterministic output: same release, same bytes.

See docs/adr/0010-print-from-renderer.md.