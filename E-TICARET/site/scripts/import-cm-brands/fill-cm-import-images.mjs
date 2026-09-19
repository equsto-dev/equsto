#!/usr/bin/env node
/**
 * cafemarkt-plp ürünlerinde boş image → PLP witcdn -O URL + yerel mirror.
 *
 *   node scripts/import-cm-brands/fill-cm-import-images.mjs
 *   node scripts/import-cm-brands/fill-cm-import-images.mjs --dry-run --limit 20
 */
import fs from "node:fs";
import path from "node:path";
import {
  DATA_DIR,
  DEPT_DIR,
  DELAY_PAGE_MS,
  ROOT,
  brandSlug,
  sleep,
  slugify,
  writeJson,
} from "./shared.mjs";

const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg >= 0 ? Number(process.argv[limitArg + 1]) || 0 : 0;

const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const REFERER = "https://www.cafemarkt.com/";
const MIN_BYTES = 4000;
const DEST_SUB = "images/catalog/cafemarkt";

function preferO(url) {
  const u = String(url || "");
  if (!u) return "";
  // -B / badge kartı varsa -O dene
  if (/-\d+-B\.jpg/i.test(u)) return u.replace(/-(\d+)-B\.jpg/i, "-$1-O.jpg");
  return u;
}

function witFilename(url) {
  const m = String(url).match(/witcdn\.cafemarkt\.com\/([^?#]+)/i);
  if (!m) return "";
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

async function downloadWit(url, abs) {
  if (fs.existsSync(abs) && fs.statSync(abs).size >= MIN_BYTES) return true;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: REFERER, Accept: "image/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) return false;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, buf);
  return true;
}

function buildPlpImageIndex() {
  const byUrl = new Map();
  const byCode = new Map();
  for (const f of fs.readdirSync(DATA_DIR).filter((x) => x.endsWith("-plp.json"))) {
    let cache;
    try {
      cache = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
    } catch {
      continue;
    }
    for (const item of cache.items || []) {
      const img = preferO(item.image || item.images?.[0] || "");
      if (!img || !/witcdn\.cafemarkt/i.test(img)) continue;
      if (item.url) byUrl.set(String(item.url).replace(/\/$/, ""), img);
      const code = String(item.code || item.sku || "").trim();
      if (code) byCode.set(code.toUpperCase(), img);
    }
  }
  return { byUrl, byCode };
}

function resolveImg(row, index) {
  const url = String(row.cafemarkt_url || "").replace(/\/$/, "");
  if (url && index.byUrl.has(url)) return index.byUrl.get(url);
  const code = String(row.sku || row.marka_urun_kodu || "").trim().toUpperCase();
  if (code && index.byCode.has(code)) return index.byCode.get(code);
  // distributor prefix variants
  for (const [k, v] of index.byCode) {
    if (k.endsWith(code) || code.endsWith(k)) {
      if (Math.abs(k.length - code.length) <= 4) return v;
    }
  }
  return "";
}

async function main() {
  const index = buildPlpImageIndex();
  console.log(`[fill-img] plp urls=${index.byUrl.size} codes=${index.byCode.size} dry=${dryRun}`);

  let scanned = 0;
  let filled = 0;
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json") && !f.includes("_items"))) {
    const filePath = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(rows)) continue;
    let changed = false;

    for (const row of rows) {
      if (row.kaynak_fiyat_listesi !== "cafemarkt-plp") continue;
      const has = String(row.image || "").trim() || (Array.isArray(row.images) && row.images[0]);
      if (has) continue;
      scanned++;
      if (LIMIT && filled + failed + skipped >= LIMIT) break;

      const remote = resolveImg(row, index);
      if (!remote) {
        skipped++;
        continue;
      }
      const fn = witFilename(remote);
      if (!fn) {
        skipped++;
        continue;
      }
      const rel = `${DEST_SUB}/${fn}`.replace(/\\/g, "/");
      const abs = path.join(ROOT, "public", rel);

      if (!dryRun) {
        const ok = await downloadWit(remote, abs);
        if (!ok) {
          failed++;
          console.warn(`[fill-img] FAIL ${row.sku || row.id} ${remote.slice(-60)}`);
          await sleep(400);
          continue;
        }
        downloaded++;
        await sleep(200);
      }

      row.image = rel;
      row.images = [rel];
      filled++;
      changed = true;
      if (filled % 50 === 0) console.log(`[fill-img] filled=${filled} dl=${downloaded} fail=${failed}`);
    }

    if (changed && !dryRun) writeJson(filePath, rows, false);
    if (LIMIT && filled + failed + skipped >= LIMIT) break;
  }

  console.log(
    `[fill-img] scanned=${scanned} filled=${filled} downloaded=${downloaded} skipped=${skipped} failed=${failed} ${dryRun ? "DRY" : "APPLY"}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
