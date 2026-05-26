/**
 * Crawler / AI önizleme indeksi — statik URL listesi (MPA prerender placeholder).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://equsto.com";
const outDir = path.join(root, "public", "seo", "prerender");
const outFile = path.join(outDir, "index.html");

const urls = [
  ORIGIN + "/",
  ORIGIN + "/shop",
  ORIGIN + "/pfos",
  ORIGIN + "/besos",
  ORIGIN + "/steakhouse-kurulumu",
  ORIGIN + "/bulut-mutfak-kurulumu",
  ORIGIN + "/cafe-kurulumu",
  ORIGIN + "/catering-mutfagi",
  ORIGIN + "/fine-dining-kurulumu",
  ORIGIN + "/all-day-dining-kurulumu",
  ORIGIN + "/fast-food-kurulumu",
  ORIGIN + "/en/besos",
  ORIGIN + "/en/pfos",
  ORIGIN + "/en/cloud-kitchen-setup",
  ORIGIN + "/en/cafe-setup",
  ORIGIN + "/en/catering-kitchen-setup",
  ORIGIN + "/en/fine-dining-setup",
  ORIGIN + "/en/all-day-dining-setup",
  ORIGIN + "/en/fast-food-setup",
  ORIGIN + "/pfos/restoran/istanbul/fine-dining/80m2",
  ORIGIN + "/pfos/kafe/izmir/specialty-coffee/45m2",
  ORIGIN + "/pfos/catering/ankara/toplu-yemek/120m2",
  ORIGIN + "/projeler",
  ORIGIN + "/projeler/istanbul-yuksek-hacim-catering-demode",
  ORIGIN + "/rehber/mutfak-alani-kisi-basi-metrekare-2026",
];

const items = urls
  .map(
    (u) =>
      `    <li><a href="${u}">${u.replace(ORIGIN, "")}</a> — Equsto vitrin / PFOS / GEO rehber</li>`
  )
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Equsto SEO Prerender Index</title>
<meta name="robots" content="index, follow">
<meta name="description" content="Equsto kanonik URL indeksi — vitrin, Proje Fabrikası, Besos ve kurulum rehberleri.">
<link rel="canonical" href="${ORIGIN}/seo/prerender/index.html">
</head>
<body>
<main>
  <h1>Equsto · SEO prerender indeksi</h1>
  <p>Statik MPA sayfaları için tarayıcı / AI önizleme bağlantı listesi. Güncelleme: ${new Date().toISOString().slice(0, 10)}.</p>
  <ul>
${items}
  </ul>
</main>
<span style="display:none">EQ-SK-2026-SEO-PRERENDER</span>
</body>
</html>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
console.log("[seo:prerender]", outFile);
