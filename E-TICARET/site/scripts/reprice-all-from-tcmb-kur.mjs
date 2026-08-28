#!/usr/bin/env node
/**
 * Tüm EUR bazlı dept ürünlerinin TL fiyatını TCMB efektif satış (/api/kur) ile yeniler.
 * EUR net tutarlar (markup dahil) korunur; yalnızca kur × KDV yeniden hesaplanır.
 *
 *   node scripts/reprice-all-from-tcmb-kur.mjs
 *   node scripts/reprice-all-from-tcmb-kur.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const DRY = process.argv.includes("--dry-run");
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const HAVALE_ISKONTO = 0.02;

const kurMeta = await fetchTcmbEurRate();
const kur = Number(kurMeta.rate);
if (!(kur > 0)) {
  console.error("TCMB kur alınamadı");
  process.exit(1);
}

function fmtTry(n) {
  return `₺${Math.round(n).toLocaleString("tr-TR")},00`;
}

function isListeTl(row) {
  const p = String(row.para_birimi || "").trim().toUpperCase();
  return p === "TL" || p === "TRY";
}

function netEurFromRow(row) {
  const pre = Number(
    row.satis_fiyati_eur ||
      row.satis_eur_indirimli ||
      row.alis_fiyati_eur ||
      row.alis_fiyati ||
      row.iskontolu_fiyat,
  );
  if (pre > 0) return pre;
  const liste = Number(row.liste_fiyati_eur || row.liste_fiyati || 0);
  if (!(liste > 0)) return 0;
  let isk = Number(
    row.iskonto_oran != null
      ? row.iskonto_oran
      : row.iskonto_yuzde != null
        ? row.iskonto_yuzde
        : NaN,
  );
  if (!(isk > 0) && Number(row.bayi_iskonto) > 0 && Number(row.bayi_iskonto) < 1) {
    isk = Number(row.bayi_iskonto) * 100;
  }
  if (isk > 0 && isk < 1) isk = isk * 100;
  if (!(isk > 0)) return 0;
  return Math.round(liste * (1 - isk / 100) * 100) / 100;
}

function patchSpecs(specs, kurVal, kdvDahil, havaleTl) {
  let s = String(specs || "");
  if (!s) return s;
  s = s.replace(
    /Kur: 1 EUR = [\d.]+ TRY(?: \(KDV %\d+\))?/g,
    `Kur: 1 EUR = ${kurVal} TRY (KDV %${KDV})`,
  );
  if (havaleTl > 0 && /Havale\s*\/\s*EFT:/i.test(s)) {
    s = s.replace(
      /Havale\s*\/\s*EFT:[^\n]*/i,
      `Havale / EFT: %${Math.round(HAVALE_ISKONTO * 100)} indirim → ${fmtTry(havaleTl)}`,
    );
  }
  if (kdvDahil > 0 && /KDV dahil:?\s*₺/i.test(s)) {
    s = s.replace(/KDV dahil:?\s*₺[\d.\s]+(?:,\d+)?/i, `KDV dahil: ${fmtTry(kdvDahil)}`);
  }
  return s;
}

function repriceRow(row) {
  if (!row || isListeTl(row)) return null;
  const netEur = netEurFromRow(row);
  if (!(netEur > 0)) return null;

  const fiyat_tl_net = Math.round(netEur * kur);
  const fiyat_tl = Math.round(fiyat_tl_net * (1 + KDV / 100));
  const hadHavale =
    Number(row.fiyat_havale_tl) > 0 ||
    /Havale\s*\/\s*EFT:/i.test(String(row.specs || ""));
  const fiyat_havale_tl = hadHavale
    ? Math.round(fiyat_tl * (1 - HAVALE_ISKONTO))
    : null;

  const oldTl = Number(row.fiyat_tl) || 0;
  const oldKur = Number(row.kur_eur_try) || 0;
  if (oldTl === fiyat_tl && Math.abs(oldKur - kur) < 0.00005) return null;

  const pricePrev = String(row.price || "");
  let price;
  if (/KDV dahil/i.test(pricePrev)) {
    price = `${fmtTry(fiyat_tl)} KDV dahil`;
  } else if (/\+ KDV/i.test(pricePrev) && /KDV Dahil/i.test(pricePrev)) {
    price = `₺${fiyat_tl_net.toLocaleString("tr-TR")},00 + KDV\nKDV Dahil ${fmtTry(fiyat_tl)}`;
  } else {
    price = `${fmtTry(fiyat_tl)} KDV dahil`;
  }

  const next = {
    ...row,
    kur_eur_try: kur,
    fiyat_tl_net,
    fiyat_tl,
    kdv_oran: Number(row.kdv_oran) > 0 ? Number(row.kdv_oran) : KDV,
    price,
    specs: patchSpecs(row.specs, kur, fiyat_tl, fiyat_havale_tl || 0),
  };
  if (fiyat_havale_tl != null) next.fiyat_havale_tl = fiyat_havale_tl;
  return { next, oldTl, oldKur, netEur };
}

const files = (await fsp.readdir(DEPT_DIR)).filter((f) => f.endsWith(".json")).sort();
let changedFiles = 0;
let changedRows = 0;
let skipped = 0;
const byBrand = new Map();
const samples = [];

function serializeDeptJson(rawText, rows) {
  const trimmed = String(rawText || "").replace(/^\uFEFF/, "");
  const pretty = trimmed.startsWith("[\n") || trimmed.startsWith("[\r\n");
  const body = pretty ? `${JSON.stringify(rows, null, 2)}\n` : `${JSON.stringify(rows)}\n`;
  return body;
}

for (const file of files) {
  const fp = path.join(DEPT_DIR, file);
  const raw = await fsp.readFile(fp, "utf8");
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) continue;
  let fileChanged = false;
  for (let i = 0; i < rows.length; i++) {
    const result = repriceRow(rows[i]);
    if (!result) {
      skipped++;
      continue;
    }
    rows[i] = result.next;
    fileChanged = true;
    changedRows++;
    const brand = String(result.next.brand || "?");
    byBrand.set(brand, (byBrand.get(brand) || 0) + 1);
    if (samples.length < 8) {
      samples.push({
        sku: result.next.sku || result.next.stok_no,
        brand,
        netEur: result.netEur,
        oldKur: result.oldKur,
        newKur: kur,
        oldTl: result.oldTl,
        newTl: result.next.fiyat_tl,
      });
    }
  }
  if (fileChanged) {
    changedFiles++;
    if (!DRY) {
      await fsp.writeFile(fp, serializeDeptJson(raw, rows), "utf8");
    }
  }
}

console.log(
  JSON.stringify(
    {
      dry: DRY,
      tcmbDate: kurMeta.tcmbDate,
      fallback: kurMeta.fallback,
      kur,
      changedFiles,
      changedRows,
      skippedApprox: skipped,
      byBrand: Object.fromEntries([...byBrand.entries()].sort((a, b) => b[1] - a[1])),
      samples,
    },
    null,
    2,
  ),
);

if (!DRY && changedRows > 0) {
  console.log("\n→ rebuild-ekipmanlar-from-dept.mjs");
  const r = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

if (!DRY && !kurMeta.fallback && kurMeta.tcmbDate) {
  const manifest = {
    version: 1,
    rate: kur,
    type: "efektif_satis",
    label: "TCMB Efektif Satış",
    source: "tcmb",
    date: kurMeta.tcmbDate,
    updatedAt: new Date().toISOString(),
  };
  const manifestPaths = [
    path.join(ROOT, "public/data/equsto-eur-try-rate.json"),
    path.join(ROOT, "../veri/public-data/equsto-eur-try-rate.json"),
  ];
  for (const mp of manifestPaths) {
    try {
      await fsp.writeFile(mp, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      console.log(`→ kur manifesto: ${mp}`);
    } catch (e) {
      console.warn(`kur manifesto yazılamadı: ${mp} — ${e}`);
    }
  }
}
