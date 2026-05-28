/**
 * Bozuk cp1254/HTML fallback metinlerini UTF-8 Türkçe ile düzeltir (kahve, pisirme).
 *   node scripts/patch-dept-html-utf8.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  path.join(ROOT, "public/kahve.html"),
  path.join(ROOT, "public/pisirme.html"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/kahve.html"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/pisirme.html"),
];

const SHARED = [
  ["? T?m Kategoriler", "☰ Tüm Kategoriler"],
  ["? T?m kategoriler", "☰ Tüm kategoriler"],
  ["?stanbul, T?rkiye", "İstanbul, Türkiye"],
  ["?r?n, marka veya kategori ara...", "Ürün, marka veya kategori ara..."],
  ['title="Tema">?', 'title="Tema">◐'],
  ["Hesab?m", "Hesabım"],
  ["Proje Fabrikas?", "Proje Fabrikası"],
  ["Pi?irme Ekipmanlar?", "Pişirme Ekipmanları"],
  ["So?utma Ekipmanlar?", "Soğutma Ekipmanları"],
  ["Kahve Ekipmanlar?", "Kahve Ekipmanları"],
  ["Y?kama Ekipmanlar?", "Yıkama Ekipmanları"],
  ["Haz?rl?k Ekipmanlar?", "Hazırlık Ekipmanları"],
  ["??ecek Ekipmanlar?", "İçecek Ekipmanları"],
  ["/* Pi?irme PLP v2 ? ba??ms?z, Cafemarkt tarz? */", "/* Pişirme PLP v2 — bağımsız, Cafemarkt tarzı */"],
  ["/* Cafemarkt tarz? facet", "/* Cafemarkt tarzı facet"],
  ["Katalog y?kleniyor?", "Katalog yükleniyor…"],
  ["B2B ? proje ? kanal ortakl?klar?", "B2B · proje · kanal ortaklıkları"],
  ["?erez tercihlerini y?net", "Çerez tercihlerini yönet"],
  ['aria-label="Kapat">?', 'aria-label="Kapat">×'],
  ["S?ralama", "Sıralama"],
  ["De?irmenler", "Değirmenler"],
  ["End?striyel", "Endüstriyel"],
  ["F?r?n", "Fırın"],
  ["Frit?z", "Fritöz"],
  ["Ekipmanlar? ? ", "Ekipmanları — "],
  [" ? Equsto", " · Equsto"],
  ["Kar???k S?ra", "Karışık Sıra"],
];

const BY_FILE = {
  "kahve.html": [
    [
      "<title>Kahve Ekipmanlar? ? Espresso Makineleri, De?irmenler ? Equsto</title>",
      "<title>Kahve Ekipmanları — Espresso Makineleri, Değirmenler · Equsto</title>",
    ],
    [
      'content="Profesyonel kahve makineleri, espresso barista istasyonlar?, de?irmenler, filtre kahve makineleri. Specialty cafe, otel ve restoran projeleri i?in Equsto g?vencesiyle teklif al."',
      'content="Profesyonel kahve makineleri, espresso barista istasyonları, değirmenler, filtre kahve makineleri. Specialty cafe, otel ve restoran projeleri için Equsto güvencesiyle teklif al."',
    ],
    [
      "<p class=\"eq-dept-plp-lead\">Espresso, ???t?c?, filtre kahve ve barista ekipmanlar?</p>",
      "<p class=\"eq-dept-plp-lead\">Espresso, öğütücü, filtre kahve ve barista ekipmanları</p>",
    ],
  ],
  "pisirme.html": [
    [
      "<title>Pi?irme Ekipmanlar? ? End?striyel Ocak, F?r?n, Frit?z ? Equsto</title>",
      "<title>Pişirme Ekipmanları — Endüstriyel Ocak, Fırın, Fritöz · Equsto</title>",
    ],
    [
      'content="End?striyel pi?irme ekipmanlar?: ocak, frit?z, f?r?n, salamander, d?ner. Restoran, otel ve catering i?in Equsto."',
      'content="Endüstriyel pişirme ekipmanları: ocak, fritöz, fırın, salamander, döner. Restoran, otel ve catering için Equsto."',
    ],
    [
      "<p class=\"eq-dept-plp-lead\">Ocaklar, ?zgaralar, kuzineler, frit?zler, d?ner ve tost ekipmanlar?</p>",
      "<p class=\"eq-dept-plp-lead\">Ocaklar, ızgaralar, kuzineler, fritözler, döner ve tost ekipmanları</p>",
    ],
  ],
};

function patchFile(file) {
  if (!fs.existsSync(file)) {
    console.log("[skip]", file);
    return;
  }
  let html = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const name = path.basename(file);
  for (const [a, b] of SHARED) {
    if (html.includes(a)) html = html.split(a).join(b);
  }
  for (const [a, b] of BY_FILE[name] || []) {
    if (html.includes(a)) html = html.split(a).join(b);
  }
  if (html.includes("?")) {
    const left = (html.match(/\?/g) || []).length;
    console.warn("[warn]", file, "hâlâ", left, "?' karakteri");
  }
  fs.writeFileSync(file, html, "utf8");
  console.log("[ok]", file);
}

for (const f of TARGETS) patchFile(f);
