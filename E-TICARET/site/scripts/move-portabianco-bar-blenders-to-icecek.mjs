#!/usr/bin/env node
/**
 * Portabianco bar blender → icecek.json (Cafemarkt)
 * Yanlışlıkla sogutma'da bar blender görünen BAR-/ST- soğutucuları düzeltir.
 *   node scripts/move-portabianco-bar-blenders-to-icecek.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const YUKSEL_SRC = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/tum-urunler.json");
const YUKSEL_IMG = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/_pdf-images-map.json");
const SOGUTMA = path.join(ROOT, "public/data/dept/sogutma.json");
const ICECEK = path.join(ROOT, "public/data/dept/icecek.json");
const IMG_SUB = "images/catalog/portabianco/cafemarkt";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_IMG = 8000;
const CM_DISCOUNT = Number(process.env.EQUSTO_CAFE_DISCOUNT || "0.07");
const CM_MULT = 1 - CM_DISCOUNT;
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");

const tcmb = await fetchTcmbEurRate();
const EUR_TRY =
  Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

const BAR_BLENDER_CODES = new Set(["251.1280", "251.1280D", "251.1280DK", "251.1280K"]);

function fmtTry(n) {
  const parts = n.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

function priceFromCafemarkt(cmPriceKdvDahil) {
  const cm = Number(cmPriceKdvDahil);
  if (!cm || cm <= 0) return null;
  const kdvDahil = Math.round(cm * CM_MULT * 100) / 100;
  const netTry = kdvDahil / (1 + KDV / 100);
  return {
    kdvDahil,
    netTry,
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_tl: Math.round(netTry),
    cm_ref: cm,
  };
}

function slugFromUrl(url) {
  return path.basename(String(url || "").split("?")[0]).replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

function witB(url) {
  return String(url || "")
    .trim()
    .replace(/-O\.jpg(\?|$)/i, "-B.jpg$1")
    .replace(/-o\.jpg(\?|$)/i, "-B.jpg$1");
}

async function downloadImage(url, destAbs) {
  if (fs.existsSync(destAbs) && fs.statSync(destAbs).size >= MIN_IMG) return true;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://www.cafemarkt.com/" },
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_IMG) return false;
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.writeFileSync(destAbs, buf);
  return true;
}

function inferCoolingName(sku, altSub) {
  const m = String(sku || "").trim().toUpperCase();
  if (/^BAR/.test(m)) return `Portabianco Bar Şişe Soğutucu ${m}`;
  if (/^ST-/.test(m)) {
    if (/granite|granit/i.test(String(altSub || ""))) return `Portabianco Granit Pizza Dolabı ${m}`;
    return `Portabianco Bar Soğutucu ${m}`;
  }
  return null;
}

function yukselImageKey(sku) {
  return String(sku || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function needsCoolingImageFix(row) {
  return (
    /portabianco/i.test(String(row.brand || "")) &&
    (/^BAR/i.test(String(row.sku || "")) || /^ST-/i.test(String(row.sku || ""))) &&
    (/\/1280-bar-blender/i.test(String(row.images?.[0] || "")) ||
      /blender/i.test(String(row.name || "")))
  );
}

async function buildBarBlenderRow(cm) {
  const code = String(cm.code || "").trim();
  const skuKey = code.replace(/^251\./, "");
  const url = witB(cm.image || cm.images?.[0]);
  const fname = slugFromUrl(url);
  const rel = `${IMG_SUB}/${fname}`.replace(/\\/g, "/");
  await downloadImage(url, path.join(ROOT, "public", rel));

  const pricing = priceFromCafemarkt(cm.price_try_kdv_dahil);
  const id = `portabianco__${skuKey.toLowerCase().replace(/\./g, "-")}`;

  return {
    category: "bar-blender",
    brand: "PORTABIANCO",
    name: String(cm.name || "").trim(),
    price: pricing?.price || "",
    specs: `${cm.name}\nKaynak: Cafemarkt\nModel: ${code}\nCafemarkt: ${cm.url || ""}${
      pricing
        ? `\nKaynak fiyat (Cafemarkt KDV dahil): ₺${fmtTry(pricing.cm_ref)}\nEqusto Cafemarkt −%${Math.round(CM_DISCOUNT * 100)} (KDV dahil): ₺${fmtTry(pricing.kdvDahil)}`
        : ""
    }`,
    aciklama: String(cm.name || "").trim(),
    keywords: ["PORTABIANCO", "Portabianco", code, skuKey, "bar-blender", cm.name].filter(Boolean),
    images: [rel],
    sku: code,
    model: code,
    fiyat_tl: pricing?.fiyat_tl,
    liste_fiyati_eur:
      pricing && EUR_TRY > 0 ? Math.round((pricing.cm_ref / EUR_TRY) * 100) / 100 : undefined,
    satis_eur_net:
      pricing && EUR_TRY > 0
        ? Math.round((pricing.kdvDahil / (1 + KDV / 100) / EUR_TRY) * 100) / 100
        : undefined,
    fiyat_kaynak: "cafemarkt",
    cafemarkt_fiyat_kdv_dahil: pricing?.cm_ref,
    cafemarkt_fiyat_equsto_kdv_dahil: pricing?.kdvDahil,
    cafemarkt_indirim_oran: CM_DISCOUNT,
    kaynak_fiyat_listesi: "cafemarkt-plp",
    dept: "icecek",
    id,
    urun_kodu: code,
    oem_brand: "Portabianco",
    cafemarkt_id: cm.cafemarkt_id,
    cafemarkt_url: cm.url,
    cafemarkt_image_source: "cafemarkt-exact",
    tip_kodu: skuKey.toLowerCase(),
  };
}

async function main() {
  const cmRows = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
  const yukselAll = JSON.parse(fs.readFileSync(YUKSEL_SRC, "utf8"));
  const yukselImg = JSON.parse(fs.readFileSync(YUKSEL_IMG, "utf8"));
  const srcBySku = new Map(
    yukselAll.map((r) => [String(r.model || r.sku || "").toUpperCase(), r]),
  );

  const icecek = JSON.parse(fs.readFileSync(ICECEK, "utf8"));
  const sogutma = JSON.parse(fs.readFileSync(SOGUTMA, "utf8"));
  const icecekIds = new Set(icecek.map((r) => r.id));

  let added = 0;
  for (const cm of cmRows) {
    if (!BAR_BLENDER_CODES.has(String(cm.code || "").trim())) continue;
    const row = await buildBarBlenderRow(cm);
    if (icecekIds.has(row.id)) continue;
    icecek.push(row);
    icecekIds.add(row.id);
    added++;
    console.log("[icecek +]", row.sku, row.name.slice(0, 60));
  }

  let fixed = 0;
  for (const row of sogutma) {
    if (!needsCoolingImageFix(row) && !/blender/i.test(String(row.name || ""))) continue;
    if (!(/^BAR/i.test(String(row.sku || "")) || /^ST-/i.test(String(row.sku || "")))) continue;
    if (!/portabianco/i.test(String(row.brand || ""))) continue;
    const sku = String(row.sku || row.model || "").trim();
    const src = srcBySku.get(sku.toUpperCase());
    const newName = inferCoolingName(sku, src?.alt_kategori);
    if (newName) row.name = newName;

    const imgKey = yukselImageKey(sku);
    const yukselRel = yukselImg.models?.[imgKey] || yukselImg[imgKey];
    if (yukselRel) {
      row.images = [String(yukselRel).replace(/\\/g, "/")];
    } else {
      row.images = row.images?.filter((img) => !/\/1280-bar-blender/i.test(String(img))) || [];
    }

    delete row.cafemarkt_url;
    delete row.cafemarkt_image_source;
    delete row.cafemarkt_fiyat_kdv_dahil;
    delete row.cafemarkt_fiyat_equsto_kdv_dahil;
    delete row.cafemarkt_indirim_oran;
    if (row.fiyat_kaynak === "cafemarkt") delete row.fiyat_kaynak;

    row.category = row.category || "sogutma-ekipmanlari";
    row.dept = "sogutma";
    fixed++;
    console.log("[sogutma fix]", sku, "→", row.name.slice(0, 55));
  }

  fs.writeFileSync(ICECEK, JSON.stringify(icecek), "utf8");
  fs.writeFileSync(SOGUTMA, JSON.stringify(sogutma), "utf8");

  const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (rebuild.status !== 0) process.exit(rebuild.status || 1);

  console.log(`[bar-blender] icecek +${added} | sogutma düzeltildi: ${fixed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
