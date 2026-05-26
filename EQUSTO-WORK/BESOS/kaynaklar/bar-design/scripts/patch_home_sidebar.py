# -*- coding: utf-8 -*-
"""Ana sayfa: sol #eq-sidebar + Mutbex vitrin korunur."""
from pathlib import Path

SIDEBAR = """    <aside class="eq-filter-col eq-home-sidebar" id="eq-filter-col" aria-label="Kategoriler" data-i18n-attr="aria-label:nav.drawer_aria_categories">
      <nav class="sidebar" id="eq-sidebar" aria-label="Kategoriler" data-i18n-attr="aria-label:nav.drawer_aria_categories"></nav>
    </aside>
"""

OLD = '<motion.div class="body" id="body">\n\n    <div class="right-col">'
OLD2 = '<motion class="body" id="body">\n\n    <div class="right-col">'
OLD3 = '<div class="body" id="body">\n\n    <div class="right-col">'
NEW = '<div class="body" id="body">\n' + SIDEBAR + '\n    <div class="right-col">'

paths = [
    Path(r"c:\D Disk\EQUSTO-CURSOR\public\index.html"),
    Path(r"c:\D Disk\EQUSTO-CURSOR\dist\index.html"),
]

for p in paths:
    if not p.is_file():
        print("skip", p)
        continue
    t = p.read_text(encoding="utf-8")
    if 'id="eq-sidebar"' in t and "eq-home-sidebar" in t:
        print("already patched", p)
        continue
    if OLD3 in t:
        t = t.replace(OLD3, NEW, 1)
    elif OLD2 in t:
        t = t.replace(OLD2, NEW, 1)
    elif OLD in t:
        t = t.replace(OLD, NEW, 1)
    else:
        raise SystemExit(f"body marker not found in {p}")
    p.write_text(t, encoding="utf-8")
    print("patched", p)
