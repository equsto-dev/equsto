#!/usr/bin/env node
/**
 * ≤40 ürünlük markalar: PLP çek + ana ekipman uygula.
 * Büyük kataloglar ve özel kapsam (GastroPlast/Cambro/Bilge/Kapp) dışarıda.
 *
 *   node scripts/import-cm-brands/batch-small.mjs
 *   node scripts/import-cm-brands/batch-small.mjs --from Hobart
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchBrandPlp } from "./fetch-plp.mjs";
import {
  DELAY_BRAND_MS,
  REPORT_DIR,
  ROOT,
  brandSlug,
  loadBrandCsv,
  plpCachePath,
  sleep,
  writeJson,
} from "./shared.mjs";

const MAX_COUNT = 40;
const SKIP_ALWAYS = new Set([
  "100% chef",
  "bora plastik",
  "rubbermaid",
  "türkay",
  "gastroplast",
  "cambro",
  "bilge inox",
  "kapp",
  "öztiryakiler",
  "empero",
  "atalay",
  "remta",
  "rational",
  "robot coupe",
  "unox",
]);

const WANT = new Set(
  fs
    .readFileSync("C:/D Disk/EQUSTO-ONE/wip/eklenecek-markalar.txt", "utf8")
    .split(/\r?\n/)
    .map((s) => s.trim().toLocaleLowerCase("tr-TR"))
    .filter(Boolean),
);

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  return process.argv[i + 1] || fallback;
}

function listSmallBrands() {
  return loadBrandCsv()
    .filter((r) => typeof r.count === "number" && r.count > 0 && r.count <= MAX_COUNT)
    .filter((r) => WANT.has(r.name.toLocaleLowerCase("tr-TR")))
    .filter((r) => !SKIP_ALWAYS.has(r.name.toLocaleLowerCase("tr-TR")))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

function runApply(brand) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["scripts/import-cm-brands/apply-new.mjs", "--brand", brand, "--apply", "--keep-review"],
      { cwd: ROOT, stdio: "inherit" },
    );
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`apply ${brand} exit ${code}`));
    });
  });
}

async function main() {
  const from = arg("--from").toLocaleLowerCase("tr-TR");
  const refresh = process.argv.includes("--refresh");
  const brands = listSmallBrands();
  const start = from ? brands.findIndex((b) => b.name.toLocaleLowerCase("tr-TR") === from) : 0;
  const queue = start >= 0 ? brands.slice(Math.max(0, start)) : brands;
  console.log(`[cm-batch] ${queue.length} marka (≤${MAX_COUNT}), from=${from || "baş"}`);

  const summary = [];
  for (let i = 0; i < queue.length; i++) {
    const b = queue[i];
    console.log(`\n[cm-batch] ${i + 1}/${queue.length} ${b.name} (CM ${b.count})`);
    try {
      const cache = plpCachePath(b.slug);
      if (!refresh && fs.existsSync(cache)) {
        console.log(`[cm-batch] önbellek var: ${cache}`);
      } else {
        const fetched = await fetchBrandPlp(b.name, { slug: b.slug });
        if (fetched.reportedTotal > 45 || fetched.count > 45) {
          console.warn(`[cm-batch] ${b.name} beklenenden büyük (${fetched.count}) — atlandı`);
          summary.push({ brand: b.name, skipped: "too-large", count: fetched.count });
          await sleep(DELAY_BRAND_MS);
          continue;
        }
      }
      await runApply(b.name);
      const reportPath = path.join(REPORT_DIR, `${brandSlug(b.name)}-apply-report.json`);
      let extra = {};
      try {
        extra = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      } catch {
        extra = {};
      }
      summary.push({
        brand: b.name,
        plp: extra.plp,
        existing: extra.equstoExisting,
        matched: extra.matchedKeep,
        dropped: extra.dropped,
        review: extra.review,
        added: extra.newRows,
      });
    } catch (err) {
      console.error(`[cm-batch] ${b.name} hata:`, err?.message || err);
      summary.push({ brand: b.name, error: String(err?.message || err) });
    }
    if (i < queue.length - 1) await sleep(DELAY_BRAND_MS);
  }

  const out = path.join(REPORT_DIR, "batch-small-summary.json");
  writeJson(out, { at: new Date().toISOString(), maxCount: MAX_COUNT, brands: summary });
  console.log(`\n[cm-batch] özet: ${out}`);
  for (const row of summary) {
    if (row.error) console.log(`  ! ${row.brand}  ${row.error}`);
    else if (row.skipped) console.log(`  - ${row.brand}  atlandı ${row.skipped}`);
    else console.log(`  + ${row.brand}  yeni=${row.added} eşleşen=${row.matched} ele=${row.dropped}`);
  }
}

const here = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] || "").toLowerCase() === here.toLowerCase()) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
