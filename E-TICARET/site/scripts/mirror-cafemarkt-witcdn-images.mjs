#!/usr/bin/env node
/**
 * witcdn.cafemarkt.com görsellerini indir → images/catalog/cafemarkt/
 * Katalog images[] alanını yerel yola çevirir (hotlink koruması).
 *
 *   node scripts/mirror-cafemarkt-witcdn-images.mjs
 *   node scripts/mirror-cafemarkt-witcdn-images.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const DEST_SUB = "images/catalog/cafemarkt";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const REFERER = "https://www.cafemarkt.com/";
const MIN_BYTES = 5000;
const dryRun = process.argv.includes("--dry-run");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function witFilename(url) {
  const m = String(url).match(/witcdn\.cafemarkt\.com\/([^?#]+)/i);
  if (!m) return "";
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

function localRel(url) {
  const fn = witFilename(url);
  return fn ? `${DEST_SUB}/${fn}` : "";
}

async function downloadWit(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: REFERER, Accept: "image/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error(`küçük ${buf.length}b (placeholder?)`);
  return buf;
}

function patchRows(rows) {
  let patched = 0;
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  return (async () => {
    for (const row of rows) {
      const imgs = row.images;
      if (!Array.isArray(imgs) || !imgs.length) continue;
      const next = [];
      let rowChanged = false;

      for (const raw of imgs) {
        const s = String(raw || "").trim();
        if (!/witcdn\.cafemarkt\.com/i.test(s)) {
          next.push(s);
          continue;
        }
        const rel = localRel(s);
        const abs = path.join(ROOT, "public", rel);
        if (fs.existsSync(abs) && fs.statSync(abs).size >= MIN_BYTES) {
          next.push(rel);
          rowChanged = true;
          skipped++;
          continue;
        }
        try {
          const buf = await downloadWit(s);
          if (!dryRun) {
            await fsp.mkdir(path.dirname(abs), { recursive: true });
            await fsp.writeFile(abs, buf);
          }
          next.push(rel);
          rowChanged = true;
          downloaded++;
          await sleep(120);
        } catch (e) {
          console.warn("  FAIL", row.sku || row.id, s.slice(0, 60), e.message);
          failed++;
          next.push(s);
        }
      }

      if (rowChanged) {
        row.images = next;
        patched++;
      }
    }
    return { patched, downloaded, skipped, failed };
  })();
}

async function main() {
  const targets = ["hazirlik.json", "kahve.json"].filter((f) =>
    fs.existsSync(path.join(DEPT_DIR, f)),
  );
  console.log(`[mirror-witcdn] ${dryRun ? "DRY" : "live"} — ${targets.join(", ")}`);

  let total = { patched: 0, downloaded: 0, skipped: 0, failed: 0 };
  for (const file of targets) {
    const dest = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(dest, "utf8"));
    const stats = await patchRows(rows);
    total.patched += stats.patched;
    total.downloaded += stats.downloaded;
    total.skipped += stats.skipped;
    total.failed += stats.failed;
    if (!dryRun) {
      const tmp = `${dest}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(rows), "utf8");
      fs.renameSync(tmp, dest);
    }
    console.log(`[mirror-witcdn] ${file}`, stats);
  }

  console.log("[mirror-witcdn] toplam", total);
  if (!dryRun && total.patched > 0) {
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
