#!/usr/bin/env node
/**
 * PLP — render olmayan (wireframe / katalog / eksik) Öztiryakiler görselleri:
 * 1) ax-images .01 render
 * 2) yerel ozti/cafemarkt
 * 3) Cafemarkt arama (witcdn) — SKU / ürün adı
 *
 *   node scripts/fetch-cafemarkt-plp-images.mjs --dry-run --limit=20
 *   node scripts/fetch-cafemarkt-plp-images.mjs --dept=davlumbaz
 *   node scripts/fetch-cafemarkt-plp-images.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "public/images/catalog/ozti/web");
const P287 = path.join(ROOT, "public/images/catalog/ozti/p287");
const CAFEMARKT_DIR = path.join(ROOT, "public/images/catalog/ozti/cafemarkt");
const CAFEMARKT_SUB = "images/catalog/ozti/cafemarkt";
const WEB_SUB = "images/catalog/ozti/web";
const CM_JSON = path.join(ROOT, "scripts/data/cafemarkt-ozti.json");
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_PHOTO = 8000;
const MIN_RENDER = 215000;
/** Yanlışlıkla tüm cafemarkt klasörüne kopyalanan UNOX stub (wireframe). */
const BAD_CAFE_STUB_BYTES = 10995;
let badCafeStubMd5 = "";

function loadBadCafeStubMd5() {
  if (badCafeStubMd5) return badCafeStubMd5;
  try {
    const sample = path.join(CAFEMARKT_DIR, "ozti-9580-appia-3v.jpg");
    if (fs.existsSync(sample) && fs.statSync(sample).size === BAD_CAFE_STUB_BYTES) {
      badCafeStubMd5 = md5File(sample);
    }
  } catch (_) {}
  return badCafeStubMd5;
}

function isBadCafemarktStub(abs) {
  if (!abs || !fs.existsSync(abs)) return false;
  const bytes = fs.statSync(abs).size;
  if (bytes !== BAD_CAFE_STUB_BYTES) return false;
  const stub = loadBadCafeStubMd5();
  if (!stub) return true;
  try {
    return md5File(abs) === stub;
  } catch (_) {
    return true;
  }
}

const dryRun = process.argv.includes("--dry-run");
const skipAx = process.argv.includes("--skip-ax");
const skipOnline = process.argv.includes("--skip-online");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;
const deptArg = process.argv.find((a) => a.startsWith("--dept="));
const deptFilter = deptArg ? deptArg.split("=")[1] : "";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function md5File(abs) {
  return crypto.createHash("md5").update(fs.readFileSync(abs)).digest("hex");
}

function loadP287Hashes() {
  const set = new Set();
  if (!fs.existsSync(P287)) return set;
  for (const name of fs.readdirSync(P287)) {
    if (!name.endsWith(".jpg")) continue;
    set.add(md5File(path.join(P287, name)));
  }
  return set;
}

function classifyAbs(abs, p287Hashes) {
  if (!fs.existsSync(abs)) return "missing";
  if (p287Hashes.has(md5File(abs))) return "catalog";
  const bytes = fs.statSync(abs).size;
  if (bytes < MIN_PHOTO) return "catalog";
  if (bytes >= MIN_RENDER) return "render";
  return "wire";
}

function normKod(k) {
  return String(k || "").replace(/\s+/g, "").toUpperCase();
}

function normHay(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
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

function isOztiRow(row) {
  return /öztiryakiler/i.test(String(row.brand || ""));
}

function publicAbs(rel) {
  return path.join(ROOT, "public", String(rel || "").replace(/^\//, ""));
}

function downloadAx01(kod) {
  const key = normKod(kod);
  if (!key) return "";
  const fname = `${slugFile(key)}.jpg`;
  const rel = `${WEB_SUB}/${fname}`;
  const dest = path.join(WEB, fname);
  const abs = path.join(ROOT, "public", rel);
  if (fs.existsSync(abs) && fs.statSync(abs).size >= MIN_RENDER) return rel;

  if (dryRun) return "";

  fs.mkdirSync(WEB, { recursive: true });
  const url = `${AX}/${encodeURIComponent(key)}.jpg`;
  const r = spawnSync("curl.exe", ["-sL", "-k", "--max-time", "45", "-o", dest, url], {
    stdio: "pipe",
  });
  if (r.status !== 0 || !fs.existsSync(dest) || fs.statSync(dest).size < MIN_RENDER) {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    return "";
  }
  return rel;
}

/** ax-images foto (render değil) → cafemarkt stub yerine. */
function downloadAxPhoto(kod) {
  const key = normKod(kod);
  if (!key) return "";
  const fname = `${slugFile(key)}.jpg`;
  const rel = `${CAFEMARKT_SUB}/${fname}`;
  const dest = path.join(CAFEMARKT_DIR, fname);
  if (fs.existsSync(dest) && fs.statSync(dest).size >= MIN_PHOTO && !isBadCafemarktStub(dest)) {
    return rel;
  }
  if (dryRun) return rel;

  fs.mkdirSync(CAFEMARKT_DIR, { recursive: true });
  const url = `${AX}/${encodeURIComponent(key)}.jpg`;
  const r = spawnSync("curl.exe", ["-sL", "-k", "--max-time", "45", "-o", dest, url], {
    stdio: "pipe",
  });
  if (r.status !== 0 || !fs.existsSync(dest) || fs.statSync(dest).size < MIN_PHOTO) {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    return "";
  }
  return rel;
}

function loadCmIndex() {
  if (!fs.existsSync(CM_JSON)) return [];
  const cm = JSON.parse(fs.readFileSync(CM_JSON, "utf8"));
  return cm.map((p) => ({
    p,
    hay: normHay(
      (p["ürün_adı"] || "") + (p.açıklamalar || "") + (p.açıklamalar_site || "")
    ),
  }));
}

function findCmRow(kod, cmRows) {
  const needle = normHay(kod);
  if (!needle || needle.length < 5) return null;
  const hits = cmRows.filter((c) => c.hay.includes(needle));
  if (!hits.length) return null;
  hits.sort((a, b) => a.hay.length - b.hay.length);
  return hits[0].p;
}

async function searchCafemarktWitCdn(queries) {
  const list = Array.isArray(queries) ? queries : [queries];
  for (const q of list) {
    const term = String(q || "").trim();
    if (!term || term.length < 3) continue;
    const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(term)}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const urls = [];
      const re = /data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/gi;
      let m;
      while ((m = re.exec(html))) urls.push(m[1]);
      const uniq = [...new Set(urls)];
      if (uniq.length) return uniq.slice(0, 8);
    } catch (_) {}
    await sleep(120);
  }
  return [];
}

function pickBestWitUrl(urls, row) {
  const list = [...new Set(urls || [])];
  if (!list.length) return "";
  const hay = normHay(
    [row?.name, row?.sku, row?.model].filter(Boolean).join(" ") +
      " oztiryakiler gurmeaid",
  );
  const scored = list.map((u) => {
    const uh = normHay(u);
    let score = 0;
    if (/oztiryakiler|gurmeaid/i.test(u)) score += 40;
    if (/anna-manuel|unox-|unlu-mamul-firin/i.test(u)) score -= 80;
    if (hay.includes("MAKARNA") && /makarna/i.test(uh)) score += 30;
    if (hay.includes("KIYMA") && /kiyma/i.test(uh)) score += 30;
    if (hay.includes("SALATA") && /salata|rende/i.test(uh)) score += 30;
    if (hay.includes("5MM") && /5-mm|5mm/i.test(uh)) score += 20;
    if (hay.includes("15MM") && /15-mm|1-5|15mm/i.test(uh)) score += 20;
    return { u, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].u : list.find((u) => /oztiryakiler/i.test(u)) || "";
}

async function downloadCafemarkt(url, kod) {
  const ext = (url.match(/\.(jpe?g|webp|png)(\?|$)/i) || [, "jpg"])[1].toLowerCase();
  const file = `${slugFile(kod)}.${ext.replace("jpeg", "jpg")}`;
  const rel = `${CAFEMARKT_SUB}/${file}`;
  const dest = path.join(CAFEMARKT_DIR, file);
  const abs = publicAbs(rel);

  if (fs.existsSync(abs) && fs.statSync(abs).size >= MIN_PHOTO && !isBadCafemarktStub(abs)) {
    const k = classifyAbs(abs, new Set());
    if (k !== "catalog") return rel;
  }

  if (dryRun) return rel;

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) throw new Error("too small");
  fs.mkdirSync(CAFEMARKT_DIR, { recursive: true });
  fs.writeFileSync(dest, buf);
  if (isBadCafemarktStub(dest)) {
    fs.unlinkSync(dest);
    throw new Error("cafemarkt stub");
  }
  return rel;
}

async function resolveImage(row, p287Hashes, cmRows, stats) {
  const kod = String(row.sku || row.model || row.urun_kodu || "").trim();
  const cur = String((row.images || [])[0] || "").replace(/\\/g, "/");
  const curAbs = cur ? publicAbs(cur) : "";
  const curKind = curAbs ? classifyAbs(curAbs, p287Hashes) : "missing";

  if (curKind === "render") {
    stats.skipRender++;
    return cur;
  }

  if (cur.includes("/cafemarkt/") && curAbs && fs.statSync(curAbs).size >= MIN_PHOTO) {
    if (isBadCafemarktStub(curAbs)) {
      /* UNOX stub — yeniden indir */
    } else {
      const k = classifyAbs(curAbs, p287Hashes);
      if (k === "wire" || k === "render") {
        stats.skipGoodCm++;
        return cur;
      }
    }
  }

  if (!skipAx && kod) {
    const axRel = downloadAx01(kod);
    if (axRel) {
      stats.ax++;
      return axRel;
    }
    const axPhoto = downloadAxPhoto(kod);
    if (axPhoto) {
      stats.axPhoto = (stats.axPhoto || 0) + 1;
      return axPhoto;
    }
  }

  if (!skipOnline) {
    const cm = kod ? findCmRow(kod, cmRows) : null;
    const queries = [
      kod,
      cm && cm["ürün_adı"],
      row.name,
      kod && kod.replace(/\./g, " "),
    ].filter(Boolean);

    try {
      const witUrls = await searchCafemarktWitCdn(queries);
      const best = pickBestWitUrl(witUrls, row);
      const tryUrls = best ? [best, ...witUrls.filter((u) => u !== best)] : witUrls;
      for (const witUrl of tryUrls) {
        try {
          const rel = await downloadCafemarkt(witUrl, kod || "ozti");
          if (rel && fs.existsSync(publicAbs(rel))) {
            stats.online++;
            await sleep(260);
            return rel;
          }
        } catch (e) {
          if (stats.onlineFail <= 8) console.warn("[cm-img]", kod, e.message);
        }
      }
    } catch (e) {
      stats.onlineFail++;
      if (stats.onlineFail <= 5) console.warn("[cm]", kod, e.message);
    }
    await sleep(200);
  }

  stats.miss++;
  return cur || "";
}

async function processDeptFile(jsonPath, p287Hashes, cmRows, stats) {
  const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  let changed = 0;
  let processed = 0;

  for (const row of rows) {
    if (!isOztiRow(row)) continue;
    const rel = String((row.images || [])[0] || "");
    const abs = rel ? publicAbs(rel) : "";
    const kind = abs ? classifyAbs(abs, p287Hashes) : "missing";
    if (kind === "render") continue;

    if (limit > 0 && processed >= limit) break;
    processed++;
    stats.candidates++;

    const next = await resolveImage(row, p287Hashes, cmRows, stats);
    if (!next || next === rel) continue;

    if (!dryRun) {
      row.images = [next];
      row.imageSource = next.includes("/cafemarkt/") ? "cafemarkt" : next.includes("/web/") ? "ozti-ax" : "plp";
      changed++;
      stats.updated++;
    }
  }

  if (!dryRun && changed) {
    fs.writeFileSync(jsonPath, JSON.stringify(rows), "utf8");
  }
  return { changed, processed };
}

async function main() {
  const p287Hashes = loadP287Hashes();
  const cmRows = loadCmIndex();
  const stats = {
    candidates: 0,
    skipRender: 0,
    skipGoodCm: 0,
    ax: 0,
    axPhoto: 0,
    online: 0,
    onlineFail: 0,
    miss: 0,
    updated: 0,
  };

  let files = fs
    .readdirSync(path.join(ROOT, "public/data/dept"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(ROOT, "public/data/dept", f));

  if (deptFilter) {
    files = files.filter((f) => path.basename(f, ".json") === deptFilter);
  }

  console.log(
    "[cafemarkt-plp] dry=%s online=%s ax=%s limit=%s dept=%s cm-json=%s",
    dryRun,
    !skipOnline,
    !skipAx,
    limit || "all",
    deptFilter || "all",
    cmRows.length
  );

  for (const jsonPath of files) {
    const { changed } = await processDeptFile(jsonPath, p287Hashes, cmRows, stats);
    if (changed) console.log(" ", path.basename(jsonPath), changed);
  }

  console.log("\n[cafemarkt-plp]", stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
