#!/usr/bin/env node
/**
 * Tüm site — Atalay ile aynı net oran:
 *   fiyat_tl × 1,0388  (+%6 sonra −%2)
 *   fiyat_havale_tl = fiyat_tl × 0,98
 *
 * Atalay (zaten ×1,0388) tekrar çarpılmaz; yalnızca havale alanları yenilenir.
 *
 *   node scripts/reprice-site-markup-havale.mjs
 *   node scripts/reprice-site-markup-havale.mjs --dry-run
 */
import fsp from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const DRY = process.argv.includes("--dry-run");

/** Atalay final: 1.06 × 0.98 */
const SITE_MARKUP = 0.0388;
const SITE_CARPAN = 1 + SITE_MARKUP;
const HAVALE_ISKONTO = 0.02;
const MARKER = SITE_MARKUP;

function fmtTry(n) {
  return `₺${Math.round(n).toLocaleString("tr-TR")},00`;
}

function isAtalayAlreadyMarked(row) {
  if (!/atalay/i.test(String(row.brand || ""))) return false;
  const kar = Number(row.equsto_kar_oran);
  return Math.abs(kar - MARKER) < 0.001;
}

function alreadySiteMarked(row) {
  if (Number(row.equsto_site_markup) === MARKER) return true;
  if (isAtalayAlreadyMarked(row)) return true;
  return false;
}

function scaleEurField(row, key) {
  const n = Number(row[key]);
  if (!(n > 0)) return row[key];
  return Math.round(n * SITE_CARPAN * 100) / 100;
}

function patchPriceString(price, kdvDahil) {
  const s = String(price || "");
  if (!s || /teklif|iletişim|sorunuz|bekleniyor/i.test(s)) return s;
  if (/KDV dahil/i.test(s) || /KDV Dahil/i.test(s)) {
    return `${fmtTry(kdvDahil)} KDV dahil`;
  }
  if (/\+?\s*KDV/i.test(s)) {
    const net = Math.round(kdvDahil / 1.2);
    return `₺${net.toLocaleString("tr-TR")},00 + KDV\nKDV Dahil ${fmtTry(kdvDahil)}`;
  }
  return `${fmtTry(kdvDahil)} KDV dahil`;
}

function patchRow(row) {
  const tl = Number(row.fiyat_tl);
  if (!(tl > 0)) return null;
  if (row.fiyat_bekleniyor) return null;
  if (/teklif\s+için/i.test(String(row.price || ""))) return null;

  // Manuel KDV dahil TL (BKD.100 vb.) — zam uygulama, yalnız havale yaz
  const hasManual =
    Number(row.fiyat_tl_override) > 0 ||
    (Number(row.fiyat_tl_formul) > 0 && Number(row.fiyat_tl_override) > 0);

  const skipScale = alreadySiteMarked(row) || hasManual;
  const nextTl = skipScale ? Math.round(tl) : Math.round(tl * SITE_CARPAN);
  const nextNet =
    Number(row.fiyat_tl_net) > 0
      ? skipScale
        ? Math.round(Number(row.fiyat_tl_net))
        : Math.round(Number(row.fiyat_tl_net) * SITE_CARPAN)
      : Math.round(nextTl / 1.2);
  const havaleTl = Math.round(nextTl * (1 - HAVALE_ISKONTO));

  const out = {
    ...row,
    fiyat_tl: nextTl,
    fiyat_tl_net: nextNet,
    fiyat_havale_tl: havaleTl,
    havale_iskonto_oran: Math.round(HAVALE_ISKONTO * 100),
    equsto_site_markup: MARKER,
    price: patchPriceString(row.price, nextTl),
  };

  if (!skipScale) {
    for (const key of [
      "satis_eur_indirimli",
      "satis_fiyati_eur",
      "alis_fiyati_eur",
      "satis_fiyati_tl",
      "alis_fiyati_tl",
    ]) {
      if (Number(row[key]) > 0) out[key] = scaleEurField(row, key);
    }
    const oldKar = Number(row.equsto_kar_oran);
    if (oldKar > 0) {
      out.equsto_kar_oran = Math.round(((1 + oldKar) * SITE_CARPAN - 1) * 1e6) / 1e6;
    } else if (!/atalay/i.test(String(row.brand || ""))) {
      out.equsto_kar_oran = MARKER;
    }
  }

  return out;
}

async function main() {
  let scanned = 0;
  let scaled = 0;
  let havaleOnly = 0;
  const samples = [];

  for (const file of (await fsp.readdir(DEPT_DIR)).filter((f) => f.endsWith(".json")).sort()) {
    const filePath = path.join(DEPT_DIR, file);
    const arr = JSON.parse(await fsp.readFile(filePath, "utf8"));
    if (!Array.isArray(arr)) continue;

    let fileChanged = 0;
    const next = arr.map((row) => {
      const patched = patchRow(row);
      if (!patched) return row;
      scanned++;
      const wasMarked = alreadySiteMarked(row);
      if (wasMarked) havaleOnly++;
      else scaled++;
      fileChanged++;
      if (samples.length < 10 && !wasMarked) {
        samples.push({
          brand: String(row.brand || "").slice(0, 28),
          sku: row.sku || row.model,
          before: row.fiyat_tl,
          after: patched.fiyat_tl,
          havale: patched.fiyat_havale_tl,
        });
      }
      return patched;
    });

    if (fileChanged > 0 && !DRY) {
      await fsp.writeFile(filePath, JSON.stringify(next), "utf8");
    }
    if (fileChanged > 0) {
      console.log(`[site-reprice] ${file}: ${fileChanged} ürün`);
    }
  }

  console.log(
    `[site-reprice] ×${SITE_CARPAN} (+%${(SITE_MARKUP * 100).toFixed(2)}) | havale −%${HAVALE_ISKONTO * 100} | fiyatlı: ${scanned} | zam: ${scaled} | yalnız havale: ${havaleOnly}${DRY ? " (dry-run)" : ""}`,
  );
  for (const s of samples) {
    console.log(
      `  ${s.brand} ${s.sku}: ₺${Number(s.before).toLocaleString("tr-TR")} → ₺${Number(s.after).toLocaleString("tr-TR")} (havale ₺${Number(s.havale).toLocaleString("tr-TR")})`,
    );
  }

  if (!DRY && scanned > 0) {
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
