"""Shared logic for the kapisko content gates (tools/audit, tools/lint, tools/validate)."""

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
META = CONTENT / "meta"
BRANCHES = CONTENT / "branches"

FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?", re.DOTALL)
KEYVALUE_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$")


def load_schema():
    schema_file = META / "schema-version.json"
    with schema_file.open(encoding="utf-8") as fh:
        return json.load(fh)


def parse_frontmatter(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None
    data = {}
    for line in m.group(1).splitlines():
        line = line.strip()
        kv = KEYVALUE_RE.match(line)
        if kv:
            value = kv.group(2).strip().strip("'\"")
            data[kv.group(1)] = value
    return data


def iter_content_files():
    if not BRANCHES.exists():
        return
    for path in sorted(BRANCHES.rglob("*.md")):
        if path.name.lower() == "readme.md":
            continue
        yield path


def branch_of(path):
    try:
        parts = path.relative_to(BRANCHES).parts
    except ValueError:
        return None
    return parts[0] if parts else None


def report(title, problems):
    if problems:
        print(f"  {title}: {len(problems)} problem(s)")
        for p in problems:
            print(f"    - {p}")
        return False
    print(f"  {title}: ok")
    return True


def run(fn):
    try:
        ok = fn()
    except Exception as exc:  # noqa: BLE001
        print(f"FATAL: {exc}")
        sys.exit(2)
    sys.exit(0 if ok else 1)
