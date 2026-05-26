/**
 * equsto.com → public/ geri yükleme (yerel dosyalar silindiyse).
 *   node scripts/restore-from-live.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const BASE = "https://equsto.com";

/** Deploy / mağaza için kritik statik dosyalar */
const FILES = [
  ".htaccess",
  "index.html",
  "admin.html",
  "pfos.html",
  "product.html",
  "login.html",
  "contact.html",
  "contact.css",
  "contact.js",
  "marka.html",
  "sepet.html",
  "bar-design.html",
  "bar-module.html",
  "theme.css",
  "theme.js",
  "nav.js",
  "equsto-logo.js",
  "eq-site-urls.js",
  "eq-i18n.js",
  "eq-home-mutbex.css",
  "eq-home-mutbex.js",
  "eq-vitrin-config.js",
  "eq-shop-vitrin.js",
  "eq-shop-header.js",
  "eq-mutbex-chrome.js",
  "eq-display-terminology.js",
  "eq-dept-plp.css",
  "eq-dept-plp.js",
  "eq-dept-plp-config.js",
  "eq-dept-tips.js",
  "eq-dept-cm-facets.js",
  "eq-fiyatlar-bridge.js",
  "eq-filter-column.js",
  "eq-shop-catalog-bootstrap.js",
  "eq-product-card-tint.js",
  "eq-vendor-sanitize.js",
  "eq-header-search.js",
  "eq-photo-search.js",
  "ecom-data.js",
  "ecom-cart.js",
  "equsto-member.js",
  "equsto-auth-client.js",
  "equsto-logo.js",
  "admin-eticaret.js",
  "admin-eticaret-kategori.js",
  "admin-eticaret-kategori-overrides.js",
  "auth-api-base.json",
  "pisirme.html",
  "sogutma.html",
  "kahve.html",
  "yikama.html",
  "hazirlik.html",
  "icecek.html",
  "tezgah.html",
  "dolap.html",
  "davlumbaz.html",
  "tasima.html",
  "araba.html",
  "istif.html",
  "market-reyonlari.html",
  "shop/index.html",
  "besos/index.html",
  "bar-module.html",
  "equsto-engine.js",
  "pfos-rule-engine.js",
  "equsto-pricing-core.js",
  "pfos-pricing.js",
  "pfos-calc-engine.js",
  "pfos-location.js",
  "pfos-teklif-ui.js",
  "pfos-teklif-excel.js",
  "eq-pfos-programmatic-seo.js",
  "equsto-adres-national.js",
  "eq-bar-design-vitrum.js",
  "eq-bar-module-url.js",
  "eq-bar-module.js",
  "eq-besos-head-seo.js",
  "eq-besos-head-seo-config.js",
  "eq-youtube-embed.js",
  "eq-youtube-embed.css",
  "eq-auth-api.js",
  "data/pfos-zone-catalog.json",
  "data/pfos-catalog.json",
  "data/pfos-projects.json",
  "data/vitrum-bars-landing.json",
  "data/vitrum-bar-projects.json",
  "data/ekipmanlar.json",
  "data/fiyatlar.json",
  "data/homepage-vitrin.json",
  "data/dept/pisirme.json",
  "data/dept/sogutma.json",
  "data/dept/kahve.json",
  "data/dept/yikama.json",
  "data/dept/hazirlik.json",
  "data/dept/icecek.json",
  "data/dept/tezgah.json",
  "data/dept/dolap.json",
  "data/dept/davlumbaz.json",
  "data/dept/tasima.json",
  "data/dept/araba.json",
  "data/dept/istif.json",
  "images/equsto-logo.png",
  "images/equsto-logo-white.png",
  "sitemap.xml",
  "llms.txt",
];

async function download(rel) {
  const url = `${BASE}/${rel.replace(/^\//, "")}`;
  const dest = path.join(PUBLIC, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: { Accept: "*/*" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 80 && buf.toString("utf8").includes("<!DOCTYPE")) {
    throw new Error("HTML hata sayfası");
  }
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  console.log("[restore] Kaynak:", BASE);
  console.log("[restore] Hedef:", PUBLIC);
  let ok = 0;
  let fail = 0;
  for (const rel of FILES) {
    try {
      const n = await download(rel);
      console.log(`  OK ${rel} (${(n / 1024).toFixed(1)} KB)`);
      ok++;
    } catch (e) {
      console.warn(`  SKIP ${rel} — ${e.message}`);
      fail++;
    }
  }
  console.log(`[restore] Bitti: ${ok} OK, ${fail} atlandı`);
  console.log("[restore] scripts/ ve package.json canlıda yok — Git/yedek gerekir.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
