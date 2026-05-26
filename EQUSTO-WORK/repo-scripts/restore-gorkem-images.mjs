/**
 * Görkem (gorkem__) ürün görselleri: kariyermutfak detay buyuk → gömülü filigran şeridi kırpılır.
 *
 *   node scripts/restore-gorkem-images.mjs --dry-run
 *   node scripts/restore-gorkem-images.mjs --apply
 *   node scripts/restore-gorkem-images.mjs --apply --limit=20
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { normCatalogKey } from "./lib/norm-catalog-key.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const IMG_DIR = path.join(ROOT, "public", "data", "images");
const INDEX = path.join(ROOT, "public", "data", ".kariyer_product_index.json");
const LOG = path.join(ROOT, "public", "data", "gorkem-image-restore-log.json");
const KARIYER = "https://www.kariyermutfak.com";

const DRY = process.argv.includes("--dry-run");
const APPLY = process.argv.includes("--apply");
const limit = parseInt((process.argv.find((x) => x.startsWith("--limit=")) || "").split("=")[1] || "0", 10);
const idArg = (process.argv.find((x) => x.startsWith("--id=")) || "").split("=")[1];

if (!DRY && !APPLY) {
  console.log("Kullanım: --dry-run | --apply [--limit=N] [--id=gorkem__...]");
  process.exit(1);
}

function httpBuf(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    lib
      .get(
        url,
        {
          headers: { "User-Agent": "Mozilla/5.0 EqustoGorkemRestore/1.0", Accept: "*/*" },
          rejectUnauthorized: false,
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const code = res.statusCode || 0;
            if ([301, 302, 307, 308].includes(code) && res.headers.location) {
              resolve(httpBuf(new URL(res.headers.location, url).href));
              return;
            }
            resolve({ status: code, buf: Buffer.concat(chunks) });
          });
        },
      )
      .on("error", () => resolve({ status: 0, buf: Buffer.alloc(0) }));
  });
}

function fileNameFromRel(rel) {
  return String(rel).replace(/^images[\\/]/i, "").replace(/\\/g, "/");
}

function overlayScore(fileName) {
  const py = path.join(__dirname, "detect_kariyer_overlay.py");
  const r = spawnSync(process.platform === "win32" ? "python" : "python3", [py, "--file", fileName], {
    cwd: ROOT,
    encoding: "utf8",
  });
  try {
    return !!JSON.parse((r.stdout || "").trim()).overlay;
  } catch {
    return false;
  }
}

function stripWatermarkDryRun(fileName) {
  const py = path.join(__dirname, "strip-kariyer-watermark-band.py");
  const r = spawnSync(process.platform === "win32" ? "python" : "python3", [py, "--file", fileName, "--dry-run"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const out = (r.stdout || "").trim();
  return out.startsWith("DRY ") && !out.includes("FAIL");
}

function stripWatermarkApply(fileName) {
  const py = path.join(__dirname, "strip-kariyer-watermark-band.py");
  spawnSync(process.platform === "win32" ? "python" : "python3", [py, "--file", fileName, "--apply"], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

function extractBuyukUrls(html) {
  const toUrls = (scope) => [
    ...scope.matchAll(/https:\/\/static\.ticimax\.cloud\/[^\s"'<>]*urunresimleri\/buyuk\/[^\s"'<>]+/gi),
    ...scope.matchAll(/\/3562\/uploads\/urunresimleri\/buyuk\/[^\s"'<>]+/gi),
    ...scope.matchAll(/uploads\/urunresimleri\/buyuk\/[a-z0-9._\-]+\.(?:jpg|jpeg|png|webp)/gi),
  ]
    .map((m) => {
      let u = m[0];
      if (!u.startsWith("http")) u = `https://static.ticimax.cloud/3562/${u.replace(/^\/?3562\//, "")}`;
      return u.replace(/\/uploads\//i, "/Uploads/").replace(/\/urunresimleri\//i, "/UrunResimleri/");
    });

  const gallery = html.match(/#divProductGallery[\s\S]{0,25000}|productDetailImage[\s\S]{0,25000}/gi) || [];
  let raw = toUrls((gallery.join("\n") || html).slice(0, 200000));
  if (raw.length < 1) raw = toUrls(html);
  return [...new Set(raw)];
}

function rankImages(blobs, p) {
  const slug = String(p.id || "").replace(/^gorkem__/i, "");
  const sku = (String(p.name || "").match(/\b(\d{2,4})\s*$/i) || [])[1] || "";
  const slugKey = normCatalogKey(slug);
  return [...blobs].sort((a, b) => {
    const score = (img) => {
      const u = normCatalogKey(img.url);
      let s = img.buf.length / 1000;
      if (sku && u.includes(sku)) s += 5000;
      if (slugKey.length > 8 && u.includes(slugKey.slice(0, 24))) s += 3000;
      if (u.includes("gorkem")) s += 200;
      return s;
    };
    return score(b) - score(a);
  });
}

async function kariyerBuyukPack(pageUrl, p) {
  const { status, buf } = await httpBuf(pageUrl);
  if (status !== 200) return null;
  const html = buf.toString("utf8");
  const raw = extractBuyukUrls(html);
  const blobs = [];
  for (const imgUrl of raw) {
    const r = await httpBuf(imgUrl);
    if (r.status !== 200 || r.buf.length < 3500) continue;
    blobs.push({ url: imgUrl, buf: r.buf });
  }
  const ranked = rankImages(blobs, p);
  if (process.argv.includes("--verbose")) {
    console.log("  [buyuk]", pageUrl, "raw", raw.length, "blobs", ranked.length);
  }
  return ranked.length ? { page: pageUrl, images: ranked } : null;
}

function loadIndex() {
  if (!fs.existsSync(INDEX)) return {};
  return JSON.parse(fs.readFileSync(INDEX, "utf8"));
}

async function slugProbePaths(p) {
  const slug = String(p.id || "").replace(/^gorkem__/i, "");
  if (!slug) return [];
  return [`/${slug}`, `/gorkem-${slug}`];
}

async function resolveDetailPath(p, idx) {
  const key = normCatalogKey(p.name);
  if (idx[key]) return idx[key];
  for (const dp of await slugProbePaths(p)) {
    const probe = await httpBuf(`${KARIYER}${dp}`);
    if (probe.status === 200 && /urunresimleri|productDetail/i.test(probe.buf.toString("utf8"))) {
      return dp;
    }
  }
  return null;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const idx = loadIndex();
  let products = catalog.filter((p) => /^gorkem__/i.test(p.id));
  if (idArg) products = products.filter((p) => p.id === idArg);
  if (limit > 0) products = products.slice(0, limit);

  console.log(`[gorkem-restore] ${products.length} ürün`);
  const log = { dryRun: DRY, items: [] };
  let catalogDirty = false;
  let ok = 0;
  let fail = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (i > 0) await sleep(180);
    console.log(`\n[${i + 1}/${products.length}] ${p.name?.slice(0, 70)}`);
    const detailPath = await resolveDetailPath(p, idx);
    if (!detailPath) {
      fail++;
      log.items.push({ id: p.id, ok: false, reason: "no-kariyer-path" });
      console.log("  FAIL detay yolu yok");
      continue;
    }
    const pack = await kariyerBuyukPack(`${KARIYER}${detailPath}`, p);
    if (!pack?.images?.length) {
      fail++;
      log.items.push({ id: p.id, ok: false, reason: "no-buyuk", page: detailPath });
      console.log("  FAIL buyuk görsel yok");
      continue;
    }

    const row = { id: p.id, ok: true, page: detailPath, files: [] };
    const rels = p.images || [];
    let slot = 0;
    const newRels = [];

    for (let j = 0; j < rels.length; j++) {
      const oldName = fileNameFromRel(rels[j]);
      const img = pack.images[slot] || pack.images[pack.images.length - 1];
      if (j > 0 && slot < pack.images.length - 1) slot++;
      const ext = img.url.match(/\.(jpe?g|png|webp)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "jpg";
      const newName = oldName.replace(/\.[a-z]+$/i, `.${ext}`);
      row.files.push({ old: oldName, new: newName, bytes: img.buf.length, url: img.url });

      if (APPLY) {
        fs.mkdirSync(IMG_DIR, { recursive: true });
        fs.writeFileSync(path.join(IMG_DIR, newName), img.buf);
        if (newName !== oldName && fs.existsSync(path.join(IMG_DIR, oldName))) {
          try {
            fs.unlinkSync(path.join(IMG_DIR, oldName));
          } catch {
            /* ignore */
          }
        }
        if (stripWatermarkDryRun(newName)) {
          stripWatermarkApply(newName);
          row.files[row.files.length - 1].stripped = true;
        }
        if (overlayScore(newName)) console.log(`  WARN turuncu çerçeve: ${newName}`);
      }

      console.log(`  ${j + 1}. ${newName} ← ${img.buf.length} B${APPLY ? "" : " (+ filigran strip uygulamada)"}`);
      newRels.push(`images\\${newName}`);
    }

    if (APPLY) {
      const ci = catalog.findIndex((x) => x.id === p.id);
      if (ci >= 0 && JSON.stringify(catalog[ci].images) !== JSON.stringify(newRels)) {
        catalog[ci].images = newRels;
        catalogDirty = true;
      }
    }

    ok++;
    log.items.push(row);
  }

  fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n", "utf8");
  if (APPLY && catalogDirty) {
    fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
    console.log("\n[apply] ekipmanlar.json — npm run data:dept");
  }
  console.log(`\nBitti: ok=${ok} fail=${fail} → ${LOG}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
