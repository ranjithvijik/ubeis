#!/usr/bin/env python3
"""
Extract code files from code.txt.
Sections are marked by lines like "1.1 package.json" or "2.1 src / types / index.ts".
"""

import re
import os
from pathlib import Path

CODE_TXT = Path(__file__).parent / "code.txt"
OUTPUT_DIR = Path(__file__).parent

def normalize_path(path_str: str) -> str:
    """Convert 'src / types / index.ts' to 'src/types/index.ts', 'alert - processor' to 'alert-processor'."""
    s = path_str.strip()
    s = s.replace(" / ", "/")
    s = s.replace(" - ", "-")
    return s

def main():
    content = CODE_TXT.read_text(encoding="utf-8")
    lines = content.split("\n")

    # Find all section headers: N.M optional_space path (path can have dots like .eslintrc.json)
    # Pattern: start of line, digits.digits, optional space, rest is path
    header_re = re.compile(r"^(\d+\.\d+)\s*(.+)$")
    sections = []  # (line_index_0based, path_str)

    for i, line in enumerate(lines):
        m = header_re.match(line)
        if m:
            path_str = m.group(2).strip()
            # Skip section titles (no path): e.g. "4. UTILITIES" - real paths have / or .
            if path_str and ("/" in path_str or "." in path_str or path_str.startswith(".")):
                sections.append((i, path_str))

    # Build (path, start_line, end_line) for each section; end_line is exclusive
    entries = []
    for idx, (line_num, path_str) in enumerate(sections):
        path = normalize_path(path_str)
        start = line_num + 1  # content starts after header
        if idx + 1 < len(sections):
            end = sections[idx + 1][0]
        else:
            # Last section: end at APPENDIX or END OF DOCUMENT or end of file
            end = len(lines)
            for j in range(start, len(lines)):
                if lines[j].startswith("APPENDIX:") or lines[j].startswith("END OF DOCUMENT"):
                    end = j
                    break
        entries.append((path, start, end))

    created = 0
    for path, start, end in entries:
        file_path = OUTPUT_DIR / path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        block = lines[start:end]
        # Trim trailing blank lines from the block
        while block and not block[-1].strip():
            block.pop()
        text = "\n".join(block) + ("\n" if block else "")
        file_path.write_text(text, encoding="utf-8")
        created += 1
        print(file_path.relative_to(OUTPUT_DIR))

    print(f"\nExtracted {created} files.")

if __name__ == "__main__":
    main()
