# Content meta

Where shared, cross-branch metadata lives. Per the architecture (ADR-0001..0005):

- `schema-version.json` — the content model version every branch must conform to
- (future) alignment tables, asset-pack manifests, cross-branch registries

Branch-specific content lives in `../branches/<branch>/` and is fully owned by that branch (ADR-0004). Nothing here references learner data (ADR-0002).