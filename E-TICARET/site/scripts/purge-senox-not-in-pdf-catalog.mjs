#!/usr/bin/env node
/**
 * SENOX 2026-2-1 PDF kataloğunda olmayan Şenox ürünlerini mağazadan kaldırır.
 *
 * Kaynak liste: scripts/data/senox/senox-katalogda-olmayan.json
 * (önce: node scripts/list-senox-not-in-pdf-catalog.mjs)
 *
 *   node scripts/purge-senox-not-in-pdf-catalog.mjs
 *   node scripts/purge-senox-not-in-pdf-catalog.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { MASTER_JSON_PATH } from "./catalog-master-paths.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const LIST_JSON = path.join(ROOT, "scripts/data/senox/senox-katalogda-olmayan.json");
const OUT_REPORT = path.join(ROOT, "scripts/data/senox/senox-katalogda-olmayan-silinen.json");
const dryRun = process.argv.includes("--dry-run");

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

function loadRemoveIds() {
  if (!fs.existsSync(LIST_JSON)) {
    console.error(`Liste yok: ${LIST_JSON}`);
    console.error("Önce: node scripts/list-senox-not-in-pdf-catalog.mjs");
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(LIST_JSON, "utf8"));
  const products = raw.products || [];
  const ids = new Set(products.map((p) => p.id).filter(Boolean));
  return { ids, products, meta: raw };
}

async function purgeDept(ids) {
  const removed = [];
  let total = 0;
  for (const file of (await fsp.readdir(DEPT_DIR)).sort()) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(DEPT_DIR, file);
    const rows = JSON.parse(await fsp.readFile(filePath, "utf8"));
    if (!Array.isArray(rows)) continue;
    const kept = [];
    let n = 0;
    for (const r of rows) {
      if (r?.id && ids.has(r.id)) {
        n++;
        removed.push({
          id: r.id,
          model: r.model,
          sku: r.sku,
          name: r.name,
          dept: file,
          kaynak: r.kaynak_fiyat_listesi || r.kaynak || "",
        });
        continue;
      }
      kept.push(r);
    }
    if (n) {
      total += n;
      console.log(`[purge-senox] ${file}: -${n} (kalan ${kept.length})`);
      if (!dryRun) writeJsonAtomic(filePath, kept);
    }
  }
  return { removed, total };
}

function purgeMaster(ids) {
  if (!fs.existsSync(MASTER_JSON_PATH)) return 0;
  const master = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, "utf8"));
  const before = (master.products || []).length;
  master.products = (master.products || []).filter((p) => !(p?.id && ids.has(p.id)));
  const removed = before - master.products.length;
  if (removed && !dryRun) {
    master.generated = new Date().toISOString();
    master.count = master.products.length;
    writeJsonAtomic(MASTER_JSON_PATH, master);
  }
  console.log(`[purge-senox] master: -${removed} (kalan ${master.products.length})`);
  return removed;
}

async function main() {
  const { ids, products, meta } = loadRemoveIds();
  console.log(
    `[purge-senox] katalog=${meta.catalog || "SENOX 2026-2-1"} | kaldırılacak id: ${ids.size}${dryRun ? " (dry-run)" : ""}`,
  );

  const { removed, total } = await purgeDept(ids);
  const masterRemoved = purgeMaster(ids);

  const missingIds = [...ids].filter((id) => !removed.some((r) => r.id === id));
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    catalog: meta.catalog,
    requested: ids.size,
    removedFromDept: total,
    removedFromMaster: masterRemoved,
    notFoundInDept: missingIds,
    products: removed.sort((a, b) => String(a.model).localeCompare(String(b.model), "tr")),
  };
  if (!dryRun) {
    writeJsonAtomic(OUT_REPORT, report);
    console.log(`→ ${OUT_REPORT}`);
  }

  if (!dryRun && total) {
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    execFileSync(process.execPath, ["scripts/list-senox-not-in-pdf-catalog.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  console.log(`[purge-senox] tamam — dept -${total} | master -${masterRemoved}`);
  if (missingIds.length) {
    console.log(`  dept'te bulunamayan id: ${missingIds.length}`, missingIds.slice(0, 8).join(", "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
