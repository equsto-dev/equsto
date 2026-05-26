# Departman sayfalarına (pisirme/sogutma/kahve/yikama/hazirlik/icecek.html)
# chrome i18n attribute'ları enjekte eder.
# - <html lang="tr">  : aynen kalır (eq-i18n.js runtime'da set ediyor)
# - <script src="eq-i18n.js"></script> : nav.js'ten ÖNCE eklenir
# - Header / topnav / hero / breadcrumb / footer statik metinler: data-i18n eklenir
# Türkçe metin AYNEN kalır (eq-i18n.js TR modunda dict'i okur ama key bulunamazsa
# fallback DOM textContent kullanılır — yani değişen tek şey EN modu davranışı).

import re
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR\public")
DEPTS = {
    "pisirme.html":  ("nav.pisirme",  "Pişirme Ekipmanları"),
    "sogutma.html":  ("nav.sogutma",  "Soğutma Ekipmanları"),
    "kahve.html":    ("nav.kahve",    "Kahve Ekipmanları"),
    "yikama.html":   ("nav.yikama",   "Yıkama Ekipmanları"),
    "hazirlik.html": ("nav.hazirlik", "Hazırlık Ekipmanları"),
    "icecek.html":   ("nav.icecek",   "İçecek Ekipmanları"),
}

# (eski_metin, yeni_metin) — sıralı, her dosyada uygulanır
REPLACERS = [
    # eq-i18n.js eklenmesi (nav.js'ten önce)
    (
        '<script src="theme.js"></script>\n    <script src="equsto-logo.js"></script>\n    <script src="eq-site-urls.js"></script>\n    <script src="nav.js"></script>',
        '<script src="theme.js"></script>\n    <script src="equsto-logo.js"></script>\n    <script src="eq-i18n.js"></script>\n    <script src="eq-site-urls.js"></script>\n    <script src="nav.js"></script>'
    ),
    # Header — teslimat
    (
        '<div style="font-size:9px;color:var(--eq-text-subtle);">Teslimat Adresi</div>\n      <div style="font-size:11px;font-weight:600;color:var(--eq-drawer-head-text);">İstanbul, Türkiye</div>',
        '<div style="font-size:9px;color:var(--eq-text-subtle);" data-i18n="common.delivery_to">Teslimat Adresi</div>\n      <div style="font-size:11px;font-weight:600;color:var(--eq-drawer-head-text);" data-i18n="common.delivery_city">İstanbul, Türkiye</div>'
    ),
    # Header — arama
    (
        '<div class="srch-cat" onclick="toggleDrawer()">☰ Tüm Kategoriler</div>\n      <input class="srch-input" type="text" placeholder="Ürün, marka veya kategori ara..." oninput="searchFilter(this.value)">\n        <button type="button" class="srch-btn" aria-label="Ara" title="Ara">',
        '<div class="srch-cat" onclick="toggleDrawer()" data-i18n="common.all_categories_caps">☰ Tüm Kategoriler</div>\n      <input class="srch-input" type="text" placeholder="Ürün, marka veya kategori ara..." oninput="searchFilter(this.value)" data-i18n-attr="placeholder:common.search_placeholder">\n        <button type="button" class="srch-btn" aria-label="Ara" title="Ara" data-i18n-attr="aria-label:common.search_aria,title:common.search_aria">'
    ),
    # Header — tema + hesap + iadeler + sepet
    (
        '<button type="button" class="theme-toggle" id="theme-toggle" onclick="equstoCycleTheme()" title="Tema">◐</button>\n        <span class="theme-legend">Sistem · Açık · Koyu</span>',
        '<button type="button" class="theme-toggle" id="theme-toggle" onclick="equstoCycleTheme()" title="Tema" data-i18n-attr="title:common.theme_title">◐</button>\n        <span class="theme-legend" data-i18n="common.theme_label">Sistem · Açık · Koyu</span>'
    ),
    (
        '<a href="login.html" class="eq-hdr-account" title="Üye girişi">\n        <span style="font-size:10px;color:var(--eq-text-muted);">Hesabım</span>\n          <span class="eq-hdr-account-title" style="font-size:12px;font-weight:600;">Projeler ve Listeler ▾</span>\n        </a>',
        '<a href="login.html" class="eq-hdr-account" title="Üye girişi" data-i18n-attr="title:common.login_title">\n        <span style="font-size:10px;color:var(--eq-text-muted);" data-i18n="common.my_account">Hesabım</span>\n          <span class="eq-hdr-account-title" style="font-size:12px;font-weight:600;" data-i18n="common.account_projects">Projeler ve Listeler ▾</span>\n        </a>'
    ),
    (
        '<span style="font-size:10px;color:var(--eq-text-muted);">İadeler</span>\n        <span style="font-size:12px;font-weight:600;cursor:pointer;">ve Siparişler</span>',
        '<span style="font-size:10px;color:var(--eq-text-muted);" data-i18n="common.returns">İadeler</span>\n        <span style="font-size:12px;font-weight:600;cursor:pointer;" data-i18n="common.and_orders">ve Siparişler</span>'
    ),
    (
        '<span style="font-size:10px;color:var(--eq-text-muted);">🛒 0</span>\n        <span style="font-size:12px;font-weight:600;">Alışveriş Sepeti</span>',
        '<span style="font-size:10px;color:var(--eq-text-muted);">🛒 0</span>\n        <span style="font-size:12px;font-weight:600;" data-i18n="common.cart">Alışveriş Sepeti</span>'
    ),
    # Topnav
    (
        '<nav class="topnav" aria-label="Departmanlar">',
        '<nav class="topnav" aria-label="Departmanlar" data-i18n-attr="aria-label:nav.departments_aria">'
    ),
    (
        '<div class="topnav-item topnav-all" onclick="toggleDrawer()">☰ Tüm kategoriler</div>',
        '<div class="topnav-item topnav-all" onclick="toggleDrawer()" data-i18n="common.all_categories_lower">☰ Tüm kategoriler</div>'
    ),
    (
        '<div class="topnav-item" onclick="eqGo(\'pfos\')">Proje Fabrikası</div>',
        '<div class="topnav-item" onclick="eqGo(\'pfos\')" data-i18n="nav.pfos">Proje Fabrikası</div>'
    ),
    (
        '<div class="topnav-item" onclick="location.href=\'sogutma.html\'">Soğutma Ekipmanları</div>',
        '<div class="topnav-item" onclick="location.href=\'sogutma.html\'" data-i18n="nav.sogutma">Soğutma Ekipmanları</div>'
    ),
    (
        '<div class="topnav-item" onclick="location.href=\'kahve.html\'">Kahve Ekipmanları</div>',
        '<div class="topnav-item" onclick="location.href=\'kahve.html\'" data-i18n="nav.kahve">Kahve Ekipmanları</div>'
    ),
    (
        '<div class="topnav-item" onclick="location.href=\'yikama.html\'">Yıkama Ekipmanları</div>',
        '<div class="topnav-item" onclick="location.href=\'yikama.html\'" data-i18n="nav.yikama">Yıkama Ekipmanları</div>'
    ),
    (
        '<div class="topnav-item" onclick="location.href=\'hazirlik.html\'">Hazırlık Ekipmanları</div>',
        '<div class="topnav-item" onclick="location.href=\'hazirlik.html\'" data-i18n="nav.hazirlik">Hazırlık Ekipmanları</div>'
    ),
    (
        '<div class="topnav-item" onclick="location.href=\'icecek.html\'">İçecek Ekipmanları</div>',
        '<div class="topnav-item" onclick="location.href=\'icecek.html\'" data-i18n="nav.icecek">İçecek Ekipmanları</div>'
    ),
    (
        '<div class="topnav-item" onclick="location.href=\'pisirme.html\'">Pişirme Ekipmanları</div>',
        '<div class="topnav-item" onclick="location.href=\'pisirme.html\'" data-i18n="nav.pisirme">Pişirme Ekipmanları</div>'
    ),
    (
        '<div class="topnav-item" onclick="eqGo(\'besos\')">Bar Design</div>',
        '<div class="topnav-item" onclick="eqGo(\'besos\')" data-i18n="nav.bar_design">Bar Design</div>'
    ),
    # Filter col aria-label
    (
        '<aside class="eq-filter-col eq-refine-amazon" id="eq-filter-col" aria-label="Filtreler">',
        '<aside class="eq-filter-col eq-refine-amazon" id="eq-filter-col" aria-label="Filtreler" data-i18n-attr="aria-label:home.filter_filtrele">'
    ),
    (
        '<nav class="sidebar" id="eq-sidebar" aria-label="Kategoriler"></nav>',
        '<nav class="sidebar" id="eq-sidebar" aria-label="Kategoriler" data-i18n-attr="aria-label:nav.drawer_aria_categories"></nav>'
    ),
    (
        '<div class="eq-filter-sec-lbl eq-filter-sec-lbl--markalarimiz">Markalarımız</div>',
        '<div class="eq-filter-sec-lbl eq-filter-sec-lbl--markalarimiz" data-i18n="filter.brands">Markalarımız</div>'
    ),
    # Hero banner
    (
        '<div class="hero-kicker">Mr. Equsto Presents</div>\n          <div class="hero-h1">DÜNYADA BİR İLK</div>\n          <div class="hero-sub">Endüstriyel Mutfak &amp; Gastronomi Platformu</div>',
        '<div class="hero-kicker" data-i18n="home.banner_kicker">Mr. Equsto Presents</div>\n          <div class="hero-h1" data-i18n="home.banner_h1">DÜNYADA BİR İLK</div>\n          <div class="hero-sub" data-i18n="home.banner_sub">Endüstriyel Mutfak &amp; Gastronomi Platformu</div>'
    ),
    # Hero cards
    (
        '<section class="hero" aria-label="Öne çıkan vitrinler">',
        '<section class="hero" aria-label="Öne çıkan vitrinler" data-i18n-attr="aria-label:home.featured_aria">'
    ),
    (
        '<div class="hero-tag">Proje Çözümleri</div>\n            <div class="hero-title">Proje Fabrikası</div>',
        '<div class="hero-tag" data-i18n="home.hero_card1_tag">Proje Çözümleri</div>\n            <div class="hero-title" data-i18n="home.hero_card1_title">Proje Fabrikası</div>'
    ),
    (
        '<div class="hero-tag">Restoran &amp; Catering</div>\n            <div class="hero-title">Yer Sofrası</div>',
        '<div class="hero-tag" data-i18n="home.hero_card2_tag">Restoran &amp; Catering</div>\n            <div class="hero-title" data-i18n="home.hero_card2_title">Yer Sofrası</div>'
    ),
    (
        '<div class="hero-tag">Bar &amp; Beverages</div>\n            <div class="hero-title">Bar Design</div>',
        '<div class="hero-tag" data-i18n="home.hero_card3_tag">Bar &amp; Beverages</div>\n            <div class="hero-title" data-i18n="home.hero_card3_title">Bar Design</div>'
    ),
    # Footer
    (
        '<span style="font-size:10px;color:var(--eq-text-muted);">B2B · proje · kanal ortaklıkları</span>',
        '<span style="font-size:10px;color:var(--eq-text-muted);" data-i18n="footer.b2b_partners">B2B · proje · kanal ortaklıkları</span>'
    ),
    (
        '<div>Çerez tercihlerini yönet</div>',
        '<div data-i18n="common.manage_cookies">Çerez tercihlerini yönet</div>'
    ),
    # Drawer overlay close
    (
        '<button type="button" class="drawer-overlay-close" onclick="__eqDrawerCloseX(event)" aria-label="Kapat">×</button>',
        '<button type="button" class="drawer-overlay-close" onclick="__eqDrawerCloseX(event)" aria-label="Kapat" data-i18n-attr="aria-label:common.close">×</button>'
    ),
]

def patch_dept(path: Path, breadcrumb_key: str, breadcrumb_label: str):
    txt = path.read_text(encoding="utf-8")
    miss = []
    for old, new in REPLACERS:
        if old in txt:
            txt = txt.replace(old, new)
        else:
            miss.append(old[:60])

    # Breadcrumb — kategori bazlı
    bc_old = f'<a onclick="eqGo(\'shop\')">Ana Sayfa</a> › <span>{breadcrumb_label}</span>'
    bc_new = f'<a onclick="eqGo(\'shop\')" data-i18n="breadcrumb.home">Ana Sayfa</a> › <span data-i18n="{breadcrumb_key}">{breadcrumb_label}</span>'
    if bc_old in txt:
        txt = txt.replace(bc_old, bc_new)
    else:
        miss.append(f"breadcrumb:{breadcrumb_label}")

    # Aktif topnav item (departmanın kendi adı, active class'li)
    active_old = f'<div class="topnav-item active">{breadcrumb_label}</div>'
    active_new = f'<div class="topnav-item active" data-i18n="{breadcrumb_key}">{breadcrumb_label}</div>'
    if active_old in txt:
        txt = txt.replace(active_old, active_new)
    else:
        miss.append(f"active topnav:{breadcrumb_label}")

    path.write_text(txt, encoding="utf-8")
    return miss

for fname, (k, label) in DEPTS.items():
    p = ROOT / fname
    miss = patch_dept(p, k, label)
    if miss:
        print(f"[{fname}] missed {len(miss)}: {miss[:3]}")
    else:
        print(f"[{fname}] OK")
