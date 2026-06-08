#!/usr/bin/env node
/**
 * İnoksan Gastroline + Klasik Seri servis hatları → Equsto / standart-servis-hatti
 * Kaynak: tezgah.json (INO-*), görseller inoksan-web-index + public/images/catalog/inoksan/web
 *
 *   node scripts/import-equsto-servis-hatti.mjs
 *   node scripts/import-equsto-servis-hatti.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { foldTr, slugify } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_FILE = path.join(ROOT, "public/data/dept/tezgah.json");
const WEB_INDEX = path.join(ROOT, "scripts/data/inoksan-web-index.json");
const INO_IMG_DIR = path.join(ROOT, "public/images/catalog/inoksan/web");
const OUT_IMG_DIR = path.join(ROOT, "public/images/catalog/equsto/servis-hatti");
const OUT_IMG_SUB = "images/catalog/equsto/servis-hatti";

const BRAND = "Equsto";
const BRAND_ID = "equsto";
const CATEGORY = "standart-servis-hatti";
const CATEGORY_LABEL = "Standart Servis Hattı";
const KAYNAK = "equsto-inoksan-servis-hatti";
const CAT_URLS = [
  "gastroline-standart-servis-hatti",
  "klasik-seri-servis-hatti",
];

const dryRun = process.argv.includes("--dry-run");
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";

function curlBin(url, dest) {
  if (dryRun || !url) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const r = spawnSync("curl.exe", ["-sL", "--max-time", "60", "-H", `User-Agent: ${UA}`, "-o", dest, url], {
    stdio: "pipe",
  });
  return r.status === 0 && fs.existsSync(dest) && fs.statSync(dest).size > 2500;
}

function publishImage(srcAbs, inoSku) {
  const fileName = `${equstoSlug(inoSku)}.jpg`;
  const dest = path.join(OUT_IMG_DIR, fileName);
  if (!dryRun) {
    fs.mkdirSync(OUT_IMG_DIR, { recursive: true });
    fs.copyFileSync(srcAbs, dest);
  }
  return `${OUT_IMG_SUB}/${fileName}`;
}

function baseCodeFromTitle(title) {
  const t = String(title || "").trim();
  const m = t.match(/^([A-Z]{2,4})\s*[\d/\-–]/i) || t.match(/^([A-Z]{2,4})\b/i);
  if (m) return m[1].toUpperCase();
  const m2 = t.match(/^([A-Z0-9]{2,6})/i);
  return m2 ? m2[1].replace(/[^A-Z0-9]/gi, "").toUpperCase() : "";
}

function skuFamily(sku) {
  const m = String(sku || "")
    .replace(/^INO-/i, "")
    .match(/^([A-Z]+)/i);
  return m ? m[1].toUpperCase() : "";
}

function inoCode(sku) {
  return String(sku || "")
    .replace(/^INO-/i, "")
    .trim()
    .toUpperCase();
}

function equstoSku(inoSku) {
  return `EQUSTO.${inoCode(inoSku)}`;
}

function equstoSlug(inoSku) {
  return `equsto-${slugify(inoCode(inoSku))}`;
}

function cleanName(name) {
  return String(name || "")
    .replace(/^İNOKSAN\s+/i, "")
    .replace(/^INOKSAN\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadTargetBases(webProducts) {
  return new Set(
    webProducts
      .filter((p) => p.catUrl && CAT_URLS.some((u) => p.catUrl.includes(u)))
      .map((p) => baseCodeFromTitle(p.title))
      .filter(Boolean),
  );
}

function buildWebByFamily(webProducts) {
  const map = new Map();
  for (const p of webProducts) {
    if (!p.catUrl || !CAT_URLS.some((u) => p.catUrl.includes(u))) continue;
    const fam = baseCodeFromTitle(p.title);
    if (fam && !map.has(fam)) map.set(fam, p);
  }
  return map;
}

function resolveImage(inoSku, webByFamily, existingRel) {
  const slugIno = slugify(inoSku);
  const candidates = [
    existingRel ? path.join(ROOT, "public", existingRel) : "",
    path.join(INO_IMG_DIR, `${slugIno}.jpg`),
    path.join(INO_IMG_DIR, `ino-${slugify(inoCode(inoSku))}.jpg`),
  ].filter(Boolean);

  for (const abs of candidates) {
    if (fs.existsSync(abs)) return publishImage(abs, inoSku);
  }

  const web = webByFamily.get(skuFamily(inoSku));
  const famSlug = web ? slugify(baseCodeFromTitle(web.title)) : slugify(skuFamily(inoSku));
  const famCandidates = [
    path.join(INO_IMG_DIR, `ino-${famSlug}.jpg`),
    path.join(INO_IMG_DIR, `${famSlug}.jpg`),
    path.join(INO_IMG_DIR, `ino-${slugify(inoCode(inoSku))}.jpg`),
  ];
  for (const abs of famCandidates) {
    if (fs.existsSync(abs)) return publishImage(abs, inoSku);
  }

  const cacheDest = path.join(INO_IMG_DIR, `ino-${famSlug}.jpg`);
  if (web?.imgs?.[0] && !fs.existsSync(cacheDest) && curlBin(web.imgs[0], cacheDest)) {
    return publishImage(cacheDest, inoSku);
  }
  if (web?.imgs?.[0]) {
    const tmp = path.join(OUT_IMG_DIR, `.tmp-${equstoSlug(inoSku)}.jpg`);
    if (curlBin(web.imgs[0], tmp)) {
      const rel = publishImage(tmp, inoSku);
      if (!dryRun && fs.existsSync(tmp)) fs.unlinkSync(tmp);
      return rel;
    }
  }

  return existingRel || "";
}

function rewriteSpecs(specs, oldSku, newSku) {
  let s = String(specs || "");
  s = s.replaceAll(oldSku, newSku);
  s = s.replace(/Kaynak: İnoksan 2026 Yurtiçi Bayi Fiyatları R1/g, `Kaynak: Equsto katalog — ${CATEGORY_LABEL}`);
  if (!s.includes("Marka: Equsto")) s += "\nMarka: Equsto";
  if (!s.includes(CATEGORY_LABEL)) {
    s = s.replace(/Kategori: [^\n]+/g, `Kategori: ${CATEGORY_LABEL}`);
  }
  return s;
}

function toEqustoRow(row, webByFamily) {
  const oldSku = sourceInoSku(row);
  const sku = equstoSku(oldSku);
  const slug = equstoSlug(oldSku);
  const imgRel = resolveImage(oldSku, webByFamily, row.images?.[0]);
  const web = webByFamily.get(skuFamily(oldSku));
  const baseName = row.brand === BRAND ? row.name : row.name;
  const name = cleanName(
    web?.title && !String(baseName).includes("—")
      ? `${inoCode(oldSku)} — ${cleanName(web.title)}`
      : baseName,
  );

  return {
    ...row,
    id: `${BRAND_ID}__${slug}`,
    brand: BRAND,
    oem_brand: "İnoksan",
    category: CATEGORY,
    name,
    sku,
    model: sku,
    urun_kodu: sku,
    stok_no: sku,
    dept: "tezgah",
    tileId: CATEGORY,
    keywords: [
      ...new Set([
        BRAND,
        sku,
        inoCode(oldSku),
        CATEGORY,
        CATEGORY_LABEL,
        "servis hattı",
        "servis hatti",
        "standart servis",
        "gastroline",
        "klasik seri",
        ...(row.keywords || []).filter((k) => k && k !== "İnoksan"),
      ]),
    ],
    specs: rewriteSpecs(row.specs, oldSku, sku),
    aciklama: `${name}\n\nKategori: ${CATEGORY_LABEL}`,
    images: imgRel ? [imgRel] : row.images || [],
    kaynak: KAYNAK,
    inoksan_kaynak_sku: oldSku,
    inoksan_web_id: web?.id || row.inoksan_web_id,
    inoksan_slug: web?.slug || row.inoksan_slug,
  };
}

function isTargetRow(row, bases) {
  if (row?.category === CATEGORY && row?.brand === BRAND && row?.inoksan_kaynak_sku) {
    return bases.has(skuFamily(row.inoksan_kaynak_sku));
  }
  if (row?.brand !== "İnoksan") return false;
  const fam = skuFamily(row.sku);
  return fam && bases.has(fam);
}

function sourceInoSku(row) {
  return row.inoksan_kaynak_sku || row.sku;
}

function main() {
  if (!fs.existsSync(DEPT_FILE)) {
    console.error("tezgah.json yok");
    process.exit(1);
  }
  if (!fs.existsSync(WEB_INDEX)) {
    console.error("inoksan-web-index.json yok — önce fetch-inoksan-catalog.mjs --refresh-index");
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
  const webProducts = index.products || [];
  const bases = loadTargetBases(webProducts);
  const webByFamily = buildWebByFamily(webProducts);

  const tezgah = JSON.parse(fs.readFileSync(DEPT_FILE, "utf8"));
  const targets = tezgah.filter((r) => isTargetRow(r, bases));
  if (!targets.length) {
    console.error("[equsto-servis-hatti] eşleşen satır yok");
    process.exit(1);
  }

  const equstoRows = targets.map((r) => toEqustoRow(r, webByFamily));
  const equstoSkus = new Set(equstoRows.map((r) => r.sku));
  const removedSkus = new Set(targets.map((r) => r.sku));

  const merged = tezgah
    .filter((r) => !removedSkus.has(r.sku) && !equstoSkus.has(r.sku))
    .concat(equstoRows);

  const imgOk = equstoRows.filter((r) => r.images?.length).length;
  console.log(
    `[equsto-servis-hatti] ${dryRun ? "DRY-RUN" : "OK"} | ${equstoRows.length} ürün | görsel: ${imgOk}/${equstoRows.length}`,
  );
  console.log(`  kategori: ${CATEGORY} (${CATEGORY_LABEL})`);
  console.log(`  web aile: ${bases.size} | kalan İnoksan tezgah: ${merged.filter((r) => r.brand === "İnoksan").length}`);

  if (!dryRun) {
    fs.writeFileSync(DEPT_FILE, JSON.stringify(merged), "utf8");
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main();
