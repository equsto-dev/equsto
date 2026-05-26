/**
 * Çerçeveli (Kariyer/Dampak vitrin) görselleri üretici veya Ticimax buyuk ile değiştirir — kırpma yok.
 *
 *   node scripts/restore-manufacturer-images.mjs --id vosco__vosco-bar-arkasi-sise-sogutucu-i-ki-kapili-vbbc-250s --apply
 *   node scripts/restore-manufacturer-images.mjs --overlay --apply --limit=30
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
const OVERLAY_REPORT = path.join(ROOT, "public", "data", "kariyer-overlay-images.json");
const LOG = path.join(ROOT, "public", "data", "manufacturer-image-restore-log.json");

const DRY = process.argv.includes("--dry-run");
const APPLY = process.argv.includes("--apply");
const USE_OVERLAY = process.argv.includes("--overlay");
const idArg = (process.argv.find((x) => x.startsWith("--id=")) || "").split("=")[1];
const limit = parseInt((process.argv.find((x) => x.startsWith("--limit=")) || "").split("=")[1] || "0", 10);

if (!DRY && !APPLY) {
  console.log("Kullanım: --dry-run | --apply [--id=...] [--overlay] [--limit=N]");
  process.exit(1);
}

function skuFromName(name) {
  const n = String(name || "");
  const m0 = n.match(/\b([A-Z]{2,6}-\d{2,4}(?:-[A-Z]{1,4})?)\s*$/i);
  if (m0) return m0[1].toUpperCase();
  const m1 = n.match(/\b([A-Z]{1,6}[\d][\w\-./]{1,14})\s*$/i);
  if (m1) return m1[1].toUpperCase();
  const m2 = n.match(/\b(\d{1,3}[A-Z]{2,8}[\dA-Z\-]{0,10})\s*$/i);
  return m2 ? m2[1].toUpperCase() : "";
}

const normKey = normCatalogKey;

function httpBuf(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    lib
      .get(
        url,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EqustoRestore/1.0",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*",
            "Accept-Encoding": "identity",
          },
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
            resolve({ status: code, buf: Buffer.concat(chunks), type: String(res.headers["content-type"] || "") });
          });
        },
      )
      .on("error", () => resolve({ status: 0, buf: Buffer.alloc(0), type: "" }));
  });
}

function fileNameFromRel(rel) {
  return String(rel).replace(/^images[\\/]/i, "").replace(/\\/g, "/");
}

async function tryDampak(p) {
  const brand = normKey(p.brand);
  if (!brand.includes("dampak")) return null;
  const sku = skuFromName(p.name);
  const slug = sku ? sku.toLowerCase().replace(/\./g, "") : "";
  const base = slug.replace(/-gn$/i, "");
  const gnSlug = slug.endsWith("-gn") ? slug : `${base}-gn`;
  const tries = [];
  if (slug.includes("22ddf2s")) {
    tries.push("https://www.dampak.com.tr/urunler/22ddf2s-gn-iki-kapili-dik-tip-derin-dondurucu");
  }
  tries.push(
    `https://www.dampak.com.tr/urunler/${gnSlug}-iki-kapili-dik-tip-buzdolabi`,
    `https://www.dampak.com.tr/urunler/${gnSlug}-iki-kapili-dik-tip-derin-dondurucu`,
    `https://www.dampak.com.tr/urunler/${base}-gn-iki-kapili-dik-tip-buzdolabi`,
    `https://www.dampak.com.tr/urunler/${slug}-iki-kapili-dik-tip-buzdolabi`,
    `https://www.dampak.com.tr/urunler/${slug}-iki-kapili-dik-tip-derin-dondurucu`,
  );
  for (const url of [...new Set(tries)]) {
    const { status, buf } = await httpBuf(url);
    if (status !== 200 || buf.length < 3000) continue;
    const html = buf.toString("utf8");
    const hashes = [...html.matchAll(/uploads\/images\/full\/([a-f0-9]+\.(?:jpg|jpeg|png|webp))/gi)].map(
      (m) => m[1],
    );
    const uniq = [...new Set(hashes)];
    if (!uniq.length) continue;
    const blobs = [];
    for (const hash of uniq) {
      const imgUrl = `https://www.dampak.com.tr/uploads/images/full/${hash}`;
      const r = await httpBuf(imgUrl);
      if (r.status === 200 && r.buf.length > 10000) blobs.push({ url: imgUrl, buf: r.buf });
    }
    blobs.sort((a, b) => b.buf.length - a.buf.length);
    if (blobs.length) return { source: "dampak.com.tr", page: url, images: blobs };
  }
  return null;
}

async function tryNdustrio(p) {
  const brand = normKey(p.brand);
  if (!brand.includes("ndustrio") && !brand.includes("ndustri")) return null;
  const sku = skuFromName(p.name).toLowerCase().replace(/\./g, "");
  const slugCore = sku.replace(/-uc$/, "").replace(/-gd$/, "");
  const tries = [
    `https://www.ndustrio.com/en/product/${slugCore}-upright-snack-refrigerator-1-full-door-compressor-up`,
    `https://www.ndustrio.com/tr/urun/${slugCore}-dik-tip-snack-buzdolabi-1-tam-kapili-ustten-motorlu`,
    `https://www.ndustrio.com/en/product/${slugCore}-upright-snack-refrigerator-1-full-door`,
  ];
  if (slugCore.includes("cps-101")) {
    tries.unshift(
      "https://www.ndustrio.com/en/product/cps-101-uc-upright-snack-refrigerator-1-full-door-compressor-up",
    );
  }
  for (const pageUrl of [...new Set(tries)]) {
    const { status, buf } = await httpBuf(pageUrl);
    if (status !== 200 || buf.length < 3000) continue;
    const html = buf.toString("utf8");
    const paths = [
      ...new Set(
        [...html.matchAll(/uploads\/\d{4}\/\d{2}\/[a-z0-9]+_op\.(?:png|jpg|jpeg|webp)/gi)].map((m) => m[0]),
      ),
    ].filter((p) => !/quipements-dhygiene|contentlogo/i.test(p));
    if (!paths.length) continue;
    const blobs = [];
    for (const rel of paths) {
      const imgUrl = `https://www.ndustrio.com/${rel}`;
      const r = await httpBuf(imgUrl);
      if (r.status !== 200 || r.buf.length < 5000) continue;
      const ext = imgUrl.match(/\.(jpe?g|png|webp)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "jpg";
      if (overlayScoreBuf(r.buf, ext) === true) continue;
      blobs.push({ url: imgUrl, buf: r.buf });
    }
    blobs.sort((a, b) => b.buf.length - a.buf.length);
    if (blobs.length) return { source: "ndustrio.com", page: pageUrl, images: blobs };
  }
  return null;
}

const DETAIL_LINK_RE = /<a[^>]*class="[^"]*\bdetailLink\b[^"]*\bdetailUrl\b[^"]*"[^>]*>/gi;

function parseDetailLinks(html) {
  const out = [];
  for (const m of html.matchAll(DETAIL_LINK_RE)) {
    const tag = m[0];
    const hm = tag.match(/href\s*=\s*['"]([^'"]+)['"]/i);
    const tm = tag.match(/title\s*=\s*['"]([^'"]*)['"]/i);
    if (hm) out.push({ path: hm[1].trim(), title: tm ? tm[1] : "" });
  }
  return out;
}

/** vosco.com.tr kategori — Ticimax 64110 buyuk (Kariyer 3562 değil). */
async function tryVoscoOfficial(p) {
  const brand = normKey(p.brand);
  if (!brand.includes("vosco")) return null;
  const sku = skuFromName(p.name);
  const { status, buf } = await httpBuf("https://vosco.com.tr/sogutucu-dolaplar");
  if (status !== 200 || buf.length < 5000) return null;
  const html = buf.toString("utf8");
  let slugHint = null;
  if (/VBBC-350/i.test(sku || "") || /vbbc-350/i.test(p.id || "")) {
    slugHint = "uc-kapa";
  } else if (/VBBC-250/i.test(sku || "") || /vbbc-250/i.test(p.id || "")) {
    slugHint = "iki-kap";
  } else if (/VBBC-150/i.test(sku || "")) {
    slugHint = "tek-kap";
  }
  if (!slugHint) return null;
  const fileRe = new RegExp(
    `(?:64110/)?(?:[Uu]ploads/)?(?:[Uu]run[Rr]esimleri/)?buyuk/[^"'\\s<>]*${slugHint}[^"'\\s<>]+\\.(?:jpg|jpeg|png|webp)`,
    "gi",
  );
  const paths = [...new Set([...html.matchAll(fileRe)].map((m) => m[0]))];
  if (!paths.length) return null;
  const blobs = [];
  for (const rel of paths) {
    let norm = rel.replace(/^64110\//i, "");
    if (!/^Uploads\//i.test(norm)) {
      norm = norm.replace(/^uploads\//i, "Uploads/").replace(/\/urunresimleri\//i, "/UrunResimleri/");
    }
    const imgUrl = `https://static.ticimax.cloud/64110/${norm}`;
    const r = await httpBuf(imgUrl);
    if (r.status !== 200 || r.buf.length < 8000) continue;
    const ext = imgUrl.match(/\.(jpe?g|png|webp)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "jpg";
    if (overlayScoreBuf(r.buf, ext) === true) continue;
    blobs.push({ url: imgUrl, buf: r.buf });
  }
  blobs.sort((a, b) => b.buf.length - a.buf.length);
  if (!blobs.length) return null;
  return { source: "vosco.com.tr-ticimax-buyuk", page: "https://vosco.com.tr/sogutucu-dolaplar", title: p.name, images: blobs };
}

async function kariyerBuyukPack(pageUrl, title) {
  const r2 = await httpBuf(pageUrl);
  if (r2.status !== 200) return null;
  const html = r2.buf.toString("utf8");
  const raw = [
    ...html.matchAll(/https:\/\/static\.ticimax\.cloud\/3562\/uploads\/urunresimleri\/buyuk\/[^"'\\s<>]+/gi),
    ...html.matchAll(/\/3562\/uploads\/urunresimleri\/buyuk\/[^"'\\s<>]+/gi),
    ...html.matchAll(/uploads\/urunresimleri\/buyuk\/[a-z0-9._\-]+\.(?:jpg|jpeg|png|webp)/gi),
  ].map((m) => {
    let u = m[0];
    if (!u.startsWith("http")) u = `https://static.ticimax.cloud/3562/${u.replace(/^\/?3562\//, "")}`;
    return u.replace(/\/uploads\//i, "/Uploads/").replace(/\/urunresimleri\//i, "/UrunResimleri/");
  });
  const urls = [...new Set(raw)];
  if (process.argv.includes("--verbose")) {
    console.log("  [kariyer-buyuk]", pageUrl, "urls", urls.length);
  }
  const blobs = [];
  for (const imgUrl of urls) {
    const r = await httpBuf(imgUrl);
    if (r.status !== 200 || r.buf.length < 8000) continue;
    const ext = imgUrl.match(/\.(jpe?g|png|webp)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "jpg";
    if (overlayScoreBuf(r.buf, ext) === true) continue;
    blobs.push({ url: imgUrl, buf: r.buf });
  }
  const uniq = [];
  const seen = new Set();
  for (const b of blobs.sort((a, c) => c.buf.length - a.buf.length)) {
    const key = `${b.buf.length}:${b.buf.slice(0, 64).toString("hex")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(b);
  }
  if (!uniq.length) return null;
  return { source: "kariyer-ticimax-buyuk-clean", page: pageUrl, title, images: uniq };
}

/** Equsto markalı ürünler — kariyermutfak.com/kariyer-{slug} buyuk (çerçevesiz). */
function loadKariyerIndex() {
  const p = path.join(ROOT, "public", "data", ".kariyer_product_index.json");
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (_) {}
  return {};
}

/** Dampak / Görkem — .kariyer_product_index → detay buyuk. */
async function tryBrandViaKariyerIndex(p) {
  const brand = normKey(p.brand);
  if (!brand.includes("gorkem") && !brand.includes("dampak")) return null;
  const idx = loadKariyerIndex();
  const key = normKey(p.name);
  const sub = idx[key];
  if (!sub) return null;
  const pageUrl = `https://www.kariyermutfak.com${sub.startsWith("/") ? sub : "/" + sub}`;
  return kariyerBuyukPack(pageUrl, p.name);
}

async function tryEqustoViaKariyer(p) {
  const id = String(p.id || "");
  const brand = normKey(p.brand);
  if (!/^equsto__/i.test(id) && !brand.includes("equsto")) return null;
  const slug = id.replace(/^equsto__/i, "");
  if (!slug) return null;
  const paths = [`/kariyer-${slug}`];
  for (const dp of paths) {
    const probe = await httpBuf(`https://www.kariyermutfak.com${dp}`);
    if (process.argv.includes("--verbose")) {
      console.log("  [equsto probe]", dp, probe.status, probe.buf.length);
    }
    if (probe.status === 200 && /urunresimleri/i.test(probe.buf.toString("utf8"))) {
      return kariyerBuyukPack(`https://www.kariyermutfak.com${dp}`, p.name);
    }
  }
  return null;
}

async function tryVoscoViaKariyer(p) {
  const brand = normKey(p.brand);
  if (!brand.includes("vosco")) return null;
  const sku = skuFromName(p.name);
  const directPaths = [];
  if (/VBBC/i.test(sku || "") || /vbbc-250/i.test(p.id || "")) {
    directPaths.push(
      "/vosco-bar-arkasi-sise-sogutucu-iki-kapili-vbb-s250",
      "/vosco-bar-arkasi-sise-sogutucu-iki-kapili-vbbc-250s",
    );
  }
  if (/VBBC-350/i.test(sku || "") || /vbbc-350/i.test(p.id || "")) {
    directPaths.push(
      "/vosco-bar-arkasi-sise-sogutucu-uc-kapili-vbb-s350",
      "/vosco-bar-arkasi-sise-sogutucu-uc-kapili-vbbc-350s",
      "/vosco-bar-arkasi-sise-sogutucu-3-kapili-vbbc-350s",
    );
  }
  let pageUrl = "";
  for (const dp of directPaths) {
    const probe = await httpBuf(`https://www.kariyermutfak.com${dp}`);
    if (process.argv.includes("--verbose")) {
      console.log("  [vosco probe]", dp, probe.status, probe.buf.length);
    }
    if (probe.status === 200 && /urunresimleri/i.test(probe.buf.toString("utf8"))) {
      pageUrl = `https://www.kariyermutfak.com${dp}`;
      break;
    }
  }
  if (!pageUrl) {
    const { status, buf } = await httpBuf("https://www.kariyermutfak.com/sogutma-ekipmanlari?marka=vosco");
    if (status !== 200) return null;
    const links = parseDetailLinks(buf.toString("utf8"));
    const skuKey = normKey(sku);
    let hit = links.find((l) => {
      const t = normKey(l.title);
      const lp = normKey(l.path);
      return (skuKey && (t.includes(skuKey) || lp.includes(skuKey))) || (sku && l.title.toUpperCase().includes(sku));
    });
    if (!hit && /VBBC-350/i.test(sku || "")) {
      hit = links.find(
        (l) =>
          /vbb-?s?350|vbbc-?350|uc-kapili.*350/i.test(l.path + l.title) ||
          (normKey(l.title).includes("bararkasi") && normKey(l.title).includes("350")),
      );
    }
    if (!hit && /VBBC/i.test(sku || "")) {
      hit = links.find(
        (l) =>
          /vbb-?s?250|vbbc-?250/i.test(l.path + l.title) ||
          (normKey(l.title).includes("bararkasi") && normKey(l.title).includes("250")),
      );
    }
    if (!hit) return null;
    pageUrl = `https://www.kariyermutfak.com${hit.path.startsWith("/") ? hit.path : "/" + hit.path}`;
  }
  return kariyerBuyukPack(pageUrl, p.name);
}

async function tryEqustoLive(fileName, force = false) {
  const url = `https://equsto.com/data/images/${encodeURI(fileName)}`;
  const local = path.join(IMG_DIR, fileName);
  const localSize = fs.existsSync(local) ? fs.statSync(local).size : 0;
  const { status, buf } = await httpBuf(url);
  if (status !== 200 || buf.length < 8000) return null;
  if (!force && Math.abs(buf.length - localSize) < 80 && localSize > 0) return null;
  const ext = fileName.match(/\.(jpe?g|png|webp)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "jpg";
  if (overlayScoreBuf(buf, ext) === true) return null;
  return { url, buf, source: "equsto-live" };
}

async function tryVoscoPack(p) {
  const official = await tryVoscoOfficial(p);
  if (official?.images?.length) return official;
  const kariyer = await tryVoscoViaKariyer(p);
  if (kariyer?.images?.length) return kariyer;
  const rels = p.images || [];
  const blobs = [];
  const forceEqusto = /vbbc-350/i.test(p.id || "");
  for (const rel of rels) {
    const fn = fileNameFromRel(rel);
    const hit = await tryEqustoLive(fn, forceEqusto);
    if (hit) blobs.push(hit);
  }
  if (!blobs.length) return null;
  return { source: "equsto-live", page: "https://equsto.com/data/images/", title: p.name, images: blobs };
}

function overlayScore(fileName) {
  const py = path.join(__dirname, "detect_kariyer_overlay.py");
  const r = spawnSync(process.platform === "win32" ? "python" : "python3", [py, "--file", fileName], {
    cwd: ROOT,
    encoding: "utf8",
  });
  try {
    return JSON.parse((r.stdout || "").trim()).overlay;
  } catch {
    return null;
  }
}

function overlayScoreBuf(buf, ext = "jpg") {
  const tmpName = `_mfr-probe-${Date.now()}.${ext}`;
  const tmpPath = path.join(IMG_DIR, tmpName);
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(tmpPath, buf);
  const ov = overlayScore(tmpName);
  try {
    fs.unlinkSync(tmpPath);
  } catch {
    /* ignore */
  }
  return ov;
}

function productsToProcess(catalog) {
  if (idArg) {
    const p = catalog.find((x) => x.id === idArg);
    return p ? [p] : [];
  }
  if (USE_OVERLAY && fs.existsSync(OVERLAY_REPORT)) {
    const bad = new Set(JSON.parse(fs.readFileSync(OVERLAY_REPORT, "utf8")).bad.map((x) => x.file));
    const out = [];
    for (const p of catalog) {
      if ((p.images || []).some((rel) => bad.has(fileNameFromRel(rel)))) out.push(p);
    }
    return limit > 0 ? out.slice(0, limit) : out;
  }
  return catalog.filter((p) => {
    const b = normKey(p.brand);
    return b.includes("vosco") || b.includes("dampak") || b.includes("ndustrio");
  });
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  let products = productsToProcess(catalog);
  if (!idArg && !USE_OVERLAY) {
    products = catalog.filter((p) => {
      const id = String(p.id || "");
      return (
        id.includes("vbbc-250") ||
        id.includes("vbbc-350") ||
        id.includes("22ddf2s-gn") ||
        id.includes("cps-101-uc") ||
        /^equsto__.*(doner-robot|kdre|kdr)/i.test(id)
      );
    });
  }
  if (idArg && products.length === 0) {
    console.error("Ürün bulunamadı:", idArg);
    process.exit(1);
  }

  console.log(`[mfr-restore] ${products.length} ürün`);
  const log = { dryRun: DRY, items: [] };
  let catalogDirty = false;

  for (const p of products) {
    console.log(`\n${p.brand} — ${p.name?.slice(0, 60)}`);
    const pack =
      (await tryNdustrio(p)) ||
      (await tryDampak(p)) ||
      (await tryBrandViaKariyerIndex(p)) ||
      (await tryEqustoViaKariyer(p)) ||
      (await tryVoscoPack(p));
    if (!pack) {
      log.items.push({ id: p.id, ok: false, reason: "no-manufacturer-source" });
      console.log("  FAIL kaynak yok");
      continue;
    }
    console.log(`  ${pack.source} — ${pack.images.length} görsel (${pack.page})`);

    const row = { id: p.id, source: pack.source, page: pack.page, files: [] };
    const rels = p.images || [];
    let slot = 0;

    for (let j = 0; j < rels.length; j++) {
      const oldName = fileNameFromRel(rels[j]);
      const img = pack.images[slot] || pack.images[pack.images.length - 1];
      if (!img) break;
      if (j > 0 && slot < pack.images.length - 1) slot++;

      const ext = img.url.match(/\.(jpe?g|png|webp)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "jpg";
      const newName = oldName.replace(/\.[a-z]+$/i, `.${ext}`);

      row.files.push({ old: oldName, new: newName, bytes: img.buf.length, url: img.url });
      console.log(`  ${j + 1}. ${newName} ← ${img.buf.length} B`);

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
        const ov = overlayScore(newName);
        if (ov) console.log(`  WARN çerçeve tespit: ${newName}`);
      }
    }

    if (APPLY) {
      const idx = catalog.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const next = row.files.map((f, i) => `images\\${f.new || fileNameFromRel(rels[i])}`);
        if (JSON.stringify(catalog[idx].images) !== JSON.stringify(next)) {
          catalog[idx].images = next;
          catalogDirty = true;
        }
      }
    }

    row.ok = row.files.length > 0;
    log.items.push(row);
  }

  fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + "\n", "utf8");
  if (APPLY && catalogDirty) {
    fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
    console.log("\n[apply] ekipmanlar.json güncellendi — npm run data:dept");
  }
  console.log("\nLog:", LOG);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
