#!/usr/bin/env node
/**
 * KÇT02 e-ticaret ürünleri → shop/tezgah vitrin (dept + ekipmanlar)
 *
 *   node scripts/import-equsto-fiyat-kct02-shop.mjs
 *   node scripts/import-equsto-fiyat-kct02-shop.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(
  ROOT,
  "public/data/fiyat-listeleri/equsto/2026-fiyat-listesi/kct02/eticaret-urunler.json",
);
const TEZGAH = path.join(ROOT, "public/data/dept/tezgah.json");
const KAYNAK = "equsto-fiyat-listesi-2026";
const SERI = "KCT02";
const dryRun = process.argv.includes("--dry-run");

function isKct02ShopRow(r) {
  return (
    String(r?.kaynak || "") === KAYNAK &&
    (String(r?.kod || "").toUpperCase() === SERI ||
      String(r?.sku || "").endsWith(".02"))
  );
}

function toShopRow(p) {
  const teknik = [
    `Model: ${p.kod || SERI}`,
    `Ebat: ${p.olcu} cm (${p.olcu_mm} mm)`,
    p.taban_eur != null ? `Taban fiyat (EUR): ${p.taban_eur}` : "",
    p.cekmece_eur != null ? `Tek çekmece (EUR): ${p.cekmece_eur}` : "",
    `Liste fiyatı (EUR): ${p.liste_fiyati_eur}`,
    `Satış fiyatı (EUR, %${p.iskonto_oran} iskonto): ${p.satis_fiyati_eur}`,
    `Kur: 1 EUR = ${p.kur_eur_try} TRY`,
  ].filter(Boolean);

  return {
    id: p.id,
    dept: "tezgah",
    category: p.category || "calisma-tezgahi",
    brand: "Equsto",
    name: p.name,
    price: p.price,
    fiyat_bekleniyor: false,
    specs: p.specs,
    aciklama:
      "Etrafı açık, rafsız, tek çekmeceli paslanmaz çalışma tezgahı. EQUSTO fiyat listesi 2026 — KÇT02 serisi.",
    teknik_ozellikler: teknik,
    olcu_etiket: p.olcu_etiket,
    olculer: p.olculer,
    images: p.images,
    sku: p.sku,
    model: p.model,
    urun_kodu: p.urun_kodu,
    kod: p.kod,
    equsto_seri: SERI,
    kaynak: KAYNAK,
    kaynak_fiyat_listesi: KAYNAK,
    liste_fiyati_eur: p.liste_fiyati_eur,
    taban_eur: p.taban_eur,
    cekmece_eur: p.cekmece_eur,
    satis_fiyati_eur: p.satis_fiyati_eur,
    satis_eur_indirimli: p.satis_fiyati_eur,
    iskonto_oran: p.iskonto_oran,
    kur_eur_try: p.kur_eur_try,
    fiyat_tl: p.fiyat_tl,
    fiyat_tl_net: p.fiyat_tl_net,
  };
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Önce: npm run catalog:equsto:fiyat-kct02");
    process.exit(1);
  }
  const incoming = JSON.parse(fs.readFileSync(SRC, "utf8"));
  if (!Array.isArray(incoming) || !incoming.length) {
    console.error("E-ticaret ürünü yok:", SRC);
    process.exit(1);
  }

  const rows = incoming.map(toShopRow);
  const kept = fs.existsSync(TEZGAH)
    ? JSON.parse(fs.readFileSync(TEZGAH, "utf8")).filter((r) => !isKct02ShopRow(r))
    : [];
  const merged = [...kept, ...rows];

  console.log(`[kct02-shop] tezgah: +${rows.length} (toplam ${merged.length})`);
  for (const r of rows) {
    console.log(`  ${r.sku} → /shop/tezgah/${String(r.sku).toLowerCase().replace(/\./g, "-")}`);
  }

  if (dryRun) return;

  fs.writeFileSync(TEZGAH, JSON.stringify(merged), "utf8");

  const rebuild = spawnSync("node", ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);

  console.log("[kct02-shop] PLP: http://localhost:3099/shop/tezgah/seri/kct02");
}

main();
