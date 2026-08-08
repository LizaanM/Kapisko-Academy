# Kapisko Academy

Open-source Christian education, Grade R to 12, from two fully independent curricula — the `oa` branch (Cambridge O/A-Level path) and the `sat` branch (US AP/SAT path). Built on the ethos in `README.MD`: synthetic phonics, explicit instruction with mastery-based progression (the 90% rule), and evidence-based retention (spaced repetition, active retrieval, interleaving).

The repository is **content-first**: curriculum and materials live in `content/` as versioned text files, and every program (web app, print, Anki bridge) is a generated consumer of that content. Learner data never lives here.

## Language

### Branches & curriculum

**Branch**:
One of the two parallel, self-contained curricula aligned to an external exam pathway (`oa` or `sat`). A branch owns all of its own content; nothing is shared between branches by default. The duplication cost is accepted deliberately (ADR-0004).
_Avoid_: track, pathway, stream, side

**Curriculum plane**:
The pure plan — scope & sequence, learning objectives, alignment tables and mastery gates. Contains no authored teaching material.
_Avoid_: syllabus, lesson plan

**Content plane**:
The versioned teaching material — units, lessons, activities, assessment items, cards, audio assets. Lives in `content/branches/<branch>/`.
_Avoid_: "the materials", "the resources"

**Learner plane**:
All private per-child data — learning events, the mastery state of the moment, and the retention schedule. Grows purely from events; never enters this repository (ADR-0002).
_Avoid_: progress (when you mean mastery state), result

**Grade**:
An academic year band, Grade R (Reception) through Grade 12. Every branch organizes itself by Grade.

**Phase**:
A curriculum-design block spanning several grades (e.g. phonics Phase 1, Phase 2). Contrast with **Grade**, which is a calendar organizational unit.
_Avoid_: level, band

**Scope & Sequence**:
The chronological progression of a branch through grades, semesters and units, including the day/week layout of the pathway. The "weekly lesson pathway" on the dashboard renders this.
_Avoid_: curriculum map, syllabus

**Unit**:
The group of lessons covering one family (e.g. the "ee" sound) within a scope & sequence. The default versioning granularity of a branch.
_Avoid_: topic, theme, chapter

**Discipline / strand**:
A subject cluster (phonics, literacy, maths, scripture, computing…). Naming is consistent within a branch.

### Content objects

**Learning Item**:
Any addressable node in the Scope & Sequence that a mastery gate, alignment or card can point at (grade → discipline → unit → session). Items carry stable **IDs** (ADR-0006).
_Avoid_: learning object, resource

**Lesson**:
One learning session in the explicit-instruction template: warm-up → hear/say → model → guided → independent practice → mastery gate.
_Avoid_: session, teaching block, PowerPoint

**Activity**:
A single cognitive task inside a lesson (echo a word, word sort, dictation). Independent practice is built from activities.
_Avoid_: exercise, worksheet (as UI object), task

**Assessment**:
Anything that yields a **Learning Event** (a gate question, a card review, a quick check).
_Avoid_: test, quiz (as a generic label)

**Card**:
A spaced-repetition object that references an item, aggregated per unit into a card box. Cards are derived, not authored alongside lessons.
_Avoid_: flashcard (in code/front-end naming)

**Phoneme**:
The smallest unit of sound (e.g. /ee/) — the atom of synthetic phonics.
_Avoid_: letter-sound, sound (when you mean phoneme)

**Grapheme**:
The written shape standing for a phoneme (one or more letters).

**Sound Variant**:
One of multiple consistent spellings of a single phoneme (e.g. /ee/ = ee, ea, e_e, ey). In the UI, variants render as mustard tiles.
_Avoid_: "alternate spelling" when you mean sound variant

### Assessment & memory

**Mastery Gate**:
The rule attached to a Learning Item that must be met before progress, e.g. ≥90% correct on independent assessment plus spaced retrieval review (the "90% rule"). Configurable per lesson.
_Avoid_: test, exam

**Retention Engine / Scheduler**:
The pure, deterministic package (`packages/engine`) that derives the next schedule for an item from learning events. Not an app-layer concept (ADR-0008).

**Learning Event**:
An append-only, immutable tuple `(item-id, outcome, timestamp)` produced whenever a card or assessment is answered. Pure input to the scheduler; the event log is what underpins all learner history (ADR-0002, ADR-0008).
_Avoid_: attempt, answer, progress entry

### Media & locales

**Asset Pack**:
A published set of media (letter-sound audio, illustrations) for a locale and branch, shipped with a manifest mapping stable id → file. Filenames are never part of the contract (ADR-0005). Existing raw files under `letter_sounds_uk/` become `oa` en-GB pack assets.

**Locale**:
The language/script overlay of a branch's surface content: `oa` defaults to `en-GB`, `sat` to `en-US`. Bases are written in the branch default; locales are overlays, not copies.

**Release**:
A versioned snapshot (semver) of a branch's content that the apps consume. Content is packaged and versioned per branch.

**Deployment instance**:
A self-hosted running install of the platform (a home, a school). Instances own their **Learner plane**; no centralized storage of learner data (ADR-0007).

## Relationships

- A **Branch** spans **Grades**; each **Grade** is a **Scope & Sequence** of **Units**.
- A **Unit** contains **Lessons**; each **Lesson** is a family of **Activities** ending in a **Mastery Gate**.
- An **Alignment** is a mapping record from a **Learning Item** to an external standard code (Cambridge/AP/SAT). Alignments live in the **Curriculum plane** and reference items by id — they never repeat teaching content.
- A **Sound Variant** publishes a **Grapheme** for one **Phoneme**; a phoneme may have many variants.
- A **Card** and a gate-question are both **Assessments**: answering produces a **Learning Event** referencing a **Learning Item** by id only.
- The **Retention Engine** reads **Learning Events** and derives the **Mastery Gate** state and next schedule. It never writes the log.

## Example dialogue

> **Dev:** "The Sunday phonics programme — is it one side of the tracker or a whole 'curriculum'?"
> **Curriculum expert:** "Neither — a school timetable isn't a content unit. The `oa` and `sat` branches list a separate **Scope & Sequence**. What we share is the pipe: the same schema `packages/schema`, the same `tools/audit` gate, the same renderer to web and print. Content is per-branch; tooling is global."

> **Dev:** "When a child returns after a month, how do we know what the next step is?"
> **Curriculum expert:** "The **Learner plane** rebuilds from its **Learning Events**. The **Retention Engine** reads the log, applies the gate rule, and the lesson's **Mastery Gate** is recomputed — never stored."
> **Dev:** "So nothing degrades when we patch the engine?"
> **Curriculum expert:** "Right. The only state is the event log. That's ADR-0008."

## Flagged ambiguities

- **"progress"** meant both "raw results" and "derived position in the sequence". Resolved: results are **Learning Events**; derived position is the **Mastery Gate** composite.
- **"syllabus"** covered both the external Cambridge/AP document (now an **Alignment** table) and our internal plan (a **Scope & Sequence**). Kept separate.
- **"course / programme"** was used for the whole content plan. Resolved: a **Branch** is the curriculum object; "Kapisko" is the name of the whole teaching system.
- **"alternate spelling"** (content) vs **Sound Variant** (pedagogy): alternate spellings are ad-hoc; a **Sound Variant** is an explicit rule the phonics instruction teaches and the UI marks.
- **Phoneme vs letter-sound**: phoneme is the object of instruction (/ee/); letter-sound is the speech-tool term for the pairing, used in the UI tiles.

## Architectural invariants

1. **Three planes stay separate** (Curriculum / Content / Learner). Learner data never enters `content/` or the repo (`.gitignore`, ADR-0002).
2. **IDs are stable and forever**: branch-prefixed, human-readable, reused — never renumbered (ADR-0006).
3. **Learner data is events, not state**: all mastery and scheduling state derives from the event log (ADR-0008).
4. External standards appear only as **Alignment** tables per branch, never merged into lesson content.