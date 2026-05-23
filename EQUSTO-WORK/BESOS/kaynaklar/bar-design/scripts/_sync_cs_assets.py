# -*- coding: utf-8 -*-
"""Sync Cocktail Stations assets public → dist (+ paket HTML patch)."""
import re
import shutil
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
PUB = ROOT / "public"
DIST = ROOT / "dist"
PAKET = ROOT / "bar-design" / "EQUSTO-BAR-DESIGN-PAKET"

CS_CSS_ANCHOR = "    .bd-vl-quote-card footer{font-size:13px;color:var(--bes-text-3);}"
CS_CSS_BLOCK = PUB.joinpath("bar-design.html").read_text(encoding="utf-8")
m = re.search(
    r"(    /\* —— Cocktail Stations · Yeni Seri —— \*/.*?@media\(max-width:900px\)\{\.bd-cs-lines-wrap\{grid-template-columns:1fr;\}\})",
    CS_CSS_BLOCK,
    re.S,
)
if not m:
    raise SystemExit("CS CSS block not found in public/bar-design.html")
css_insert = m.group(1)

BLOCK = """
  <!-- ============ COCKTAIL STATIONS — Yeni Seri ============ -->
  <section class="bd-cs-seri" id="bd-cs-seri" aria-label="Cocktail Stations yeni seri" data-i18n-attr="aria-label:besos.cs_seri_aria">
    <div id="bd-cs-intro"></div>
    <div class="bd-cs-lines-wrap" id="bd-cs-lines"></div>
    <div class="bd-cs-catalog">
      <header class="bd-cs-catalog-hd">
        <p class="bd-cs-kicker" data-i18n="besos.cs_catalog_kicker">Cocktail Stations · Besos</p>
        <h2 data-i18n="besos.cs_catalog_h2">Yeni seri kataloğu</h2>
      </header>
      <nav class="bd-cs-jump" id="bd-cs-jump" aria-label="Kategori atlama" data-i18n-attr="aria-label:besos.cs_jump_aria"></nav>
      <div id="bd-cs-board"></div>
    </div>
    <div id="bd-cs-method"></div>
  </section>

"""

ANCHOR = '  <div class="bd-vitrum-landing" id="bd-vitrum-landing">'


def patch_html(path: Path) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    changed = False
    if 'id="bd-cs-seri"' not in text and ANCHOR in text:
        text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
        changed = True
    if css_insert not in text and CS_CSS_ANCHOR in text:
        text = text.replace(CS_CSS_ANCHOR, CS_CSS_ANCHOR + "\n\n" + css_insert, 1)
        changed = True
    if "eq-bar-design-cocktailstations.js" not in text:
        text = text.replace(
            '<script  src="eq-bar-design-vitrum.js" defer></script>',
            '<script  src="eq-bar-design-vitrum.js" defer></script>\n'
            '  <script  src="eq-bar-design-cocktailstations.js" defer></script>',
            1,
        )
        changed = True
        text = text.replace(
            '<script src="eq-bar-design-vitrum.js" defer></script>',
            '<script src="eq-bar-design-vitrum.js" defer></script>\n'
            '  <script src="eq-bar-design-cocktailstations.js" defer></script>',
            1,
        )
    if 'href="#bd-cs-seri"' not in text:
        text = text.replace(
            'data-i18n="besos.hdr_nav_vitrin">Vitrin</a>',
            'data-i18n="besos.hdr_nav_vitrin">Vitrin</a>\n'
            '        <a href="#bd-cs-seri" data-i18n="besos.hdr_nav_yeni_seri">Yeni Seri</a>',
            1,
        )
        changed = True
    if changed:
        path.write_text(text, encoding="utf-8")
        print("html", path)


def copy_file(src: Path, dst: Path) -> None:
    if src.is_file():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print("copy", dst.relative_to(ROOT))


for html in (DIST / "bar-design.html", PAKET / "bar-design.html"):
    patch_html(html)

for name in (
    "eq-bar-design-cocktailstations.js",
    "data/cocktailstations-catalogue.json",
    "data/cocktailstations-landing.json",
):
    copy_file(PUB / name, DIST / name)

img_src = PUB / "data" / "cocktailstations-images"
if img_src.is_dir():
    dst_img = DIST / "data" / "cocktailstations-images"
    if dst_img.exists():
        shutil.rmtree(dst_img)
    shutil.copytree(img_src, dst_img)
    print("copy tree", dst_img.relative_to(ROOT))

for i18n in ("tr.json", "en.json"):
    copy_file(PUB / "i18n" / i18n, DIST / "i18n" / i18n)
