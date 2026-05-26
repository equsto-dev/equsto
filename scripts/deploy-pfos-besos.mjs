/**
 * PFOS + BESOS tam paket → public/ (yerel) ve deploy-manifest.txt
 * Kaynak: equsto.com (canlı) + equsto-v2/public (varsa daha güncel)
 *
 *   node scripts/deploy-pfos-besos.mjs
 *   node scripts/deploy-pfos-besos.mjs --dry-run
 *
 * cPanel: public/ içeriğini (veya manifest'teki dosyaları) public_html'e yükleyin.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const V2_PUBLIC = path.join(ROOT, "EQUSTO-WORK", "E-TICARET", "site", "public");
const BASE = "https://equsto.com";
const DRY = process.argv.includes("--dry-run");

/** PFOS + BESOS + ortak bağımlılıklar */
const FILES = [
  ".htaccess",
  "pfos.html",
  "bar-design.html",
  "bar-module.html",
  "besos/index.html",
  "theme.css",
  "theme.js",
  "nav.js",
  "equsto-logo.js",
  "eq-site-urls.js",
  "eq-i18n.js",
  "eq-analytics.js",
  "ecom-data.js",
  "ecom-cart.js",
  "equsto-member.js",
  "equsto-auth-client.js",
  "contact.css",
  "contact.js",
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
  "eq-vitrum-catalogue-fallback.js",
  "eq-bar-module-url.js",
  "eq-bar-module.js",
  "eq-besos-head-seo.js",
  "eq-besos-head-seo-config.js",
  "eq-youtube-embed.js",
  "eq-youtube-embed.css",
  "eq-auth-api.js",
  "data/pfos-zone-catalog.json",
  "data/pfos-tip-shop-links.json",
  "data/pfos-catalog.json",
  "pfos-template-api.js",
  "data/pfos-projects.json",
  "data/vitrum-bars-landing.json",
  "data/vitrum-bar-projects.json",
  "data/vitrum-bars-catalogue.json",
  "data/fiyatlar.json",
  "assets/manifest-CtzHFPu3.json",
  "assets/besos-ice-mint-DUtHKFgd.png",
  "assets/besos-ice-bar-uGGlF5Nj.png",
  "assets/besos-ice-tong-DsigH4FN.png",
  "assets/besos-ice-diamond-DMNdO_4O.png",
  "assets/besos-ice-molds-6zkZE2su.png",
  "assets/besos-ice-sphere-NLq_ILu6.png",
  "images/home/hero-bar-cocktailstation.png",
];

async function download(rel) {
  const url = `${BASE}/${rel.replace(/^\//, "")}`;
  const dest = path.join(PUBLIC, rel);
  if (DRY) {
    console.log(`  [dry] ${rel}`);
    return;
  }
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

function copyLocal(rel) {
  for (const srcRoot of [V2_PUBLIC, path.join(ROOT, "public")]) {
    const src = path.join(srcRoot, rel);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(PUBLIC, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

async function ensureOgCover() {
  const dest = path.join(PUBLIC, "og-cover-besos.jpg");
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return;
  const src = path.join(PUBLIC, "images/home/hero-bar-cocktailstation.png");
  if (!fs.existsSync(src)) return;
  if (!DRY) fs.copyFileSync(src, dest);
  console.log("  OK og-cover-besos.jpg (hero-bar kopyası)");
}

function copyVitrumDrawings() {
  for (const srcRoot of [V2_PUBLIC, path.join(ROOT, "public")]) {
    const dir = path.join(srcRoot, "data/vitrum-drawings");
    if (!fs.existsSync(dir)) continue;
    const destDir = path.join(PUBLIC, "data/vitrum-drawings");
    if (DRY) {
      const n = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile()).length;
      console.log(`  [dry] data/vitrum-drawings/ (${n} files)`);
      return n;
    }
    fs.mkdirSync(destDir, { recursive: true });
    let n = 0;
    for (const f of fs.readdirSync(dir)) {
      const src = path.join(dir, f);
      if (!fs.statSync(src).isFile()) continue;
      fs.copyFileSync(src, path.join(destDir, f));
      n++;
    }
    console.log(`  OK data/vitrum-drawings/ (${n} files)`);
    return n;
  }
  console.warn("  SKIP data/vitrum-drawings/ — kaynak yok");
  return 0;
}

function ensureBesosCatalogue() {
  const catalogue = path.join(V2_PUBLIC, "data/vitrum-bars-catalogue.json");
  const buildScript = path.join(V2_PUBLIC, "../scripts/build-vitrum-catalogue.mjs");
  if (!fs.existsSync(catalogue) && fs.existsSync(buildScript)) {
    if (!DRY) {
      execFileSync(process.execPath, [buildScript], { cwd: path.join(V2_PUBLIC, ".."), stdio: "inherit" });
    } else {
      console.log("  [dry] would run build-vitrum-catalogue.mjs");
    }
  }
}

async function main() {
  console.log("[deploy-pfos-besos] Hedef:", PUBLIC);
  if (DRY) console.log("[deploy-pfos-besos] DRY RUN");

  let ok = 0;
  let skip = 0;
  for (const rel of FILES) {
    if (copyLocal(rel)) {
      console.log(`  LOCAL ${rel}`);
      ok++;
      continue;
    }
    try {
      const n = await download(rel);
      console.log(`  OK ${rel} (${((n || 0) / 1024).toFixed(1)} KB)`);
      ok++;
    } catch (e) {
      console.warn(`  SKIP ${rel} — ${e.message}`);
      skip++;
    }
  }

  ensureBesosCatalogue();
  copyVitrumDrawings();
  await ensureOgCover();

  const manifest = path.join(ROOT, "deploy-pfos-besos-manifest.txt");
  if (!DRY) {
    fs.writeFileSync(manifest, FILES.concat(["og-cover-besos.jpg"]).join("\n") + "\n", "utf8");
    console.log(`[deploy-pfos-besos] Manifest: ${manifest}`);
  }

  console.log(`[deploy-pfos-besos] Bitti: ${ok} dosya, ${skip} atlandı`);
  console.log("[deploy-pfos-besos] Sonraki: public/ → cPanel public_html (FTP veya Dosya Yöneticisi)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
