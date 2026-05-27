# -*- coding: utf-8 -*-
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / "public"

HDR_CHROME = """
<header class="hdr">
  <a class="logo" href="/" aria-label="Equsto"></a>
  <div class="pg-inner hdr-pg-inner" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:10px 20px 10px 0;">
    <div class="hdr-alici">
      <div class="st-label">Teslimat Adresi</div>
      <div class="st-val">İstanbul, Türkiye</div>
    </div>
    <div class="srch">
      <div class="srch-cat" onclick="toggleCatPicker()">☰ Tüm Kategoriler</div>
      <input class="srch-input" type="search" placeholder="Ürün, marka veya kategori ara..." autocomplete="off" spellcheck="false">
      <button type="button" class="srch-btn" aria-label="Ara" title="Ara"><svg xmlns="http://www.w3.org/2000/svg" class="eq-srch-ico" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" stroke-width="1.35"/><line x1="12.35" y1="12.35" x2="17.85" y2="12.35" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg></button>
    </div>
    <div class="hdr-right">
      <div class="theme-wrap">
        <button type="button" class="theme-toggle" id="theme-toggle" onclick="equstoCycleTheme()" title="Tema" aria-label="Tema">◝</button>
        <span class="theme-legend">Sistem · Açık · Koyu</span>
      </div>
      <a href="/login.html" class="eq-hdr-account" title="Üye girişi">
        <span style="font-size:10px;color:var(--eq-text-muted);">Hesabım</span>
        <span class="eq-hdr-account-title" style="font-size:12px;font-weight:600;color:var(--eq-text);">Projeler ve Listeler ▾</span>
      </a>
      <div style="display:flex;flex-direction:column;line-height:1.4;">
        <span style="font-size:10px;color:var(--eq-text-muted);">İadeler</span>
        <span style="font-size:12px;font-weight:600;cursor:pointer;color:var(--eq-text);">ve Siparişler</span>
      </div>
      <div id="equsto-hdr-cart" class="equsto-hdr-cart" style="display:flex;flex-direction:column;line-height:1.4;cursor:pointer;" title="Sepeti aç" role="button" tabindex="0">
        <span id="equsto-cart-count" style="font-size:10px;color:var(--eq-text-muted);">🛒 0</span>
        <span style="font-size:12px;font-weight:600;color:var(--eq-text);">Alışveriş Sepeti</span>
      </div>
    </div>
  </div>
</header>
"""

TOPNAV = """
<nav class="topnav" aria-label="Departmanlar">
  <div class="pg-inner topnav-inner">
    <div class="topnav-item topnav-all" onclick="toggleCatPicker()">☰ Tüm kategoriler</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item topnav-pfos" onclick="eqGo('pfos')"><span class="topnav-pfos__in" aria-hidden="true"><span class="topnav-pfos__face topnav-pfos__face--plain">Proje Fabrikası</span><span class="topnav-pfos__face topnav-pfos__face--dark">Proje Fabrikası</span></span></div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item" onclick="eqDeptGo('pisirme')">Pişirme Ekipmanları</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item" onclick="eqDeptGo('sogutma')">Soğutma Ekipmanları</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item" onclick="eqDeptGo('kahve')">Kahve Ekipmanları</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item" onclick="eqDeptGo('yikama')">Yıkama Ekipmanları</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item" onclick="eqDeptGo('hazirlik')">Hazırlık Ekipmanları</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item" onclick="eqDeptGo('icecek')">İçecek Ekipmanları</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item topnav-besos active" onclick="eqGo('besos')" aria-current="page"><span class="topnav-besos__in" aria-hidden="true"><span class="topnav-besos__face topnav-besos__face--plain">Bar Design</span><span class="topnav-besos__face topnav-besos__face--dark">Dark Side</span></span></div>
  </div>
</nav>
"""


def inject_assets(html: str) -> str:
    if "besos-shell.css" not in html:
        html = html.replace(
            '<link rel="stylesheet" href="/theme.css',
            '<link rel="stylesheet" href="/besos-shell.css?v=20260527homehdr">\n<link rel="stylesheet" href="/theme.css',
            1,
        )
    return html


def replace_header(html: str, imt300_active: bool) -> str:
    header = HDR_CHROME + "\n" + TOPNAV
    body_class = (
        "bd-page eq-shop besos besos-sub eq-imt-page"
        if imt300_active
        else "bd-page eq-shop besos besos-sub bm-page"
    )
    html = re.sub(r'<body class="[^"]*">', f'<body class="{body_class}">', html, count=1)
    html = re.sub(
        r"<header class=\"hdr\"[^>]*>.*?</nav>\s*",
        header + "\n",
        html,
        count=1,
        flags=re.S,
    )
    return html


def patch_imt300():
    path = ROOT / "imt300.html"
    html = path.read_text(encoding="utf-8")
    html = inject_assets(html)
    html = replace_header(html, True)
    path.write_text(html, encoding="utf-8")
    print("patched", path)


def patch_bar_module():
    path = ROOT / "bar-module.html"
    html = path.read_text(encoding="utf-8")
    html = inject_assets(html)
    html = replace_header(html, False)
    if "eq-footer.js" not in html:
        html = html.replace(
            "</body>",
            '<div class="drawer-overlay" id="drawerOverlay" onclick="__eqDrawerBackdropClick(event)"></div>\n'
            '<div class="cat-drawer eq-amazon-shop-all" id="catDrawer" aria-hidden="true"></div>\n'
            '<script src="/eq-footer.js?v=20260527homehdr"></script>\n'
            '<script>document.addEventListener("DOMContentLoaded",function(){window.__eqMountMarketFooter&&window.__eqMountMarketFooter();});</script>\n'
            "</body>",
        )
    path.write_text(html, encoding="utf-8")
    print("patched", path)


if __name__ == "__main__":
    patch_imt300()
    patch_bar_module()
