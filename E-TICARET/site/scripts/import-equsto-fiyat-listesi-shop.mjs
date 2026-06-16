#!/usr/bin/env node
/**
 * EQUSTO Fiyat Listesi 2026 — e-ticaret ürünleri → shop dept vitrinleri
 *
 *   node scripts/import-equsto-fiyat-listesi-shop.mjs
 *   node scripts/import-equsto-fiyat-listesi-shop.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "public/data/fiyat-listeleri/equsto/2026-fiyat-listesi/eticaret-tum-urunler.json");
const KAYNAK = "equsto-fiyat-listesi-2026";
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const dryRun = process.argv.includes("--dry-run");

const SHOP_DEPTS = ["tezgah", "davlumbaz", "dolap", "istif"];

function isFiyatListesiRow(r) {
  return String(r?.kaynak || "") === KAYNAK;
}

function toShopRow(p) {
  return {
    id: p.id,
    dept: p.dept,
    category: p.category,
    brand: "Equsto",
    name: p.name,
    price: p.price,
    fiyat_bekleniyor: false,
    specs: p.specs,
    aciklama: p.aciklama || "",
    teknik_ozellikler: p.teknik_ozellikler || [],
    malzeme: p.malzeme,
    olcu_etiket: p.olcu_etiket,
    olculer: p.olculer,
    images: p.images,
    sku: p.sku,
    model: p.model,
    urun_kodu: p.urun_kodu,
    kod: p.kod,
    equsto_seri: p.kod,
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
    console.error("Önce: python scripts/import-equsto-fiyat-listesi.py");
    process.exit(1);
  }
  const incoming = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const rows = incoming.map(toShopRow);
  const byDept = {};
  for (const r of rows) {
    const d = r.dept || "tezgah";
    (byDept[d] ||= []).push(r);
  }

  const totals = {};
  for (const dept of SHOP_DEPTS) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    const kept = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, "utf8")).filter((r) => !isFiyatListesiRow(r))
      : [];
    const add = byDept[dept] || [];
    const merged = [...kept, ...add];
    totals[dept] = { kept: kept.length, add: add.length, total: merged.length };
    if (!dryRun && (add.length || fs.existsSync(file))) {
      fs.writeFileSync(file, JSON.stringify(merged), "utf8");
    }
  }

  console.log("[fiyat-listesi-shop] e-ticaret:", rows.length);
  for (const [d, t] of Object.entries(totals)) {
    if (t.add) console.log(`  ${d}: +${t.add} → ${t.total}`);
  }

  if (dryRun) return;

  const rebuild = spawnSync("node", ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);

  console.log("[fiyat-listesi-shop] Örnek: http://localhost:3099/shop/tezgah/seri/kct02");
  console.log("[fiyat-listesi-shop] Katalog: http://localhost:3099/shop/fiyat-listesi-2026");
}

main();
