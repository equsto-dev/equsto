# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
src = (ROOT / "public" / "bar-design.html").read_text(encoding="utf-8")
m_src = re.search(r"/\* —— Cocktail Stations.*?(?=\n  </style>)", src, re.S)
block = m_src.group(0)
if not block.startswith("    "):
    block = "    " + block.lstrip()

for name in ("dist/bar-design.html", "bar-design/EQUSTO-BAR-DESIGN-PAKET/bar-design.html"):
    p = ROOT / name
    dst = p.read_text(encoding="utf-8")
    d = re.search(r"/\* —— Cocktail Stations.*?(?=\n  </style>)", dst, re.S)
    if d:
        dst = dst[: d.start()] + block + dst[d.end() :]
    # nav: Vitrin, Modüller, Yeni Seri
    dst = re.sub(
        r'(<a href="#bd-hero"[^>]*>.*?</a>\s*)'
        r'<a href="#bd-cs-seri"[^>]*>.*?</a>\s*'
        r'(<a href="#bd-stations"[^>]*>)',
        r'\1\2\n        <a href="#bd-cs-seri" data-i18n="besos.hdr_nav_yeni_seri">Yeni Seri</a>',
        dst,
        count=1,
        flags=re.S,
    )
    p.write_text(dst, encoding="utf-8")
    print("ok", name)
