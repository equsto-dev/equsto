#!/usr/bin/env node
/**
 * Atalay PDF katalog — fiyat_tl KDV dahil olmalı (site standardı).
 * Eski kayıtlarda net TL fiyat_tl alanına yazılmış, vitrin KDV dahil sanıyordu.
 *
 *   node scripts/fix-atalay-kdv-fiyat.mjs
 *   node scripts/fix-atalay-kdv-fiyat.mjs --dry-run
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

const kur = (await fetchTcmbEurRate()).rate;

function fmtTry(n) {
  return `₺${Math.round(n).toLocaleString("tr-TR")},00`;
}

function isAtalayKaynak(row) {
  const k = String(row.kaynak_fiyat_listesi || row.kaynak || "").toLowerCase();
  return /atalay-2025-yerli/.test(k);
}

function isAtalayBrand(row) {
  return /atalay/i.test(String(row.brand || ""));
}

function discountFromRow(row) {
  const isk = Number(row.iskonto_oran);
  if (isk > 0 && isk < 100) return isk / 100;
  const kaynak = String(row.kaynak_fiyat_listesi || "");
  if (kaynak.includes("doner")) return 0.4;
  return 0.5;
}

function pricingFromListe(listeEur, discount) {
  const netEur = listeEur * (1 - discount);
  const netTl = Math.round(netEur * kur);
  const kdvDahil = Math.round(netTl * (1 + KDV / 100));
  return { netEur, netTl, kdvDahil };
}

function patchSpecs(specs, netEur, kdvDahil, discountPct) {
  let s = String(specs || "");
  if (!s) return s;
  s = s.replace(/Kur: 1 EUR = [\d.]+ TRY \(KDV %\d+\)/, `Kur: 1 EUR = ${kur} TRY (KDV %${KDV})`);
  s = s.replace(
    /Equsto fiyatı \(%\d+ indirimli EUR\): [\d.]+/,
    `Equsto fiyatı (%${Math.round(discountPct * 100)} indirimli EUR): ${netEur.toFixed(2)}`,
  );
  if (!/Equsto satış \(TL, KDV dahil\)/.test(s)) {
    s += `\nEqusto satış (TL, KDV dahil): ${fmtTry(kdvDahil)}`;
  } else {
    s = s.replace(
      /Equsto satış \(TL, KDV dahil\):[^\n]*/,
      `Equsto satış (TL, KDV dahil): ${fmtTry(kdvDahil)}`,
    );
  }
  return s;
}

function patchRow(row) {
  if (!isAtalayBrand(row) || !isAtalayKaynak(row)) return null;
  const liste = Number(row.liste_fiyati_eur) || 0;
  if (!(liste > 0)) return null;

  const discount = discountFromRow(row);
  const { netEur, netTl, kdvDahil } = pricingFromListe(liste, discount);
  const prev = Number(row.fiyat_tl) || 0;
  if (Math.abs(prev - kdvDahil) <= 1) return null;

  return {
    ...row,
    fiyat_tl: kdvDahil,
    fiyat_tl_net: netTl,
    price: `${fmtTry(kdvDahil)} KDV dahil`,
    satis_eur_indirimli: Math.round(netEur * 100) / 100,
    specs: patchSpecs(row.specs, netEur, kdvDahil, discount),
  };
}

async function main() {
  let total = 0;
  let updated = 0;
  const samples = [];

  for (const file of (await fsp.readdir(DEPT_DIR)).filter((f) => f.endsWith(".json")).sort()) {
    const filePath = path.join(DEPT_DIR, file);
    const arr = JSON.parse(await fsp.readFile(filePath, "utf8"));
    if (!Array.isArray(arr)) continue;

    let fileUpdated = 0;
    const next = arr.map((row) => {
      if (!isAtalayBrand(row) || !isAtalayKaynak(row)) return row;
      total++;
      const patched = patchRow(row);
      if (!patched) return row;
      fileUpdated++;
      updated++;
      if (samples.length < 8) {
        samples.push({
          model: row.model,
          before: row.fiyat_tl,
          after: patched.fiyat_tl,
          liste: row.liste_fiyati_eur,
        });
      }
      return patched;
    });

    if (fileUpdated > 0 && !DRY) {
      await fsp.writeFile(filePath, JSON.stringify(next), "utf8");
    }
    if (fileUpdated > 0) {
      console.log(`[atalay-kdv] ${file}: ${fileUpdated} ürün`);
    }
  }

  console.log(`[atalay-kdv] Kur: ${kur} | Atalay satır: ${total} | güncellenen: ${updated}${DRY ? " (dry-run)" : ""}`);
  for (const s of samples) {
    console.log(`  ${s.model}: ₺${s.before?.toLocaleString("tr-TR")} → ₺${s.after?.toLocaleString("tr-TR")} (liste ${s.liste} €)`);
  }

  if (updated > 0 && !DRY) {
    const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (rebuild.status !== 0) process.exit(rebuild.status ?? 1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
