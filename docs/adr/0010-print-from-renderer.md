# ADR-0010: Print is a rendering product of the same pipeline

Status: accepted 2026-08-08

Year-one consumers are a web dashboard and printable PDFs (worksheets, lesson plans, booklets). To avoid two diverging content pipelines, both are generated **from the same content, by the same renderer**.

Markdown content is compiled once to a canonical HTML document (`packages/render`); the dashboard serves that HTML as the interactive shell, and the print app renders the same HTML through paged-media CSS (`@page`, page breaks) to a deterministic PDF in CI. No separate "print edition" of content exists.

**Consequences**

- A content edit is visibly correct in both modalities in one review.
- Print output is reproducible per release (ADR-0005 release snapshots).
- Print styling lives in the renderer, not in the content.