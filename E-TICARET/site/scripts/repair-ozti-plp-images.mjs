#!/usr/bin/env node
/**
 * Hatalı Öztiryakiler PLP görsellerini düzelt:
 * - 10995 bayt UNOX stub (6696b6d1…)
 * - wireframe / katalog (<215 KB render eşiği)
 *
 * ax-images CDN'den indirir → public/images/catalog/ozti/web/
 * dept JSON + manifest güncellenir.
 *
 *   node scripts/repair-ozti-plp-images.mjs --dry-run
 *   node scripts/repair-ozti-plp-images.mjs --dept=set-ustu-mutfak
 *   node scripts/repair-ozti-plp-images.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB_DIR = path.join(ROOT, "public/images/catalog/ozti/web");
const CAFEMARKT_DIR = path.join(ROOT, "public/images/catalog/ozti/cafemarkt");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
const WEB_SUB = "images/catalog/ozti/web";
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const BAD_STUB_BYTES = 10995;
const BAD_STUB_MD5 = "6696b6d14fecffc05fb1dc0156c9f6b4";
const MIN_PHOTO = 8000;
const MIN_RENDER = 215000;

const dryRun = process.argv.includes("--dry-run");
const deptArg = process.argv.find((a) => a.startsWith("--dept="));
const deptFilter = deptArg ? deptArg.split("=")[1] : "";
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;

function md5File(abs) {
  return crypto.createHash("md5").update(fs.readFileSync(abs)).digest("hex");
}

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function slugFile(kod) {
  return (
    "ozti-" +
    String(kod)
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

function webRel(kod) {
  return `${WEB_SUB}/${slugFile(kod)}.jpg`;
}

function publicAbs(rel) {
  return path.join(ROOT, "public", String(rel || "").replace(/^\//, ""));
}

function isBadImage(abs) {
  if (!abs || !fs.existsSync(abs)) return "missing";
  const bytes = fs.statSync(abs).size;
  if (bytes === BAD_STUB_BYTES && md5File(abs) === BAD_STUB_MD5) return "stub";
  if (bytes < MIN_PHOTO) return "tiny";
  if (bytes < MIN_RENDER) return "wire";
  return "ok";
}

function downloadAx(kod) {
  const key = normKod(kod);
  if (!key) return "";
  const rel = webRel(key);
  const dest = publicAbs(rel);
  if (fs.existsSync(dest) && isBadImage(dest) === "ok") return rel;

  if (dryRun) return rel;

  fs.mkdirSync(WEB_DIR, { recursive: true });
  const url = `${AX}/${encodeURIComponent(key)}.jpg`;
  const r = spawnSync("curl.exe", ["-sL", "-k", "--max-time", "45", "-o", dest, url], {
    stdio: "pipe",
  });
  if (r.status !== 0 || !fs.existsSync(dest) || fs.statSync(dest).size < MIN_PHOTO) {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    return "";
  }
  if (isBadImage(dest) === "stub") {
    fs.unlinkSync(dest);
    return "";
  }
  return rel;
}

function removeBadCafemarkt(rel) {
  if (!rel || !rel.includes("/cafemarkt/")) return;
  const abs = publicAbs(rel);
  if (!fs.existsSync(abs)) return;
  const kind = isBadImage(abs);
  if (kind !== "stub" && kind !== "tiny") return;
  if (!dryRun) fs.unlinkSync(abs);
}

function isOztiRow(row) {
  return /öztiryakiler|oztiryakiler/i.test(String(row.brand || ""));
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST)) return {};
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
}

function saveManifest(manifest) {
  if (!dryRun) fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
}

function processDept(jsonPath, manifest, stats) {
  const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  let changed = 0;

  for (const row of rows) {
    if (!isOztiRow(row)) continue;
    if (limit > 0 && stats.processed >= limit) break;

    const kod = String(row.sku || row.model || row.urun_kodu || "").trim();
    if (!kod) continue;

    const cur = String((row.images || [])[0] || "").replace(/\\/g, "/");
    const curAbs = cur ? publicAbs(cur) : "";
    const kind = curAbs ? isBadImage(curAbs) : "missing";
    if (kind === "ok") continue;

    stats.processed++;
    stats.bad[kind] = (stats.bad[kind] || 0) + 1;

    const next = downloadAx(kod);
    if (!next) {
      stats.miss++;
      continue;
    }

    removeBadCafemarkt(cur);
    if (next !== cur) {
      if (!dryRun) {
        row.images = [next];
        row.imageSource = "ozti-ax-repair";
      }
      changed++;
      stats.fixed++;
    }

    const nk = normKod(kod);
    if (manifest[nk] !== next) {
      manifest[nk] = next;
      stats.manifest++;
    }
  }

  if (!dryRun && changed) {
    fs.writeFileSync(jsonPath, JSON.stringify(rows), "utf8");
  }
  return changed;
}

function main() {
  const manifest = loadManifest();
  const stats = {
    processed: 0,
    fixed: 0,
    miss: 0,
    manifest: 0,
    bad: {},
  };

  let files = fs
    .readdirSync(DEPT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(DEPT_DIR, f));

  if (deptFilter) {
    files = files.filter((f) => path.basename(f, ".json") === deptFilter);
  }

  console.log(
    "[repair-ozti-plp] dry=%s dept=%s limit=%s files=%s",
    dryRun,
    deptFilter || "all",
    limit || "all",
    files.length
  );

  for (const fp of files) {
    const n = processDept(fp, manifest, stats);
    if (n) console.log(" ", path.basename(fp), n);
  }

  saveManifest(manifest);
  console.log("\n[repair-ozti-plp]", stats);
}

main();
