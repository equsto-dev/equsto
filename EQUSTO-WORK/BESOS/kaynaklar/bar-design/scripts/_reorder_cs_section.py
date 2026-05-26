# -*- coding: utf-8 -*-
import re
import shutil
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
ANCHOR_AFTER = '  <motion id="bd-vitrum-quotes"></div>'
ANCHOR_AFTER = '  <div id="bd-vitrum-quotes"></motion>'

for rel in (
    "public/bar-design.html",
    "dist/bar-design.html",
    "bar-design/EQUSTO-BAR-DESIGN-PAKET/bar-design.html",
):
    p = ROOT / rel
    if not p.exists():
        print("skip", p)
        continue
    t = p.read_text(encoding="utf-8")
    m = re.search(
        r"\n  <!-- ============ COCKTAIL STATIONS — Yeni Seri ============ -->.*?</section>\n",
        t,
        re.S,
    )
    if not m:
        print("no cs block", p.name)
        continue
    block = m.group(0)
    t = t[: m.start()] + "\n" + t[m.end() :]
    anchor = '  <div id="bd-vitrum-quotes"></div>'
    if anchor not in t:
        print("no anchor", p.name)
        continue
    if block.strip() in t:
        print("already moved", p.name)
        continue
    t = t.replace(anchor, anchor + block, 1)
    p.write_text(t, encoding="utf-8")
    print("moved", p.name)
