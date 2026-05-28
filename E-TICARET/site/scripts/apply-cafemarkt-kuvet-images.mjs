#!/usr/bin/env node
/**
 * Küvetler PLP — yerel cafemarkt-images, mevcut dosyalar, Öztiryakiler ax-images (web).
 * İsteğe bağlı Cafemarkt arama: --online
 *
 *   node scripts/apply-cafemarkt-kuvet-images.mjs
 *   node scripts/apply-cafemarkt-kuvet-images.mjs --online
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildCafemarktImagesIndex, parseKuvetSignature } from "./lib/kuvet-signature.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const useOnline = process.argv.includes("--online");
const LOCAL_DIR = path.join(ROOT, "public/images/catalog/cafemarkt-images");
const LOCAL_SUB = "images/catalog/cafemarkt-images";
const FALLBACK_SUB = "images/catalog/ozti/cafemarkt";
const WEB_SUB = "images/catalog/ozti/web";
const AX_BASE = "https://oztiryakiler.com.tr/ax-images/images";
const MIN_BYTES = 8000;
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";

const TARGET_JSON = [
  path.join(ROOT, "public/data/dept/set-ustu-mutfak.json"),
  path.join(ROOT, "public/data/ekipmanlar.json"),
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function slugFile(kod) {
  return (
    "ozti-" +
    String(kod)
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

/** eq-dept-tips.js isKuvetProduct ile uyumlu */
function isKuvetRow(row) {
  if (!row || !/öztiryakiler/i.test(String(row.brand || ""))) return false;
  const c = String(row.category || "").toLowerCase();
  if (c === "gastronom-kuvetler" || c === "kuvet") return true;
  const t = `${row.name || ""} ${row.brand || ""} ${row.category || ""}`.toLocaleLowerCase("tr-TR");
  if (/buzdolab|buz dolab|donduruc|soğuk oda/.test(t) && !/(küvet(?!li)|kuvet(?!li))/.test(t)) return false;
  if (/bain\s*marie|bainmarie|küvetli|kuvetli|küvetsiz|kuvetsiz|küvet\s*kapasiteli|kuvet\s*kapasiteli/i.test(t))
    return false;
  if (/küvet\s*ta[sş]|kuvet\s*ta[sş]|banket\s*arab.*kapasiteli/i.test(t)) return false;
  if (/benmari/i.test(t) && !/gastronom\s*küvet|gastronom\s*kuvet/i.test(t)) return false;
  if (/küvet\s*kapak|kuvet\s*kapak/i.test(t)) return true;
  if (/(küvet(?!li)|kuvet(?!li))/.test(t)) return true;
  if (/gastronom(?!\s*seri)/.test(t)) return true;
  if (/\bgn\s*\d{1,2}\s*\/\s*\d{1,2}/.test(t)) return true;
  if (c === "bain-marie-celik-saklama-kaplari") return true;
  if (/polipropilen|polikarbonat|pp\s*gn/.test(t)) return true;
  if (/karıştırma kap|karistirma kap|süzgeç|suzgec/.test(t)) return true;
  return false;
}

function publicFileSize(rel) {
  const p = path.join(ROOT, "public", String(rel || "").replace(/^\//, ""));
  if (!fs.existsSync(p)) return 0;
  return fs.statSync(p).size;
}

function hasGoodImage(rel) {
  return publicFileSize(rel) >= MIN_BYTES;
}

function isCatalogScan(rel) {
  return /\/catalog\/ozti\/p\d+\//i.test(String(rel || ""));
}

function downloadAxToWeb(kod) {
  const key = normKod(kod);
  if (!key) return "";
  const fname = slugFile(key);
  const outDir = path.join(ROOT, "public", WEB_SUB);
  const dest = path.join(outDir, `${fname}.jpg`);
  if (hasGoodImage(`${WEB_SUB}/${fname}.jpg`)) {
    return `${WEB_SUB}/${fname}.jpg`.replace(/\\/g, "/");
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const ext of ["jpg", "png", "webp"]) {
    const url = `${AX_BASE}/${encodeURIComponent(key)}.${ext}`;
    const tryDest = path.join(outDir, `${fname}.${ext === "jpeg" ? "jpg" : ext}`);
    const r = spawnSync("curl.exe", ["-sL", "-k", "--max-time", "45", "-o", tryDest, url], {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    if (r.status !== 0 || !fs.existsSync(tryDest)) continue;
    if (fs.statSync(tryDest).size < MIN_BYTES) {
      fs.unlinkSync(tryDest);
      continue;
    }
    const rel = `${WEB_SUB}/${path.basename(tryDest)}`.replace(/\\/g, "/");
    return rel;
  }
  return "";
}

async function searchCafemarktImage(sku, name) {
  const queries = [String(sku || "").trim(), String(name || "").trim()].filter(Boolean);
  for (const q of queries) {
    const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
    });
    if (!res.ok) continue;
    const html = await res.text();
    const imgM = html.match(/data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/i);
    if (!imgM) continue;
    return imgM[1];
  }
  return null;
}

async function downloadToFallback(url, sku) {
  const ext = (url.match(/\.(jpe?g|webp|png)(\?|$)/i) || [, "jpg"])[1].toLowerCase();
  const file =
    slugFile(sku || "kuvet") +
    "." +
    ext.replace("jpeg", "jpg");
  const rel = `${FALLBACK_SUB}/${file}`;
  const dest = path.join(ROOT, "public", rel);
  if (!hasGoodImage(rel)) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`IMG ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 800) throw new Error("IMG too small");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
  }
  return rel.replace(/\\/g, "/");
}

async function resolveImage(row, localIndex, stats) {
  const sig = parseKuvetSignature(row.name);
  const localFile = localIndex.get(sig.key);
  const cur = String(row.images?.[0] || "").replace(/\\/g, "/");

  if (localFile) {
    stats.local++;
    return `${LOCAL_SUB}/${localFile}`.replace(/\\/g, "/");
  }

  if (cur && hasGoodImage(cur) && !isCatalogScan(cur)) {
    stats.kept++;
    return cur;
  }

  if (cur && hasGoodImage(cur) && isCatalogScan(cur)) {
    stats.scanKept++;
  }

  const kod = normKod(row.sku || row.model || row.urun_kodu);
  if (kod) {
    const axRel = dryRun ? "" : downloadAxToWeb(kod);
    if (axRel) {
      stats.ax++;
      return axRel;
    }
  }

  if (cur && hasGoodImage(cur)) {
    stats.kept++;
    return cur;
  }

  if (useOnline && !dryRun) {
    try {
      const url = await searchCafemarktImage(row.sku || row.model, row.name);
      if (url) {
        const rel = await downloadToFallback(url, row.sku || row.model);
        stats.online++;
        await sleep(280);
        return rel;
      }
    } catch (e) {
      console.warn("[online]", row.name?.slice(0, 48), e.message);
    }
  }

  return "";
}

async function main() {
  const localIndex = buildCafemarktImagesIndex(LOCAL_DIR, fs.readdirSync);
  console.log("[cafemarkt-kuvet] yerel dosya:", localIndex.size, LOCAL_DIR);

  const stats = {
    rows: 0,
    local: 0,
    kept: 0,
    scanKept: 0,
    ax: 0,
    online: 0,
    miss: 0,
    updated: 0,
  };

  for (const jsonPath of TARGET_JSON) {
    if (!fs.existsSync(jsonPath)) continue;
    const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    let changed = 0;

    for (const row of rows) {
      if (!isKuvetRow(row)) continue;
      stats.rows++;

      const rel = await resolveImage(row, localIndex, stats);
      if (!rel) {
        stats.miss++;
        continue;
      }

      if (!dryRun && JSON.stringify(row.images) !== JSON.stringify([rel])) {
        row.images = [rel];
        row.cafemarktImageSource = rel.includes("cafemarkt-images")
          ? "cafemarkt-images"
          : rel.includes("/web/")
            ? "ozti-ax"
            : "fallback";
        changed++;
        stats.updated++;
      }
    }

    if (!dryRun && changed) {
      fs.writeFileSync(jsonPath, JSON.stringify(rows), "utf8");
      console.log(`  ${path.basename(jsonPath)}: ${changed} gorsel`);
    }
  }

  console.log("\n[cafemarkt-kuvet]", stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
