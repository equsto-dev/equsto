/**
 * Korunan modüller: admin, PFOS, BESOS + paylaşılan public varlıkları.
 * Önce ../public kopyalar, eksikleri equsto.com'dan indirir.
 *
 *   node scripts/sync-legacy-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_PUBLIC = path.join(ROOT, "..", "..", "public");
const PUBLIC = path.join(ROOT, "public");
const BASE = "https://equsto.com";

const LIVE_FILES = [
  "admin.html",
  "admin-gate.js",
  "admin-config.js",
  "admin-eticaret.js",
  "admin-eticaret-kategori.js",
  "admin-eticaret-kategori-overrides.js",
  "admin-eticaret-api.js",
  "admin-eticaret-kategori-ui.js",
  "admin-vitrin.js",
  "eq-footer.js",
  "data/footer-vitrin.json",
  "eq-product-card-tint.js",
  "eq-photo-search.js",
  "eq-cart.css",
  "i18n/tr.json",
  "data/tr-adres.json",
  "data/pfos-rules.json",
  "data/pfos-nakliye-bolgeler.json",
  "data/pfos-address-patches.json",
  "data/product-category-overrides.json",
  "pfos.html",
  "bar-design.html",
  "bar-module.html",
  "imt300.html",
  "theme.css",
  "theme.js",
  "eq-home-mutbex.css",
  "eq-home-decor.css",
  "eq-dept-plp.css",
  "eq-home-vitrin.js",
  "eq-vendor-sanitize.js",
  "eq-category-overrides.js",
  "eq-mutbex-chrome.js",
  "eq-product-compare.js",
  "manifest.json",
  "og-cover.jpg",
  "contact.css",
  "contact.js",
  "equsto-bize-ulasin-isimlik.png",
  "equsto-member.js",
  "nav.js",
  "equsto-logo.js",
  "eq-site-urls.js",
  "eq-i18n.js",
  "eq-dept-tips.js",
  "ecom-data.js",
  "ecom-cart.js",
  "equsto-member.js",
  "equsto-auth-client.js",
  "eq-analytics.js",
  "eq-pfos-programmatic-seo.js",
  "equsto-engine.js",
  "pfos-rule-engine.js",
  "equsto-pricing-core.js",
  "pfos-pricing.js",
  "pfos-calc-engine.js",
  "pfos-location.js",
  "pfos-teklif-ui.js",
  "pfos-teklif-excel.js",
  "equsto-adres-national.js",
  "pfos-teklif-vitrin.js",
  "besos/index.html",
  "data/pfos-zone-catalog.json",
  "data/imt300-product.json",
  "data/templates/equsto_teklif_v14.xlsx",
  "images/favicon.svg",
  "images/home/hero-yer-sofrasi-bufe.png",
  "images/home/hero-bar-cocktailstation.png",
  "images/home/hero-pfos-cover.jpg",
  "images/equsto-logo.png",
];

function copyTree(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  const st = fs.statSync(src);
  if (st.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return 1;
  }
  for (const name of fs.readdirSync(src)) {
    n += copyTree(path.join(src, name), path.join(dest, name));
  }
  return n;
}

async function download(rel) {
  const url = `${BASE}/${rel.replace(/^\//, "")}`;
  const dest = path.join(PUBLIC, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: { Accept: "*/*" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  fs.mkdirSync(PUBLIC, { recursive: true });
  const copied = copyTree(LEGACY_PUBLIC, PUBLIC);
  console.log(`[sync] Yerel public'ten ${copied} dosya kopyalandı`);

  let ok = 0;
  let skip = 0;
  for (const rel of LIVE_FILES) {
    const dest = path.join(PUBLIC, rel);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 200) {
      continue;
    }
    try {
      const n = await download(rel);
      console.log(`  OK ${rel} (${(n / 1024).toFixed(1)} KB)`);
      ok++;
    } catch (e) {
      console.warn(`  SKIP ${rel} — ${e.message}`);
      skip++;
    }
  }
  console.log(`[sync] Canlıdan: ${ok} indirildi, ${skip} atlandı`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
