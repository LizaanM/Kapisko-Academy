#!/usr/bin/env python3
"""Structural gate: every content file conforms to the schema contract, IDs are unique."""

import re
import sys

from kapcheck import (
    BRANCHES,
    branch_of,
    iter_content_files,
    load_schema,
    parse_frontmatter,
    report,
    run,
)


def audit():
    schema = load_schema()
    id_re = re.compile(schema["id_regex"])
    allowed_types = set(schema["frontmatter"]["type_enum"])
    allowed_branches = set(schema["branches"])
    required = schema["frontmatter"]["required"]

    problems = []
    seen = {}

    files = list(iter_content_files())

    print(f"audit: scanning content/branches/ ... ({len(files)} content file(s) found)")

    if not files:
        print("  (no content files yet — looking for branches/oa, branches/sat)")
        return True

    for path in files:
        branch = branch_of(path)
        rel = path.relative_to(BRANCHES)
        text = path.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        if fm is None:
            problems.append(f"{rel}: missing YAML frontmatter (`---` header)")
            continue

        for key in required:
            if key not in fm or not fm[key]:
                problems.append(f"{rel}: missing required frontmatter key `{key}`")
                continue

        item_id = fm.get("id")
        if item_id:
            if not id_re.match(item_id):
                problems.append(f"{rel}: id `{item_id}` does not match {schema['id_regex']}")
            prefix = item_id.split(".")[0]
            if branch and prefix != branch:
                problems.append(f"{rel}: id prefix `{prefix}` != directory branch `{branch}`")
            if prefix not in allowed_branches:
                problems.append(f"{rel}: unknown branch prefix `{prefix}`")
            if item_id in seen:
                problems.append(f"{rel}: duplicate id `{item_id}` (first at {seen[item_id]})")
            else:
                seen[item_id] = str(rel)

        ftype = fm.get("type")
        if ftype and ftype not in allowed_types:
            problems.append(f"{rel}: type `{ftype}` not in {sorted(allowed_types)}")

        fbranch = fm.get("branch")
        if fbranch and fbranch not in allowed_branches:
            problems.append(f"{rel}: branch `{fbranch}` not in {sorted(allowed_branches)}")

    print(f"audit: {len(files)} content file(s), {len(seen)} unique id(s), branch dirs: {sorted(p.name for p in BRANCHES.iterdir() if p.is_dir())}")
    ok = report("structural integrity", problems)
    return ok


if __name__ == "__main__":
    sys.exit(0 if audit() else 1)