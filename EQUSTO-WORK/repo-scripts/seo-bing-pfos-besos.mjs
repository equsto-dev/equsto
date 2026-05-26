/**
 * Bing Webmaster — PFOS + Besos öncelik URL listesi ve canlı kontrol.
 * npm run seo:bing-pfos-besos
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN } from "./eq-seo-lib.mjs";
import { pfosBesosPriorityUrls } from "./eq-pfos-besos-urls.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outTxt = path.join(root, "deploy", "bing-pfos-besos-urls.txt");
const urls = pfosBesosPriorityUrls(ORIGIN);

const lines = [
  "# Bing Webmaster Tools — URL Gönderimi (Submit URLs)",
  "# Site haritaları (önce): https://equsto.com/sitemap-priority.xml",
  "# Sonra: https://equsto.com/sitemap.xml",
  "#",
  "# URL Gönderimi → aşağıdaki adresleri tek tek veya grupla gönderin:",
  "",
  ...urls,
  "",
];

fs.mkdirSync(path.dirname(outTxt), { recursive: true });
fs.writeFileSync(outTxt, lines.join("\n"), "utf8");

console.log("[bing-pfos-besos] URL listesi:", outTxt);
console.log("[bing-pfos-besos] Toplam", urls.length, "URL\n");
console.log("Bing Webmaster adımları:");
console.log("1. Site haritaları → Submit → https://equsto.com/sitemap-priority.xml");
console.log("2. (isteğe bağlı) https://equsto.com/sitemap.xml");
console.log("3. URL Gönderimi → önce şunlar:");
for (const u of urls.slice(0, 6)) console.log("   ", u);
if (urls.length > 6) console.log("   ... +" + (urls.length - 6) + " modül (tam liste:", outTxt + ")");
console.log("4. IndexNow: .env INDEXNOW_KEY + npm run seo:indexnow + npm run seo:ping\n");

async function head(url) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    return r.status;
  } catch (_) {
    return 0;
  }
}

console.log("Canlı kontrol:");
for (const u of [
  `${ORIGIN}/pfos`,
  `${ORIGIN}/besos`,
  `${ORIGIN}/sitemap-priority.xml`,
]) {
  const st = await head(u);
  console.log(st === 200 ? "OK" : "FAIL", st, u);
}
