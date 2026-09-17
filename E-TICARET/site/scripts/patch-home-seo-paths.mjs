#!/usr/bin/env node
/** Ana sayfa: gizli catstrip butonları → gerçek /shop linkleri + görünür GEO yolları. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const target = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "lib/vitrin/bodies/index.ts",
);
const raw = fs.readFileSync(target, "utf8");
const prefix = 'export const IndexBodyHtml = "';
const start = raw.indexOf(prefix);
const end = raw.lastIndexOf('";');
if (start < 0 || end < 0) throw new Error("IndexBodyHtml not found");

let html = JSON.parse(`"${raw.slice(start + prefix.length, end)}"`);

html = html.replace(
  '<button type="button" class="eq-decor-catstrip__link eq-decor-catstrip__link--all" onclick="toggleCatPicker()">Tüm kategoriler</button>',
  '<a class="eq-decor-catstrip__link eq-decor-catstrip__link--all" href="/shop">Tüm kategoriler</a>',
);

const depts = [
  ["pisirme", "Pişirme Ekipmanları"],
  ["sogutma", "Soğutma Ekipmanları"],
  ["kahve", "Kahve Ekipmanları"],
  ["yikama", "Yıkama Ekipmanları"],
  ["hazirlik", "Hazırlık Ekipmanları"],
  ["icecek", "İçecek Ekipmanları"],
  ["set-ustu-mutfak", "Set Üstü Mutfak Ekipmanları"],
];
for (const [slug, label] of depts) {
  html = html.replace(
    `<button type="button" class="eq-decor-catstrip__link" onclick="eqDeptGo('${slug}')">${label}</button>`,
    `<a class="eq-decor-catstrip__link" href="/shop/${slug}">${label}</a>`,
  );
}

const seoNav = `<nav class="eq-home-seo-paths" aria-label="Tedarik ve proje">
        <a href="/endustriyel-mutfak-ekipmani-turkiye">Endüstriyel mutfak ekipmanı</a>
        <a href="/mutfak-teklif-platformu">Restoran mutfak teklifi</a>
        <a href="/oztiryakiler-ekipmani-tedarik">Öztiryakiler tedarik</a>
        <a href="/steakhouse-kurulumu">Steakhouse kurulumu</a>
        <a href="/pfos">Proje Fabrikası</a>
      </nav>`;

if (!html.includes("eq-home-seo-paths")) {
  const brands = '<section class="eq-home-band eq-mx-o-4b" aria-label="Popüler markalar">';
  if (!html.includes(brands)) throw new Error("brand section not found");
  html = html.replace(brands, `${seoNav}\n\n      ${brands}`);
}

fs.writeFileSync(target, `export const IndexBodyHtml = ${JSON.stringify(html)};\n`, "utf8");
console.log("[patch-home-seo-paths] OK");
