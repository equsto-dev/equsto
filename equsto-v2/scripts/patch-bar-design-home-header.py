# -*- coding: utf-8 -*-
"""bar-design.html — Besos üst chrome = ana sayfa; yalnızca siyah zemin."""
from pathlib import Path
import re

PATH = Path(__file__).resolve().parents[1] / "public" / "bar-design.html"

HDR = """  <header class="hdr">
    <a class="logo" href="/" aria-label="Equsto"></a>
    <div class="pg-inner hdr-pg-inner" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:10px 20px 10px 0;">
      <div class="hdr-alici">
        <div class="st-label" data-i18n="common.delivery_to">Teslimat Adresi</div>
        <div class="st-val" data-i18n="common.delivery_city">İstanbul, Türkiye</div>
      </div>
      <div class="srch">
        <div class="srch-cat" onclick="toggleCatPicker()" data-i18n="common.all_categories_caps">☰ Tüm Kategoriler</div>
        <input class="srch-input" type="search" placeholder="Ürün, marka veya kategori ara..." autocomplete="off" spellcheck="false" data-i18n-attr="placeholder:common.search_placeholder" oninput="typeof filterStations==='function'&&filterStations(this.value)">
        <button type="button" class="srch-btn" aria-label="Ara" title="Ara" data-i18n-attr="aria-label:common.search_aria, title:common.search_aria"><svg xmlns="http://www.w3.org/2000/svg" class="eq-srch-ico" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" stroke-width="1.35"/><line x1="12.35" y1="12.35" x2="17.85" y2="12.35" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg></button>
      </div>
      <div class="hdr-right">
        <div class="theme-wrap">
          <button type="button" class="theme-toggle" id="theme-toggle" onclick="equstoCycleTheme()" title="Tema" data-i18n-attr="title:common.theme_title">◝</button>
          <span class="theme-legend" data-i18n="common.theme_label">Sistem · Açık · Koyu</span>
        </div>
        <a href="/login.html" class="eq-hdr-account" title="Üye girişi" data-i18n-attr="title:common.login_title">
          <span style="font-size:10px;color:var(--eq-text-muted);" data-i18n="common.my_account">Hesabım</span>
          <span class="eq-hdr-account-title" style="font-size:12px;font-weight:600;color:var(--eq-text);" data-i18n="common.account_projects">Projeler ve Listeler ▾</span>
        </a>
        <div style="display:flex;flex-direction:column;line-height:1.4;">
          <span style="font-size:10px;color:var(--eq-text-muted);" data-i18n="common.returns">İadeler</span>
          <span style="font-size:12px;font-weight:600;cursor:pointer;color:var(--eq-text);" data-i18n="common.and_orders">ve Siparişler</span>
        </div>
        <div id="equsto-hdr-cart" class="equsto-hdr-cart" style="display:flex;flex-direction:column;line-height:1.4;cursor:pointer;" title="Sepeti aç" role="button" tabindex="0" data-i18n-attr="title:common.cart_open_title">
          <span id="equsto-cart-count" style="font-size:10px;color:var(--eq-text-muted);">🛒 0</span>
          <span style="font-size:12px;font-weight:600;color:var(--eq-text);" data-i18n="common.cart">Alışveriş Sepeti</span>
        </div>
      </div>
    </div>
  </header>"""

BESOS_CHROME_CSS = """    /* Besos — yalnızca siyah zemin; üst chrome ana sayfa ile aynı (theme.css) */
    body.bd-page.besos header.hdr{
      background:#000000 !important;
      border-bottom:1px solid rgba(255,255,255,0.12) !important;
      box-shadow:none !important;
      color:#f1f1f3;
    }
    body.bd-page.besos nav.topnav,
    body.bd-page.besos .topnav{
      background:#000 !important;
      border-bottom:1px solid rgba(255,255,255,0.12) !important;
    }
    body.bd-page.besos .topnav-item{color:#fff !important;}
    body.bd-page.besos .topnav-item.active,
    body.bd-page.besos .topnav-besos.active{box-shadow:inset 0 -2px 0 0 var(--bes-gold,#c8a44a) !important;}
    body.bd-page.besos .topnav-sep{color:rgba(255,255,255,0.35) !important;}
"""


def main() -> None:
    html = PATH.read_text(encoding="utf-8")

    if "besos-shell.css" not in html:
        html = html.replace(
            '<link rel="stylesheet" href="/theme.css',
            '<link rel="stylesheet" href="/besos-shell.css?v=20260527homehdr">\n<link rel="stylesheet" href="/theme.css',
            1,
        )

    html = re.sub(
        r"    /\* Besos üst kabuk \(kilit\).*?body\.bd-page\.besos \.bd-hdr-nav a\.bd-hdr-equsto\{[^}]+\}\n",
        BESOS_CHROME_CSS,
        html,
        count=1,
        flags=re.S,
    )

    html = re.sub(
        r'  <header class="hdr"[^>]*>.*?</header>\s*\n\s*<nav class="topnav"',
        HDR + "\n\n  <nav class=\"topnav\"",
        html,
        count=1,
        flags=re.S,
    )

    html = html.replace(
        '<body class="bd-page eq-shop besos besos-locked" data-besos-header-lock="1">',
        '<body class="bd-page eq-shop besos">',
    )
    html = re.sub(
        r"\n  <!-- Besos üst şerit KİLİTLİ:.*?-->\n",
        "\n",
        html,
        count=1,
    )
    html = re.sub(
        r"function assertBesosHeaderLock\(\) \{.*?\}\n",
        "",
        html,
        count=1,
        flags=re.S,
    )
    html = html.replace("assertBesosHeaderLock();", "")

    PATH.write_text(html, encoding="utf-8")
    print("patched", PATH)


if __name__ == "__main__":
    main()
