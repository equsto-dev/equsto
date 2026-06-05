/**
 * Vercel prebuild — Electrolux import canlı katalogda olmalı (stale deploy yakalama).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIN = 650;
const KAYNAK = "electrolux-professional";

function countInFile(file) {
  if (!fs.existsSync(file)) return 0;
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(rows)) return 0;
  return rows.filter((r) => r && r.kaynak === KAYNAK).length;
}

const ekipPath = path.join(ROOT, "public/data/ekipmanlar.json");
const pisirmePath = path.join(ROOT, "public/data/dept/pisirme.json");
const ekipN = countInFile(ekipPath);
const pisirmeN = countInFile(pisirmePath);
const pisirmeBytes = fs.existsSync(pisirmePath) ? fs.statSync(pisirmePath).size : 0;

console.log("[verify-electrolux]", { ekipN, pisirmeN, pisirmeBytes });

if (ekipN < MIN) {
  console.error(`[verify-electrolux] HATA: ekipmanlar.json içinde ${ekipN} Electrolux (min ${MIN})`);
  process.exit(1);
}
if (pisirmeBytes < 3_000_000) {
  console.error(
    `[verify-electrolux] HATA: pisirme.json çok küçük (${pisirmeBytes} B) — import sonrası ~3.7MB beklenir`
  );
  process.exit(1);
}

console.log("[verify-electrolux] OK");
