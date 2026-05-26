# -*- coding: utf-8 -*-
import re
import shutil
from pathlib import Path

PAKET = Path(r"c:\D Disk\EQUSTO-CURSOR\bar-design\EQUSTO-BAR-DESIGN-PAKET")
PUB = Path(r"c:\D Disk\EQUSTO-CURSOR\public")
html_path = PAKET / "bar-design.html"

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

""".replace('<motion id="bd-cs-board">', '<motion id="bd-cs-board">').replace(
    '<motion id="bd-cs-board">', '<div id="bd-cs-board">'
)

ANCHOR = "  <!-- ============ TEZGAH — Bar Tezgahı Modülleri ============ -->"
css_src = (PUB / "bar-design.html").read_text(encoding="utf-8")
m = re.search(
    r"(    /\* —— Cocktail Stations · Yeni Seri —— \*/.*?@media\(max-width:900px\)\{\.bd-cs-lines-wrap\{grid-template-columns:1fr;\}\})",
    css_src,
    re.S,
)
css_block = m.group(1) if m else ""

text = html_path.read_text(encoding="utf-8")
if 'id="bd-cs-seri"' not in text and ANCHOR in text:
    text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
if css_block and css_block not in text:
    text = text.replace("  </style>", css_block + "\n  </style>", 1)
if "eq-bar-design-cocktailstations.js" not in text:
    needle = '<script src="eq-bar-module-url.js"></script>'
    if needle in text:
        text = text.replace(
            needle,
            needle + '\n  <script src="eq-bar-design-cocktailstations.js" defer></script>',
            1,
        )
html_path.write_text(text, encoding="utf-8")

for rel in (
    "eq-bar-design-cocktailstations.js",
    "data/cocktailstations-catalogue.json",
    "data/cocktailstations-landing.json",
):
    shutil.copy2(PUB / rel, PAKET / rel)

img_s = PUB / "data" / "cocktailstations-images"
img_d = PAKET / "data" / "cocktailstations-images"
if img_d.exists():
    shutil.rmtree(img_d)
shutil.copytree(img_s, img_d)
print("paket CS patch done", len(list(img_d.glob("*"))), "images")
