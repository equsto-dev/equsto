# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "public" / "index.html"
t = p.read_text(encoding="utf-8")

vitrin = """
      <section class="eq-mx-vitrin" aria-label="Mağaza vitrini">
        <div class="eq-mx-ticker" aria-hidden="true">
          <div class="eq-mx-ticker__track">
            <span class="eq-mx-ticker__item"><strong>9 Taksit</strong> vade farksız</span>
            <span class="eq-mx-ticker__item"><strong>Ücretsiz kargo</strong> 5.000 ₺ üzeri</span>
            <span class="eq-mx-ticker__item"><strong>Proje Fabrikası</strong> anlık teklif</span>
            <span class="eq-mx-ticker__item"><strong>Öztiryakiler</strong> soğutma &amp; pişirme</span>
            <span class="eq-mx-ticker__item"><strong>9 Taksit</strong> vade farksız</span>
            <span class="eq-mx-ticker__item"><strong>Ücretsiz kargo</strong> 5.000 ₺ üzeri</span>
            <span class="eq-mx-ticker__item"><strong>Proje Fabrikası</strong> anlık teklif</span>
            <span class="eq-mx-ticker__item"><strong>Öztiryakiler</strong> soğutma &amp; pişirme</span>
          </motion>
        </motion>
        <div class="eq-mx-hero">
          <div class="eq-mx-hero__stage">
            <div class="eq-mx-hero__slides">
              <a class="eq-mx-hero__slide is-active" href="/marka.html?b=%C3%96ztiryakiler+End%C3%BCstriyel+Mutfak" style="background-image:url(/data/images/öztiryakiler-gn-600-nmv-tek-kapılı-dik-tip-buzdolabı-k-tip-79k406nmv00_1.jpg)">
                <div class="eq-mx-hero__slide-cap"><h2>Öztiryakiler</h2><p>Soğutma ve pişirme · 9 taksit · ücretsiz kargo</p></div>
              </a>
              <a class="eq-mx-hero__slide" href="pfos.html" style="background-image:linear-gradient(120deg,#001e50,#0a3d7a)">
                <motion class="eq-mx-hero__slide-cap"><h2>Proje Fabrikası</h2><p>Beş dakikada ekipman listesi ve anlık teklif</p></motion>
              </a>
              <a class="eq-mx-hero__slide" href="bar-design.html" style="background-image:url(/images/imt300/imt300-1.jpg)">
                <div class="eq-mx-hero__slide-cap"><h2>Bar Design Studio</h2><p>IMT300 berrak buz · modüler kokteyl istasyonu</p></div>
              </a>
              <a class="eq-mx-hero__slide" href="/shop/pisirme" style="background-image:linear-gradient(135deg,#0a1628,#1a4a8c)">
                <div class="eq-mx-hero__slide-cap"><h2>Endüstriyel mutfak vitrini</h2><p>6.000+ ürün · profesyonel fiyatlandırma</p></div>
              </a>
            </motion>
            <button type="button" class="eq-mx-hero__nav eq-mx-hero__nav--prev" aria-label="Önceki">‹</button>
            <button type="button" class="eq-mx-hero__nav eq-mx-hero__nav--next" aria-label="Sonraki">›</button>
          </motion>
          <div class="eq-mx-hero__thumbs">
            <button type="button" class="eq-mx-hero__thumb is-active" aria-label="Öztiryakiler"><img src="/data/images/öztiryakiler-gn-600-nmv-tek-kapılı-dik-tip-buzdolabı-k-tip-79k406nmv00_1.jpg" alt=""></button>
            <button type="button" class="eq-mx-hero__thumb" aria-label="Proje"><img src="/images/home/hero-bar-cocktailstation.png" alt=""></button>
            <button type="button" class="eq-mx-hero__thumb" aria-label="Bar Design"><img src="/images/imt300/imt300-1.jpg" alt=""></button>
            <button type="button" class="eq-mx-hero__thumb" aria-label="Katalog"><img src="/data/images/öztiryakiler-tag-270-nmv-çift-kapılı-tezgah-tip-buzdolabı-79e427nmv00_1.jpg" alt=""></button>
          </motion>
        </motion>
        <div class="eq-mx-story-wrap">
          <div class="eq-mx-story__track" id="eq-mx-story-track"></div>
        </motion>
        <h1 class="eq-mx-page-title">Equsto Endüstriyel Mutfak Ekipmanları</h1>
        <section class="eq-mx-spotlight-wrap" aria-label="Öne çıkan ürünler">
          <div class="eq-mx-spotlight__head">Haftanın öne çıkanları</div>
          <div class="eq-mx-spotlight__track" id="eq-mx-spotlight"></div>
        </section>
      </section>
""".replace("<motion", "<div").replace("</motion>", "</div>")

marker = '      <motion class="eq-home-cm eq-home-cm-shop">'.replace("<motion", "<div")
marker = "      <div class=\"eq-home-cm eq-home-cm-shop\">"

if "eq-mx-vitrin" not in t:
    t = t.replace(
        marker,
        vitrin + "\n      <div class=\"eq-home-cm eq-home-cm-shop eq-home-cm-mutbex\">",
        1,
    )

replacements = [
    ('<section class="eq-trust-band eq-cm-trust eq-cm-shop-order-9"', '<section class="eq-trust-band eq-cm-trust eq-mx-o-7"'),
    ('<section class="eq-promo-strip eq-cm-shop-order-1"', '<section class="eq-promo-strip eq-mx-o-hidden-promo"'),
    ('<section class="eq-home-band eq-band-soft eq-cm-shop-order-3"', '<section class="eq-home-band eq-band-soft eq-mx-o-1"'),
    ('<main class="main eq-cm-shop-order-2"', '<main class="main eq-mx-o-2"'),
    ('<section class="eq-home-band eq-cm-shop-order-4"', '<section class="eq-home-band eq-mx-o-4"'),
    ('<section class="eq-home-band eq-band-soft eq-cm-shop-order-5"', '<section class="eq-home-band eq-band-soft eq-mx-o-6"'),
    ('<section class="eq-home-band eq-cm-shop-order-8" id="eq-home-catband"', '<section class="eq-home-band eq-mx-o-5" id="eq-home-catband"'),
    ('eq-cm-twin-wrap eq-cm-shop-order-7"', 'eq-cm-twin-wrap eq-mx-o-8"'),
    ('<section class="eq-cta-band eq-cm-shop-order-10"', '<section class="eq-cta-band eq-mx-o-9"'),
    ('<section class="eq-home-band eq-cm-shop-order-6" aria-label="Popüler markalar"', '<section class="eq-home-band eq-mx-o-4b" aria-label="Popüler markalar"'),
]
for a, b in replacements:
    if a in t and b not in t:
        t = t.replace(a, b, 1)

if "eq-home-mutbex.js" not in t:
    t = t.replace(
        '<script src="/ecom-cart.js"></script>',
        '<script src="/ecom-cart.js"></script>\n<script src="/eq-home-mutbex.js" defer></script>',
        1,
    )

if "eqMxFillSpotlight" not in t:
    t = t.replace(
        "function renderHomeRails(){\n  try {",
        "function renderHomeRails(){\n  try {\n    if (typeof eqMxFillSpotlight === 'function') eqMxFillSpotlight();",
        1,
    )

p.write_text(t, encoding="utf-8")
print("OK", p)
