# -*- coding: utf-8 -*-
import re
import shutil
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
PUB = ROOT / "public"
CS_BLOCK_RE = re.compile(
    r"\n  <!-- ============ COCKTAIL STATIONS — Yeni Seri ============ -->.*?</section>\n",
    re.S,
)


def move_cs_after_catalog(t: str, anchor: str) -> str:
    m = CS_BLOCK_RE.search(t)
    if not m:
        return t
    block = m.group(0)
    if anchor not in t:
        return t
    t = t[: m.start()] + "\n" + t[m.end() :]
    if block.strip() in t:
        return t
    return t.replace(anchor, anchor + block, 1)


def sync_css(dst_html: Path, src_html: Path) -> None:
    src = src_html.read_text(encoding="utf-8")
    dst = dst_html.read_text(encoding="utf-8")
    m = re.search(r"    /\* —— Cocktail Stations.*?(?=\n  </style>)", src, re.S)
    if not m:
        return
    block = m.group(0)
    d = re.search(r"    /\* —— Cocktail Stations.*?(?=\n  </style>)", dst, re.S)
    if d:
        dst = dst[: d.start()] + block + dst[d.end() :]
    else:
        dst = dst.replace("  </style>", block + "\n  </style>", 1)
    dst_html.write_text(dst, encoding="utf-8")


# Paket: CS after catalog section
paket = ROOT / "bar-design" / "EQUSTO-BAR-DESIGN-PAKET" / "bar-design.html"
if paket.exists():
    t = paket.read_text(encoding="utf-8")
    t = move_cs_after_catalog(t, "  </section>\n\n    </main>")
    t = t.replace(
        '<a href="#bd-cs-seri" data-i18n="besos.hdr_nav_yeni_seri">Yeni Seri</a>\n        <a href="#bd-stations"',
        '<a href="#bd-stations" data-i18n="besos.hdr_nav_modules">Modüller</a>\n        <a href="#bd-cs-seri"',
        1,
    )
    if 'href="#bd-stations" data-i18n="besos.hdr_nav_modules">Modüller</a>' not in t:
        t = t.replace(
            '        <a href="#bd-stations" data-i18n="besos.hdr_nav_modules">Modüller</a>',
            '        <a href="#bd-stations" data-i18n="besos.hdr_nav_modules">Modüller</a>\n        <a href="#bd-cs-seri" data-i18n="besos.hdr_nav_yeni_seri">Yeni Seri</a>',
            1,
        )
        t = re.sub(
            r'\n        <a href="#bd-cs-seri" data-i18n="besos.hdr_nav_yeni_seri">Yeni Seri</a>\n        <a href="#bd-cs-seri"',
            '\n        <a href="#bd-cs-seri"',
            t,
            count=1,
        )
    sync_css(paket, PUB / "bar-design.html")
    paket.write_text(t, encoding="utf-8")
    print("paket ok")

dist = ROOT / "dist" / "bar-design.html"
if dist.exists():
    sync_css(dist, PUB / "bar-design.html")
    print("dist css ok")

for rel in (
    "eq-bar-design-cocktailstations.js",
    "data/cocktailstations-catalogue.json",
):
    shutil.copy2(PUB / rel, ROOT / "dist" / rel)
    shutil.copy2(PUB / rel, ROOT / "bar-design" / "EQUSTO-BAR-DESIGN-PAKET" / rel)
print("assets copied")
