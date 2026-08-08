#!/usr/bin/env python3
"""Compile Markdown content to release artefacts.

Single renderer for every modality (ADR-0010): reads Markdown + frontmatter
from `content/branches/<branch>/`, emits

  - `<web>/release/<id>.json`   — the canonical read-model the dashboard fetches
  - `<print>/release/<id>.html` — a standalone printable lesson-plan document

Pure stdlib; deterministic output (same input -> same bytes).
"""

import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CONTENT = ROOT / "content" / "branches"
WEB_RELEASE = ROOT / "apps" / "web" / "release"
PRINT_RELEASE = ROOT / "apps" / "print" / "release"

FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?", re.DOTALL)
KV_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$")
JSON_BLOCK_RE = re.compile(r"```json\s*\n(.*?)```", re.DOTALL)
TITLE_RE = re.compile(r"^#\s+(.*)$")

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def parse_frontmatter(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    data = {}
    for line in m.group(1).splitlines():
        kv = KV_RE.match(line)
        if kv:
            data[kv.group(1)] = kv.group(2).strip().strip("'\"")
    return data


def json_blocks(text):
    return [json.loads(b) for b in JSON_BLOCK_RE.findall(text)]


def collect_units(branch="oa"):
    root = CONTENT / branch / "phonics" / "units"
    if not root.exists():
        return []
    return sorted(p for p in root.glob("*/unit.md") if p.is_file())


def lesson_files(unit_dir):
    lessons = list((unit_dir / "lessons").glob("*.md")) if (unit_dir / "lessons").is_dir() else []
    variants = unit_dir / "variants.md"
    files = sorted(lessons)
    extra = []
    if variants.is_file():
        extra.append(variants)
    return files, extra


def build_unit(unit_path):
    fm = parse_frontmatter(unit_path.read_text(encoding="utf-8"))
    unit = {
        "id": fm.get("id"),
        "title": fm.get("title"),
        "branch": fm.get("branch"),
        "locale": fm.get("locale", "en-GB"),
        "focus": fm.get("focus_sound", "/ee/"),
        "grade": fm.get("grade"),
        "minutes_per_session": int(fm.get("minutes_per_session", 25)),
        "mastery_gate": "independent accuracy >= 90% + spaced retrieval review",
    }
    return unit


def build_days(unit_dir):
    # Lessons keyed by weekday; unknown days follow file order.
    by_day = {d: [] for d in DAYS}
    ordered = []
    for path in sorted((unit_dir / "lessons").glob("*.md")):
        text = path.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        steps = []
        for block in json_blocks(text):
            for i, s in enumerate(block.get("steps", []), 1):
                steps.append({**s, "id": f"{fm.get('id')}.s{i}"})
        day = {
            "id": fm.get("id"),
            "name": fm.get("day", path.stem.title()),
            "spell": fm.get("spell", ""),
            "variant": fm.get("variant", "false").lower() == "true",
            "focus": fm.get("focus", ""),
            "accent": fm.get("accent", "peach"),
            "mins": int(fm.get("mins", 20)),
            "steps": steps,
            "unit": fm.get("unit"),
        }
        if day["name"] in by_day:
            by_day[day["name"]] = day
        else:
            ordered.append(day)
    return [by_day[d] for d in DAYS if by_day.get(d)] + ordered


def build_variants(unit_dir):
    path = unit_dir / "variants.md"
    if not path.is_file():
        return []
    fm = parse_frontmatter(path.read_text(encoding="utf-8"))
    unit_id = fm.get("unit") or "unit"
    rows = []
    for line in [ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip().startswith("|")]:
        cells = [c.strip().strip("`") for c in line.split("|")]
        if len(cells) >= 6 and cells[0] == "":
            _, grapheme, kind, word, card, _ = cells[:6]
            if grapheme in ("Grapheme", "----------") or not grapheme:
                continue
            rows.append({
                "id": f"{unit_id}.sv.{grapheme}",
                "phoneme": fm.get("phoneme", "/ee/"),
                "grapheme": grapheme,
                "kind": kind if kind in ("base", "variant", "split digraph") else kind.split(" ")[0],
                "word": word,
                "example": card or word,
            })
    return rows


def render_week(branch="oa"):
    units = collect_units(branch)
    out = []
    for unit_path in units:
        fm = parse_frontmatter(unit_path.read_text(encoding="utf-8"))
        unit_dir = unit_path.parent
        week = {
            "model": 1,
            "branch": branch,
            "locale": fm.get("locale", "en-GB"),
            "unit": build_unit(unit_path),
            "days": build_days(unit_dir),
            "variants": build_variants(unit_dir),
        }
        out.append(week)
    return out


ENGINE_SRC = ROOT / "packages" / "engine" / "engine.js"


def emit(week, branch):
    WEB_RELEASE.mkdir(parents=True, exist_ok=True)
    PRINT_RELEASE.mkdir(parents=True, exist_ok=True)
    slug = week["unit"]["id"].replace(".", "-")
    json_path = WEB_RELEASE / f"{branch}.json"
    html_path = PRINT_RELEASE / f"{slug}.html"
    engine_path = WEB_RELEASE / "engine.js"
    json_path.write_text(json.dumps(week, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    html_path.write_text(render_html(week), encoding="utf-8")
    if ENGINE_SRC.is_file():
        engine_path.write_text(ENGINE_SRC.read_text(encoding="utf-8"), encoding="utf-8")
    return json_path, html_path, engine_path


def render_html(week):
    rows = []
    for day in week["days"]:
        steps = "\n".join(f"<li>{s['t']} — {s.get('n', '')}</li>" for s in day["steps"])
        rows.append(
            "<div class='day'><h2>" + day["name"] + "</h2>"
            "<p><code>" + day.get("spell", "") + "</code> · " + day.get("focus", "") + "</p>"
            "<ol>" + steps + "</ol></div>"
        )
    variants = ", ".join("<code>" + v["grapheme"] + "</code>" for v in week["variants"])
    grade = week["unit"].get("grade") or ""
    gate = week["unit"].get("mastery_gate") or ""
    return (
        "<!doctype html><html lang='en'><head><meta charset='utf-8'>"
        "<title>" + week["unit"]["title"] + "</title>"
        "<style>body{font-family:system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem}"
        ".day{border:1px solid #ddd;border-radius:1rem;padding:1rem 1.5rem;margin:1rem 0}"
        "code{background:#f5efe6}.stamp{margin-bottom:1rem}</style></head><body>"
        "<h1>" + week["unit"]["title"] + "</h1>"
        "<p>" + week["unit"]["focus"] + " · " + grade + " · " + variants + "</p>"
        "<p class='stamp'><strong>Mastery gate:</strong> " + gate + "</p>"
        + "".join(rows) + "</body></html>"
    )


def main(argv):
    branch = argv[1] if len(argv) > 1 else "oa"
    weeks = render_week(branch)
    if not weeks:
        print(f"no units found for branch {branch}")
        return 1
    for week in weeks:
        json_path, html_path, engine_path = emit(week, branch)
        print(f"rendered {json_path} / {html_path} / {engine_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))