/**
 * dept/*.json görsel yollarını _manifest.json (ax-images/web) ile hizala.
 * p287/pdf katalog kırpıntılarını web görselleriyle değiştirir.
 *
 *   node scripts/sync-ozti-manifest-dept.mjs --dept davlumbaz
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

const LOW = /catalog\/ozti\/(p287|pdf|katalog)\//i;

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function parseArgs() {
  const args = process.argv.slice(2);
  let dept = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dept") dept = args[++i] || "";
  }
  return { dept };
}

function main() {
  const { dept } = parseArgs();
  if (!fs.existsSync(MANIFEST)) {
    console.error("[sync-ozti] manifest yok:", MANIFEST);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const files = fs
    .readdirSync(DEPT_DIR)
    .filter((f) => f.endsWith(".json") && (!dept || f === `${dept}.json`));

  let total = 0;
  for (const file of files) {
    const fp = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(fp, "utf8").replace(/\bNaN\b/g, "null"));
    let changed = 0;
    for (const row of rows) {
      if (!/öztiryaki|oztiryaki/i.test(row.brand || "")) continue;
      const kod = normKod(row.urun_kodu || row.sku || row.model);
      const cur = (row.images || [])[0] || "";
      const rel = manifest[kod];
      if (!rel || !/\/web\//i.test(rel)) continue;
      const abs = path.join(ROOT, "public", rel.replace(/^\//, ""));
      if (!fs.existsSync(abs)) continue;
      if (cur === rel) continue;
      if (!LOW.test(cur) && cur.includes("/web/")) continue;
      row.images = [rel];
      changed++;
    }
    if (changed) {
      fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
      console.log(`[sync-ozti] ${file} → ${changed} satır`);
      total += changed;
    }
  }
  console.log("[sync-ozti] toplam:", total);
}

main();
