/**
 * Kariyer Mutfak turuncu çerçeveli görselleri tespit edip alternatif kaynaklardan değiştirir.
 *
 * Kaynak önceliği (ürün başına):
 *   1) equsto.com /data/images/{aynı dosya} — canlıda farklı/büyük dosya varsa
 *   2) kariyermutfak.com ürün sayfası — Ticimax ham urunresimleri (cdn-cgi olmadan)
 *   3) Marka: Öztiryakiler ax-images (sku/model)
 *
 *   node scripts/replace-kariyer-overlay-images.mjs --dry-run
 *   node scripts/replace-kariyer-overlay-images.mjs --apply --limit=20
 *   npm run data:fix-kariyer-images
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const IMG_DIR = path.join(ROOT, "public", "data", "images");
const REPORT = path.join(ROOT, "public", "data", "kariyer-overlay-images.json");
const LOG = path.join(ROOT, "public", "data", "kariyer-image-replace-log.json");

const EQUSTO_ORIGIN = "https://equsto.com";
const KARIYER = "https://www.kariyermutfak.com";
const OZTI_AX = "https://oztiryakiler.com.tr/ax-images/images/";

const DRY = process.argv.includes("--dry-run");
const APPLY = process.argv.includes("--apply");
const limit = (() => {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  return a ? parseInt(a.split("=")[1], 10) : 0;
})();

function slugify(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normKey(s) {
  return slugify(s).replace(/-/g, "");
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
          "User-Agent": "EqustoImageReplacer/1.0 (+https://equsto.com)",
          Accept: "image/*,text/html,*/*",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const code = res.statusCode || 0;
          if ([301, 302, 307, 308].includes(code) && res.headers.location && maxRedirect > 0) {
            resolve(httpBuf(new URL(res.headers.location, url).href, maxRedirect - 1));
            return;
          }
          resolve({ status: code, buf, type: String(res.headers["content-type"] || "") });
        });
      },
    );
    req.on("error", () => resolve({ status: 0, buf: Buffer.alloc(0), type: "" }));
    req.setTimeout(45000, () => {
      req.destroy();
      resolve({ status: 0, buf: Buffer.alloc(0), type: "" });
    });
    req.end();
  });
}

/** Turuncu çerçeve tespiti (Python). */
function detectOverlayViaPython(files) {
  const py = path.join(__dirname, "detect_kariyer_overlay.py");
  if (!fs.existsSync(REPORT) || process.argv.includes("--rescan")) {
    const r = spawnSync(process.platform === "win32" ? "python" : "python3", [py], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: "inherit",
    });
    if (r.status !== 0) throw new Error("detect_kariyer_overlay.py failed");
  }
  const data = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const set = new Set((data.bad || []).map((x) => x.file));
  if (files) return files.filter((f) => set.has(f));
  return data;
}

function extractTicimaxUrls(html) {
  const urls = [];
  const re = /https:\/\/static\.ticimax\.cloud\/[^\s"'<>]+/gi;
  let m;
  while ((m = re.exec(html))) {
    let u = m[0].replace(/&amp;/g, "&");
    if (/\.svg/i.test(u)) continue;
    urls.push(u);
  }
  const raw = [];
  for (const u of urls) {
    const m2 = u.match(/\/3562\/uploads\/urunresimleri\/[^?\s"'<>]+/i);
    if (m2) raw.push(`https://static.ticimax.cloud${m2[0]}`);
  }
  return [...new Set([...urls, ...raw])];
}

function skuFromProduct(p) {
  const name = String(p.name || "");
  const m = name.match(/\b([A-Z]{1,5}[\d][\w\-./]{2,})\s*$/i) || name.match(/\b([A-Z]{2,}[\d\-][\w\-./]*)\b/g);
  if (!m) return "";
  const hit = Array.isArray(m) ? m[m.length - 1] : m[1];
  return String(hit || "").trim();
}

function mapProductsByImage(catalog, badFiles) {
  const byFile = new Map();
  for (const p of catalog) {
    for (const rel of p.images || []) {
      const fn = String(rel).replace(/^images[\\/]/i, "").replace(/\\/g, "/");
      if (badFiles.has(fn)) {
        if (!byFile.has(fn)) byFile.set(fn, []);
        byFile.get(fn).push(p);
      }
    }
  }
  return byFile;
}

async function tryEqustoLive(fileName) {
  const url = `${EQUSTO_ORIGIN}/data/images/${encodeURIComponent(fileName)}`;
  const local = path.join(IMG_DIR, fileName);
  const localSize = fs.existsSync(local) ? fs.statSync(local).size : 0;
  const { status, buf } = await httpBuf(url);
  if (status !== 200 || buf.length < 800) return null;
  if (Math.abs(buf.length - localSize) < 50) return null;
  return { url, buf, source: "equsto-live" };
}

async function tryKariyerPage(p) {
  const slug = slugify(p.name);
  const brand = slugify(p.brand || "");
  const paths = [
    `/urun/${slug}`,
    `/${p.category || ""}/${slug}`.replace(/\/+/g, "/"),
    `/urun/${brand}-${slug}`.replace(/^-/, ""),
  ];
  for (const pth of [...new Set(paths)]) {
    const { status, buf } = await httpBuf(`${KARIYER}${pth}`);
    if (status !== 200 || buf.length < 2000) continue;
    const html = buf.toString("utf8");
    if (!/ticimax|urunresimleri/i.test(html)) continue;
    const urls = extractTicimaxUrls(html);
    for (const imgUrl of urls) {
      const { status: s2, buf: b2 } = await httpBuf(imgUrl);
      if (s2 === 200 && b2.length > 2000) {
        return { url: imgUrl, buf: b2, source: "kariyer-ticimax-raw" };
      }
    }
  }
  return null;
}

async function tryVoscoSite(p) {
  const brand = String(p.brand || "").toLocaleLowerCase("tr");
  if (!brand.includes("vosco")) return null;
  const sku = (p.sku || skuFromProduct(p) || "").toUpperCase();
  const slug = slugify(p.name);
  const tries = [
    `https://vosco.com.tr/urun/${slug}`,
    `https://vosco.com.tr/${slug}`,
    sku ? `https://vosco.com.tr/?s=${encodeURIComponent(sku)}` : "",
  ].filter(Boolean);
  for (const url of tries) {
    const { status, buf } = await httpBuf(url);
    if (status !== 200 || buf.length < 1500) continue;
    const html = buf.toString("utf8");
    const imgs = [];
    const re = /https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/gi;
    let m;
    while ((m = re.exec(html))) {
      const u = m[0];
      if (/vosco\.com/i.test(u) && !/logo|icon|banner|slider/i.test(u)) imgs.push(u);
    }
    for (const imgUrl of [...new Set(imgs)].slice(0, 8)) {
      const { status: s2, buf: b2 } = await httpBuf(imgUrl);
      if (s2 === 200 && b2.length > 3000) return { url: imgUrl, buf: b2, source: "vosco.com.tr" };
    }
  }
  return null;
}

async function tryOztiAx(p) {
  const brand = String(p.brand || "").toLocaleLowerCase("tr");
  if (!brand.includes("öztiryak") && !brand.includes("oztiryak")) return null;
  const sku = p.sku || skuFromProduct(p) || p.model || "";
  const code = String(sku).trim();
  if (!code) return null;
  for (const ext of ["jpg", "png", "jpeg"]) {
    const url = OZTI_AX + encodeURIComponent(code) + "." + ext;
    const { status, buf } = await httpBuf(url);
    if (status === 200 && buf.length > 800) return { url, buf, source: "oztiryakiler-ax" };
  }
  return null;
}

function isStillOverlay(fileName) {
  const py = path.join(__dirname, "detect_kariyer_overlay.py");
  const r = spawnSync(process.platform === "win32" ? "python" : "python3", [py, "--file", fileName], {
    cwd: ROOT,
    encoding: "utf8",
  });
  try {
    const j = JSON.parse((r.stdout || "").trim());
    return !!j.overlay;
  } catch {
    return false;
  }
}

async function main() {
  if (!APPLY && !DRY) {
    console.log("Kullanım: --dry-run veya --apply");
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const report = detectOverlayViaPython();
  const badSet = new Set((report.bad || []).map((x) => x.file));
  console.log(`[overlay] ${badSet.size} şüpheli dosya (eşik ${report.threshold})`);

  const byFile = mapProductsByImage(catalog, badSet);
  const files = [...byFile.keys()];
  let todo = files;
  if (limit > 0) todo = todo.slice(0, limit);

  const log = { dryRun: DRY, ok: [], skip: [], fail: [] };

  for (let i = 0; i < todo.length; i++) {
    const fileName = todo[i];
    const products = byFile.get(fileName) || [];
    const p = products[0];
    if (!p) {
      log.skip.push({ file: fileName, reason: "no-catalog-product" });
      continue;
    }

    let hit =
      (await tryEqustoLive(fileName)) ||
      (await tryVoscoSite(p)) ||
      (await tryOztiAx(p)) ||
      (await tryKariyerPage(p));

    if (!hit) {
      log.fail.push({ file: fileName, name: p.name, brand: p.brand });
      console.log(`[${i + 1}/${todo.length}] FAIL ${fileName} — ${p.name?.slice(0, 50)}`);
      continue;
    }

    if (DRY) {
      log.ok.push({ file: fileName, source: hit.source, url: hit.url, bytes: hit.buf.length, dryRun: true });
      console.log(`[${i + 1}/${todo.length}] DRY ${fileName} ← ${hit.source} (${hit.buf.length} B)`);
      continue;
    }

    const dest = path.join(IMG_DIR, fileName);
    fs.writeFileSync(dest, hit.buf);
    const still = await isStillOverlay(fileName);
    if (still) {
      log.fail.push({ file: fileName, reason: "still-overlay-after-replace", source: hit.source });
      console.log(`[${i + 1}/${todo.length}] STILL OVERLAY ${fileName}`);
    } else {
      log.ok.push({ file: fileName, source: hit.source, url: hit.url, bytes: hit.buf.length });
      console.log(`[${i + 1}/${todo.length}] OK ${fileName} ← ${hit.source}`);
    }
  }

  fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n", "utf8");
  console.log(`\nBitti: ok=${log.ok.length} fail=${log.fail.length} skip=${log.skip.length}`);
  console.log("Log:", LOG);
  if (APPLY && log.ok.length) {
    console.log("Sonra: npm run data:dept && deploy data/images + ekipmanlar.json");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
