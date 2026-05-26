#!/usr/bin/env node
/**
 * EQUSTO SEO/GEO.docx gereksinimleri — tek seferlik bakım.
 * Kullanım: node scripts/patch-seo-geo-complete.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const INDEX = path.join(ROOT, "index.html");

const TITLE = "Equsto — Endüstriyel Mutfak ve Gastronomi Çözümleri";
const DESC =
  "Restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanları: pişirme, soğutma, yıkama, hazırlık, kahve ve içecek. Proje Fabrikası ile 5 dakikada teklif özeti; Bar Design Studio · Besos.";

function patchIndex() {
  let html = fs.readFileSync(INDEX, "utf8");
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${DESC}">`
  );
  html = html.replace(/\n<meta name="keywords" content="[^"]*">\n/, "\n");
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${TITLE}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${DESC}">`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${TITLE}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${DESC}">`
  );
  html = html.replace(/"dateModified": "2026-05-26"/g, '"dateModified": "2026-05-27"');
  const mojibake = [
    [/EndÃ¼striyel/g, "Endüstriyel"],
    [/Ã‡Ã¶zÃ¼mleri/g, "Çözümleri"],
    [/iÃ§in/g, "için"],
    [/ekipmanlarÄ±/g, "ekipmanları"],
    [/piÅŸirme/g, "pişirme"],
    [/soÄŸutma/g, "soğutma"],
    [/yÄ±kama/g, "yıkama"],
    [/hazÄ±rlÄ±k/g, "hazırlık"],
    [/iÃ§ecek/g, "içecek"],
    [/FabrikasÄ±/g, "Fabrikası"],
    [/anÄ±nda/g, "anında"],
    [/TÃ¼rkiye/g, "Türkiye"],
    [/Ã–ztiryakiler/g, "Öztiryakiler"],
    [/seÃ§ili/g, "seçili"],
    [/Ã¼rÃ¼nleri/g, "ürünleri"],
    [/sÃ¼rede/g, "sürede"],
    [/oluÅŸturulur/g, "oluşturulur"],
    [/TasarÄ±mÄ±/g, "Tasarımı"],
    [/DanÄ±ÅŸmanlÄ±ÄŸÄ±/g, "Danışmanlığı"],
    [/MÃ¼hendisliÄŸi/g, "Mühendisliği"],
    [/gÃ¼venliÄŸi/g, "güvenliği"],
    [/verimliliÄŸi/g, "verimliliği"],
    [/â€"/g, "—"],
    [/Â·/g, "·"],
  ];
  for (const [re, rep] of mojibake) html = html.replace(re, rep);
  fs.writeFileSync(INDEX, html, "utf8");
  console.log("patched index.html meta + JSON-LD mojibake");
}

patchIndex();
