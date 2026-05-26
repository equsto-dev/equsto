/**
 * PFOS + Besos — Search Console için URL listesi ve kontrol.
 * npm run seo:gsc-pfos-besos
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN } from "./eq-seo-lib.mjs";
import { pfosBesosPriorityUrls } from "./eq-pfos-besos-urls.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outTxt = path.join(root, "deploy", "gsc-pfos-besos-urls.txt");
const urls = pfosBesosPriorityUrls(ORIGIN);

const lines = [
  "# Google Search Console → URL denetimi → yapıştır → Dizine eklenmesini iste",
  "# Site haritaları → https://equsto.com/sitemap-priority.xml (önce) + sitemap.xml",
  "",
  ...urls,
  "",
];

fs.mkdirSync(path.dirname(outTxt), { recursive: true });
fs.writeFileSync(outTxt, lines.join("\n"), "utf8");

console.log("[gsc-pfos-besos] URL listesi:", outTxt);
console.log("[gsc-pfos-besos] Toplam", urls.length, "URL (PFOS, Besos, modüller)\n");
console.log("Search Console adımları:");
console.log("1. Dizin oluşturma → Site haritaları → https://equsto.com/sitemap-priority.xml");
console.log("2. URL denetimi → sırayla yapıştır → Dizine eklenmesini iste:\n");
for (const u of urls.slice(0, 6)) console.log("   ", u);
if (urls.length > 6) console.log("   ... +" + (urls.length - 6) + " modül (tam liste:", outTxt + ")");

async function head(url) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    return r.status;
  } catch (_) {
    return 0;
  }
}

console.log("\nCanlı kontrol:");
for (const u of [`${ORIGIN}/pfos`, `${ORIGIN}/besos`, `${ORIGIN}/sitemap-priority.xml`]) {
  const st = await head(u);
  console.log(st === 200 ? "OK" : "FAIL", st, u);
}
