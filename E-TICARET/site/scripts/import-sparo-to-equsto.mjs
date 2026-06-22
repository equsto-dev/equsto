#!/usr/bin/env node
/**
 * Sparo web katalog → Equsto vitrin (public/data/dept/pisirme.json)
 *
 *   node scripts/import-sparo-to-equsto.mjs
 *   node scripts/import-sparo-to-equsto.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { slugify } from "./lib/ozti-enrich.mjs";
import {
  formatVariantSpecs,
  mapSparoCategory,
  normalizeSprKod,
  variantToOlculer,
} from "./lib/sparo-parse.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_JSON = path.join(ROOT, "scripts/data/sparo/sparo-web-catalog.json");
const OUT_IMG = path.join(ROOT, "public/images/catalog/sparo");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

const BRAND = "Sparo";
const BRAND_ID = "sparo";
const KAYNAK = "sparo-web";
const dryRun = process.argv.includes("--dry-run");

function expandVariants(p) {
  if (p.variants?.length) return p.variants;
  return [{ kod: null }];
}

function rowName(p, v) {
  if (!v.kod) return p.name;
  const base = p.name.replace(/\s*\([^)]*SPR[^)]*\)/i, "").trim();
  return `${base} — ${v.kod}`;
}

function rowId(p, v) {
  const kod = v.kod ? normalizeSprKod(v.kod) : null;
  const suffix = kod ? slugify(kod) : slugify(p.slug || String(p.wc_id));
  return `${BRAND_ID}__${p.wc_id}-${suffix}`;
}

async function resolveImages(p) {
  const out = [];
  for (const img of p.images || []) {
    const remote = typeof img === "string" ? img : img?.src;
    if (remote && /^https?:\/\//i.test(remote)) {
      out.push(remote);
      continue;
    }
    const localPath = path.join(ROOT, img.local || "");
    if (!fs.existsSync(localPath)) continue;
    const fname = path.basename(localPath);
    const dest = path.join(OUT_IMG, fname);
    if (!dryRun) {
      await fsp.mkdir(OUT_IMG, { recursive: true });
      await fsp.copyFile(localPath, dest);
    }
    out.push(`images/catalog/sparo/${fname}`);
  }
  return out;
}

function teknikFromVariant(v, features) {
  const rows = [];
  if (v.kod) rows.push(`Model: ${v.kod}`);
  if (v.uzunluk_cm) rows.push(`Uzunluk: ${v.uzunluk_cm} cm`);
  if (v.genislik_cm) rows.push(`Genişlik: ${v.genislik_cm} cm`);
  if (v.yukseklik_cm) rows.push(`Yükseklik: ${v.yukseklik_cm} cm`);
  if (v.izgara_olcusu) rows.push(`Izgara ölçüsü: ${v.izgara_olcusu}`);
  if (v.dinlendirme_olcusu) rows.push(`Dinlendirme ölçüsü: ${v.dinlendirme_olcusu}`);
  if (v.agirlik_kg) rows.push(`Ağırlık: ${v.agirlik_kg} kg`);
  for (const f of features || []) rows.push(f);
  return rows;
}

async function toRows(p) {
  const mapped = mapSparoCategory(p.categories);
  const images = await resolveImages(p);
  const features = p.features || [];
  const rows = [];

  for (const v of expandVariants(p)) {
    const kod = v.kod ? normalizeSprKod(v.kod) : null;
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
      aciklama: p.intro || p.short_description || p.name,
      teknik_ozellikler: teknikFromVariant(v.kod ? v : {}, features),
      ...olcu,
      keywords: [BRAND, kod, mapped.category, p.name].filter(Boolean),
      images: images.length ? images : undefined,
      sku: kod || `SPARO-${p.wc_id}`,
      model: kod || p.slug,
      urun_kodu: kod || undefined,
      sparo_wc_id: p.wc_id,
      kaynak: KAYNAK,
      kaynak_url: p.url,
    });
  }
  return rows;
}

function isSparoRow(r) {
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
    console.error("Önce: npm run catalog:sparo:scrape");
    process.exit(1);
  }

  const raw = JSON.parse(await fsp.readFile(SRC_JSON, "utf8"));
  const products = raw.products || [];
  const rows = [];
  for (const p of products) {
    rows.push(...(await toRows(p)));
  }

  const byDept = rows.reduce((acc, r) => {
    (acc[r.dept] ||= []).push(r);
    return acc;
  }, {});

  for (const [dept, add] of Object.entries(byDept)) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    let kept = [];
    if (fs.existsSync(file)) kept = JSON.parse(fs.readFileSync(file, "utf8")).filter((r) => !isSparoRow(r));
    const merged = [...kept, ...add];
    if (!dryRun && add.length) {
      fs.mkdirSync(DEPT_DIR, { recursive: true });
      writeJsonAtomic(file, merged);
    }
    console.log(`  ${dept}: +${add.length} (toplam ${merged.length})`);
  }

  console.log(`[sparo-import] ${dryRun ? "DRY-RUN" : "OK"} ${rows.length} vitrin satırı (${products.length} WC ürünü)`);

  if (!dryRun) {
    let priced = false;
    try {
      execFileSync(process.execPath, ["scripts/apply-sparo-pdf-prices.mjs"], {
        cwd: ROOT,
        stdio: "inherit",
      });
      priced = true;
    } catch (_) {
      console.log("\nFiyat listesi yok — npm run catalog:sparo:pdf-prices && npm run catalog:sparo:prices");
    }
    if (!priced) {
      execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
        cwd: ROOT,
        stdio: "inherit",
      });
    }
    console.log("\nYerel vitrin: http://localhost:3099/shop/marka/sparo");
    console.log("Arama indeksi: npm run search:index");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
