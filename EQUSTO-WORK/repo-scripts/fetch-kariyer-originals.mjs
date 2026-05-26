/**
 * Kariyer görsellerini equsto.com canlıdan tam boy indirir (kırpma yok).
 * İkincil kaynak: kariyermutfak ürün detay (yalnızca detay sayfası, arama listesi değil).
 *
 *   node scripts/fetch-kariyer-originals.mjs --dry-run
 *   node scripts/fetch-kariyer-originals.mjs --apply [--rename]
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { productSlug } from "./eq-seo-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const IMG_DIR = path.join(ROOT, "public", "data", "images");
const LOG = path.join(ROOT, "public", "data", "kariyer-originals-fetch-log.json");
const INDEX_CACHE = path.join(ROOT, "public", "data", ".kariyer_product_index.json");

const EQUSTO = "https://equsto.com";
const KARIYER = "https://www.kariyermutfak.com";
const MIN_BYTES = 12000;
const DRY = process.argv.includes("--dry-run");
const APPLY = process.argv.includes("--apply");
const RENAME = process.argv.includes("--rename");

if (!DRY && !APPLY) {
  console.log("Kullanım: --dry-run veya --apply [--rename]");
  process.exit(1);
}

function normKey(name) {
  return String(name || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "");
}

function httpBuf(url, maxRedirect = 6) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 EqustoImageRestore/1.0",
          Accept: "image/*,*/*",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const code = res.statusCode || 0;
          if ([301, 302, 307, 308].includes(code) && res.headers.location && maxRedirect > 0) {
            resolve(httpBuf(new URL(res.headers.location, url).href, maxRedirect - 1));
            return;
          }
          resolve({ status: code, buf: Buffer.concat(chunks), type: String(res.headers["content-type"] || "") });
        });
      },
    );
    req.on("error", () => resolve({ status: 0, buf: Buffer.alloc(0), type: "" }));
    req.setTimeout(90000, () => {
      req.destroy();
      resolve({ status: 0, buf: Buffer.alloc(0), type: "" });
    });
    req.end();
  });
}

function fileNameFromRel(rel) {
  return String(rel).replace(/^images[\\/]/i, "").replace(/\\/g, "/");
}

function toRawTicimax(url) {
  const u = String(url).replace(/&amp;/g, "&");
  let m = u.match(/\/3562\/uploads\/urunresimleri\/(?:buyuk|thumb)\/([^?\s"'<>]+)/i);
  if (m) return `https://static.ticimax.cloud/3562/Uploads/UrunResimleri/buyuk/${m[1]}`;
  m = u.match(/\/3562\/uploads\/urunresimleri\/([^?\s"'<>]+)/i);
  if (m) return `https://static.ticimax.cloud/3562/Uploads/UrunResimleri/buyuk/${m[1]}`;
  return u;
}

function extractDetailImages(html) {
  const out = [];
  const seen = new Set();
  const blocks = html.match(/productDetailImage|productImages|urunResim|#divProductGallery[\s\S]{0,8000}/gi) || [html];
  const scope = blocks.join("\n") + html.slice(0, 120000);
  const re = /https:\/\/static\.ticimax\.cloud\/[^\s"'<>]+/gi;
  let m;
  while ((m = re.exec(scope))) {
    let u = toRawTicimax(m[0]);
    if (/\.svg/i.test(u) || !/urunresimleri/i.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function loadKariyerIndex() {
  if (!fs.existsSync(INDEX_CACHE)) return {};
  return JSON.parse(fs.readFileSync(INDEX_CACHE, "utf8"));
}

async function findKariyerDetailPath(p) {
  const idx = loadKariyerIndex();
  const key = normKey(p.name);
  if (idx[key]) return idx[key];

  const { status, buf } = await httpBuf(`${KARIYER}/?s=${encodeURIComponent(normKey(p.name).slice(0, 40))}`);
  if (status !== 200) return null;
  const html = buf.toString("utf8");
  const re = /href="(\/[^"]+)"[^>]*class="[^"]*detailUrl/gi;
  let m;
  const candidates = [];
  while ((m = re.exec(html)) && candidates.length < 12) candidates.push(m[1]);
  for (const sub of candidates) {
    const r2 = await httpBuf(`${KARIYER}${sub}`);
    if (r2.status !== 200) continue;
    const h2 = r2.buf.toString("utf8");
    if (!/productDetail|ProductDetail|urunDetay/i.test(h2)) continue;
    const titleKey = normKey((h2.match(/<title>([^<]+)/i) || [])[1] || "");
    if (titleKey && (titleKey.includes(key.slice(0, 20)) || key.includes(titleKey.slice(0, 20)))) {
      return sub;
    }
    const imgs = extractDetailImages(h2);
    if (imgs.length >= (p.images || []).length) return sub;
  }
  return null;
}

async function tryEqustoLive(fileName) {
  const url = `${EQUSTO}/data/images/${encodeURI(fileName)}`;
  const { status, buf } = await httpBuf(url);
  if (status === 200 && buf.length >= MIN_BYTES) {
    return { source: "equsto-live", url, buf };
  }
  return null;
}

async function tryKariyerDetail(p, slotIndex) {
  const detailPath = await findKariyerDetailPath(p);
  if (!detailPath) return null;
  const { status, buf } = await httpBuf(`${KARIYER}${detailPath}`);
  if (status !== 200) return null;
  const imgs = extractDetailImages(buf.toString("utf8"));
  const imgUrl = imgs[slotIndex] || imgs[imgs.length - 1];
  if (!imgUrl) return null;
  const { status: s2, buf: b2 } = await httpBuf(imgUrl);
  if (s2 === 200 && b2.length >= MIN_BYTES) {
    return { source: "kariyer-detail-buyuk", url: imgUrl, buf: b2, page: detailPath };
  }
  return null;
}

function hasKariyerImage(p) {
  return (p.images || []).some((rel) => /kariyer|kariyermutfak/i.test(String(rel)));
}

function relImagePath(fileName) {
  return `images\\${fileName}`;
}

function extFromBuf(buf, url) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  const m = String(url || "").match(/\.(jpe?g|png|webp)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

function overlayCheck(fileName) {
  const py = path.join(__dirname, "detect_kariyer_overlay.py");
  const r = spawnSync(process.platform === "win32" ? "python" : "python3", [py, "--file", fileName], {
    cwd: ROOT,
    encoding: "utf8",
  });
  try {
    return !!JSON.parse((r.stdout || "").trim()).overlay;
  } catch {
    return null;
  }
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const products = catalog.filter(hasKariyerImage);
  console.log(`[kariyer-originals] ${products.length} ürün`);

  const log = { dryRun: DRY, rename: RENAME, files: [] };
  let catalogDirty = false;

  for (let pi = 0; pi < products.length; pi++) {
    const p = products[pi];
    const baseSlug = productSlug(p.brand, p.name);
    const newRelPaths = [];
    console.log(`\n[${pi + 1}/${products.length}] ${p.name}`);

    for (let j = 0; j < (p.images || []).length; j++) {
      const oldName = fileNameFromRel(p.images[j]);
      if (!/kariyer|kariyermutfak/i.test(oldName)) {
        newRelPaths.push(p.images[j]);
        continue;
      }

      let hit = await tryEqustoLive(oldName);
      if (!hit) hit = await tryKariyerDetail(p, j);

      const row = { product: p.id, old: oldName, ok: false };
      if (!hit) {
        row.reason = "not-found";
        log.files.push(row);
        console.log(`  FAIL ${oldName}`);
        newRelPaths.push(p.images[j]);
        continue;
      }

      const ext = extFromBuf(hit.buf, hit.url);
      const newName = RENAME
        ? `${baseSlug}_${j + 1}.${ext}`
        : oldName.replace(/\.[a-z]+$/i, `.${ext}`);
      row.ok = true;
      row.source = hit.source;
      row.url = hit.url;
      row.bytes = hit.buf.length;
      row.file = newName;
      log.files.push(row);
      console.log(`  OK ${oldName} → ${newName} (${hit.buf.length} B, ${hit.source})`);

      if (APPLY) {
        fs.mkdirSync(IMG_DIR, { recursive: true });
        fs.writeFileSync(path.join(IMG_DIR, newName), hit.buf);
        if (newName !== oldName && fs.existsSync(path.join(IMG_DIR, oldName))) {
          try {
            fs.unlinkSync(path.join(IMG_DIR, oldName));
          } catch {
            /* ignore */
          }
        }
        const ov = overlayCheck(newName);
        if (ov === true) console.log(`  WARN hâlâ turuncu çerçeve: ${newName}`);
      }
      newRelPaths.push(relImagePath(newName));
    }

    const idx = catalog.findIndex((x) => x.id === p.id);
    if (idx >= 0 && JSON.stringify(catalog[idx].images) !== JSON.stringify(newRelPaths)) {
      catalog[idx].images = newRelPaths;
      catalogDirty = true;
    }
  }

  fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n", "utf8");
  if (APPLY && catalogDirty) {
    fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
    console.log("\n[apply] ekipmanlar.json güncellendi");
  }
  const ok = log.files.filter((f) => f.ok).length;
  const fail = log.files.filter((f) => !f.ok).length;
  console.log(`\nBitti: ok=${ok} fail=${fail} → ${LOG}`);
  if (APPLY && ok) console.log("Sonra: npm run data:dept");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
