#!/usr/bin/env node
/**
 * Bar arkası şişe soğutucu fiyatlarını vitrinden gizle (rakipler scrape etmesin).
 * Dahili yedek: var/catalog/gizli-fiyatlar-bar-sise.json
 *
 *   node scripts/hide-bar-sise-sogutucu-prices.mjs
 *   node scripts/hide-bar-sise-sogutucu-prices.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOGUTMA = path.join(ROOT, "public/data/dept/sogutma.json");
const MARKET = path.join(ROOT, "public/data/dept/market-reyon.json");
const OUT_SECRET = path.join(ROOT, "var/catalog/gizli-fiyatlar-bar-sise.json");
const dryRun = process.argv.includes("--dry-run");
const LABEL = "Teklif için iletişim";

function foldTr(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0131/g, "i");
}

function isBarSiseSogutucu(row) {
  const cat = String(row.category || "");
  if (cat === "bar-tipi-sise-sogutucu" || cat === "proso-sise-sogutucu") return true;
  const hay = foldTr(
    [
      row.name,
      row.sku,
      row.urun_alt_kategori,
      row.specs,
      Array.isArray(row.kategori_yolu) ? row.kategori_yolu.join(" ") : "",
      row.search_hints,
    ].join(" "),
  );
  if (
    /granite pizza|teshir buzdolabi|salata|saladette|\bst[- ]?\d{2,}/.test(hay) &&
    !/sise sogut|bar alti|bar arkasi|bbc|vbbc/.test(hay)
  ) {
    return false;
  }
  return /sise sogut|bar alti|bar arkasi|bar sogutucu|bottle cooler|back ?bar|\bbbc[-.]|\bvbbc|\bbbcs|\bvgb|\bgbc[-.]/.test(
    hay,
  );
}

const PRICE_KEYS = [
  "fiyat_tl",
  "fiyat_tl_net",
  "fiyat_havale_tl",
  "havale_iskonto_oran",
  "liste_fiyati_eur",
  "satis_eur_net",
  "satis_eur_indirimli",
  "satis_fiyati_eur",
  "iskonto_oran",
  "kur_eur_try",
  "cafemarkt_fiyat_kdv_dahil",
  "cafemarkt_fiyat_equsto_kdv_dahil",
  "price_display",
  "piyasa_ref_tl",
];

function scrubSpecs(specs) {
  if (!specs) return specs;
  return String(specs)
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/equsto\s*(net|satis|satış)|liste\s*fiyat|bayi\s*net|iskonto|kur\s*:|€|eur\s*=|fiyat_tl|₺\s*[\d.,]+/i.test(
          line,
        ),
    )
    .join("\n")
    .trim();
}

function snapshot(row) {
  const snap = {
    sku: row.sku,
    id: row.id,
    name: row.name,
    brand: row.brand,
    dept: row.dept,
    price: row.price,
    fiyat_bekleniyor: row.fiyat_bekleniyor,
    hidden_at: new Date().toISOString(),
  };
  for (const k of PRICE_KEYS) {
    if (row[k] != null && row[k] !== "") snap[k] = row[k];
  }
  return snap;
}

function hideRow(row) {
  const before = snapshot(row);
  row.fiyat_bekleniyor = true;
  row.price = LABEL;
  row.price_display = LABEL;
  for (const k of PRICE_KEYS) {
    if (k === "price_display") continue;
    if (k in row) row[k] = null;
  }
  if (row.specs) row.specs = scrubSpecs(row.specs);
  return before;
}

function patchFile(filePath, secrets) {
  if (!fs.existsSync(filePath)) return 0;
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(rows)) return 0;
  let n = 0;
  for (const row of rows) {
    if (!isBarSiseSogutucu(row)) continue;
    // Zaten gizli ve fiyat yoksa yine de yedeğe al (idempotent)
    const hasPublic =
      Number(row.fiyat_tl) > 0 ||
      (row.fiyat_bekleniyor !== true && /\d/.test(String(row.price || "")));
    if (!hasPublic && row.fiyat_bekleniyor === true) continue;
    secrets.push(hideRow(row));
    n++;
  }
  if (n && !dryRun) {
    const tmp = `${filePath}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(rows), "utf8");
    fs.renameSync(tmp, filePath);
  }
  return n;
}

const secrets = [];
const n1 = patchFile(SOGUTMA, secrets);
const n2 = patchFile(MARKET, secrets);
console.log(`[hide-bar-sise] sogutma=${n1} market-reyon=${n2} total=${secrets.length}${dryRun ? " (dry-run)" : ""}`);

if (!dryRun && secrets.length) {
  fs.mkdirSync(path.dirname(OUT_SECRET), { recursive: true });
  let prev = [];
  if (fs.existsSync(OUT_SECRET)) {
    try {
      prev = JSON.parse(fs.readFileSync(OUT_SECRET, "utf8"));
      if (!Array.isArray(prev)) prev = [];
    } catch {
      prev = [];
    }
  }
  const bySku = new Map();
  for (const s of prev) {
    if (s?.sku) bySku.set(String(s.sku), s);
  }
  for (const s of secrets) {
    if (s?.sku) bySku.set(String(s.sku), s);
  }
  const merged = [...bySku.values()].sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
  fs.writeFileSync(OUT_SECRET, JSON.stringify(merged, null, 2), "utf8");
  console.log(`[hide-bar-sise] secret → ${path.relative(ROOT, OUT_SECRET)} (${merged.length} sku)`);

  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}
