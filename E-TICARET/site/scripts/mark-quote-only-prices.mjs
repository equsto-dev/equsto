#!/usr/bin/env node
/**
 * Fiyatı olmayan / boş ürünleri Google-safe teklif moduna çeker:
 *   fiyat_bekleniyor=true, price="Teklif iste"
 *
 *   node scripts/mark-quote-only-prices.mjs
 *   node scripts/mark-quote-only-prices.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const dryRun = process.argv.includes("--dry-run");
const LABEL = "Teklif iste";

function hasSellablePrice(p) {
  if (p.fiyat_bekleniyor === true) return false;
  const tl = Number(p.fiyat_tl);
  if (Number.isFinite(tl) && tl > 0) return true;
  const price = String(p.price || "").trim();
  if (!price) return false;
  if (/teklif\s*iste|teklif\s*için|fiyat\s*beklen|iletişim|contact\s*for|price\s*on\s*request/i.test(price)) {
    return false;
  }
  if (/\d/.test(price) && /₺|tl|try|eur|€/i.test(price)) return true;
  if (/^\d+([.,]\d+)?$/.test(price.replace(/\s/g, ""))) return true;
  return false;
}

let n = 0;
for (const f of fs.readdirSync(DEPT).filter((x) => x.endsWith(".json") && !x.includes("_items"))) {
  const file = path.join(DEPT, f);
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(rows)) continue;
  let changed = false;
  for (const row of rows) {
    if (hasSellablePrice(row)) continue;
    const before = { price: row.price, fb: row.fiyat_bekleniyor, tl: row.fiyat_tl };
    row.fiyat_bekleniyor = true;
    row.price = LABEL;
    if (row.fiyat_tl != null && !(Number(row.fiyat_tl) > 0)) delete row.fiyat_tl;
    n++;
    changed = true;
    if (n <= 5) console.log("[quote]", row.id || row.sku, before, "→", LABEL);
  }
  if (changed && !dryRun) fs.writeFileSync(file, JSON.stringify(rows), "utf8");
}

console.log(`[mark-quote-only] ${dryRun ? "DRY-RUN " : ""}updated=${n}`);
if (!dryRun && n) {
  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}
