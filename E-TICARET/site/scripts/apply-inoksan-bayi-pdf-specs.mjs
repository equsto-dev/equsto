/**
 * İnoksan bayi PDF ölçü/güç → ölçüsü eksik İnoksan ürünleri (katalog + Cafemarkt).
 *
 *   node scripts/apply-inoksan-bayi-pdf-specs.mjs --dry
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPT = path.join(ROOT, "public/data/dept");
const DRY = process.argv.includes("--dry");
const specs = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/data/inoksan/inoksan-bayi-pdf-specs.json"), "utf8"),
).products;

const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

function hasDim(row) {
  const o = row.olculer;
  return Boolean(o && typeof o === "object" && (Number(o.genislik_mm) >= 40 || Number(o.uzunluk_mm) >= 40));
}

function keys(row) {
  const out = [];
  for (const v of [row.sku, row.model, row.marka_urun_kodu, row.urun_kodu, row.stok_no]) {
    const k = norm(v).replace(/^210/, "");
    if (k.length >= 6) out.push(k);
  }
  return out;
}

const stats = { inoksan: 0, eslesen: 0, olcu: 0, enerji: 0, zatenVar: 0 };
const samples = [];
const files = fs.readdirSync(DEPT).filter((f) => f.endsWith(".json") && !f.includes("brema"));

for (const f of files) {
  const file = path.join(DEPT, f);
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(items)) continue;
  let dirty = false;
  for (const row of items) {
    if (!row || !/[İI]noksan/i.test(String(row.brand || row.oem_brand || ""))) continue;
    stats.inoksan++;
    const rec = keys(row).map((k) => specs[k]).find(Boolean);
    if (!rec) continue;
    stats.eslesen++;
    if (hasDim(row)) {
      stats.zatenVar++;
      continue;
    }
    const prev = row.olculer && typeof row.olculer === "object" && !Array.isArray(row.olculer) ? row.olculer : {};
    row.olculer = { ...prev, genislik_mm: rec.g, derinlik_mm: rec.d, yukseklik_mm: rec.y };
    if (!String(row.olcu_etiket || "").trim()) row.olcu_etiket = `${rec.g}×${rec.d}×${rec.y} mm`;
    stats.olcu++;
    dirty = true;

    const lines = Array.isArray(row.teknik_ozellikler) ? row.teknik_ozellikler.map(String) : [];
    const add = [];
    if (rec.guc && !lines.some((l) => /g[uü][çc]\s*:/i.test(l))) add.push("Elektrik gücü: " + rec.guc);
    if (rec.volt && !lines.some((l) => /voltaj|gerilim/i.test(l))) add.push("Elektrik voltaj: " + rec.volt.replace("V", " V"));
    if (add.length) {
      row.teknik_ozellikler = lines.concat(add);
      stats.enerji++;
    }
    if (samples.length < 25) {
      samples.push(`${row.sku} | ${row.olcu_etiket} | ${add.join(", ")} | s.${rec.page} ${rec.raw} | ${String(row.name).slice(0, 55)}`);
    }
  }
  if (dirty && !DRY) fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n");
}

console.log(JSON.stringify(stats, null, 2));
for (const s of samples) console.log(s);
if (DRY) console.log("dry — yazılmadı");
