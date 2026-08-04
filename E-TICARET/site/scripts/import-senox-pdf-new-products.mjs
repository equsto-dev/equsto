#!/usr/bin/env node
/**
 * SENOX 2026-2-1 PDF'te olup Equsto'da olmayan temiz kodlu ürünleri ekler.
 *
 *   node scripts/import-senox-pdf-new-products.mjs
 *   node scripts/import-senox-pdf-new-products.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { slugify } from "./lib/ozti-enrich.mjs";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  loadSenoxPdfCatalog,
  normSenoxKey,
  pricingFromSenoxPdfListe,
  SENOX_LISTE_OVERRIDES,
} from "./lib/senox-pdf-prices.mjs";
import { MASTER_JSON_PATH } from "./catalog-master-paths.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const IMG_SRC = path.join(ROOT, "scripts/data/senox/images");
const IMG_PUB = path.join(ROOT, "public/data/senox/images");
const SATIS_ORAN = 0.5;
const KDV = 20;
const dryRun = process.argv.includes("--dry-run");

/** modelKey → dept / category / name override */
const NEW_PRODUCTS = [
  { key: "SMF5105", dept: "sogutma", category: "buzdolaplari-ve-derin-dondurucular" },
  { key: "BBLA", dept: "icecek", category: "bar-blender", name: "Senox BBL-A Bar Blender" },
  { key: "BBLD", dept: "icecek", category: "bar-blender", name: "Senox BBL-D Bar Blender" },
  { key: "CF5500KROM", dept: "sogutma", category: "buzdolaplari-ve-derin-dondurucular" },
  { key: "CF6600KROM", dept: "sogutma", category: "buzdolaplari-ve-derin-dondurucular" },
  { key: "CF6650KROM", dept: "sogutma", category: "buzdolaplari-ve-derin-dondurucular" },
  { key: "DW9RA", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PDM942", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PDM943", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PDM1242", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PDM1243", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PDM1542", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PDM1543", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PDM300L", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PDM440L", dept: "sogutma", category: "teshir-dolaplari" },
  { key: "PLM10", dept: "hazirlik", category: "mikserler" },
  // PLM20/PLM30 zaten GGM-M-20/30 olarak katalogda
  { key: "FR25", dept: "icecek", category: "buz-makineleri" },
  { key: "FR30", dept: "icecek", category: "buz-makineleri" },
  { key: "FR35", dept: "icecek", category: "buz-makineleri" },
  { key: "FR40", dept: "icecek", category: "buz-makineleri" },
  { key: "FR50", dept: "icecek", category: "buz-makineleri" },
  { key: "FR60", dept: "icecek", category: "buz-makineleri" },
  { key: "FR70", dept: "icecek", category: "buz-makineleri" },
  { key: "FR90", dept: "icecek", category: "buz-makineleri" },
  { key: "FR250", dept: "icecek", category: "buz-makineleri" },
  { key: "FR500", dept: "icecek", category: "buz-makineleri" },
  { key: "SB200", dept: "icecek", category: "buz-makineleri" },
  { key: "SB400", dept: "icecek", category: "buz-makineleri" },
];

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

function findPdfProduct(products, key) {
  const want = normSenoxKey(key);
  const exact = [];
  for (const p of products) {
    const k = normSenoxKey(p.model);
    if (k === want) exact.push(p);
  }
  if (exact.length) {
    return exact.sort(
      (a, b) =>
        Number(String(b.specs?.fiyat_eur || "").replace(/\D/g, "") || 0) -
        Number(String(a.specs?.fiyat_eur || "").replace(/\D/g, "") || 0),
    )[0];
  }
  return null;
}

function listeEurFor(p, key) {
  const ov = SENOX_LISTE_OVERRIDES.get(normSenoxKey(key));
  if (ov > 0) return ov;
  const raw = Number(String(p.specs?.fiyat_eur || "").replace(/\./g, "").replace(",", "."));
  return raw > 0 ? raw : 0;
}

function copyImage(localImage) {
  if (!localImage) return null;
  const base = path.basename(localImage);
  const src = path.join(IMG_SRC, base);
  if (!fs.existsSync(src)) return null;
  const dest = path.join(IMG_PUB, base);
  if (!dryRun) {
    fs.mkdirSync(IMG_PUB, { recursive: true });
    if (!fs.existsSync(dest)) {
      try {
        fs.copyFileSync(src, dest);
      } catch {
        fs.writeFileSync(dest, fs.readFileSync(src));
      }
    }
  }
  return `data/senox/images/${base}`;
}

function existingSenoxKeys() {
  const keys = new Set();
  for (const f of fs.readdirSync(DEPT_DIR).filter((x) => x.endsWith(".json"))) {
    const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    if (!Array.isArray(rows)) continue;
    for (const r of rows) {
      if (!String(r.id || "").startsWith("senox__") && !String(r.kaynak || "").includes("senox")) continue;
      for (const x of [r.model, r.sku, r.urun_kodu, r.senox_pdf_match]) {
        if (x) keys.add(normSenoxKey(x));
      }
    }
  }
  return keys;
}

function alreadyPresent(existing, key) {
  const want = normSenoxKey(key);
  return existing.has(want);
}

function buildRow(def, p, kur, listeEur, image) {
  const model = String(p.model || def.key).trim();
  const slug = slugify(model) || slugify(def.key);
  const id = `senox__senox-${slug}`;
  const px = pricingFromSenoxPdfListe(listeEur, kur, KDV, SATIS_ORAN);
  const name = def.name || p.title || `Senox ${model}`;
  const ebat = p.specs?.ebat_mm || "";
  const specs = [
    name,
    "",
    (p.description || "").split("\n").slice(0, 12).join("\n"),
    "",
    `Model: ${model}`,
    `Kategori: ${p.category || def.category}`,
    ebat ? `Ölçü: ${ebat}` : "",
    "",
    `Liste fiyatı (EUR, SENOX PDF): ${px.liste_fiyati_eur}`,
    `Equsto satış: liste × 50% = ${px.satis_fiyati_eur} EUR`,
    `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${KDV})`,
    `PDF eşleşme: ${normSenoxKey(model)}`,
    "",
    "Kaynak fiyat: SENOX 2026-2-1 PDF",
    "Marka: Şenox",
  ]
    .filter((l, i, arr) => !(l === "" && arr[i + 1] === ""))
    .join("\n");

  return {
    id,
    dept: def.dept,
    category: def.category,
    brand: "Şenox",
    name,
    price: px.price,
    fiyat_bekleniyor: false,
    specs,
    aciklama: p.description || name,
    teknik_ozellikler: [
      `Model: ${model}`,
      ebat ? `Ölçü: ${ebat}` : "",
      `PDF kod: ${normSenoxKey(model)}`,
      `Katalog sayfası: ${p.page}`,
    ].filter(Boolean),
    olcu_etiket: ebat || undefined,
    olculer:
      p.specs?.genislik_mm > 0
        ? {
            genislik_mm: p.specs.genislik_mm,
            derinlik_mm: p.specs.derinlik_mm,
            yukseklik_mm: p.specs.yukseklik_mm,
          }
        : undefined,
    keywords: ["Şenox", "Senox", model, def.category, p.category].filter(Boolean),
    images: image ? [image] : undefined,
    image_kaynak: "senox-pdf-2026-2-1",
    sku: model,
    model,
    urun_kodu: model,
    kaynak: "senox-pdf",
    kaynak_fiyat_listesi: "senox-pdf-2026-2-1",
    senox_pdf_match: normSenoxKey(model),
    senox_pdf_fuzzy: false,
    iskonto_oran: 50,
    equsto_site_markup: 0,
    equsto_kar_oran: 0,
    ...px,
  };
}

async function main() {
  const pdf = loadSenoxPdfCatalog();
  const tcmb = await fetchTcmbEurRate();
  const kur =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;
  const existing = existingSenoxKeys();
  const byDept = new Map();
  const added = [];
  const skipped = [];

  for (const def of NEW_PRODUCTS) {
    if (alreadyPresent(existing, def.key)) {
      skipped.push({ key: def.key, reason: "already" });
      continue;
    }
    const p = findPdfProduct(pdf.products, def.key);
    if (!p) {
      skipped.push({ key: def.key, reason: "not-in-pdf" });
      continue;
    }
    const listeEur = listeEurFor(p, def.key);
    if (!(listeEur > 0)) {
      skipped.push({ key: def.key, reason: "no-price" });
      continue;
    }
    // exact collision on id
    const slug = slugify(p.model) || slugify(def.key);
    const id = `senox__senox-${slug}`;
    let existsId = false;
    for (const f of fs.readdirSync(DEPT_DIR).filter((x) => x.endsWith(".json"))) {
      const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
      if (Array.isArray(rows) && rows.some((r) => r.id === id)) existsId = true;
    }
    if (existsId) {
      skipped.push({ key: def.key, reason: "id-exists" });
      continue;
    }

    const image = copyImage(p.localImage);
    const row = buildRow(def, p, kur, listeEur, image);
    if (!byDept.has(def.dept)) byDept.set(def.dept, []);
    byDept.get(def.dept).push(row);
    added.push(row);
    existing.add(def.key);
    existing.add(normSenoxKey(p.model));
  }

  if (!dryRun) {
    for (const [dept, rows] of byDept) {
      const filePath = path.join(DEPT_DIR, `${dept}.json`);
      const cur = JSON.parse(await fsp.readFile(filePath, "utf8"));
      cur.push(...rows);
      writeJsonAtomic(filePath, cur);
    }

    if (added.length && fs.existsSync(MASTER_JSON_PATH)) {
      const master = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, "utf8"));
      const products = master.products || [];
      for (const row of added) {
        if (products.some((p) => p.id === row.id)) continue;
        products.push({
          equsto_kod: `EQ-ŞENOX.${row.model}`,
          marka: row.brand,
          marka_kodu: "ŞENOX",
          marka_urun_kodu: row.model,
          aciklama: row.name,
          teknik_ozellikler: row.specs,
          olculer: row.olcu_etiket || "",
          fiyat_eur: row.liste_fiyati_eur,
          urun_kategori: row.dept,
          urun_alt_kategori: row.category,
          dept: row.dept,
          category: row.category,
          id: row.id,
          fiyat_tl: row.fiyat_tl,
          image: row.images?.[0] || "",
        });
      }
      master.products = products;
      master.count = products.length;
      master.generated = new Date().toISOString();
      writeJsonAtomic(MASTER_JSON_PATH, master);
    }

    if (added.length) {
      execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
        cwd: ROOT,
        stdio: "inherit",
      });
    }
  }

  console.log(
    `[senox-pdf-new] +${added.length} ürün | skip ${skipped.length}${dryRun ? " (dry-run)" : ""} | kur ${kur}`,
  );
  for (const r of added) {
    console.log(`  + ${r.model} ${r.liste_fiyati_eur}€ → ₺${r.fiyat_tl} (${r.dept})`);
  }
  if (skipped.length) {
    console.log("  skip:", skipped.map((s) => `${s.key}:${s.reason}`).join(", "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
