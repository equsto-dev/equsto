#!/usr/bin/env node
/**
 * Büyük markalar: büyükten küçüğe, --keep-review YOK.
 * GastroPlast / Cambro / Bilge / Kapp özel kapsam — bu listede yok.
 *
 *   node scripts/import-cm-brands/batch-large.mjs
 *   node scripts/import-cm-brands/batch-large.mjs --from Empero
 *   node scripts/import-cm-brands/batch-large.mjs --only Empero
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
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

const MIN_COUNT = 41;
const SKIP_ALWAYS = new Set([
  "100% chef",
  "bora plastik",
  "rubbermaid",
  "türkay",
  "gastroplast",
  "cambro",
  "rational",
  "robot coupe",
  "unox",
  "öztiryakiler",
  "empero",
  "atalay",
  "remta",
  "kapp",
  "bilge inox",
  "karacasan",
  "silverinox",
  "csa inox",
  "iceinox",
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

function listLargeBrands() {
  return loadBrandCsv()
    .filter((r) => typeof r.count === "number" && r.count >= MIN_COUNT)
    .filter((r) => WANT.has(r.name.toLocaleLowerCase("tr-TR")))
    .filter((r) => !SKIP_ALWAYS.has(r.name.toLocaleLowerCase("tr-TR")))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"));
}

function runApply(brand) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["scripts/import-cm-brands/apply-new.mjs", "--brand", brand, "--apply"],
      { cwd: ROOT, stdio: "inherit" },
    );
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`apply ${brand} exit ${code}`));
    });
  });
}

async function main() {
  const only = arg("--only");
  const from = arg("--from");
  let brands = listLargeBrands();
  if (only) {
    brands = brands.filter((b) => b.name.toLocaleLowerCase("tr-TR") === only.toLocaleLowerCase("tr-TR"));
  } else if (from) {
    const i = brands.findIndex((b) => b.name.toLocaleLowerCase("tr-TR") === from.toLocaleLowerCase("tr-TR"));
    if (i >= 0) brands = brands.slice(i);
  }

  const done = [];
  const failed = [];
  console.log(`[cm-large] ${brands.length} marka: ${brands.map((b) => `${b.name}(${b.count})`).join(", ")}`);

  for (const b of brands) {
    try {
      const cache = plpCachePath(brandSlug(b.name));
      if (!fs.existsSync(cache)) {
        await fetchBrandPlp(b.name);
      } else {
        console.log(`[cm-large] cache var: ${cache}`);
      }
      await runApply(b.name);
      done.push(b.name);
    } catch (err) {
      console.error(`[cm-large] HATA ${b.name}:`, err?.message || err);
      failed.push({ brand: b.name, error: String(err?.message || err) });
    }
    await sleep(DELAY_BRAND_MS);
  }

  writeJson(path.join(REPORT_DIR, "batch-large-summary.json"), {
    at: new Date().toISOString(),
    done,
    failed,
  });
  console.log(`[cm-large] bitti done=${done.length} failed=${failed.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
