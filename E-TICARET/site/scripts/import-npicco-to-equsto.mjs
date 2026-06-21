#!/usr/bin/env node
/**
 * Npicco web katalog → Equsto vitrin (kati-yakitli-izgaralar / Kömürlü Izgaralar)
 *
 *   node scripts/import-npicco-to-equsto.mjs
 *   node scripts/import-npicco-to-equsto.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { slugify } from "./lib/ozti-enrich.mjs";
import {
  formatVariantSpecs,
  mapNpiccoCategory,
  normalizeNpiccoKod,
  variantToOlculer,
} from "./lib/npicco-parse.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_JSON = path.join(ROOT, "scripts/data/npicco/npicco-web-catalog.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

const BRAND = "Npicco";
const BRAND_ID = "npicco";
const KAYNAK = "npicco-web";
const dryRun = process.argv.includes("--dry-run");

function expandVariants(p) {
  if (p.variants?.length) return p.variants;
  return [{ kod: null }];
}

function rowName(p, v) {
  if (!v.kod) return p.name;
  return `${p.name} — ${v.kod}`;
}

function rowId(p, v) {
  const kod = v.kod ? normalizeNpiccoKod(v.kod) : null;
  const suffix = kod ? slugify(kod) : slugify(p.slug || String(p.wc_id));
  return `${BRAND_ID}__${p.wc_id}-${suffix}`;
}

function resolveImages(p) {
  return (p.images || [])
    .map((img) => (typeof img === "string" ? img : img?.src))
    .filter((u) => u && /^https?:\/\//i.test(u));
}

function teknikFromVariant(v, features) {
  const rows = [];
  if (v.kod) rows.push(`Model: ${v.kod}`);
  if (v.uzunluk_cm) rows.push(`Uzunluk: ${v.uzunluk_cm} cm`);
  if (v.genislik_cm) rows.push(`Genişlik: ${v.genislik_cm} cm`);
  if (v.yukseklik_cm) rows.push(`Yükseklik: ${v.yukseklik_cm} cm`);
  if (v.izgara_olcusu) rows.push(`Izgara ölçüsü: ${v.izgara_olcusu}`);
  if (v.agirlik_kg) rows.push(`Ağırlık: ${v.agirlik_kg} kg`);
  for (const f of features || []) rows.push(f);
  return rows;
}

function toRows(p) {
  const mapped = mapNpiccoCategory(p.categories);
  const images = resolveImages(p);
  const features = p.features || [];
  const rows = [];

  for (const v of expandVariants(p)) {
    const kod = v.kod ? normalizeNpiccoKod(v.kod) : null;
    const olcu = v.kod ? variantToOlculer(v) : {};
    rows.push({
      id: rowId(p, v),
      dept: mapped.dept,
      category: mapped.category,
      brand: BRAND,
      name: rowName(p, v),
      price: "Teklif için iletişim",
      fiyat_bekleniyor: true,
      specs: formatVariantSpecs(p.name, v.kod ? v : { kod: kod || "" }, features, p.url),
      aciklama: p.intro || p.name,
      teknik_ozellikler: teknikFromVariant(v.kod ? v : {}, features),
      ...olcu,
      keywords: [BRAND, kod, mapped.category, p.npicco_category, p.name].filter(Boolean),
      images: images.length ? images : undefined,
      sku: kod || `NPICCO-${p.wc_id}`,
      model: kod || p.slug,
      urun_kodu: kod || undefined,
      npicco_wc_id: p.wc_id,
      npicco_kategori: p.npicco_category || undefined,
      kaynak: KAYNAK,
      kaynak_url: p.url,
    });
  }
  return rows;
}

function isNpiccoRow(r) {
  return String(r?.kaynak || "") === KAYNAK || String(r?.id || "").startsWith(`${BRAND_ID}__`);
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

async function main() {
  if (!fs.existsSync(SRC_JSON)) {
    console.error("Önce: npm run catalog:npicco:scrape");
    process.exit(1);
  }

  const raw = JSON.parse(await fsp.readFile(SRC_JSON, "utf8"));
  const products = raw.products || [];
  const rows = products.flatMap(toRows);

  const byDept = rows.reduce((acc, r) => {
    (acc[r.dept] ||= []).push(r);
    return acc;
  }, {});

  for (const [dept, add] of Object.entries(byDept)) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    let kept = [];
    if (fs.existsSync(file)) kept = JSON.parse(fs.readFileSync(file, "utf8")).filter((r) => !isNpiccoRow(r));
    const merged = [...kept, ...add];
    if (!dryRun && add.length) {
      fs.mkdirSync(DEPT_DIR, { recursive: true });
      writeJsonAtomic(file, merged);
    }
    console.log(`  ${dept}: +${add.length} (toplam ${merged.length})`);
  }

  console.log(`[npicco-import] ${dryRun ? "DRY-RUN" : "OK"} ${rows.length} vitrin satırı (${products.length} WC ürünü)`);

  if (!dryRun) {
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log("\nYerel vitrin: http://localhost:3099/shop/marka/npicco");
    console.log("Kategori: http://localhost:3099/shop/pisirme?tip=kati-yakitli-izgaralar");
    console.log("Arama indeksi: npm run search:index");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
