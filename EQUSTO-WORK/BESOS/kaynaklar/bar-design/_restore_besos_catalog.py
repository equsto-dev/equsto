# -*- coding: utf-8 -*-
"""Kokteyl tezgahı + ürün ızgarası: EQUSTO-BAR-DESIGN-PAKET → public/dist."""
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
SRC = ROOT / "bar-design" / "EQUSTO-BAR-DESIGN-PAKET" / "bar-design.html"
PUB = ROOT / "public" / "bar-design.html"
DIST = ROOT / "dist" / "bar-design.html"

html = SRC.read_text(encoding="utf-8")
html = html.replace(
    '<script src="/eq-besos-head-seo.js"></script>\n<script src="/eq-besos-head-seo.js"></script>',
    '<script src="/eq-besos-head-seo.js"></script>',
    1,
)

if "file:// ile acilinca" not in html:
    guard = PUB.read_text(encoding="utf-8")
    i = guard.find("<script>\n/** file://")
    j = guard.find("</script>\n", i) + len("</script>\n")
    file_guard = guard[i:j]
    html = html.replace("<head>\n", "<head>\n" + file_guard, 1)

PUB.write_text(html, encoding="utf-8")
DIST.write_text(html, encoding="utf-8")
print("ok public + dist", len(html))
for needle in ("bd-tezgah", "bd-col-grid", "bd-hdr-brand", "Bar İstasyonları"):
    print(" ", needle, ":", needle in html)
