# ADR-0011: Dual licensing — code MIT, content CC BY-SA 4.0

Status: accepted 2026-08-08

Kapisko Academy is free and open source, but the two planes have different legal needs. We adopted a dual license:

- **Code** (packages, apps, tools): MIT.
- **Content** (everything under `content/`, including curriculum and materials): Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), which allows broad reuse and republication while keeping derivative curricula share-alike.

The repo ships a top-level `LICENSE` (MIT) and a `CONTENT-LICENSE` notice; every asset pack (ADR-0005) records attribution per file so the ShareAlike chain stays intact.

**Consequences**

- A school can self-host (MIT) and print/redistribute its branch's material (CC BY-SA) freely.
- Derivatives of the curriculum must stay share-alike — the intended openness ceiling.
- The "Kapisko" name is not covered by these licenses; naming/marks need separate policy.