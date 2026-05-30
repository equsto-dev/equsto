#!/usr/bin/env python3
import sys

try:
    import fitz
except ImportError:
    sys.exit(0)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

path = sys.argv[1] if len(sys.argv) > 1 else ""
if not path:
    sys.exit(0)
doc = fitz.open(path)
text = "".join(doc[i].get_text() for i in range(len(doc)))
sys.stdout.write(text)
