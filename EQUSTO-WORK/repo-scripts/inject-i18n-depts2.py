# Kalan departman sayfaları için regex tabanlı i18n attribute enjeksiyonu.
# pisirme.html dışındakiler farklı girinti/script sırası kullanıyor.

import re
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR\public")
DEPTS = {
    "sogutma.html":  ("nav.sogutma",  "Soğutma Ekipmanları"),
    "kahve.html":    ("nav.kahve",    "Kahve Ekipmanları"),
    "yikama.html":   ("nav.yikama",   "Yıkama Ekipmanları"),
    "hazirlik.html": ("nav.hazirlik", "Hazırlık Ekipmanları"),
    "icecek.html":   ("nav.icecek",   "İçecek Ekipmanları"),
    "pisirme.html":  ("nav.pisirme",  "Pişirme Ekipmanları"),
}

# (pattern, repl) regex tabanlı, DOTALL gerek yok
PATCHES = [
    # 1) eq-i18n.js ekle (henüz yoksa, nav.js'ten önce)
    (
        r'(<script src="equsto-logo\.js"></script>\s*\n\s*)(<script src="eq-site-urls\.js"></script>)',
        r'\1<script src="eq-i18n.js"></script>\n    \2'
    ),
    # 2) Teslimat
    (
        r'<div style="font-size:9px;color:var\(--eq-text-subtle\);">Teslimat Adresi</div>',
        r'<div style="font-size:9px;color:var(--eq-text-subtle);" data-i18n="common.delivery_to">Teslimat Adresi</div>'
    ),
    (
        r'<div style="font-size:11px;font-weight:600;color:var\(--eq-drawer-head-text\);">İstanbul, Türkiye</div>',
        r'<div style="font-size:11px;font-weight:600;color:var(--eq-drawer-head-text);" data-i18n="common.delivery_city">İstanbul, Türkiye</div>'
    ),
    # 3) Search row (cat + input + button)
    (
        r'<div class="srch-cat" onclick="toggleDrawer\(\)">☰ Tüm Kategoriler</div>',
        r'<div class="srch-cat" onclick="toggleDrawer()" data-i18n="common.all_categories_caps">☰ Tüm Kategoriler</div>'
    ),
    (
        r'<input class="srch-input" type="text" placeholder="Ürün, marka veya kategori ara\.\.\." oninput="searchFilter\(this\.value\)">',
        r'<input class="srch-input" type="text" placeholder="Ürün, marka veya kategori ara..." oninput="searchFilter(this.value)" data-i18n-attr="placeholder:common.search_placeholder">'
    ),
    (
        r'<button type="button" class="srch-btn" aria-label="Ara" title="Ara">',
        r'<button type="button" class="srch-btn" aria-label="Ara" title="Ara" data-i18n-attr="aria-label:common.search_aria,title:common.search_aria">'
    ),
    # 4) Login (üye girişi + Hesabım + Projeler ve Listeler) — tek satıra dönüştür
    (
        r'<a href="login\.html" class="eq-hdr-account" title="Üye girişi">\s*\n(\s*)<span style="font-size:10px;color:var\(--eq-text-muted\);">Hesabım</span>\s*\n(\s*)<span class="eq-hdr-account-title" style="font-size:12px;font-weight:600;">Projeler ve Listeler ▾</span>',
        r'<a href="login.html" class="eq-hdr-account" title="Üye girişi" data-i18n-attr="title:common.login_title">\n\1<span style="font-size:10px;color:var(--eq-text-muted);" data-i18n="common.my_account">Hesabım</span>\n\2<span class="eq-hdr-account-title" style="font-size:12px;font-weight:600;" data-i18n="common.account_projects">Projeler ve Listeler ▾</span>'
    ),
    # 5) İadeler / Siparişler
    (
        r'<span style="font-size:10px;color:var\(--eq-text-muted\);">İadeler</span>\s*\n(\s*)<span style="font-size:12px;font-weight:600;cursor:pointer;">ve Siparişler</span>',
        r'<span style="font-size:10px;color:var(--eq-text-muted);" data-i18n="common.returns">İadeler</span>\n\1<span style="font-size:12px;font-weight:600;cursor:pointer;" data-i18n="common.and_orders">ve Siparişler</span>'
    ),
    # 6) Sepet
    (
        r'<span style="font-size:12px;font-weight:600;">Alışveriş Sepeti</span>',
        r'<span style="font-size:12px;font-weight:600;" data-i18n="common.cart">Alışveriş Sepeti</span>'
    ),
    # 7) Topnav aria-label
    (
        r'<nav class="topnav" aria-label="Departmanlar">',
        r'<nav class="topnav" aria-label="Departmanlar" data-i18n-attr="aria-label:nav.departments_aria">'
    ),
    # 8) Topnav items — generic
    (
        r'<div class="topnav-item topnav-all" onclick="toggleDrawer\(\)">☰ Tüm kategoriler</div>',
        r'<div class="topnav-item topnav-all" onclick="toggleDrawer()" data-i18n="common.all_categories_lower">☰ Tüm kategoriler</div>'
    ),
    (
        r'<div class="topnav-item" onclick="eqGo\(\'pfos\'\)">Proje Fabrikası</div>',
        r'<div class="topnav-item" onclick="eqGo(\'pfos\')" data-i18n="nav.pfos">Proje Fabrikası</div>'
    ),
    (
        r'<div class="topnav-item" onclick="location\.href=\'pisirme\.html\'">Pişirme Ekipmanları</div>',
        r'<div class="topnav-item" onclick="location.href=\'pisirme.html\'" data-i18n="nav.pisirme">Pişirme Ekipmanları</div>'
    ),
    (
        r'<div class="topnav-item" onclick="location\.href=\'sogutma\.html\'">Soğutma Ekipmanları</div>',
        r'<div class="topnav-item" onclick="location.href=\'sogutma.html\'" data-i18n="nav.sogutma">Soğutma Ekipmanları</div>'
    ),
    (
        r'<div class="topnav-item" onclick="location\.href=\'kahve\.html\'">Kahve Ekipmanları</div>',
        r'<div class="topnav-item" onclick="location.href=\'kahve.html\'" data-i18n="nav.kahve">Kahve Ekipmanları</div>'
    ),
    (
        r'<div class="topnav-item" onclick="location\.href=\'yikama\.html\'">Yıkama Ekipmanları</div>',
        r'<div class="topnav-item" onclick="location.href=\'yikama.html\'" data-i18n="nav.yikama">Yıkama Ekipmanları</div>'
    ),
    (
        r'<div class="topnav-item" onclick="location\.href=\'hazirlik\.html\'">Hazırlık Ekipmanları</div>',
        r'<div class="topnav-item" onclick="location.href=\'hazirlik.html\'" data-i18n="nav.hazirlik">Hazırlık Ekipmanları</div>'
    ),
    (
        r'<div class="topnav-item" onclick="location\.href=\'icecek\.html\'">İçecek Ekipmanları</div>',
        r'<div class="topnav-item" onclick="location.href=\'icecek.html\'" data-i18n="nav.icecek">İçecek Ekipmanları</div>'
    ),
    (
        r'<div class="topnav-item" onclick="eqGo\(\'besos\'\)">Bar Design</div>',
        r'<div class="topnav-item" onclick="eqGo(\'besos\')" data-i18n="nav.bar_design">Bar Design</div>'
    ),
    # 9) Filter col
    (
        r'<aside class="eq-filter-col eq-refine-amazon" id="eq-filter-col" aria-label="Filtreler">',
        r'<aside class="eq-filter-col eq-refine-amazon" id="eq-filter-col" aria-label="Filtreler" data-i18n-attr="aria-label:home.filter_filtrele">'
    ),
    (
        r'<nav class="sidebar" id="eq-sidebar" aria-label="Kategoriler"></nav>',
        r'<nav class="sidebar" id="eq-sidebar" aria-label="Kategoriler" data-i18n-attr="aria-label:nav.drawer_aria_categories"></nav>'
    ),
    (
        r'<div class="eq-filter-sec-lbl eq-filter-sec-lbl--markalarimiz">Markalarımız</div>',
        r'<div class="eq-filter-sec-lbl eq-filter-sec-lbl--markalarimiz" data-i18n="filter.brands">Markalarımız</div>'
    ),
    # 10) Hero banner
    (
        r'<div class="hero-kicker">Mr\. Equsto Presents</div>',
        r'<div class="hero-kicker" data-i18n="home.banner_kicker">Mr. Equsto Presents</div>'
    ),
    (
        r'<div class="hero-h1">DÜNYADA BİR İLK</div>',
        r'<div class="hero-h1" data-i18n="home.banner_h1">DÜNYADA BİR İLK</div>'
    ),
    (
        r'<div class="hero-sub">Endüstriyel Mutfak &amp; Gastronomi Platformu</div>',
        r'<div class="hero-sub" data-i18n="home.banner_sub">Endüstriyel Mutfak &amp; Gastronomi Platformu</div>'
    ),
    # 11) Hero section
    (
        r'<section class="hero" aria-label="Öne çıkan vitrinler">',
        r'<section class="hero" aria-label="Öne çıkan vitrinler" data-i18n-attr="aria-label:home.featured_aria">'
    ),
    # 12) Hero cards
    (
        r'<div class="hero-tag">Proje Çözümleri</div>',
        r'<div class="hero-tag" data-i18n="home.hero_card1_tag">Proje Çözümleri</div>'
    ),
    (
        r'<div class="hero-title">Proje Fabrikası</div>',
        r'<div class="hero-title" data-i18n="home.hero_card1_title">Proje Fabrikası</div>'
    ),
    (
        r'<div class="hero-tag">Restoran &amp; Catering</div>',
        r'<div class="hero-tag" data-i18n="home.hero_card2_tag">Restoran &amp; Catering</div>'
    ),
    (
        r'<div class="hero-title">Yer Sofrası</div>',
        r'<div class="hero-title" data-i18n="home.hero_card2_title">Yer Sofrası</div>'
    ),
    (
        r'<div class="hero-tag">Bar &amp; Beverages</div>',
        r'<div class="hero-tag" data-i18n="home.hero_card3_tag">Bar &amp; Beverages</div>'
    ),
    (
        r'<div class="hero-title">Bar Design</div>',
        r'<div class="hero-title" data-i18n="home.hero_card3_title">Bar Design</div>'
    ),
    # 13) Footer
    (
        r'<span style="font-size:10px;color:var\(--eq-text-muted\);">B2B · proje · kanal ortaklıkları</span>',
        r'<span style="font-size:10px;color:var(--eq-text-muted);" data-i18n="footer.b2b_partners">B2B · proje · kanal ortaklıkları</span>'
    ),
    (
        r'<div>Çerez tercihlerini yönet</div>',
        r'<div data-i18n="common.manage_cookies">Çerez tercihlerini yönet</div>'
    ),
    # 14) Drawer overlay close
    (
        r'<button type="button" class="drawer-overlay-close" onclick="__eqDrawerCloseX\(event\)" aria-label="Kapat">×</button>',
        r'<button type="button" class="drawer-overlay-close" onclick="__eqDrawerCloseX(event)" aria-label="Kapat" data-i18n-attr="aria-label:common.close">×</button>'
    ),
]

# data-i18n zaten olan satırlara tekrar enjekte etmemek için: önce mevcut data-i18n var mı kontrol et
def patched(txt: str) -> bool:
    return 'data-i18n="common.delivery_to"' in txt

def patch_dept(path: Path, breadcrumb_key: str, breadcrumb_label: str):
    txt = path.read_text(encoding="utf-8")
    count = 0
    for pat, repl in PATCHES:
        new_txt, n = re.subn(pat, repl, txt)
        if n > 0:
            txt = new_txt
            count += n

    # Breadcrumb
    bc_pat = re.escape(f'<a onclick="eqGo(\'shop\')">Ana Sayfa</a> › <span>{breadcrumb_label}</span>')
    bc_repl = f'<a onclick="eqGo(\'shop\')" data-i18n="breadcrumb.home">Ana Sayfa</a> › <span data-i18n="{breadcrumb_key}">{breadcrumb_label}</span>'
    new_txt, n = re.subn(bc_pat, bc_repl, txt)
    if n > 0:
        txt = new_txt
        count += n

    # Aktif topnav
    active_pat = re.escape(f'<div class="topnav-item active">{breadcrumb_label}</div>')
    active_repl = f'<div class="topnav-item active" data-i18n="{breadcrumb_key}">{breadcrumb_label}</div>'
    new_txt, n = re.subn(active_pat, active_repl, txt)
    if n > 0:
        txt = new_txt
        count += n

    path.write_text(txt, encoding="utf-8")
    return count

for fname, (k, label) in DEPTS.items():
    p = ROOT / fname
    c = patch_dept(p, k, label)
    print(f"[{fname}] applied {c} patches")
