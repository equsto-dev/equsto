#!/usr/bin/env node
/**
 * cafemarkt-portabianco.json → Yüksel/Portabianco bozuk PDF görsellerini düzelt
 *   node scripts/fetch-cafemarkt-portabianco.mjs
 *   node scripts/apply-cafemarkt-portabianco-images.mjs
 *   node scripts/apply-cafemarkt-portabianco-images.mjs --search-missing
 *   node scripts/apply-cafemarkt-portabianco-images.mjs --upgrade-b
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const EKIPMANLAR = path.join(ROOT, "public/data/ekipmanlar.json");
const SOGUTMA = path.join(ROOT, "public/data/dept/sogutma.json");
const IMG_SUB = "images/catalog/portabianco/cafemarkt";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_IMG = 8000;
const MIN_GOOD_YUKSEL = Number(process.env.EQUSTO_YUKSEL_MIN_GOOD_IMG || "85000");

const dryRun = process.argv.includes("--dry-run");
const replaceAll = process.argv.includes("--all");
const searchMissing = process.argv.includes("--search-missing");
const upgradeB = process.argv.includes("--upgrade-b") || !process.argv.includes("--keep-o");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normHay(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

function slugFromUrl(url) {
  return path.basename(String(url || "").split("?")[0]).replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
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

function rowLookupKeys(row) {
  const sku = String(row.sku || row.model || "").trim();
  const keys = new Set([normHay(sku)]);
  const noEko = sku.replace(/-EKO$/i, "");
  if (noEko !== sku) keys.add(normHay(noEko));
  const noE = sku.replace(/E$/i, "");
  if (noE !== sku && noE.length >= 4) keys.add(normHay(noE));
  return [...keys].filter(Boolean);
}

function findCm(row, cmIndex) {
  for (const key of rowLookupKeys(row)) {
    if (cmIndex.has(key)) return cmIndex.get(key);
  }
  return null;
}

function imageBytes(rel) {
  const abs = path.join(ROOT, "public", String(rel || "").replace(/^\//, ""));
  if (!fs.existsSync(abs)) return 0;
  return fs.statSync(abs).size;
}

function isYukselPortabianco(row) {
  return (
    /portabianco/i.test(String(row.brand || "")) &&
    String(row.kaynak_fiyat_listesi || "").includes("yuksel-2025-yerli")
  );
}

function isYukselPdfImage(rel) {
  return /\/catalog\/yuksel\//i.test(String(rel || ""));
}

function isBadImage(rel) {
  const r = String(rel || "").replace(/\\/g, "/");
  if (!r) return true;
  if (/\/catalog\/portabianco\/cafemarkt\//i.test(r)) {
    if (upgradeB && /-14-o\.jpg$/i.test(r)) return true;
    return imageBytes(r) < MIN_IMG;
  }
  if (!isYukselPdfImage(r)) return false;
  return imageBytes(r) < MIN_GOOD_YUKSEL;
}

function shouldReplace(cur) {
  if (replaceAll) return true;
  if (isYukselPdfImage(cur)) return true;
  if (upgradeB && /\/portabianco\/cafemarkt\//i.test(cur)) {
    if (/-14-o\.jpg$/i.test(cur) || /-14--o\.jpg$/i.test(cur)) return true;
    if (imageBytes(cur) < 40000) return true;
  }
  return isBadImage(cur);
}

function bestDownloadUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (upgradeB && /-O\.jpg(\?|$)/i.test(u)) return u.replace(/-O\.jpg/i, "-B.jpg");
  return u;
}

async function downloadImage(url, destAbs, force) {
  if (!force && fs.existsSync(destAbs) && fs.statSync(destAbs).size >= MIN_IMG) return true;
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

function buildCmIndex(cmRows) {
  const byModel = new Map();
  for (const cm of cmRows) {
    for (const key of cmModelKeys(cm)) {
      if (!byModel.has(key)) byModel.set(key, cm);
    }
  }
  return byModel;
}

async function searchCafemarktModel(model) {
  for (const term of [model, String(model).replace(/-EKO$/i, "")]) {
    const q = String(term || "").trim();
    if (!q || q.length < 3) continue;
    const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" } });
    if (!res.ok) continue;
    const html = await res.text();
    const m = html.match(
      /<script type="application\/ld\+json">\s*(\{"@context"[^<]*"@type":"ItemList"[\s\S]*?)\s*<\/script>/i,
    );
    if (!m) continue;
    const data = JSON.parse(m[1]);
    const items = (data.itemListElement || []).map((li) => li.item || {});
    const want = normHay(q);
    for (const p of items) {
      if (!/portabianco/i.test(`${p.brand?.name || ""} ${p.name || ""}`)) continue;
      const keys = cmModelKeys({ code: p.sku, name: p.name });
      if (keys.some((k) => k === want || k.includes(want) || want.includes(k))) {
        return {
          cafemarkt_id: String(p.productID || ""),
          name: p.name || "",
          code: p.sku || "",
          url: p.url || "",
          image: (p.image || [])[0] || "",
        };
      }
    }
    await sleep(150);
  }
  return null;
}

async function resolveCmImage(cm, force) {
  const raw = cm.image || cm.images?.[0];
  if (!raw) return "";
  const url = bestDownloadUrl(raw);
  const fname = slugFromUrl(url);
  const rel = `${IMG_SUB}/${fname}`;
  const abs = path.join(ROOT, "public", rel);
  let ok = await downloadImage(url, abs, force);
  if (!ok && url !== raw) ok = await downloadImage(raw, abs, force);
  if (ok || fs.existsSync(abs)) return rel.replace(/\\/g, "/");
  return "";
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
    console.error("Önce: node scripts/fetch-cafemarkt-portabianco.mjs");
    process.exit(1);
  }

  const cmRows = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
  const cmIndex = buildCmIndex(cmRows);
  const catalog = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8"));
  const sogutma = JSON.parse(fs.readFileSync(SOGUTMA, "utf8"));
  const sogById = new Map(sogutma.map((r) => [r.id, r]));

  const stats = {
    yukselPb: 0,
    badImg: 0,
    matched: 0,
    updated: 0,
    skippedGood: 0,
    noCm: 0,
    searched: 0,
  };

  for (const row of catalog) {
    if (!isYukselPortabianco(row)) continue;
    stats.yukselPb++;

    const cur = (row.images || [])[0] || "";
    if (isBadImage(cur) || isYukselPdfImage(cur)) stats.badImg++;
    if (!shouldReplace(cur)) {
      stats.skippedGood++;
      continue;
    }

    let cm = findCm(row, cmIndex);
    if (!cm && searchMissing) {
      cm = await searchCafemarktModel(row.sku || row.model);
      stats.searched++;
      await sleep(200);
    }
    if (!cm) {
      stats.noCm++;
      continue;
    }

    stats.matched++;
    const force = upgradeB || isYukselPdfImage(cur);
    const imgRel = await resolveCmImage(cm, force);
    if (!imgRel) continue;
    if (imgRel === cur && !force) continue;

    row.images = [imgRel];
    row.cafemarkt_url = cm.url || row.cafemarkt_url;
    row.cafemarkt_image_source = "cafemarkt-plp";
    stats.updated++;

    const deptRow = sogById.get(row.id);
    if (deptRow) deptRow.images = [imgRel];
    console.log(`[gorsel] ${row.sku} → ${path.basename(imgRel)} (${imageBytes(imgRel)} B)`);
    await sleep(80);
  }

  if (!dryRun && stats.updated) {
    writeJsonAtomic(EKIPMANLAR, catalog);
    writeJsonAtomic(SOGUTMA, sogutma);
  }

  console.log("\n[apply-cafemarkt-pb] Yüksel Portabianco:", stats.yukselPb);
  console.log("[apply-cafemarkt-pb] Bozuk / Yüksel PDF:", stats.badImg);
  console.log("[apply-cafemarkt-pb] Cafemarkt eşleşen:", stats.matched);
  console.log("[apply-cafemarkt-pb] Güncellenen:", stats.updated);
  console.log("[apply-cafemarkt-pb] İyi görsel (atlandı):", stats.skippedGood);
  console.log("[apply-cafemarkt-pb] Cafemarkt yok:", stats.noCm);
  if (dryRun) console.log("(dry-run — dosya yazılmadı)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
