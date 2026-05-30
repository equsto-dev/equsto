import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../lib/vitrin/bodies/index.ts");
let raw = fs.readFileSync(file, "utf8");

const pairs = [
  ['aria-label=\\"Popüler Kategoriler\\"', 'aria-label=\\"Popüler Kategoriler\\" data-i18n-attr=\\"aria-label:home.cat_strip_h\\"'],
  ['class=\\"eq-mx-pop-cats__title\\">Popüler Kategoriler<', 'class=\\"eq-mx-pop-cats__title\\" data-i18n=\\"home.cat_strip_h\\">Popüler Kategoriler<'],
  ['class=\\"eq-mx-brand__kicker\\">Profesyonel Mutfağın Markası<', 'class=\\"eq-mx-brand__kicker\\" data-i18n=\\"home.brand_kicker\\">Profesyonel Mutfağın Markası<'],
  ['class=\\"eq-mx-brand__cta\\">Tüm Öztiryakiler ürünleri →<', 'class=\\"eq-mx-brand__cta\\" data-i18n=\\"home.brand_cta\\">Tüm Öztiryakiler ürünleri →<'],
  ['aria-label=\\"Öne çıkan ürünler\\"', 'aria-label=\\"Öne çıkan ürünler\\" data-i18n-attr=\\"aria-label:home.featured_aria\\"'],
  ['data-eq-rail-tab=\\"campaign\\">Kampanyalı Ürünler<', 'data-eq-rail-tab=\\"campaign\\" data-i18n=\\"home.rail_tab_campaign\\">Kampanyalı Ürünler<'],
  ['data-eq-rail-tab=\\"bestseller\\">En Çok Satanlar<', 'data-eq-rail-tab=\\"bestseller\\" data-i18n=\\"home.rail_tab_bestseller\\">En Çok Satanlar<'],
  ['class=\\"eq-mx-rail__view-all\\">Tümünü gör →<', 'class=\\"eq-mx-rail__view-all\\" data-i18n=\\"home.rail_view_all\\">Tümünü gör →<'],
  ['class=\\"eq-home-grid-title\\">Tüm Ürünler<', 'class=\\"eq-home-grid-title\\" data-i18n=\\"home.main_title\\">Tüm Ürünler<'],
  ['id=\\"eq-home-load-more\\">Daha Fazla Göster<', 'id=\\"eq-home-load-more\\" data-i18n=\\"home.load_more\\">Daha Fazla Göster<'],
  ['class=\\"eq-mx-new__kicker\\">Kataloğa Yeni Eklendi<', 'class=\\"eq-mx-new__kicker\\" data-i18n=\\"home.new_kicker\\">Kataloğa Yeni Eklendi<'],
  ['class=\\"eq-mx-new__title\\">Yeni eklenen ekipmanlar<', 'class=\\"eq-mx-new__title\\" data-i18n=\\"home.new_h\\">Yeni eklenen ekipmanlar<'],
  ['class=\\"eq-mx-trust__title\\">Güvenli Alışveriş<', 'class=\\"eq-mx-trust__title\\" data-i18n=\\"home.trust_1_h\\">Güvenli Alışveriş<'],
  ['class=\\"eq-mx-brands__title\\">Popüler Markalarımız<', 'class=\\"eq-mx-brands__title\\" data-i18n=\\"home.brands_h\\">Popüler Markalarımız<'],
  ['aria-label=\\"Öne çıkanlar\\"', 'aria-label=\\"Öne çıkanlar\\" data-i18n-attr=\\"aria-label:home.featured_band_aria\\"'],
  ['<span>Öne çıkanlar</span>', '<span data-i18n=\\"home.featured_band_title\\">Öne çıkanlar</span>'],
  ['class=\\"eq-home-band-link\\" href=\\"/shop/pisirme\\">Tümünü gör →<', 'class=\\"eq-home-band-link\\" href=\\"/shop/pisirme\\" data-i18n=\\"home.rail_view_all\\">Tümünü gör →<'],
  ['aria-label=\\"Çözümler\\"', 'aria-label=\\"Çözümler\\" data-i18n-attr=\\"aria-label:home.decor_promos_aria\\"'],
  ['class=\\"eq-decor-promo__kicker\\">Proje Fabrikası<', 'class=\\"eq-decor-promo__kicker\\" data-i18n=\\"home.decor_promo_pfos_kicker\\">Proje Fabrikası<'],
  ['class=\\"eq-decor-promo__h\\">Beş dakikada liste, anlık teklif<', 'class=\\"eq-decor-promo__h\\" data-i18n=\\"home.decor_promo_pfos_h\\">Beş dakikada liste, anlık teklif<'],
  ['class=\\"eq-decor-promo__p\\">Adım adım soru-cevap ile ekipman listeniz.<', 'class=\\"eq-decor-promo__p\\" data-i18n=\\"home.decor_promo_pfos_p\\">Adım adım soru-cevap ile ekipman listeniz.<'],
  ['class=\\"eq-decor-promo__cta\\">Projeyi başlat →<', 'class=\\"eq-decor-promo__cta\\" data-i18n=\\"home.decor_promo_pfos_cta\\">Projeyi başlat →<'],
  ['class=\\"eq-decor-promo__kicker\\">Bar Design<', 'class=\\"eq-decor-promo__kicker\\" data-i18n=\\"home.decor_promo_bar_kicker\\">Bar Design<'],
  ['class=\\"eq-decor-promo__h\\">IMT300 · modüler kokteyl istasyonu<', 'class=\\"eq-decor-promo__h\\" data-i18n=\\"home.decor_promo_bar_h\\">IMT300 · modüler kokteyl istasyonu<'],
  ['class=\\"eq-decor-promo__p\\">Berrak buz ve bar modül seçimi.<', 'class=\\"eq-decor-promo__p\\" data-i18n=\\"home.decor_promo_bar_p\\">Berrak buz ve bar modül seçimi.<'],
  ['class=\\"eq-decor-promo__cta\\">Bar Design →<', 'class=\\"eq-decor-promo__cta\\" data-i18n=\\"home.decor_promo_bar_cta\\">Bar Design →<'],
  ['class=\\"eq-decor-promo__soon\\">PEK YAKINDA<', 'class=\\"eq-decor-promo__soon\\" data-i18n=\\"home.decor_promo_yer_soon\\">PEK YAKINDA<'],
  ['class=\\"eq-decor-promo__kicker\\">Yer Sofrası<', 'class=\\"eq-decor-promo__kicker\\" data-i18n=\\"home.decor_promo_yer_kicker\\">Yer Sofrası<'],
  ['class=\\"eq-decor-promo__h\\">Restoran &amp; catering servis hatları<', 'class=\\"eq-decor-promo__h\\" data-i18n=\\"home.decor_promo_yer_h\\">Restoran &amp; catering servis hatları<'],
  ['class=\\"eq-decor-promo__p\\">Konsept vitrin ve açık büfe — çok yakında.<', 'class=\\"eq-decor-promo__p\\" data-i18n=\\"home.decor_promo_yer_p\\">Konsept vitrin ve açık büfe — çok yakında.<'],
  ['class=\\"eq-mx-pop-cats__nav eq-mx-pop-cats__nav--prev\\" aria-label=\\"Önceki\\"', 'class=\\"eq-mx-pop-cats__nav eq-mx-pop-cats__nav--prev\\" aria-label=\\"Önceki\\" data-i18n-attr=\\"aria-label:home.pop_cat_prev\\"'],
  ['class=\\"eq-mx-pop-cats__nav eq-mx-pop-cats__nav--next\\" aria-label=\\"Sonraki\\"', 'class=\\"eq-mx-pop-cats__nav eq-mx-pop-cats__nav--next\\" aria-label=\\"Sonraki\\" data-i18n-attr=\\"aria-label:home.pop_cat_next\\"'],
  ['aria-label=\\"Proje teklifi\\"', 'aria-label=\\"Proje teklifi\\" data-i18n-attr=\\"aria-label:home.cta_band_aria\\"'],
  ['class=\\"eq-cta-kicker\\">Mr. Equsto ile çalış<', 'class=\\"eq-cta-kicker\\" data-i18n=\\"home.cta_kicker\\">Mr. Equsto ile çalış<'],
  ['class=\\"eq-cta-h2\\">Profesyonel mutfağınızı birlikte planlayalım<', 'class=\\"eq-cta-h2\\" data-i18n=\\"home.cta_h2\\">Profesyonel mutfağınızı birlikte planlayalım<'],
  ['class=\\"eq-cta-p\\">Konseptinizi anlatın; Mr. Equsto sizin için en uygun ekipman setini, kapasiteyi ve markayı seçsin — teklifinizi 24 saatte hazırlayalım.<', 'class=\\"eq-cta-p\\" data-i18n=\\"home.cta_p\\">Konseptinizi anlatın; Mr. Equsto sizin için en uygun ekipman setini, kapasiteyi ve markayı seçsin — teklifinizi 24 saatte hazırlayalım.<'],
  ['class=\\"eq-cta-btn-primary\\" onclick=\\"eqGo(\'pfos\')\\">Proje Fabrikası\'na git<', 'class=\\"eq-cta-btn-primary\\" onclick=\\"eqGo(\'pfos\')\\" data-i18n=\\"home.cta_btn_pfos\\">Proje Fabrikası\'na git<'],
  ['class=\\"eq-cta-btn-secondary\\" onclick=\\"typeof eqGo===\'function\'?eqGo(\'contact\'):location.href=\'/contact.html\'\\">Uzmana danış<', 'class=\\"eq-cta-btn-secondary\\" onclick=\\"typeof eqGo===\'function\'?eqGo(\'contact\'):location.href=\'/contact.html\'\\" data-i18n=\\"home.cta_btn_contact\\">Uzmana danış<'],
];

let n = 0;
for (const [from, to] of pairs) {
  if (raw.includes(to)) continue;
  if (!raw.includes(from)) {
    console.warn("[skip]", from.slice(0, 55));
    continue;
  }
  raw = raw.replace(from, to);
  n++;
}
fs.writeFileSync(file, raw, "utf8");
console.log("[patch-home-body-i18n]", n, "ok");
