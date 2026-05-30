/**
 * Header / topnav UTF-8 düzeltmesi — geo-landing, marka, index
 *   node scripts/patch-header-utf8.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const PARTIAL = path.join(PUBLIC, "partials/eq-d-header.html");

const SHARED = [
  ["? T?m Kategoriler", "☰ Tüm Kategoriler"],
  ["? T?m kategoriler", "☰ Tüm kategoriler"],
  ["? T\uFFFDm Kategoriler", "☰ Tüm Kategoriler"],
  ["? T\uFFFDm kategoriler", "☰ Tüm kategoriler"],
  ["?stanbul, T?rkiye", "İstanbul, Türkiye"],
  ["?r?n, marka veya kategori ara?", "Ürün, marka veya kategori ara…"],
  ["?r?n, marka veya kategori ara...", "Ürün, marka veya kategori ara..."],
  ['title="Tema">?', 'title="Tema">◐'],
  ["Sistem ? A??k ? Koyu", "Sistem · Açık · Koyu"],
  ["Hesab?m", "Hesabım"],
  ["?ye giri?i", "Üye girişi"],
  ["Projeler ve Listeler ?", "Projeler ve Listeler ▾"],
  ["?adeler", "İadeler"],
  ["ve Sipari?ler", "ve Siparişler"],
  ["Sepeti a?", "Sepeti aç"],
  ["?? 0", "🛒 0"],
  ["Al??veri? Sepeti", "Alışveriş Sepeti"],
  ["Proje Fabrikas?", "Proje Fabrikası"],
  ["Pi?irme Ekipmanlar?", "Pişirme Ekipmanları"],
  ["So?utma Ekipmanlar?", "Soğutma Ekipmanları"],
  ["Kahve Ekipmanlar?", "Kahve Ekipmanları"],
  ["Y?kama Ekipmanlar?", "Yıkama Ekipmanları"],
  ["Haz?rl?k Ekipmanlar?", "Hazırlık Ekipmanları"],
  ["??ecek Ekipmanlar?", "İçecek Ekipmanları"],
  ['aria-label="Kapat">?', 'aria-label="Kapat">×'],
  ["/* T?rk?e paragraf girintisi (sat?r ba?? ? tab) */", "/* Türkçe paragraf girintisi (satır başı · tab) */"],
];

function applyPairs(html) {
  let out = html.replace(/^\uFEFF/, "");
  for (const [a, b] of SHARED) {
    if (out.includes(a)) out = out.split(a).join(b);
  }
  return out;
}

function patchWithPairs(file) {
  if (!fs.existsSync(file)) {
    console.log("[skip]", file);
    return;
  }
  const before = fs.readFileSync(file, "utf8");
  let html = applyPairs(before);
  fs.writeFileSync(file, html, "utf8");
  const qBefore = (before.match(/\?(?=[A-Za-z\u0130\u0131\u015e\u015f\u011e\u011f\u00dc\u00fc\u00d6\u00f6\u00c7\u00e7])/g) || []).length;
  const qAfter = (html.match(/\? T\?m|Pi\?irme|So\?utma/g) || []).length;
  console.log("[ok]", path.basename(file), "suspicious ? patterns left:", qAfter);
}

function patchGeoLanding() {
  const file = path.join(PUBLIC, "geo-landing.html");
  if (!fs.existsSync(file)) {
    console.log("[skip] geo-landing.html (Next.js route)");
    return;
  }
  let html = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const header = fs.readFileSync(PARTIAL, "utf8").trim();
  const re = /<header class="hdr">[\s\S]*?<\/nav>/;
  if (!re.test(html)) {
    console.warn("[warn] geo-landing: header block not found, pairs only");
    patchWithPairs(file);
    return;
  }
  html = html.replace(re, header);
  html = applyPairs(html);
  fs.writeFileSync(file, html, "utf8");
  console.log("[ok] geo-landing.html — header synced from partial");
}

patchGeoLanding();
patchWithPairs(path.join(PUBLIC, "marka.html"));
patchWithPairs(path.join(PUBLIC, "index.html"));
