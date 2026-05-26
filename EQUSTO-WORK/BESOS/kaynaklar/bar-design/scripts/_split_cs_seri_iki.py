# -*- coding: utf-8 -*-
from pathlib import Path

NEW = r"""  <!-- ============ COCKTAIL STATIONS — Yeni Seri (kart vitrin) ============ -->
  <section class="bd-cs-seri bd-cs-seri--bir" id="bd-cs-seri" aria-label="Cocktail Stations yeni seri" data-i18n-attr="aria-label:besos.cs_seri_aria">
    <nav class="bd-cs-branch" aria-label="Cocktail Stations serileri" data-i18n-attr="aria-label:besos.cs_branch_aria">
      <a class="bd-cs-branch-link is-active" href="#bd-cs-seri" data-i18n="besos.cs_branch_seri_bir">Yeni Seri</a>
      <span class="bd-cs-branch-sep" aria-hidden="true">/</span>
      <a class="bd-cs-branch-link" href="#bd-cs-seri-iki" data-i18n="besos.cs_branch_seri_iki">Seri İki</a>
    </nav>
    <motion id="bd-cs-intro"></motion>
    <motion class="bd-cs-lines-wrap" id="bd-cs-lines"></motion>
    <motion class="bd-cs-catalog">
      <header class="bd-cs-catalog-hd">
        <p class="bd-cs-kicker" data-i18n="besos.cs_catalog_kicker">Cocktail Stations · Besos</p>
        <h2 data-i18n="besos.cs_catalog_h2">Yeni seri kataloğu</h2>
      </header>
      <nav class="bd-cs-jump bd-cs-jump--classic" id="bd-cs-jump" aria-label="Katalog kategori" data-i18n-attr="aria-label:besos.cs_jump_classic_aria"></nav>
      <motion id="bd-cs-board"></motion>
    </motion>
    <p class="bd-cs-branch-next">
      <a href="#bd-cs-seri-iki" data-i18n="besos.cs_branch_next_iki">Seri İki — tam ekran ürün vitrini →</a>
    </p>
  </section>

  <!-- ============ COCKTAIL STATIONS — Seri İki (barras-moviles) ============ -->
  <section class="bd-cs-seri bd-cs-seri--iki" id="bd-cs-seri-iki" aria-label="Cocktail Stations seri iki" data-i18n-attr="aria-label:besos.cs_seri_iki_aria">
    <nav class="bd-cs-branch" aria-label="Cocktail Stations serileri" data-i18n-attr="aria-label:besos.cs_branch_aria">
      <a class="bd-cs-branch-link" href="#bd-cs-seri" data-i18n="besos.cs_branch_seri_bir">Yeni Seri</a>
      <span class="bd-cs-branch-sep" aria-hidden="true">/</span>
      <a class="bd-cs-branch-link is-active" href="#bd-cs-seri-iki" data-i18n="besos.cs_branch_seri_iki">Seri İki</a>
    </nav>
    <motion id="bd-cs-iki-intro"></motion>
    <nav class="bd-cs-jump bd-cs-jump--editorial" id="bd-cs-iki-jump" aria-label="Kategori atlama" data-i18n-attr="aria-label:besos.cs_jump_aria"></nav>
    <motion id="bd-cs-iki-board"></motion>
    <motion id="bd-cs-iki-method"></motion>
    <p class="bd-cs-branch-next">
      <a href="#bd-cs-seri" data-i18n="besos.cs_branch_prev_bir">← Yeni Seri kataloğu</a>
    </p>
  </section>

"""
NEW = NEW.replace("<motion ", "<div ").replace("</motion>", "</div>")

MARK_START = "  <!-- ============ COCKTAIL STATIONS"
MARK_END = "  <div class=\"bd-vitrum-landing\""

for rel in ("public/bar-design.html", "dist/bar-design.html"):
    p = Path(r"c:\D Disk\EQUSTO-CURSOR") / rel
    if not p.exists():
        print("missing", rel)
        continue
    t = p.read_text(encoding="utf-8")
    s = t.find(MARK_START)
    e = t.find(MARK_END, s)
    if s < 0 or e < 0:
        print("markers not found", rel)
        continue
    t = t[:s] + NEW + t[e:]
    p.write_text(t, encoding="utf-8")
    print("patched", rel)
