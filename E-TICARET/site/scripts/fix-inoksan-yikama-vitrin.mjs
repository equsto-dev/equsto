#!/usr/bin/env node
/**
 * İnoksan yıkama vitrin: Excel fiyatları + tezgah/ZCO-ZMD temizliği + Excel adları.
 *
 *   node scripts/fix-inoksan-yikama-vitrin.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const YIKAMA = path.join(ROOT, "public/data/dept/yikama.json");
const KAYNAK = "inoksan-fiyat-listesi-2026-r1";

function vitrinOk(row) {
  if (row.brand !== "İnoksan" && row.kaynak_fiyat_listesi !== KAYNAK) return true;
  if (row.inoksan_h2 === "Ekipmanlar") return false;
  const sku = String(row.sku || "");
  if (sku.includes("-ZCO-") || sku.includes("-ZMD-")) return false;
  return true;
}

function loadExcelYikama() {
  const py = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("sync", r"${path.join(ROOT, "scripts/sync-inoksan-fiyat-2026.py").replace(/\\/g, "\\\\")}")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
rows = [r for r in m.load_excel_rows() if r.get("dept") == "yikama"]
print(json.dumps(rows, ensure_ascii=False))
`;
  const r = spawnSync("python", ["-c", py], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  if (r.status !== 0) throw new Error(r.stderr || "Excel okunamadı");
  return JSON.parse(r.stdout.trim());
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  fs.renameSync(tmp, filePath);
}

const excel = loadExcelYikama();
const excelBySku = new Map(excel.map((r) => [r.sku, r]));
const allowedSkus = new Set(excel.filter(vitrinOk).map((r) => r.sku));

const rows = JSON.parse(fs.readFileSync(YIKAMA, "utf8"));
const before = rows.length;
let removed = 0;
let updated = 0;

const PRESERVE = [
  "images",
  "inoksan_web_id",
  "inoksan_web_title",
  "inoksan_slug",
  "inoksan_url",
  "inoksan_match_via",
  "inoksan_image_source",
  "inoksan_image_url",
  "inoksan_enriched",
  "inoksan_enriched_at",
  "teknik_ozellikler",
];

const out = [];
for (const row of rows) {
  const isIno =
    row.brand === "İnoksan" ||
    row.kaynak_fiyat_listesi === KAYNAK ||
    String(row.id || "").startsWith("inoksan__");

  if (!isIno) {
    out.push(row);
    continue;
  }

  if (!allowedSkus.has(row.sku)) {
    removed++;
    continue;
  }

  const fresh = excelBySku.get(row.sku);
  if (!fresh) {
    removed++;
    continue;
  }

  const kept = {};
  for (const k of PRESERVE) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") kept[k] = row[k];
  }

  const merged = { ...fresh, ...kept };
  merged.aciklama = `${merged.name}\n\nKategori: ${merged.inoksan_h3 || merged.category || ""}`;
  updated++;
  out.push(merged);
}

writeJsonAtomic(YIKAMA, out);
spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

console.log(`[inoksan-yikama] önce: ${before} | sonra: ${out.length}`);
console.log(`  silinen İnoksan: ${removed} | güncellenen: ${updated} | vitrin: ${allowedSkus.size}`);
