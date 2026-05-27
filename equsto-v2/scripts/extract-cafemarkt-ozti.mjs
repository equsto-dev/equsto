#!/usr/bin/env node
/**
 * cafemarkt.json → Öztiryakiler alt küme
 *   node scripts/extract-cafemarkt-ozti.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_CANDIDATES = [
  process.env.CAFEMARKT_JSON,
  "C:/Users/User/OneDrive/Masaüstü/SİTELER/cafemarkt.json",
  "C:/Users/User/Downloads/cafemarkt.json",
].filter(Boolean);

const SRC = SRC_CANDIDATES.find((p) => fs.existsSync(p));
if (!SRC) {
  console.error("cafemarkt.json bulunamadı. CAFEMARKT_JSON veya Downloads/OneDrive.");
  process.exit(1);
}

const OUT = path.join(ROOT, "scripts/data/cafemarkt-ozti.json");

const all = JSON.parse(fs.readFileSync(SRC, "utf8"));
const oz = all.filter((p) =>
  /öztiryakiler/i.test(String(p["ürün_markası"] || p.urun_markasi || "")),
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(oz, null, 2), "utf8");

const withImg = oz.filter((p) => Array.isArray(p.resimler) && p.resimler.length).length;
console.log(`Kaynak: ${SRC}`);
console.log(`Toplam: ${all.length} | Öztiryakiler: ${oz.length} | Görselli: ${withImg}`);
console.log(`Yazıldı: ${OUT}`);
