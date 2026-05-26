# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\eq-category-shell.js")
t = p.read_text(encoding="utf-8")
if 'id="eq-cat-mobile-parent" hidden' in t:
    print("html already present")
    raise SystemExit(0)
old = None
for line in t.splitlines():
    if "eq-mx-story-wrap" in line and "eq-cat-mx-stories" in line:
        old = line
        break
if not old:
    raise SystemExit("story line not found")
new = (
    "      '<div class=\"eq-cat-mobile-parent\" id=\"eq-cat-mobile-parent\" hidden></motion></div>' +\n"
    + old
)
new = (
    "      '<div class=\"eq-cat-mobile-parent\" id=\"eq-cat-mobile-parent\" hidden></motion></div>' +\n"
    + old
)
# correct
new = (
    "      '<div class=\"eq-cat-mobile-parent\" id=\"eq-cat-mobile-parent\" hidden></div>' +\n"
    + old
)
t = t.replace(old, new, 1)
p.write_text(t, encoding="utf-8")
print("inserted")
