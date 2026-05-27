/**
 * Excel fiyat listesi ↔ vitrin JSON doğrulama (örnek + hata sayımı).
 *   node scripts/verify-ozti-prices.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { oztiPricingFields, normKod } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
const KUR_SNAP = path.join(ROOT, "scripts/data/tcmb-kur-snapshot.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

const kur = JSON.parse(fs.readFileSync(KUR_SNAP, "utf8")).rate || 53.05;
const rows = JSON.parse(fs.readFileSync(SRC, "utf8").replace(/\bNaN\b/g, "null"));

const bySku = new Map();
for (const f of fs.readdirSync(DEPT_DIR).filter((x) => x.endsWith(".json"))) {
  const list = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
  for (const r of list) {
    const k = normKod(r.sku || r.model);
    if (k && /öztiryaki|oztiryaki/i.test(String(r.brand || ""))) bySku.set(k, r);
  }
}

let missingVitrin = 0;
let mismatch = 0;
let ok = 0;
const samples = ["073M.00000.AD", "074M.00000.AD", "7865.N1.80908.10"];

for (const row of rows) {
  const kod = normKod(row.urun_kodu);
  const exp = oztiPricingFields(row, kur);
  const vit = bySku.get(kod);
  if (!vit) {
    missingVitrin++;
    continue;
  }
  if (!(exp.fiyat_tl > 0)) continue;
  const diff = Math.abs(Number(vit.fiyat_tl) - exp.fiyat_tl);
  if (diff > 2) {
    mismatch++;
    if (mismatch <= 5) {
      console.warn("[mismatch]", kod, "json", vit.fiyat_tl, "exp", exp.fiyat_tl);
    }
  } else ok++;
}

console.log("Kur:", kur);
console.log("Vitrin eslesen OK:", ok);
console.log("Fiyat uyumsuz:", mismatch);
console.log("Vitrinde yok:", missingVitrin);
for (const s of samples) {
  const v = bySku.get(normKod(s));
  console.log(s, "→", v?.price, "fiyat_tl:", v?.fiyat_tl);
}
