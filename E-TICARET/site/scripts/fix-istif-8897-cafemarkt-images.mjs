#!/usr/bin/env node
/**
 * Polipropilen istif rafları (8897.36/46/56*.P0) — yanlış UNOX fırın cafemarkt görsellerini
 * genişliğe göre doğru 8897.*IP4.07 raf fotoğrafı ile değiştirir.
 *
 *   node scripts/fix-istif-8897-cafemarkt-images.mjs
 *   node scripts/fix-istif-8897-cafemarkt-images.mjs --dry-run
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CM = path.join(ROOT, "public/images/catalog/ozti/cafemarkt");
const BAD_HASH = "6696b6d1e8f0a8b5c3d2e1f0a9b8c7d6"; // prefix match below
const dryRun = process.argv.includes("--dry-run");

function md5File(fp) {
  return crypto.createHash("md5").update(fs.readFileSync(fp)).digest("hex");
}

function isBadOvenImage(fp) {
  if (!fs.existsSync(fp)) return false;
  return md5File(fp).startsWith("6696b6d1");
}

function widthToIp4(width) {
  const w = Number(width);
  const table = [
    [70, "11"],
    [80, "12"],
    [90, "13"],
    [100, "14"],
    [110, "15"],
    [120, "21"],
    [130, "22"],
    [141, "22"],
    [151, "24"],
    [161, "24"],
    [171, "24"],
  ];
  let best = "21";
  let bestDiff = 1e9;
  for (const [tw, ip] of table) {
    const diff = Math.abs(tw - w);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = ip;
    }
  }
  return best;
}

function parse8897FromFilename(name) {
  const m = name.match(/^ozti-8897-(36|46|56)([0-9a-z.]+)-p0\.jpg$/i);
  if (!m) return null;
  const rest = m[2].replace(/-/g, "");
  const width = parseFloat(rest.replace(/p$/i, ""));
  if (!isFinite(width) || width <= 0) return null;
  return { depth: m[1], width };
}

function sourceForWidth(width) {
  const ip = widthToIp4(width);
  const src = path.join(CM, `ozti-8897-${ip}ip4-07.jpg`);
  if (!fs.existsSync(src) || isBadOvenImage(src)) return null;
  return src;
}

let fixed = 0;
let skipped = 0;

for (const name of fs.readdirSync(CM)) {
  if (!/^ozti-8897-(36|46|56).*-p0\.jpg$/i.test(name)) continue;
  const target = path.join(CM, name);
  if (!isBadOvenImage(target)) {
    skipped++;
    continue;
  }
  const parsed = parse8897FromFilename(name);
  if (!parsed) {
    console.warn("skip parse", name);
    continue;
  }
  const src = sourceForWidth(parsed.width);
  if (!src) {
    console.warn("skip no source", name, parsed);
    continue;
  }
  if (dryRun) {
    console.log("would fix", name, "←", path.basename(src), `(w≈${parsed.width})`);
  } else {
    fs.copyFileSync(src, target);
    console.log("fixed", name, "←", path.basename(src));
  }
  fixed++;
}

console.log(dryRun ? `[dry-run] would fix: ${fixed}, ok already: ${skipped}` : `done: fixed ${fixed}, ok already ${skipped}`);
