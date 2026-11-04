#!/usr/bin/env node
/**
 * KitchenAid stand mikser fiyat güncellemesi.
 *
 * Priced modeller (EUR liste → ×1.15 → ×kur → ×1.20 KDV = TL satış):
 *   5KSM7990*  1150 EUR  (6.9 L prof)
 *   5KSM70JPX* 1050 EUR  (6.6 L heavy duty)
 *   5KPM5*      690 EUR  (4.8 L heavy duty, kırmızı dahil)
 *   5K45SS*     530 EUR  (4.3 L classic)
 *   5KSM55SXX*  820 EUR  (heavy duty / 2–5.2 L seri)
 *
 * Diğer tüm KitchenAid ürünleri → fiyatsız (Teklif için iletişim).
 *
 *   node scripts/update-kitchenaid-mixer-prices.mjs
 *   node scripts/update-kitchenaid-mixer-prices.mjs --dry
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const DRY = process.argv.includes("--dry");
const MARKUP = 1.15;
const KDV = 0.2;
const HAVALE_PCT = 2;

/** Base model prefix → EUR liste (renk varyantları aynı fiyat). */
const PRICED = [
  { prefix: "5KSM7990", eur: 1150, label: "Profesyonel 6.9 L" },
  { prefix: "5KSM70JPX", eur: 1050, label: "Heavy Duty 6.6 L" },
  { prefix: "5KPM5", eur: 690, label: "Heavy Duty 4.8 L" },
  { prefix: "5K45SS", eur: 530, label: "Classic 4.3 L" },
  { prefix: "5KSM55SXX", eur: 820, label: "Heavy Duty 5KSM55SXX" },
];

function isKitchenAid(row) {
  const b = String(row?.brand || "").toLowerCase().replace(/\s+/g, "");
  const m = String(row?.marka_kodu || "").toUpperCase();
  return b === "kitchenaid" || m === "KITCHENAID";
}

function matchPriced(sku) {
  const s = String(sku || "").toUpperCase().replace(/\s+/g, "");
  for (const p of PRICED) {
    if (s.startsWith(p.prefix)) return p;
  }
  return null;
}

function formatTl(n) {
  return (
    "₺" +
    Number(n).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    " KDV dahil"
  );
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

function calcPrice(eur, kur) {
  const satisEur = Math.round(eur * MARKUP * 100) / 100;
  const fiyatTlNet = Math.round(satisEur * kur);
  const fiyatTl = Math.round(fiyatTlNet * (1 + KDV));
  const havale = Math.round(fiyatTl * (1 - HAVALE_PCT / 100));
  return { satisEur, fiyatTlNet, fiyatTl, havale };
}

function clearPrice(row) {
  row.price = "Teklif için iletişim";
  row.fiyat_bekleniyor = true;
  row.fiyat_tl = null;
  row.fiyat_tl_net = null;
  row.fiyat_havale_tl = null;
  row.havale_iskonto_oran = null;
  row.liste_fiyati_eur = null;
  row.satis_eur_net = null;
  row.satis_eur_indirimli = null;
  row.satis_fiyati_eur = null;
  row.cafemarkt_fiyat_kdv_dahil = null;
  row.cafemarkt_fiyat_equsto_kdv_dahil = null;
  delete row.price_display;
}

function applyPrice(row, rule, kur) {
  const { satisEur, fiyatTlNet, fiyatTl, havale } = calcPrice(rule.eur, kur);
  row.liste_fiyati_eur = rule.eur;
  row.satis_eur_net = satisEur;
  row.satis_eur_indirimli = satisEur;
  row.satis_fiyati_eur = satisEur;
  row.kur_eur_try = kur;
  row.kdv_oran = Math.round(KDV * 100);
  row.fiyat_tl_net = fiyatTlNet;
  row.fiyat_tl = fiyatTl;
  row.fiyat_havale_tl = havale;
  row.havale_iskonto_oran = HAVALE_PCT;
  row.fiyat_bekleniyor = false;
  row.price = formatTl(fiyatTl);
  row.para_birimi = "EUR";
  row.kaynak_fiyat_listesi = "kitchenaid-manual-eur-2026-11";
  row.fiyat_kaynak = "kitchenaid-eur-15pct-kdv";
  row.marka_kodu = row.marka_kodu || "KITCHENAID";
  row.marka_urun_kodu = row.marka_urun_kodu || row.sku;

  const note = [
    `Liste (EUR): ${rule.eur}`,
    `Satış EUR (+%15): ${satisEur}`,
    `Kur: 1 EUR = ${kur} TRY`,
    `Equsto satış (TL, KDV dahil): ${formatTl(fiyatTl)}`,
    `Havale / EFT: %${HAVALE_PCT} indirim → ${formatTl(havale)}`,
    `Kaynak: KitchenAid manuel EUR liste (${rule.label})`,
  ].join("\n");

  const specs = String(row.specs || "");
  if (/Liste \(EUR\):|Equsto satış \(TL/.test(specs)) {
    row.specs = specs
      .replace(/Liste \(EUR\):[^\n]*/g, `Liste (EUR): ${rule.eur}`)
      .replace(/Satış EUR[^\n]*/g, `Satış EUR (+%15): ${satisEur}`)
      .replace(/Kur: 1 EUR[^\n]*/g, `Kur: 1 EUR = ${kur} TRY`)
      .replace(/Equsto satış \(TL[^\n]*/g, `Equsto satış (TL, KDV dahil): ${formatTl(fiyatTl)}`)
      .replace(/Havale \/ EFT:[^\n]*/g, `Havale / EFT: %${HAVALE_PCT} indirim → ${formatTl(havale)}`);
  } else {
    row.specs = [specs.trim(), "", note].filter(Boolean).join("\n");
  }
  return { fiyatTl, satisEur };
}

async function main() {
  const tcmb = await fetchTcmbEurRate();
  const kur =
    Number(process.env.EQUSTO_EUR_TRY) > 0
      ? Number(process.env.EQUSTO_EUR_TRY)
      : Number(tcmb.rate);
  if (!(kur > 0)) throw new Error("EUR kur alınamadı");
  console.log(
    `[kitchenaid] kur 1 EUR = ${kur} TRY${tcmb.fallback ? " (fallback)" : ""} date=${tcmb.date || "?"}`,
  );

  for (const p of PRICED) {
    const px = calcPrice(p.eur, kur);
    console.log(
      `  ${p.prefix.padEnd(12)} ${p.eur} EUR → ${px.satisEur} EUR net → ₺${px.fiyatTl.toLocaleString("tr-TR")}`,
    );
  }

  let priced = 0;
  let cleared = 0;
  const pricedSkus = [];
  const clearedSample = [];

  for (const file of fs.readdirSync(DEPT_DIR).sort()) {
    if (!file.endsWith(".json") || file.includes("_items")) continue;
    const fp = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (!Array.isArray(rows)) continue;
    let dirty = false;

    for (const row of rows) {
      if (!isKitchenAid(row)) continue;
      const sku = row.sku || row.model || row.marka_urun_kodu || "";
      const rule = matchPriced(sku);
      if (rule) {
        const before = row.fiyat_tl;
        const { fiyatTl } = applyPrice(row, rule, kur);
        priced += 1;
        pricedSkus.push({
          dept: file.replace(/\.json$/, ""),
          sku,
          from: before,
          to: fiyatTl,
          eur: rule.eur,
        });
        dirty = true;
      } else if (
        row.fiyat_bekleniyor !== true ||
        Number(row.fiyat_tl) > 0 ||
        !/teklif/i.test(String(row.price || ""))
      ) {
        clearPrice(row);
        cleared += 1;
        if (clearedSample.length < 8) clearedSample.push(sku);
        dirty = true;
      }
    }

    if (dirty && !DRY) writeJsonAtomic(fp, rows);
  }

  console.log(`[kitchenaid] priced=${priced} cleared=${cleared}`);
  for (const p of pricedSkus) {
    console.log(`  + ${p.sku} ${p.from} → ${p.to} (${p.eur} EUR)`);
  }
  if (clearedSample.length) {
    console.log("  cleared örn:", clearedSample.join(", "));
  }

  // Expected SKU presence
  for (const p of PRICED) {
    const n = pricedSkus.filter((x) =>
      String(x.sku).toUpperCase().startsWith(p.prefix),
    ).length;
    if (n === 0) throw new Error(`Hiç SKU eşleşmedi: ${p.prefix}`);
  }

  if (DRY) {
    console.log("[kitchenaid] dry-run — dosya yazılmadı");
    return;
  }

  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  execFileSync(process.execPath, ["scripts/build-sitemap.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
