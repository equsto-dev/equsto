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
