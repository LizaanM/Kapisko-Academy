# packages/render

Single content → HTML renderer shared by both the web app and the print pipeline (ADR-0010).

Markdown + frontmatter content is compiled once to a canonical HTML document; the dashboard serves it as an interactive shell, and the print app re-styles the same HTML via paged-media CSS to produce deterministic PDFs.

## Layout (planned)

packages/render/
    ├── md/            # markdown → HTML core
    ├── shell/         # dashboard chrome (the prototype lives in apps/web)
    └── print/         # @page / paged-media stylesheets

No "print edition" content exists; print styling is a renderer concern.