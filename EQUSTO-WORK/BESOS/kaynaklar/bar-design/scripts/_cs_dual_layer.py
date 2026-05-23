# -*- coding: utf-8 -*-
import re
import shutil
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
CS_BLOCK = """
  <!-- ============ COCKTAIL STATIONS — Yeni Seri ============ -->
  <section class="bd-cs-seri" id="bd-cs-seri" aria-label="Cocktail Stations yeni seri" data-i18n-attr="aria-label:besos.cs_seri_aria">
    <div class="bd-cs-editorial">
      <div id="bd-cs-intro"></div>
      <nav class="bd-cs-jump bd-cs-jump--editorial" id="bd-cs-jump" aria-label="Kategori atlama" data-i18n-attr="aria-label:besos.cs_jump_aria"></nav>
      <motion id="bd-cs-board"></div>
      <div id="bd-cs-method"></div>
    </div>
    <div class="bd-cs-classic">
      <div id="bd-cs-intro-classic"></div>
      <div class="bd-cs-lines-wrap" id="bd-cs-lines"></div>
      <div class="bd-cs-catalog">
        <header class="bd-cs-catalog-hd">
          <p class="bd-cs-kicker" data-i18n="besos.cs_catalog_kicker">Cocktail Stations · Besos</p>
          <h2 data-i18n="besos.cs_catalog_h2">Yeni seri kataloğu</h2>
        </header>
        <nav class="bd-cs-jump bd-cs-jump--classic" id="bd-cs-jump-classic" aria-label="Katalog kategori"></nav>
        <div id="bd-cs-board-classic"></div>
      </div>
    </div>
  </section>
""".replace("<motion id", "<div id")

CS_RE = re.compile(
    r"\n  <!-- ============ COCKTAIL STATIONS — Yeni Seri ============ -->.*?</section>\n",
    re.S,
)
ANCHOR = '  </section>\n\n\n  <div class="bd-vitrum-landing"'

for rel in ("public/bar-design.html", "dist/bar-design.html", "bar-design/EQUSTO-BAR-DESIGN-PAKET/bar-design.html"):
    p = ROOT / rel
    if not p.exists():
        continue
    t = p.read_text(encoding="utf-8")
    t = CS_RE.sub("\n", t)
    if 'class="bd-cs-editorial"' not in t and ANCHOR in t:
        t = t.replace(ANCHOR, "  </section>\n" + CS_BLOCK + "\n\n  <div class=\"bd-vitrum-landing\"", 1)
    p.write_text(t, encoding="utf-8")
    print("html", p.name)
