# -*- coding: utf-8 -*-
from pathlib import Path

paths = [
    Path(r"c:\D Disk\EQUSTO-CURSOR\public\bar-design.html"),
    Path(r"c:\D Disk\EQUSTO-CURSOR\dist\bar-design.html"),
    Path(r"c:\D Disk\EQUSTO-CURSOR\bar-design\EQUSTO-BAR-DESIGN-PAKET\bar-design.html"),
]

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

for p in paths:
    if not p.exists():
        print("skip", p)
        continue
    text = p.read_text(encoding="utf-8")
    if "bd-cs-seri" in text:
        print("already", p.name)
        continue
    if ANCHOR not in text:
        print("no anchor", p)
        continue
    text = text.replace(ANCHOR, BLOCK + ANCHOR, 1)
    if "eq-bar-design-cocktailstations.js" not in text:
        text = text.replace(
            '<script src="eq-bar-design-vitrum.js" defer></script>',
            '<script src="eq-bar-design-vitrum.js" defer></script>\n'
            '  <script src="eq-bar-design-cocktailstations.js" defer></script>',
            1,
        )
    if 'href="#bd-cs-seri"' not in text:
        text = text.replace(
            '<a href="#bd-hero" data-i18n="besos.hdr_nav_vitrin">Vitrin</a>',
            '<a href="#bd-hero" data-i18n="besos.hdr_nav_vitrin">Vitrin</a>\n'
            '        <a href="#bd-cs-seri" data-i18n="besos.hdr_nav_yeni_seri">Yeni Seri</a>',
            1,
        )
    p.write_text(text, encoding="utf-8")
    print("patched", p)
