#!/usr/bin/env node
/**
 * Tüm Atalay (yerli PDF) fiyatlarını yeniden hesapla:
 *   liste × (1 − iskonto) × 1,06 × kur × 1,20 → fiyat_tl (KDV dahil)
 *   fiyat_havale_tl = fiyat_tl × 0,98
 *
 *   node scripts/reprice-atalay-markup-havale.mjs
 *   node scripts/reprice-atalay-markup-havale.mjs --dry-run
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
const EQUSTO_MARKUP = 0.06;
const HAVALE_ISKONTO = 0.02;

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
  const bayiNetEur = listeEur * (1 - discount);
  const satisEur = Math.round(bayiNetEur * (1 + EQUSTO_MARKUP) * 100) / 100;
  const netTl = Math.round(satisEur * kur);
  const kdvDahil = Math.round(netTl * (1 + KDV / 100));
  const havaleTl = Math.round(kdvDahil * (1 - HAVALE_ISKONTO));
  return { bayiNetEur, satisEur, netTl, kdvDahil, havaleTl };
}

function patchSpecs(specs, { bayiNetEur, satisEur, kdvDahil, havaleTl, discount }) {
  let s = String(specs || "");
  if (!s) return s;
  s = s.replace(/Kur: 1 EUR = [\d.]+ TRY \(KDV %\d+\)/, `Kur: 1 EUR = ${kur} TRY (KDV %${KDV})`);
  s = s.replace(
    /Equsto fiyatı \(%\d+ indirimli EUR\): [\d.]+/,
    `Bayi net (%${Math.round(discount * 100)} iskonto EUR): ${bayiNetEur.toFixed(2)}`,
  );
  if (!/Bayi net \(/.test(s) && !/Equsto satış \(\+%/.test(s)) {
    s += `\nBayi net (%${Math.round(discount * 100)} iskonto EUR): ${bayiNetEur.toFixed(2)}`;
  }
  if (!/Equsto satış \(\+%/.test(s)) {
    s += `\nEqusto satış (+%${Math.round(EQUSTO_MARKUP * 100)} EUR): ${satisEur.toFixed(2)}`;
  } else {
    s = s.replace(
      /Equsto satış \(\+%\d+ EUR\): [\d.]+/,
      `Equsto satış (+%${Math.round(EQUSTO_MARKUP * 100)} EUR): ${satisEur.toFixed(2)}`,
    );
  }
  if (!/Havale \/ EFT:/.test(s)) {
    s += `\nHavale / EFT: %${Math.round(HAVALE_ISKONTO * 100)} indirim → ${fmtTry(havaleTl)}`;
  } else {
    s = s.replace(
      /Havale \/ EFT:[^\n]*/,
      `Havale / EFT: %${Math.round(HAVALE_ISKONTO * 100)} indirim → ${fmtTry(havaleTl)}`,
    );
  }
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
  const px = pricingFromListe(liste, discount);

  return {
    ...row,
    fiyat_tl: px.kdvDahil,
    fiyat_tl_net: px.netTl,
    fiyat_havale_tl: px.havaleTl,
    price: `${fmtTry(px.kdvDahil)} KDV dahil`,
    satis_eur_indirimli: px.satisEur,
    equsto_kar_oran: EQUSTO_MARKUP,
    havale_iskonto_oran: Math.round(HAVALE_ISKONTO * 100),
    specs: patchSpecs(row.specs, { ...px, discount }),
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
      if (samples.length < 6) {
        samples.push({
          model: row.model || row.sku,
          before: row.fiyat_tl,
          after: patched.fiyat_tl,
          havale: patched.fiyat_havale_tl,
          liste: row.liste_fiyati_eur,
        });
      }
      return patched;
    });

    if (fileUpdated > 0 && !DRY) {
      await fsp.writeFile(filePath, JSON.stringify(next), "utf8");
    }
    if (fileUpdated > 0) {
      console.log(`[atalay-reprice] ${file}: ${fileUpdated} ürün`);
    }
  }

  console.log(
    `[atalay-reprice] Kur: ${kur} | +%${EQUSTO_MARKUP * 100} | havale −%${HAVALE_ISKONTO * 100} | satır: ${total} | güncellenen: ${updated}${DRY ? " (dry-run)" : ""}`,
  );
  for (const s of samples) {
    console.log(
      `  ${s.model}: ₺${Number(s.before).toLocaleString("tr-TR")} → ₺${Number(s.after).toLocaleString("tr-TR")} (havale ₺${Number(s.havale).toLocaleString("tr-TR")})`,
    );
  }

  if (!DRY && updated > 0) {
    const r = spawnSync("node", ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
