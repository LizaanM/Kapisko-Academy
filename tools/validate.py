#!/usr/bin/env python3
"""Schema gate: verify frontmatter matches the shared content model."""

import sys

from kapcheck import BRANCHES, iter_content_files, load_schema, parse_frontmatter, report


def validate():
    schema = load_schema()
    required = schema["frontmatter"]["required"]
    type_enum = set(schema["frontmatter"]["type_enum"])
    branches = set(schema["branches"])

    problems = []
    files = list(iter_content_files())

    for path in files:
        rel = path.relative_to(BRANCHES)
        fm = parse_frontmatter(path.read_text(encoding="utf-8"))
        if fm is None:
            problems.append(f"{rel}: missing frontmatter")
            continue
        for key in required:
            if key not in fm or not fm[key]:
                problems.append(f"{rel}: missing `{key}`")
        if fm.get("type") not in type_enum:
            problems.append(f"{rel}: type `{fm.get('type')}` not in {sorted(type_enum)}")
        if fm.get("branch") not in branches:
            problems.append(f"{rel}: branch `{fm.get('branch')}` not in {sorted(branches)}")

    print(f"validate: checking content against schema model v{schema['model']} ... ({len(files)} file(s))")
    return report("schema conformance", problems)


if __name__ == "__main__":
    sys.exit(0 if validate() else 1)