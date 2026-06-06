#!/usr/bin/env node
/**
 * cafemarkt-robot-coupe.json → equsto katalog (görsel + eksik ürün)
 *   node scripts/fetch-cafemarkt-robot-coupe.mjs
 *   node scripts/apply-cafemarkt-robot-coupe-to-equsto.mjs
 *   node scripts/apply-cafemarkt-robot-coupe-to-equsto.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-robot-coupe.json");
const EKIPMANLAR = path.join(ROOT, "public/data/ekipmanlar.json");
const HAZIRLIK = path.join(ROOT, "public/data/dept/hazirlik.json");
const KAHVE = path.join(ROOT, "public/data/dept/kahve.json");
const ICECEK = path.join(ROOT, "public/data/dept/icecek.json");
const IMG_SUB = "images/catalog/robot-coupe/cafemarkt";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_IMG = 4000;

const dryRun = process.argv.includes("--dry-run");
const skipImages = process.argv.includes("--skip-images");

const SKU_TO_YUKSEL_REF = {
  "9860.MP160.VV": "34740",
  "9860.MP190.VV": "34750",
  "9860.MP190.C0": "34770",
  "9860.MP240.VV": "34760",
  "9860.MP250.C0": "34300B",
  "9810.MP350.U0": "34800L",
  "9810.MP350.CU": "34860L",
  "9810.MP450.UL": "34810L",
  "9860.MP450.C0": "34870L",
  "9860.MP550.A0": "34820LH",
  "9860.MP600.A0": "34830LH",
  "9810.MP800.UL": "34890L",
  "9840.CL50D.00": "24440",
  "9840.CL52D.00": "24490",
  "9840.CL55D.00": "2245",
  "9840.CL60D.00": "2325F",
  "9840.R201E.00": "2129D",
  "9840.R301C.00": "2525",
  "9860.000R2.00": "22100D",
  "9860.000R5.00": "24608M",
  "9860.00J80.00": "56000B",
};

const REF_TO_SKU = Object.fromEntries(
  Object.entries(SKU_TO_YUKSEL_REF).map(([sku, ref]) => [normRef(ref), sku])
);

function normRef(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/\s+/g, "");
}

function cmRef(code) {
  return normRef(String(code || "").replace(/^057\.?/i, ""));
}

function normHay(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function slugFromUrl(url) {
  const base = path.basename(String(url || "").split("?")[0]);
  const cleaned = base.replace(/[^a-z0-9._-]/gi, "-");
  if (/-O\.jpg$/i.test(cleaned)) {
    return `${cleaned.slice(0, -5).toLowerCase()}-O.jpg`;
  }
  return cleaned.toLowerCase();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRobotCoupeRow(row) {
  return /robot coupe/i.test(`${row.brand || ""} ${row.name || ""} ${row.oem_brand || ""}`);
}

function imageBytes(rel) {
  const abs = path.join(ROOT, "public", String(rel || "").replace(/^\//, ""));
  if (!fs.existsSync(abs)) return 0;
  return fs.statSync(abs).size;
}

function isWireframe(rel) {
  const r = String(rel || "");
  if (!r) return true;
  if (/\/catalog\/ozti\/(?:web|p\d+|pdf)\//i.test(r)) return true;
  return imageBytes(r) < MIN_IMG;
}

async function downloadImage(url, destAbs) {
  if (fs.existsSync(destAbs) && fs.statSync(destAbs).size >= MIN_IMG) return true;
  if (dryRun || skipImages) return false;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_IMG) return false;
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.writeFileSync(destAbs, buf);
  return true;
}

function mapCategory(cm) {
  const cat = `${cm.category_path || ""} ${cm.category || ""}`.toLocaleLowerCase("tr-TR");
  if (/bar blender/i.test(cat)) return { dept: "kahve", category: "bar-blenderlar" };
  if (/meyve|sikac|içecek|icecek/i.test(cat)) return { dept: "icecek", category: "meyve-sikacaklari" };
  if (/bıçak|bicak|disk|aksesuar|yedek/i.test(cat)) return { dept: "hazirlik", category: "robot-coupe-aksesuarlari" };
  if (/el blender|mikser|blender/i.test(cat)) return { dept: "hazirlik", category: "robot-coupe-el-mikserleri" };
  if (/sebze|parçalama|parcalama|mutfak robot|blixer|r2|r5|cl /i.test(cat)) {
    return { dept: "hazirlik", category: "sebze-dograma-makineleri" };
  }
  return { dept: "hazirlik", category: "robot-coupe" };
}

function buildMatchIndex(rows) {
  const byRef = new Map();
  const bySku = new Map();
  const byBarcode = new Map();
  const byName = new Map();

  for (const row of rows) {
    if (!isRobotCoupeRow(row)) continue;
    const sku = String(row.sku || row.model || "").trim();
    if (sku) bySku.set(sku, row);
    const yRef = row.yuksel_ref || SKU_TO_YUKSEL_REF[sku];
    if (yRef) byRef.set(normRef(yRef), row);
    const bc = String(row.barkod || "").trim();
    if (bc) byBarcode.set(bc, row);
    byName.set(normHay(row.name), row);
  }
  return { byRef, bySku, byBarcode, byName };
}

function findMatch(cm, idx) {
  const ref = cmRef(cm.code);
  if (ref && idx.byRef.has(ref)) return idx.byRef.get(ref);
  if (REF_TO_SKU[ref] && idx.bySku.has(REF_TO_SKU[ref])) return idx.bySku.get(REF_TO_SKU[ref]);
  if (cm.gtin13 && idx.byBarcode.has(cm.gtin13)) return idx.byBarcode.get(cm.gtin13);
  const nh = normHay(cm.name);
  if (idx.byName.has(nh)) return idx.byName.get(nh);
  return null;
}

function makeId(cm) {
  const slug = String(cm.url || cm.name || cm.cafemarkt_id)
    .toLowerCase()
    .replace(/https?:\/\/[^/]+\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `robot-coupe__${slug || cm.cafemarkt_id}`;
}

function makeNewRow(cm, imgRel) {
  const ref = cmRef(cm.code);
  const oztiSku = REF_TO_SKU[ref] || "";
  const { dept, category } = mapCategory(cm);
  const name = String(cm.name || "").toLocaleUpperCase("tr-TR");
  const id = makeId(cm);
  const priceTry = Number(cm.price_try_kdv_dahil) || 0;
  const priceStr =
    priceTry > 0 ? `₺${priceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} KDV dahil` : "";

  return {
    category,
    brand: "Öztiryakiler Endüstriyel Mutfak",
    name,
    price: priceStr,
    specs: `${name}\nKaynak: Cafemarkt\nRobot Coupe ref: ${cm.code}\nCafemarkt: ${cm.url}`,
    aciklama: name,
    teknik_ozellikler: cm.gtin13 ? [`Barkod: ${cm.gtin13}`] : [],
    keywords: ["Robot Coupe", cm.code, category, name].filter(Boolean),
    images: imgRel ? [imgRel] : [],
    sku: oztiSku || `RC.${ref || cm.cafemarkt_id}`,
    model: oztiSku || cm.code || ref,
    dept,
    id,
    urun_kodu: oztiSku || cm.code,
    oem_brand: "Robot Coupe",
    yuksel_ref: ref || undefined,
    cafemarkt_id: cm.cafemarkt_id,
    cafemarkt_url: cm.url,
    kaynak_fiyat_listesi: "cafemarkt-plp",
    barkod: cm.gtin13 || undefined,
  };
}

async function resolveImage(cm, existingRow) {
  const url = cm.image || cm.images?.[0];
  if (!url) return existingRow?.images?.[0] || "";
  const fname = slugFromUrl(url);
  const rel = `${IMG_SUB}/${fname}`;
  const abs = path.join(ROOT, "public", rel);
  const cur = existingRow?.images?.[0];
  if (cur && !isWireframe(cur)) return cur;
  const ok = await downloadImage(url, abs);
  if (ok || fs.existsSync(abs)) return rel.replace(/\\/g, "/");
  return cur || "";
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

async function main() {
  if (!fs.existsSync(CM_JSON)) {
    console.error("Önce: node scripts/fetch-cafemarkt-robot-coupe.mjs");
    process.exit(1);
  }

  const cmRows = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
  const catalog = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8"));
  const haz = JSON.parse(fs.readFileSync(HAZIRLIK, "utf8"));
  const kahve = fs.existsSync(KAHVE) ? JSON.parse(fs.readFileSync(KAHVE, "utf8")) : [];
  const ice = fs.existsSync(ICECEK) ? JSON.parse(fs.readFileSync(ICECEK, "utf8")) : [];

  const idx = buildMatchIndex([...catalog, ...haz, ...kahve, ...ice]);
  const stats = { matched: 0, imgUpdated: 0, added: 0, skipped: 0 };

  const catalogBySku = new Map(catalog.filter((r) => r.sku).map((r) => [r.sku, r]));
  const hazById = new Map(haz.map((r) => [r.id, r]));
  const kahveById = new Map(kahve.map((r) => [r.id, r]));
  const iceById = new Map(ice.map((r) => [r.id, r]));

  for (const cm of cmRows) {
    const hit = findMatch(cm, idx);
    const imgRel = await resolveImage(cm, hit);
    if (imgRel && !skipImages) await sleep(120);

    if (hit) {
      stats.matched++;
      if (imgRel && hit.images?.[0] !== imgRel && !isWireframe(imgRel)) {
        hit.images = [imgRel];
        stats.imgUpdated++;
        if (hit.sku && catalogBySku.has(hit.sku)) catalogBySku.get(hit.sku).images = [imgRel];
        if (hazById.has(hit.id)) hazById.get(hit.id).images = [imgRel];
        if (kahveById.has(hit.id)) kahveById.get(hit.id).images = [imgRel];
        if (iceById.has(hit.id)) iceById.get(hit.id).images = [imgRel];
      }
      continue;
    }

    if (!imgRel && !dryRun) {
      stats.skipped++;
      continue;
    }

    const row = makeNewRow(cm, imgRel);
    stats.added++;
    catalog.push(row);
    if (row.dept === "icecek") ice.push(row);
    else if (row.dept === "kahve") kahve.push(row);
    else haz.push(row);
    console.log(`[yeni] ${row.sku} | ${row.name.slice(0, 55)}`);
  }

  if (!dryRun) {
    writeJsonAtomic(EKIPMANLAR, catalog);
    writeJsonAtomic(HAZIRLIK, haz);
    if (fs.existsSync(KAHVE)) writeJsonAtomic(KAHVE, kahve);
    if (fs.existsSync(ICECEK)) writeJsonAtomic(ICECEK, ice);
  }

  console.log("\n[apply-cafemarkt-rc] Cafemarkt:", cmRows.length);
  console.log("[apply-cafemarkt-rc] Eslesen:", stats.matched);
  console.log("[apply-cafemarkt-rc] Gorsel guncellenen:", stats.imgUpdated);
  console.log("[apply-cafemarkt-rc] Yeni eklenen:", stats.added);
  if (stats.skipped) console.log("[apply-cafemarkt-rc] Gorsel yok atlandi:", stats.skipped);
  if (dryRun) console.log("(dry-run — dosya yazilmadi)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
