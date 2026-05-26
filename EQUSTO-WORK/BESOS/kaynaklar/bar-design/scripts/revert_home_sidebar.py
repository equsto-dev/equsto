# -*- coding: utf-8 -*-
from pathlib import Path

SIDEBAR_BLOCK = """    <aside class="eq-filter-col eq-home-sidebar" id="eq-filter-col" aria-label="Kategoriler" data-i18n-attr="aria-label:nav.drawer_aria_categories">
      <nav class="sidebar" id="eq-sidebar" aria-label="Kategoriler" data-i18n-attr="aria-label:nav.drawer_aria_categories"></nav>
    </aside>
"""

NEW = '<motion.div class="body" id="body">\n\n    <div class="right-col">'
NEW = '<div class="body" id="body">\n\n    <div class="right-col">'

for p in [
    Path(r"c:\D Disk\EQUSTO-CURSOR\public\index.html"),
    Path(r"c:\D Disk\EQUSTO-CURSOR\dist\index.html"),
]:
    if not p.is_file():
        continue
    t = p.read_text(encoding="utf-8")
    marker = '<div class="body" id="body">\n' + SIDEBAR_BLOCK + '\n    <div class="right-col">'
    if marker in t:
        t = t.replace(marker, NEW, 1)
    elif SIDEBAR_BLOCK in t:
        t = t.replace(SIDEBAR_BLOCK + "\n", "", 1)
    else:
        print("skip", p)
        continue
    p.write_text(t, encoding="utf-8")
    print("reverted", p)
