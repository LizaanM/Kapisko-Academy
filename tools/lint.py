#!/usr/bin/env python3
"""Style gate: content files keep clean, portable formatting."""

import sys

from kapcheck import BRANCHES, iter_content_files, parse_frontmatter, report


def lint():
    problems = []
    files = list(iter_content_files())

    for path in files:
        rel = path.relative_to(BRANCHES)
        text = path.read_text(encoding="utf-8")

        if text.startswith("\ufeff"):
            problems.append(f"{rel}: has a BOM (use UTF-8 without BOM)")
        if "\r" in text:
            problems.append(f"{rel}: contains CRLF line endings")
        if text and not text.endswith("\n"):
            problems.append(f"{rel}: missing trailing newline")
        for lineno, line in enumerate(text.splitlines(), 1):
            if line.rstrip() != line:
                problems.append(f"{rel}:{lineno}: trailing whitespace")
        fm = parse_frontmatter(text)
        if fm is None:
            problems.append(f"{rel}: no `---` frontmatter block at the top")

    print(f"lint: scanning content/branches/ ... ({len(files)} file(s))")
    return report("formatting", problems)


if __name__ == "__main__":
    sys.exit(0 if lint() else 1)