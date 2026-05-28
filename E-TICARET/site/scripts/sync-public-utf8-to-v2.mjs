/**
 * UTF-8 temiz public/ → equsto-v2/public/ (Vercel kökü)
 *   node equsto-v2/scripts/sync-public-utf8-to-v2.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const srcDir = path.join(root, "public");
const destDir = path.join(root, "equsto-v2/public");

/** Latin-1 / Windows-1254 yanlış decode (þ, ý, ð …) */
const LATIN1_TR = [
  ["Proje Fabrikas\u00fd", "Proje Fabrikası"],
  ["Pi\u00feirme", "Pişirme"],
  ["So\u00f0utma", "Soğutma"],
  ["Y\u00fdkama", "Yıkama"],
  ["Haz\u00fdrl\u00fdk", "Hazırlık"],
  ["\u00dd\u00e7ecek", "İçecek"],
  ["Ekipmanlar\u00fd", "Ekipmanları"],
  ["T\u00fcm", "Tüm"],
  ["\u00f6", "ö"],
  ["\u00fc", "ü"],
  ["\u00fe", "ş"],
  ["\u00f0", "ğ"],
  ["\u00fd", "ı"],
  ["\u00dd", "İ"],
  ["\u00de", "Ş"],
  ["\u00d0", "Ğ"],
];

/** UTF-8 kaybı: ? ile bozulmuş kalıplar (URL ?query= dokunulmaz — tam ifadeler) */
const QMARK_TR = [
  ["Set ?st? Mutfak Ekipmanlar?", "Set Üstü Mutfak Ekipmanları"],
  ["Set ?st? Mutfak", "Set Üstü Mutfak"],
  ["?ztiryakiler", "Öztiryakiler"],
  ["gere?leri", "gereçleri"],
  ["? T?m Kategoriler", "☰ Tüm Kategoriler"],
  ["? T?m kategoriler", "☰ Tüm kategoriler"],
  ["? Tüm kategoriler", "☰ Tüm kategoriler"],
  ["?stanbul", "İstanbul"],
  ["T?rkiye", "Türkiye"],
  ["?r?n, marka", "Ürün, marka"],
  ["Hesab?m", "Hesabım"],
  ["Proje Fabrikas?", "Proje Fabrikası"],
  ["Pi?irme Ekipmanlar?", "Pişirme Ekipmanları"],
  ["Pi?irme", "Pişirme"],
  ["So?utma Ekipmanlar?", "Soğutma Ekipmanları"],
  ["So?utma", "Soğutma"],
  ["Y?kama Ekipmanlar?", "Yıkama Ekipmanları"],
  ["Y?kama", "Yıkama"],
  ["Haz?rl?k Ekipmanlar?", "Hazırlık Ekipmanları"],
  ["Haz?rl?k", "Hazırlık"],
  ["??ecek Ekipmanlar?", "İçecek Ekipmanları"],
  ["??ecek", "İçecek"],
  ["?al??ma Tezgahlar?", "Çalışma Tezgahları"],
  ["Ekipmanlar?", "Ekipmanları"],
  ["S?ralama", "Sıralama"],
  ["Kar???k S?ra", "Karışık Sıra"],
  ["y?kleniyor?", "yükleniyor…"],
  ["B2B ? proje ? kanal ortakl?klar?", "B2B · proje · kanal ortaklıkları"],
  ["?erez tercihlerini y?net", "Çerez tercihlerini yönet"],
  ["katalog ? servis", "katalog — servis"],
  ["aksesuarlar?", "aksesuarları"],
  ["ba??ms?z", "bağımsız"],
  ["tarz?", "tarzı"],
  ["Pi?irme PLP v2 ? ba??ms?z, Cafemarkt tarz?", "Set üstü PLP v2 — bağımsız, Cafemarkt tarzı"],
  ['title="Tema">?', 'title="Tema">◐'],
  ['aria-label="Kapat">?', 'aria-label="Kapat">×'],
];

function fixTurkishText(s) {
  for (const [a, b] of LATIN1_TR) {
    if (s.includes(a)) s = s.split(a).join(b);
  }
  for (const [a, b] of QMARK_TR) {
    if (s.includes(a)) s = s.split(a).join(b);
  }
  return s;
}

function syncIndex() {
  const src = path.join(srcDir, "index.html");
  const dest = path.join(destDir, "index.html");
  let html = fs.readFileSync(src, "utf8");
  if (html.includes("eq-decor-catstrip")) {
    html = html.replace(
      /\s*<nav class="eq-decor-catstrip"[\s\S]*?<\/nav>\s*\n/,
      "\n"
    );
  }
  html = html
    .replace("/theme.css?v=20260521globalsearch", "/theme.css?v=20260519topnavstatic")
    .replace("/theme.js?v=20260521globalsearch", "/theme.js?v=20260519topnavstatic")
    .replace("/nav.js?v=20260521globalsearch", "/nav.js?v=20260528setustu")
    .replace("/eq-home-decor.css?v=20260528decor", "/eq-home-decor.css?v=20260519decor");
  fs.writeFileSync(dest, html, "utf8");
  return "index.html";
}

function listHtml(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith(".html")) out.push(name);
  }
  return out.sort();
}

const copied = [];
const skipped = [];

for (const name of listHtml(srcDir)) {
  if (name === "index.html") continue;
  const src = path.join(srcDir, name);
  const dest = path.join(destDir, name);
  let html = fs.readFileSync(src, "utf8");
  html = fixTurkishText(html);
  fs.writeFileSync(dest, html, "utf8");
  copied.push(name);
}

syncIndex();
copied.push("index.html (özel)");

const setUstu = path.join(destDir, "set-ustu-mutfak.html");
if (fs.existsSync(setUstu)) {
  let fixed = fixTurkishText(fs.readFileSync(setUstu, "utf8"));
  fixed = fixed
    .replace(
      "<title>Set Üstü Mutfak Ekipmanları ? Öztiryakiler ? Equsto</title>",
      "<title>Set Üstü Mutfak Ekipmanları · Öztiryakiler · Equsto</title>"
    )
    .replace(
      'content="Set ?st? mutfak ekipmanlar? ? servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları ? Öztiryakiler katalog ? Equsto"',
      'content="Set üstü mutfak ekipmanları — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları · Öztiryakiler katalog · Equsto"'
    )
    .replace(
      "/* Pişirme PLP v2 ? bağımsız, Cafemarkt tarzı */",
      "/* Set üstü PLP v2 — bağımsız, Cafemarkt tarzı */"
    );
  fs.writeFileSync(setUstu, fixed, "utf8");
  copied.push("set-ustu-mutfak.html (düzeltildi)");
}

const bad =
  /[\uFFFD]|Piirme|Pi\u00feirme|So\u00f0utma|Y\u00fdkama|\? T\?m|\? T\uFFFDm|Pi\?irme|So\?utma/;
let remain = 0;
for (const name of listHtml(destDir)) {
  const s = fs.readFileSync(path.join(destDir, name), "utf8");
  if (bad.test(s)) {
    remain++;
    console.warn("[utf8] hâlâ bozuk:", name);
  }
}

console.log("[sync-utf8] kopyalanan:", copied.length, "dosya");
console.log("[sync-utf8] örnek:", copied.slice(0, 8).join(", "), "…");
console.log("[sync-utf8] kalan bozuk HTML:", remain);
