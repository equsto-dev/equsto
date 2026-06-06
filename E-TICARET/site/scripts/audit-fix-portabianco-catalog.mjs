#!/usr/bin/env node
/**
 * Portabianco (Yüksel yerli) — fiyat, isim, Cafemarkt görsel denetimi
 *   node scripts/audit-fix-portabianco-catalog.mjs
 *   node scripts/audit-fix-portabianco-catalog.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const YUKSEL_SRC = path.join(ROOT, "public/data/fiyat-listeleri/yuksel/2025-yerli/tum-urunler.json");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const SOGUTMA = path.join(ROOT, "public/data/dept/sogutma.json");
const EKIPMANLAR = path.join(ROOT, "public/data/ekipmanlar.json");
const IMG_MAP_OUT = path.join(ROOT, "public/portabianco-cafemarkt-img-map.js");
const IMG_SUB = "images/catalog/portabianco/cafemarkt";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_IMG = 8000;

const dryRun = process.argv.includes("--dry-run");
const CM_DISCOUNT = Number(process.env.EQUSTO_CAFE_DISCOUNT || "0.07");
const CM_MULT = 1 - CM_DISCOUNT;
const ISKONTO = Number(process.env.EQUSTO_YUKSEL_ISKONTO || "0.55");
const NET_MULT = Math.max(0, Math.min(1, 1 - ISKONTO));
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");

const tcmb = await fetchTcmbEurRate();
const EUR_TRY =
  Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

function normHay(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

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

function priceFromEuro(listEur) {
  const netEur = Math.round(listEur * NET_MULT * 100) / 100;
  const netTry = netEur * EUR_TRY;
  const kdvDahil = netTry * (1 + KDV / 100);
  return {
    netEur,
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_tl: Math.round(netTry),
  };
}

function isDimensionOnlySku(model) {
  const m = String(model || "")
    .trim()
    .replace(/\s+/g, "");
  return /^\d{2,3}[Xx]\d{2}[Xx]\d{2,3}(\/\d+)?$/.test(m);
}

function isGenericSub(sub) {
  return /her\s*kap[iı]da|tel\s*raf\s*dikme|olcu\s*\/\s*size|ozel\s*kalip\s*formlu|raf\s*sistemi/i.test(
    String(sub || ""),
  );
}

function inferCategoryFromModel(model) {
  const m = String(model || "").toUpperCase().trim();
  const doorM = m.match(/(?:^|[.-])([1-4])[ND]/);
  const doors = doorM ? doorM[1] : "";
  const doorTr = doors
    ? { 1: "Tek Kapılı", 2: "İki Kapılı", 3: "Üç Kapılı", 4: "Dört Kapılı" }[doors] || ""
    : "";

  if (/^TT-?\d/.test(m) || /^TT[KCGMRXTS]/.test(m)) {
    if (/ND/.test(m)) return `Tezgah Tip Mix ${doorTr}`.trim();
    if (/^TTD|^TT-?\d+D/.test(m)) return `Tezgah Tip Derin Dondurucu ${doorTr}`.trim();
    if (/^TTC/.test(m)) return `Tezgah Tip Cam Kapaklı ${doorTr}`.trim();
    if (/^TTG/.test(m)) return `Tezgah Tip GN Tepsi ${doorTr}`.trim();
    if (/^TTK/.test(m)) return `Tezgah Tip Mix ${doorTr}`.trim();
    return `Tezgah Tip Buzdolabı ${doorTr}`.trim();
  }
  if (/^DTT/.test(m)) return "Dik Tip GN Tepsi Buzdolabı";
  if (/^DT/.test(m)) {
    if (/ND/.test(m)) return `Dik Tip Mix ${doorTr}`.trim();
    if (/DGN|DGN/.test(m)) return `Dik Tip Derin Dondurucu ${doorTr}`.trim();
    return `Dik Tip Buzdolabı ${doorTr}`.trim();
  }
  if (/^CA-?\d/.test(m) || /^CAM/.test(m)) {
    if (/D/.test(m)) return `Cihaz Altı Derin Dondurucu ${doorTr}`.trim();
    return `Cihaz Altı Buzdolabı ${doorTr}`.trim();
  }
  if (/^SBM/.test(m)) return `Make-Up Buzdolabı Mermer Tablalı ${doorTr}`.trim();
  if (/^SBT/.test(m)) return `Make-Up Buzdolabı ${doorTr}`.trim();
  if (/^SBH/.test(m)) return `GN Havuzlu Make-Up Buzdolabı ${doorTr}`.trim();
  if (/^SBB/.test(m)) return `Yükseltilmiş Make-Up Buzdolabı ${doorTr}`.trim();
  if (/^TTEV/.test(m)) return `Tezgah Tip Make-Up Evyeli ${doorTr}`.trim();
  if (/^PZA/.test(m)) return `Pizza Buzdolabı ${doorTr}`.trim();
  if (/^PZAD/.test(m)) return `Pizza Buzdolabı ${doorTr}`.trim();
  if (/^PZAC/.test(m)) return `Pizza Hazırlık Dolabı ${doorTr}`.trim();
  if (/^PZAG/.test(m)) return `Granit Pizza Dolabı ${doorTr}`.trim();
  if (/^SLM/.test(m)) return "Slim Tip Buzdolabı";
  if (/^ST-/.test(m)) return "Bar Soğutucu";
  if (/^BAR/.test(m)) return "Bar Blender";
  return "";
}

function displayName(model, altSub, cmName) {
  const sku = String(model || "").trim();
  let sub = inferCategoryFromModel(sku);
  if (cmName) {
    const cleaned = String(cmName)
      .replace(/^Portabianco\s+/i, "")
      .replace(/,\s*\d+\s*Kapılı.*$/i, "")
      .trim();
    if (cleaned.length > 8) sub = cleaned;
  } else if (!sub && !isGenericSub(altSub)) {
    sub = String(altSub || "").split("·")[0].trim();
  }
  if (!sub) sub = "Endüstriyel Soğutma";
  return `Portabianco ${sub} ${sku}`.replace(/\s+/g, " ").trim();
}

function cmModelKeys(cm) {
  const keys = new Set();
  const code = String(cm.code || "").trim();
  const m251 = code.match(/^251\.(.+)$/i);
  if (m251) {
    keys.add(normHay(m251[1].replace(/\./g, "-")));
    keys.add(normHay(m251[1].replace(/\./g, "")));
  }
  keys.add(normHay(code));
  const nameM = String(cm.name || "").match(/\bPortabianco\s+([A-Z0-9][A-Z0-9./-]{2,}?)(?:\s|,|$)/i);
  if (nameM) {
    keys.add(normHay(nameM[1]));
    keys.add(normHay(nameM[1].replace(/\./g, "-")));
  }
  return [...keys].filter((k) => k.length >= 3);
}

function rowLookupKeys(sku) {
  const s = String(sku || "").trim();
  const keys = new Set([normHay(s)]);
  if (/E$/.test(s) && !/-E$/.test(s)) keys.add(normHay(s.replace(/E$/, "-E")));
  if (/-E$/.test(s)) keys.add(normHay(s.replace(/-E$/, "E")));
  const noEko = s.replace(/-EKO$/i, "");
  if (noEko !== s) keys.add(normHay(noEko));
  return [...keys].filter(Boolean);
}

function fallbackSkus(sku) {
  const s = String(sku || "").trim().toUpperCase();
  const out = new Set();
  if (/E$/.test(s) && !/-E$/.test(s)) out.add(s.replace(/E$/, "-E"));
  out.add(s.replace(/ND(\d)/g, "N$1"));
  out.add(s.replace(/ND(\d)/g, "D$1"));
  out.add(s.replace(/-1N/, "-2N"));
  out.add(s.replace(/-1D/, "-2D"));
  const ttNorm = s.replace(/^TT[KCGMRXTS]+-/, "TT-");
  out.add(ttNorm);
  out.add(ttNorm.replace(/-1N/, "-2N"));
  out.add(ttNorm.replace(/-1D/, "-2D"));
  out.add(s.replace(/^TT[KCGMRXTS]+-/, "TT-"));
  out.add(s.replace(/^ASBH/, "SBH"));
  out.add(s.replace(/^MSBH/, "SBH"));
  out.add(s.replace(/^SBTM/, "SBM"));
  out.add(s.replace(/^SBTP/, "SBT"));
  out.add(s.replace(/^SBHK/, "SBH"));
  out.add(s.replace(/^SBHKG/, "SBH"));
  out.add(s.replace(/^CAM-/, "CA-"));
  out.add(s.replace(/^DTT-2/, "DTT-1"));
  if (/^SB[THM]G/.test(s)) out.add(s.replace(/^SB([THM])G/, "SB$1-"));
  out.delete(s);
  return [...out];
}

function buildCmIndex(cmRows) {
  const byModel = new Map();
  for (const cm of cmRows) {
    for (const key of cmModelKeys(cm)) {
      if (!byModel.has(key)) byModel.set(key, cm);
    }
  }
  return byModel;
}

function findCmExact(sku, cmIndex) {
  for (const key of rowLookupKeys(sku)) {
    if (cmIndex.has(key)) return { cm: cmIndex.get(key), via: key, exact: true };
  }
  return null;
}

function findCm(sku, cmIndex) {
  const exact = findCmExact(sku, cmIndex);
  if (exact) return exact;
  for (const fb of fallbackSkus(sku)) {
    for (const key of rowLookupKeys(fb)) {
      if (cmIndex.has(key)) return { cm: cmIndex.get(key), via: `${sku}→${fb}`, exact: false };
    }
  }
  return null;
}

function witB(url) {
  return String(url || "")
    .trim()
    .replace(/-O\.jpg(\?|$)/i, "-B.jpg$1")
    .replace(/-o\.jpg(\?|$)/i, "-B.jpg$1");
}

function slugFromUrl(url) {
  return path.basename(String(url || "").split("?")[0]).replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
}

async function downloadImage(url, destAbs) {
  if (fs.existsSync(destAbs) && fs.statSync(destAbs).size >= MIN_IMG) return true;
  if (dryRun) return false;
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

function writeJsonAtomic(filePath, data) {
  if (dryRun) return;
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

function isYukselPortabianco(row) {
  return (
    /portabianco/i.test(String(row.brand || "")) &&
    String(row.kaynak_fiyat_listesi || "").includes("yuksel-2025-yerli")
  );
}

async function main() {
  const srcAll = JSON.parse(fs.readFileSync(YUKSEL_SRC, "utf8"));
  const srcBySku = new Map();
  for (const item of srcAll) {
    const sku = String(item.model || item.sku || "").trim();
    if (sku) srcBySku.set(sku.toUpperCase(), item);
  }

  const cmRows = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
  const cmIndex = buildCmIndex(cmRows);

  const sogutma = JSON.parse(fs.readFileSync(SOGUTMA, "utf8"));
  const ekipmanlar = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8"));
  const ekiById = new Map(ekipmanlar.map((r) => [r.id, r]));

  const witMap = Object.create(null);
  for (const cm of cmRows) {
    const url = witB(cm.image || cm.images?.[0]);
    if (!url) continue;
    for (const key of cmModelKeys(cm)) {
      if (!witMap[key]) witMap[key] = url;
    }
  }

  const stats = {
    total: 0,
    purged: 0,
    names: 0,
    prices: 0,
    images: 0,
    imgFallback: 0,
    cmPriceExact: 0,
    noCm: 0,
    noSrc: 0,
  };

  const kept = [];

  for (const row of sogutma) {
    if (!isYukselPortabianco(row)) {
      kept.push(row);
      continue;
    }
    stats.total++;

    const sku = String(row.sku || row.model || "").trim();
    if (isDimensionOnlySku(sku)) {
      stats.purged++;
      const eki = ekiById.get(row.id);
      if (eki) eki._purge = true;
      console.log(`[purge] ${sku} — olcu satiri`);
      continue;
    }

    const src = srcBySku.get(sku.toUpperCase());
    if (!src) stats.noSrc++;

    const hit = findCm(sku, cmIndex);
    const cm = hit?.cm;
    const exactHit = findCmExact(sku, cmIndex);
    if (hit?.via?.includes("→")) stats.imgFallback++;

    const newName = displayName(sku, src?.alt_kategori, cm?.name);
    if (newName !== row.name) {
      stats.names++;
      row.name = newName;
      if (row.aciklama?.startsWith("Portabianco")) row.aciklama = newName;
    }

    const cmPrice = priceFromCafemarkt(exactHit?.cm?.price_try_kdv_dahil);
    if (cmPrice) {
      stats.cmPriceExact++;
      stats.prices++;
      row.fiyat_tl = cmPrice.fiyat_tl;
      row.price = cmPrice.price;
      row.fiyat_kaynak = "cafemarkt";
      row.cafemarkt_fiyat_kdv_dahil = cmPrice.cm_ref;
      row.cafemarkt_fiyat_equsto_kdv_dahil = cmPrice.kdvDahil;
      row.cafemarkt_indirim_oran = CM_DISCOUNT;
      if (EUR_TRY > 0) {
        row.liste_fiyati_eur = Math.round((cmPrice.cm_ref / EUR_TRY) * 100) / 100;
        row.satis_eur_net = Math.round((cmPrice.kdvDahil / (1 + KDV / 100) / EUR_TRY) * 100) / 100;
      }
      const specsLines = String(row.specs || "")
        .split("\n")
        .filter((l) => !/^Kaynak fiyat \(Cafemarkt|^Equsto Cafemarkt/i.test(l));
      specsLines.push(
        `Kaynak fiyat (Cafemarkt KDV dahil): ₺${fmtTry(cmPrice.cm_ref)}`,
        `Equsto Cafemarkt −%${Math.round(CM_DISCOUNT * 100)} (KDV dahil): ₺${fmtTry(cmPrice.kdvDahil)}`,
      );
      row.specs = specsLines.join("\n");
    } else if (src) {
      const listEur = Number(src.fiyat_euro);
      if (listEur > 0) {
        const { netEur, price, fiyat_tl } = priceFromEuro(listEur);
        if (row.liste_fiyati_eur !== listEur || row.fiyat_tl !== fiyat_tl) {
          stats.prices++;
          row.liste_fiyati_eur = listEur;
          row.satis_eur_net = netEur;
          row.fiyat_tl = fiyat_tl;
          row.price = price;
          row.fiyat_kaynak = "yuksel-2025-yerli";
        }
      }
    }

    if (cm) {
      const url = witB(cm.image || cm.images?.[0]);
      const fname = slugFromUrl(url);
      const rel = `${IMG_SUB}/${fname}`;
      const abs = path.join(ROOT, "public", rel);
      const ok = await downloadImage(url, abs);
      if (ok || dryRun) {
        row.images = [rel.replace(/\\/g, "/")];
        row.cafemarkt_url = cm.url || row.cafemarkt_url;
        row.cafemarkt_image_source = hit?.via?.includes("→") ? "cafemarkt-family" : "cafemarkt-exact";
        stats.images++;
        for (const key of rowLookupKeys(sku)) {
          witMap[key] = url;
        }
        const yukselKey = normHay(`yuksel-${sku.toLowerCase().replace(/\./g, "-")}`);
        witMap[yukselKey] = url;
      }
    } else {
      stats.noCm++;
    }

    kept.push(row);
    const eki = ekiById.get(row.id);
    if (eki) {
      eki.name = row.name;
      eki.price = row.price;
      eki.fiyat_tl = row.fiyat_tl;
      eki.liste_fiyati_eur = row.liste_fiyati_eur;
      eki.satis_eur_net = row.satis_eur_net;
      eki.fiyat_kaynak = row.fiyat_kaynak;
      eki.cafemarkt_fiyat_kdv_dahil = row.cafemarkt_fiyat_kdv_dahil;
      eki.cafemarkt_fiyat_equsto_kdv_dahil = row.cafemarkt_fiyat_equsto_kdv_dahil;
      eki.cafemarkt_indirim_oran = row.cafemarkt_indirim_oran;
      eki.specs = row.specs;
      if (row.images) eki.images = row.images;
      eki.cafemarkt_url = row.cafemarkt_url;
      eki.cafemarkt_image_source = row.cafemarkt_image_source;
    }
  }

  const ekipKept = ekipmanlar.filter((r) => !r._purge);
  for (const r of ekipKept) delete r._purge;

  writeJsonAtomic(SOGUTMA, kept);
  writeJsonAtomic(EKIPMANLAR, ekipKept);

  const mapBody =
    "/** Auto: scripts/audit-fix-portabianco-catalog.mjs — Portabianco SKU → Cafemarkt witcdn */\n" +
    "window.EQ_PB_CM_WITCDN=" +
    JSON.stringify(witMap) +
    ";\n";
  if (!dryRun) {
    const tmp = `${IMG_MAP_OUT}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, mapBody, "utf8");
    try {
      if (fs.existsSync(IMG_MAP_OUT)) fs.unlinkSync(IMG_MAP_OUT);
    } catch (_) {}
    fs.renameSync(tmp, IMG_MAP_OUT);
  }

  console.log("\n[audit-pb] Portabianco:", stats.total);
  console.log("[audit-pb] Silinen olcu satiri:", stats.purged);
  console.log("[audit-pb] Isim duzeltildi:", stats.names);
  console.log("[audit-pb] Fiyat guncellendi:", stats.prices, `(cafemarkt -%${Math.round(CM_DISCOUNT * 100)}: ${stats.cmPriceExact})`);
  console.log("[audit-pb] Cafemarkt gorsel:", stats.images, `(aile eslesme: ${stats.imgFallback})`);
  console.log("[audit-pb] Cafemarkt eslesme yok:", stats.noCm);
  console.log("[audit-pb] witcdn map keys:", Object.keys(witMap).length);
  if (dryRun) console.log("(dry-run)");

  if (!dryRun && (stats.purged > 0 || stats.names > 0 || stats.prices > 0 || stats.images > 0)) {
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
