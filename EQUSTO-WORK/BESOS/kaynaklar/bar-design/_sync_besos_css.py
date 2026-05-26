# -*- coding: utf-8 -*-
from pathlib import Path

pub = Path(r"c:\D Disk\EQUSTO-CURSOR\public\bar-design.html").read_text(encoding="utf-8")
start = pub.index("    /* Besos üst kabuk (kilit):")
end = pub.index("    html:has(body.bd-page.besos)")
block = pub[start:end]

dup = 'oninput="filterStations(this.value)" oninput="filterStations(this.value)"'
fix = 'oninput="filterStations(this.value)"'

for p in [
    Path(r"c:\D Disk\EQUSTO-CURSOR\bar-design\EQUSTO-BAR-DESIGN-PAKET\bar-design.html"),
    Path(r"c:\D Disk\EQUSTO-CURSOR\dist\bar-design.html"),
]:
    if not p.exists():
        print("skip", p)
        continue
    html = p.read_text(encoding="utf-8")
    s = html.index("    /* Besos üst kabuk (kilit):") if "    /* Besos üst kabuk (kilit):" in html else html.index("    /* Besos üst")
    e = html.index("    html:has(body.bd-page.besos)")
    html = html[:s] + block + html[e:]
    html = html.replace(dup, fix)
    p.write_text(html, encoding="utf-8")
    print("ok", p)
