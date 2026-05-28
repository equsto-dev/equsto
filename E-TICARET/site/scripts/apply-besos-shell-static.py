# -*- coding: utf-8 -*-
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / "public"

BESOS_LINKS = """
    <div class="bd-hdr-brand">
      <a class="bd-hdr-wordmark" href="/besos" aria-label="Besos vitrin"></a>
      <div class="bd-hdr-studio">Bar Design Studio</div>
      <nav class="bd-hdr-nav" aria-label="Besos">
        <a href="/besos">Vitrin</a>
        <a href="/besos#bd-stations">Modüller</a>
        <a href="/besos#bd-vitrum-projects">Projeler</a>
        {imt300_link}
        <a href="/besos#bd-foot">Teklif iste</a>
        <a href="/" class="bd-hdr-equsto">↗ Equsto</a>
      </nav>
    </div>
"""

HDR_SEARCH = """
    <a class="logo" href="/" aria-label="Equsto"></a>
    <div class="pg-inner hdr-pg-inner" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:10px 20px 10px 0;">
      <div class="hdr-alici">
        <div style="font-size:9px;color:var(--eq-text-subtle);">Teslimat Adresi</div>
        <div style="font-size:11px;font-weight:600;">İstanbul, Türkiye</div>
      </div>
      <div class="srch">
        <input class="srch-input" type="search" placeholder="Bar modülü, ürün veya kategori ara..." autocomplete="off">
        <button type="button" class="srch-btn" aria-label="Ara"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" stroke-width="1.35"/><line x1="12.35" y1="12.35" x2="17.85" y2="12.35" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hdr-right">
        <div id="equsto-hdr-cart" class="equsto-hdr-cart" title="Sepet" role="button" tabindex="0">
          <span id="equsto-cart-count" style="font-size:10px;color:var(--eq-text-muted);">🛒 0</span>
          <span style="font-size:12px;font-weight:600;">Alışveriş Sepeti</span>
        </div>
      </div>
    </div>
"""

TOPNAV = """
<nav class="topnav" aria-label="Departmanlar">
  <div class="pg-inner topnav-inner">
    <div class="topnav-item topnav-pfos" onclick="eqGo('pfos')">Proje Fabrikası</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item" onclick="eqGo('icecek')">İçecek</div>
    <span class="topnav-sep" aria-hidden="true">|</span>
    <div class="topnav-item topnav-besos active" onclick="eqGo('besos')" aria-current="page">Bar Design</div>
  </div>
</nav>
"""


def inject_assets(html: str) -> str:
    if "besos-shell.css" not in html:
        html = html.replace(
            '<link rel="stylesheet" href="/theme.css',
            '<link rel="stylesheet" href="/besos-shell.css?v=20260524besos">\n<link rel="stylesheet" href="/theme.css',
            1,
        )
    return html


def replace_header(html: str, imt300_active: bool) -> str:
    imt_link = (
        '<a href="/besos/imt300" class="is-active">IMT300</a>'
        if imt300_active
        else '<a href="/besos/imt300">IMT300</a>'
    )
    brand = BESOS_LINKS.format(imt300_link=imt_link)
    header = (
        '<header class="hdr" data-besos-shell="locked">\n'
        + brand
        + HDR_SEARCH
        + "\n</header>\n"
        + TOPNAV
    )
    body_class = (
        'bd-page eq-shop besos besos-locked besos-sub eq-imt-page'
        if imt300_active
        else "bd-page eq-shop besos besos-locked besos-sub bm-page"
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
    if "bd-hdr-brand" not in html:
        html = replace_header(html, True)
    path.write_text(html, encoding="utf-8")
    print("patched", path)


def patch_bar_module():
    path = ROOT / "bar-module.html"
    html = path.read_text(encoding="utf-8")
    html = inject_assets(html)
    if "bd-hdr-brand" not in html:
        html = replace_header(html, False)
    if "eq-footer.js" not in html:
        html = html.replace(
            "</body>",
            '<div class="drawer-overlay" id="drawerOverlay" onclick="__eqDrawerBackdropClick(event)"></div>\n'
            '<div class="cat-drawer eq-amazon-shop-all" id="catDrawer" aria-hidden="true"></div>\n'
            '<script src="/eq-footer.js?v=20260524besos"></script>\n'
            '<script>document.addEventListener("DOMContentLoaded",function(){window.__eqMountMarketFooter&&window.__eqMountMarketFooter();});</script>\n'
            "</body>",
        )
    path.write_text(html, encoding="utf-8")
    print("patched", path)


if __name__ == "__main__":
    patch_imt300()
    patch_bar_module()
