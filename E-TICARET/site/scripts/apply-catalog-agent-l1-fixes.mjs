#!/usr/bin/env node
/**
 * Katalog ajanı L1 (+ marka price_mismatch) — expected_tl'yi dept'e uygular.
 * L3/L4 uygulanmaz (medyan/anomali; insan incelemesi gerekir).
 *
 *   node scripts/apply-catalog-agent-l1-fixes.mjs
 *   node scripts/apply-catalog-agent-l1-fixes.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const REPORT = path.join(ROOT, "scripts/data/catalog-agent/full-report.json");
const dryRun = process.argv.includes("--dry-run");

function fmtTry(n) {
  const v = Math.round(Number(n));
  return `₺${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},00`;
}

function skuOf(row) {
  return String(row.sku || row.model || row.urun_kodu || "").trim();
}

/** Cafemarkt / Portabianco kaynaklı satırlar L1 liste×iskonto ile ezilmemeli. */
function skipRow(row, fix) {
  const brand = String(row.brand || fix.brand || "");
  const src = String(
    row.fiyat_kaynak ||
      row.fiyat_kaynagi ||
      row.kaynak_fiyat_listesi ||
      row.kaynak ||
      "",
  ).toLowerCase();
  if (/portabianco/i.test(brand)) return true;
  if (src.includes("cafemarkt")) return true;
  if (String(fix.layer) === "brand" && /portabianco/i.test(String(fix.brand || "")))
    return true;
  return false;
}

function loadReportIssues() {
  const r = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const issues = r.issues || [];
  /** @type {Map<string, {expected:number, site:number, layer:string, message:string}>} */
  const byKey = new Map();
  for (const i of issues) {
    const layer = i.meta?.layer || "brand";
    if (layer === "L3" || layer === "L4") continue;
    if (i.type !== "price_mismatch" && i.type !== "price_update") continue;
    const exp = Number(i.expected_tl);
    const site = Number(i.site_tl);
    if (!(exp > 0) || !(site > 0)) continue;
    if (Math.abs(exp - site) < 2) continue;
    const dept = String(i.meta?.dept || "");
    const sku = String(i.sku || "").trim();
    if (!sku) continue;
    // Aynı SKU birden fazla dept'te olabilir — dept tercih et
    const keys = dept ? [`${dept}::${sku}`, sku] : [sku];
    for (const k of keys) {
      const prev = byKey.get(k);
      if (!prev || Math.abs(exp - site) > Math.abs(prev.expected - prev.site)) {
        byKey.set(k, {
          expected: Math.round(exp),
          site: Math.round(site),
          layer,
          message: i.message || "",
          brand: i.brand,
          dept,
        });
      }
    }
  }
  return byKey;
}

function applyToRow(row, fix) {
  const kdv = (Number(row.kdv_oran) || 20) / 100;
  const fiyat_tl = fix.expected;
  const fiyat_tl_net = Math.round(fiyat_tl / (1 + kdv));
  const price = `${fmtTry(fiyat_tl)} KDV dahil`;
  const before = Number(row.fiyat_tl) || 0;
  row.fiyat_tl = fiyat_tl;
  row.fiyat_tl_net = fiyat_tl_net;
  row.price = price;
  row.fiyat_bekleniyor = false;
  // specs içindeki "Equsto satış (TL" satırını güncelle (varsa)
  if (typeof row.specs === "string" && row.specs.includes("Equsto satış (TL")) {
    row.specs = row.specs.replace(
      /Equsto satış \(TL[^\\n]*/g,
      `Equsto satış (TL, KDV dahil): ${fmtTry(fiyat_tl)}`,
    );
  }
  return { before, after: fiyat_tl };
}

function main() {
  if (!fs.existsSync(REPORT)) {
    console.error("Rapor yok — önce: npm run catalog:agent:run");
    process.exit(1);
  }
  const fixes = loadReportIssues();
  console.log(`[apply-l1] uygulanabilir hedef: ${fixes.size} (L1+brand, L3/L4 hariç)`);

  let updated = 0;
  let touchedFiles = 0;
  const samples = [];

  for (const f of fs.readdirSync(DEPT).filter((x) => x.endsWith(".json"))) {
    const dept = f.replace(/\.json$/, "");
    const fp = path.join(DEPT, f);
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (!Array.isArray(rows)) continue;
    let fileHits = 0;
    for (const row of rows) {
      const sku = skuOf(row);
      const fix = fixes.get(`${dept}::${sku}`) || fixes.get(sku);
      if (!fix) continue;
      if (skipRow(row, fix)) continue;
      if (Math.abs(Number(row.fiyat_tl) - fix.expected) < 2) continue;
      const { before, after } = applyToRow(row, fix);
      fileHits++;
      updated++;
      if (samples.length < 12) {
        samples.push({
          dept,
          sku,
          brand: row.brand,
          before,
          after,
          layer: fix.layer,
        });
      }
    }
    if (fileHits) {
      touchedFiles++;
      if (!dryRun) {
        fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
      }
      console.log(`  ${f}: ${fileHits} ürün`);
    }
  }

  console.log(`\nÖzet: ${updated} ürün güncellendi | ${touchedFiles} dept dosyası`);
  for (const s of samples) {
    console.log(
      `  [${s.layer}] ${s.brand} ${s.sku}: ₺${s.before.toLocaleString("tr-TR")} → ₺${s.after.toLocaleString("tr-TR")}`,
    );
  }
  if (dryRun) {
    console.log("(dry-run — yazılmadı)");
    return;
  }

  const reb = spawnSync("node", ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (reb.status !== 0) process.exit(reb.status || 1);
}

main();
