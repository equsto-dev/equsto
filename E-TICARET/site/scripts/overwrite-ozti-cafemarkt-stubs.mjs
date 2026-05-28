#!/usr/bin/env node
/**
 * cafemarkt/ içindeki UNOX stub dosyalarını ax-images ile üzerine yazar.
 * Canlı sitede eski JS + mevcut JSON yolu ile doğru görsel gösterilir.
 *
 *   node scripts/overwrite-ozti-cafemarkt-stubs.mjs --dry-run
 *   node scripts/overwrite-ozti-cafemarkt-stubs.mjs --dept=sogutma
 *   node scripts/overwrite-ozti-cafemarkt-stubs.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAFEMARKT_DIR = path.join(ROOT, "public/images/catalog/ozti/cafemarkt");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const BAD_STUB_BYTES = 10995;
const BAD_STUB_MD5 = "6696b6d14fecffc05fb1dc0156c9f6b4";
const MIN_PHOTO = 8000;

const dryRun = process.argv.includes("--dry-run");
const deptArg = process.argv.find((a) => a.startsWith("--dept="));
const deptFilter = deptArg ? deptArg.split("=")[1] : "";

function md5File(abs) {
  return crypto.createHash("md5").update(fs.readFileSync(abs)).digest("hex");
}

function isStub(abs) {
  if (!fs.existsSync(abs)) return false;
  const bytes = fs.statSync(abs).size;
  return bytes === BAD_STUB_BYTES && md5File(abs) === BAD_STUB_MD5;
}

function kodFromFilename(name) {
  const m = /^ozti-([a-z0-9-]+)\.jpe?g$/i.exec(name);
  if (!m) return "";
  return m[1].replace(/-/g, ".").toUpperCase();
}

function downloadTo(dest, kod) {
  if (dryRun) return true;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const url = `${AX}/${encodeURIComponent(kod)}.jpg`;
  const r = spawnSync("curl.exe", ["-sL", "-k", "--max-time", "45", "-o", dest, url], {
    stdio: "pipe",
  });
  if (r.status !== 0 || !fs.existsSync(dest) || fs.statSync(dest).size < MIN_PHOTO) {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    return false;
  }
  if (isStub(dest)) {
    fs.unlinkSync(dest);
    return false;
  }
  return true;
}

function deptSkus(dept) {
  const fp = path.join(DEPT_DIR, `${dept}.json`);
  if (!fs.existsSync(fp)) return null;
  const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
  const set = new Set();
  for (const row of rows) {
    if (!/öztiryakiler|oztiryakiler/i.test(String(row.brand || ""))) continue;
    const kod = String(row.sku || row.model || row.urun_kodu || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    if (kod) set.add(kod);
  }
  return set;
}

function main() {
  const allowed = deptFilter ? deptSkus(deptFilter) : null;
  const stats = { stub: 0, ok: 0, miss: 0, skip: 0 };

  for (const name of fs.readdirSync(CAFEMARKT_DIR)) {
    if (!/\.jpe?g$/i.test(name)) continue;
    const abs = path.join(CAFEMARKT_DIR, name);
    if (!isStub(abs)) continue;

    const kod = kodFromFilename(name);
    if (!kod) {
      stats.skip++;
      continue;
    }
    if (allowed && !allowed.has(kod)) continue;

    stats.stub++;
    const tmp = abs + ".tmp";
    if (downloadTo(tmp, kod)) {
      if (!dryRun) fs.renameSync(tmp, abs);
      stats.ok++;
    } else {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      if (!dryRun && isStub(abs)) fs.unlinkSync(abs);
      stats.miss++;
    }
  }

  console.log("[overwrite-stubs]", { dryRun, deptFilter: deptFilter || "all", ...stats });
}

main();
