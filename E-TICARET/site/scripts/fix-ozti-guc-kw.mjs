#!/usr/bin/env node
/**
 * Öztiryakiler — yanlış parse edilmiş toplam kW değerlerini PDF/web ile düzeltir.
 *
 *   node scripts/fix-ozti-guc-kw.mjs
 *   node scripts/fix-ozti-guc-kw.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  applyOztiGucKwFix,
  isOztiBrand,
  kodSoftKey,
  loadPdfByKod,
  normKod,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const WEB_INDEX = path.join(ROOT, "scripts/data/ozti-web-index.json");
const MASTER = path.join(ROOT, "public/data/equsto-katalog-master.json");
const REPORT = path.join(ROOT, "scripts/data/ozti-guc-kw-fix-report.json");

const dryRun = process.argv.includes("--dry-run");

function loadWebByKod() {
  if (!fs.existsSync(WEB_INDEX)) return new Map();
  const raw = JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
  const map = new Map();
  const list = raw.byKod ? Object.values(raw.byKod) : Array.isArray(raw) ? raw : [];
  for (const e of list) {
    const k = normKod(e.kod || e.urun_kodu);
    if (!k) continue;
    map.set(k, e);
    const soft = kodSoftKey(k);
    if (soft && !map.has(soft)) map.set(soft, e);
  }
  if (raw.byKodSoft) {
    for (const [soft, e] of Object.entries(raw.byKodSoft)) {
      if (!map.has(soft)) map.set(soft, e);
    }
  }
  return map;
}

function patchRows(rows, pdfByKod, webByKod) {
  const changes = [];
  for (const row of rows) {
    if (!isOztiBrand(row)) continue;
    const kod = normKod(row.urun_kodu || row.sku);
    const prev = row.olculer?.guc_kw ?? null;
    if (!applyOztiGucKwFix(row, pdfByKod, webByKod)) continue;
    changes.push({
      kod,
      prev: prev != null ? String(prev) : null,
      next: String(row.olculer?.guc_kw ?? ""),
      name: row.name || row.urun_tanimi || "",
    });
  }
  return changes;
}

function patchMaster(pdfByKod, webByKod) {
  if (!fs.existsSync(MASTER)) return [];
  const master = JSON.parse(fs.readFileSync(MASTER, "utf8"));
  const rows = master.urunler || master.products || [];
  const changes = [];
  for (const row of rows) {
    const kod = normKod(row.marka_urun_kodu || row.urun_kodu);
    if (!kod.startsWith("78")) continue;
    const fake = {
      brand: "Öztiryakiler Endüstriyel Mutfak",
      sku: kod,
      urun_kodu: kod,
      name: row.urun_adi || row.name || "",
      urun_tanimi: row.urun_tanimi || "",
      kategori: row.kategori || "",
      olculer: row.olculer || {},
      teknik_ozellikler: String(row.teknik_ozellikler || "").split("\n").filter(Boolean),
      specs: row.teknik_ozellikler || "",
    };
    const prev = fake.olculer?.guc_kw ?? null;
    if (!applyOztiGucKwFix(fake, pdfByKod, webByKod)) continue;
    row.olculer = fake.olculer;
    const gucLine = `Güç: ${fake.olculer.guc_kw} kW`;
    row.teknik_ozellikler = String(row.teknik_ozellikler || "").replace(
      /(^|\n)G[uü]ç:\s*[\d.,]+\s*kW/gi,
      `$1${gucLine}`,
    );
    changes.push({ kod, prev: prev != null ? String(prev) : null, next: fake.olculer.guc_kw });
  }
  if (!dryRun && changes.length) {
    fs.writeFileSync(MASTER, `${JSON.stringify(master, null, 2)}\n`, "utf8");
  }
  return changes;
}

function main() {
  const pdfByKod = loadPdfByKod();
  const webByKod = loadWebByKod();
  const allChanges = [];

  for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
    const p = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(p, "utf8"));
    const changes = patchRows(rows, pdfByKod, webByKod);
    if (changes.length && !dryRun) {
      fs.writeFileSync(p, `${JSON.stringify(rows)}\n`, "utf8");
    }
    allChanges.push(...changes.map((c) => ({ ...c, dept: file.replace(/\.json$/, "") })));
  }

  const masterChanges = patchMaster(pdfByKod, webByKod);

  const report = {
    at: new Date().toISOString(),
    dryRun,
    deptChanges: allChanges.length,
    masterChanges: masterChanges.length,
    changes: allChanges.sort((a, b) => a.kod.localeCompare(b.kod)),
    master: masterChanges,
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `[ozti-guc-kw] ${dryRun ? "dry-run " : ""}dept: ${allChanges.length}, master: ${masterChanges.length}`,
  );
  for (const c of allChanges.slice(0, 30)) {
    console.log(`  ${c.kod}: ${c.prev} → ${c.next} (${c.dept})`);
  }
  if (allChanges.length > 30) console.log(`  … +${allChanges.length - 30} more`);

  if (!dryRun && allChanges.length) {
    const rb = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (rb.status !== 0) process.exit(rb.status || 1);
  }
}

main();
