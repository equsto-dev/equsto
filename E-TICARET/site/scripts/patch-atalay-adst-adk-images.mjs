#!/usr/bin/env node
/**
 * Atalay ADST / ADK — PDF tablo kırpıntısı yerine Cafemarkt ürün fotoğrafı.
 * ADST-02…06 Cafemarkt'ta yok → ADST-01 aile görseli.
 *
 *   node scripts/patch-atalay-adst-adk-images.mjs
 *   node scripts/patch-atalay-adst-adk-images.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const DEST = "images/catalog/atalay/cafemarkt";
const dryRun = process.argv.includes("--dry-run");

/** model → cafemarkt arama / witcdn eşlemesi */
const CM_FETCH = [
  {
    model: "ADST-01",
    queries: ["Atalay ADST-01 Döner Lifti", "Atalay ADST-01"],
    file: "atalay-adst-01.jpg",
  },
  {
    model: "ADK-10/2",
    queries: ["Atalay ADK-10-2 Döner Kalıbı", "Atalay ADK 10/2"],
    file: "atalay-adk-102.jpg",
  },
  {
    model: "ADK-8/3",
    queries: ["Atalay ADK08-3 Döner Kalıbı", "Atalay ADK-8/3"],
    file: "atalay-adk-83.jpg",
  },
  {
    model: "ADK-C5/2",
    queries: ["Atalay ADKC5-2 Döner Kalıbı", "Atalay ADK-C5/2"],
    file: "atalay-adk-c52.jpg",
  },
];

/** PDF p119/p120 tablo görseli — Cafemarkt yok */
const ADST_FALLBACK_MODEL = "ADST-01";
const ADST_PDF_MODELS = ["ADST-02", "ADST-03", "ADST-04", "ADST-05", "ADST-06"];

function isBadPdfHero(rel) {
  return /\/atalay\/p\d{2,3}\/atalay-(adst|adk)-/i.test(String(rel || ""));
}

async function searchWitCdn(q) {
  const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const re = /data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/gi;
  const urls = [];
  let m;
  while ((m = re.exec(html))) urls.push(m[1]);
  return [...new Set(urls)].filter((u) => /atalay/i.test(u));
}

function witVariants(url) {
  return [
    url.replace(/-K\.(jpe?g)/i, "-B.$1"),
    url.replace(/-K\.(jpe?g)/i, "-O.$1"),
    url,
  ].filter((u, i, a) => a.indexOf(u) === i);
}

async function downloadBest(urls) {
  for (const base of urls.slice(0, 10)) {
    for (const u of witVariants(base)) {
      const res = await fetch(u, { headers: { "User-Agent": UA } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      if ((meta.width || 0) >= 400 && (meta.height || 0) >= 300) {
        return sharp(buf).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
      }
    }
  }
  return null;
}

async function ensureCmImage(entry) {
  const destDir = path.join(ROOT, "public", DEST);
  const rel = `${DEST}/${entry.file}`;
  const dest = path.join(destDir, entry.file);
  if (!dryRun) fs.mkdirSync(destDir, { recursive: true });

  let urls = [];
  for (const q of entry.queries) {
    urls.push(...(await searchWitCdn(q)));
    if (urls.length) break;
  }
  if (!urls.length) {
    console.warn("[miss]", entry.model);
    return null;
  }
  const buf = await downloadBest(urls);
  if (!buf) {
    console.warn("[small]", entry.model);
    return null;
  }
  if (!dryRun) fs.writeFileSync(dest, buf);
  const meta = await sharp(buf).metadata();
  console.log("[ok]", entry.model, rel, `${meta.width}x${meta.height}`);
  return rel;
}

function patchDeptFiles(imageByModel) {
  const deptDir = path.join(ROOT, "public/data/dept");
  let total = 0;
  for (const file of fs.readdirSync(deptDir)) {
    if (!file.endsWith(".json")) continue;
    const fp = path.join(deptDir, file);
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    let changed = 0;
    for (const row of rows) {
      if (!/atalay/i.test(String(row.brand || ""))) continue;
      const model = String(row.model || "").trim();
      let rel = imageByModel.get(model);
      if (!rel && ADST_PDF_MODELS.includes(model)) {
        rel = imageByModel.get(ADST_FALLBACK_MODEL);
      }
      if (!rel) continue;
      const cur = String((row.images || [])[0] || "");
      if (!isBadPdfHero(cur) && cur === rel) continue;
      if (!isBadPdfHero(cur) && cur.includes("/cafemarkt/")) continue;
      row.images = [rel];
      changed++;
    }
    if (changed && !dryRun) {
      fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
      console.log(`  ${file}: ${changed}`);
      total += changed;
    }
  }
  return total;
}

async function main() {
  const imageByModel = new Map();
  for (const entry of CM_FETCH) {
    const rel = await ensureCmImage(entry);
    if (rel) imageByModel.set(entry.model, rel);
    await new Promise((r) => setTimeout(r, 350));
  }
  const fallback = imageByModel.get(ADST_FALLBACK_MODEL);
  if (fallback) {
    for (const m of ADST_PDF_MODELS) imageByModel.set(m, fallback);
  }
  const n = patchDeptFiles(imageByModel);
  if (!dryRun && n > 0) {
    const { spawnSync } = await import("node:child_process");
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
  console.log("[patch-atalay-adst-adk-images]", { downloaded: imageByModel.size, deptRows: n, dryRun });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
