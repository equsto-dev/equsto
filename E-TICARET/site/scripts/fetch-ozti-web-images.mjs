/**
 * Öztiryakiler ürün kodu → resmi CDN (ax-images) görseli.
 *   https://oztiryakiler.com.tr/ax-images/images/{KOD}.jpg
 *
 *   node scripts/fetch-ozti-web-images.mjs
 *   node scripts/fetch-ozti-web-images.mjs --limit 100
 *   node scripts/fetch-ozti-web-images.mjs --kod 7865.N1.80908.10
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_BASE = path.join(ROOT, "public/images/catalog/ozti");
const MANIFEST = path.join(OUT_BASE, "_manifest.json");
const AX_BASE = "https://oztiryakiler.com.tr/ax-images/images";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MIN_BYTES = 8000;
const CONCURRENCY = 12;

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

function readJsonArray(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\bNaN\b/g, "null");
  return JSON.parse(text);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { limit: 0, kod: "", dept: "", dry: false, force: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit") out.limit = parseInt(args[++i], 10) || 0;
    else if (args[i] === "--kod") out.kod = args[++i] || "";
    else if (args[i] === "--dept") out.dept = args[++i] || "";
    else if (args[i] === "--dry") out.dry = true;
    else if (args[i] === "--force") out.force = true;
  }
  return out;
}

function hasGoodImage(rel) {
  if (!rel || !/catalog\/ozti\//i.test(rel)) return false;
  const p = path.join(ROOT, "public", String(rel).replace(/^\//, ""));
  return fs.existsSync(p) && fs.statSync(p).size >= MIN_BYTES;
}

function collectTargets(opts) {
  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};
  const seen = new Set();
  const need = [];

  const add = (kod, dept, name) => {
    const key = normKod(kod);
    if (!key || seen.has(key)) return;
    seen.add(key);
    if (!opts.force) {
      if (hasGoodImage(manifest[key])) return;
    }
    need.push({ kod: key, dept, name: name || "" });
  };

  if (opts.kod) {
    add(opts.kod, opts.dept || "pisirme", opts.kod);
    return need;
  }

  for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
    if (opts.dept && file.replace(".json", "") !== opts.dept) continue;
    const dept = file.replace(".json", "");
    const rows = readJsonArray(path.join(DEPT_DIR, file));
    for (const row of rows) {
      if (!/öztiryaki|oztiryaki/i.test(row.brand || "")) continue;
      const kod = normKod(row.urun_kodu || row.sku || row.model);
      if (!kod) continue;
      const img0 = (row.images || [])[0] || "";
      if (!opts.force && hasGoodImage(img0)) continue;
      if (!opts.force && hasGoodImage(manifest[kod])) continue;
      add(kod, dept, row.name);
    }
  }

  const eslesme = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
  if (!opts.dept && fs.existsSync(eslesme)) {
    const rows = readJsonArray(eslesme);
    for (const row of rows) {
      const kod = normKod(row.urun_kodu || row.urun_kodu_norm);
      if (!kod) continue;
      if (!opts.force && hasGoodImage(manifest[kod])) continue;
      add(kod, "set-ustu-mutfak", row.urun_tanimi);
    }
  }

  return need;
}

function downloadFromKod(kod, dest) {
  const variants = [
    `${AX_BASE}/${kod}.jpg`,
    `${AX_BASE}/${kod}.png`,
    `${AX_BASE}/${kod}.webp`,
  ];
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  for (const url of variants) {
    const ext = path.extname(url).slice(1).toLowerCase().replace("jpeg", "jpg");
    const tryDest = dest.replace(/\.[a-z]+$/, `.${ext}`);
    const r = spawnSync(
      "curl.exe",
      ["-sL", "-k", "--max-time", "45", "-o", tryDest, url],
      { encoding: "utf8", maxBuffer: 8 * 1024 }
    );
    if (r.status !== 0 || !fs.existsSync(tryDest)) continue;
    const n = fs.statSync(tryDest).size;
    if (n < MIN_BYTES) {
      fs.unlinkSync(tryDest);
      continue;
    }
    if (tryDest !== dest && fs.existsSync(dest)) fs.unlinkSync(dest);
    return { n, ext: ext === "peg" ? "jpg" : ext, path: tryDest };
  }
  throw new Error("ax-images yok");
}

async function worker(queue, manifest, stats, opts, deptUpdates) {
  while (queue.length) {
    const item = queue.shift();
    if (!item) break;
    const { kod, dept } = item;
    try {
      const fname = slugFile(kod) + ".jpg";
      const outDir = path.join(OUT_BASE, "web");
      const dest = path.join(outDir, fname);

      if (!opts.dry) {
        const dl = downloadFromKod(kod, dest);
        const base = path.basename(dl.path);
        const rel = `images/catalog/ozti/web/${base}`;
        const n = dl.n;
        manifest[kod] = rel;
        if (!deptUpdates.has(dept)) deptUpdates.set(dept, new Map());
        deptUpdates.get(dept).set(kod, rel);
        stats.ok++;
        stats.bytes += n;
      } else {
        stats.ok++;
      }
    } catch {
      stats.fail++;
    }
  }
}

async function main() {
  const opts = parseArgs();
  let targets = collectTargets(opts);
  if (opts.limit > 0) targets = targets.slice(0, opts.limit);

  console.log("[ozti-ax-images] hedef ürün:", targets.length);
  if (opts.dry) {
    console.log("[ozti-ax-images] dry-run — indirme yok");
    return;
  }

  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};
  const stats = { ok: 0, miss: 0, fail: 0, bytes: 0 };
  const deptUpdates = new Map();
  const queue = [...targets];

  const workers = Array.from({ length: CONCURRENCY }, () =>
    worker(queue, manifest, stats, opts, deptUpdates)
  );
  await Promise.all(workers);

  console.log("[ozti-ax-images] indirilen:", stats.ok, "yok:", stats.miss, "hata:", stats.fail);
  if (stats.bytes) console.log("[ozti-ax-images] toplam MB:", (stats.bytes / 1024 / 1024).toFixed(1));

  if (!opts.dry && stats.ok) {
    fs.mkdirSync(OUT_BASE, { recursive: true });
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");

    let totalRows = 0;
    for (const [dept, byKod] of deptUpdates) {
      const fp = path.join(DEPT_DIR, `${dept}.json`);
      if (!fs.existsSync(fp)) continue;
      const rows = readJsonArray(fp);
      let changed = 0;
      for (const row of rows) {
        const k = normKod(row.urun_kodu || row.sku || row.model);
        if (!byKod.has(k)) continue;
        row.images = [byKod.get(k)];
        changed++;
      }
      if (changed) {
        fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
        totalRows += changed;
        console.log(`  ${dept}.json → ${changed} görsel`);
      }
    }
    console.log("[ozti-ax-images] dept güncelleme:", totalRows, "satır");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
