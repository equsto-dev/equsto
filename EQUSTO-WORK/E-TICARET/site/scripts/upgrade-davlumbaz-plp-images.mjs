/**

 * Davlumbaz PLP — katalog kırpıntısı (p287) ve wireframe yerine 3D render (.01 ax-images).

 *

 *   node scripts/upgrade-davlumbaz-plp-images.mjs

 *   node scripts/upgrade-davlumbaz-plp-images.mjs --dry

 */

import crypto from "node:crypto";

import fs from "node:fs";

import path from "node:path";

import { spawnSync } from "node:child_process";

import { fileURLToPath } from "node:url";



const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const WEB = path.join(ROOT, "public/images/catalog/ozti/web");

const P287 = path.join(ROOT, "public/images/catalog/ozti/p287");

const DEPT = path.join(ROOT, "public/data/dept/davlumbaz.json");

const AX = "https://oztiryakiler.com.tr/ax-images/images";



function md5File(abs) {

  return crypto.createHash("md5").update(fs.readFileSync(abs)).digest("hex");

}



function jpegSize(buf) {

  let i = 2;

  while (i < buf.length) {

    if (buf[i] !== 0xff) break;

    const marker = buf[i + 1];

    const len = buf.readUInt16BE(i + 2);

    if (marker === 0xc0 || marker === 0xc2) {

      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };

    }

    i += 2 + len;

  }

  return null;

}



/** p287 katalog ≈ 65–90 KB; wireframe ax ≈ 85–210 KB; tam render .01 ≈ 230+ KB */
function classifyAbs(abs, p287Hashes) {
  if (!fs.existsSync(abs)) return "missing";
  if (p287Hashes.has(md5File(abs))) return "catalog";
  const buf = fs.readFileSync(abs);
  const bytes = buf.length;
  if (bytes < 95000) return "catalog";
  if (bytes > 215000) return "render";
  const sz = jpegSize(buf);
  if (sz && sz.h / sz.w > 1.2) return "catalog";
  return "wire";
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



function parse7885(kod) {

  const m = normKod(kod).match(/^7885\.(\d+)\.(\d+)$/);

  if (!m) return null;

  return { mid: m[1], suffix: m[2] };

}



/** Ürün ailesi — ölçüden önceki başlık (ORTA TİP … 250*150 → aynı render) */

function lineKey(name) {

  return String(name || "")

    .replace(/\s+\d+\s*[*xX×]\s*\d+\s*$/i, "")

    .replace(/\s+/g, " ")

    .trim()

    .toUpperCase();

}



function relFromKod(kod) {

  return `images/catalog/ozti/web/${slugFile(kod)}.jpg`;

}



function downloadRender01(kod) {

  const fname = `${slugFile(kod)}.jpg`;

  const dest = path.join(WEB, fname);

  const url = `${AX}/${normKod(kod)}.jpg`;

  fs.mkdirSync(WEB, { recursive: true });

  const r = spawnSync("curl.exe", ["-sL", "-k", "--max-time", "45", "-o", dest, url], {

    stdio: "pipe",

  });

  if (r.status !== 0 || !fs.existsSync(dest) || fs.statSync(dest).size < 8000) {

    if (fs.existsSync(dest)) fs.unlinkSync(dest);

    return null;

  }

  return relFromKod(kod);

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



function pickBestRender(candidates) {

  let best = null;

  let bestScore = 0;

  for (const rel of candidates) {

    const abs = path.join(ROOT, "public", rel.replace(/^\//, ""));

    if (!fs.existsSync(abs)) continue;

    const buf = fs.readFileSync(abs);

    const sz = jpegSize(buf);

    if (!sz) continue;

    const score = buf.length;

    if (score > bestScore) {

      bestScore = score;

      best = rel;

    }

  }

  return best;

}



function main() {

  const dry = process.argv.includes("--dry");

  const p287Hashes = loadP287Hashes();

  const renderByMid = new Map();

  const renderByLine = new Map();



  for (const name of fs.readdirSync(WEB)) {

    if (!name.startsWith("ozti-7885") || !name.endsWith(".jpg")) continue;

    const abs = path.join(WEB, name);

    if (classifyAbs(abs, p287Hashes) !== "render") continue;

    const rel = `images/catalog/ozti/web/${name}`;

    const m = name.match(/^ozti-7885-(\d+)-/);

    if (m) renderByMid.set(m[1], rel);

  }



  const rows = JSON.parse(fs.readFileSync(DEPT, "utf8").replace(/\bNaN\b/g, "null"));

  for (const row of rows) {

    if (!/öztiryaki|oztiryaki/i.test(row.brand || "")) continue;

    const rel = (row.images || [])[0];

    if (!rel || classifyAbs(path.join(ROOT, "public", rel.replace(/^\//, "")), p287Hashes) !== "render")

      continue;

    const lk = lineKey(row.name);

    if (!lk) continue;

    if (!renderByLine.has(lk)) renderByLine.set(lk, []);

    renderByLine.get(lk).push(rel);

  }

  for (const [lk, list] of renderByLine) {

    const best = pickBestRender(list);

    if (best) renderByLine.set(lk, best);

    else renderByLine.delete(lk);

  }



  let changed = 0;

  let fetched = 0;

  const stats = { wire: 0, catalog: 0, render: 0, upgraded: 0, fetched: 0, noFallback: 0 };



  for (const row of rows) {

    if (!/öztiryaki|oztiryaki/i.test(row.brand || "")) continue;

    const kod = normKod(row.urun_kodu || row.sku || row.model);

    const rel = (row.images || [])[0];

    if (!rel) continue;

    const abs = path.join(ROOT, "public", rel.replace(/^\//, ""));

    const kind = classifyAbs(abs, p287Hashes);

    stats[kind] = (stats[kind] || 0) + 1;

    if (kind === "render") continue;



    const p = parse7885(kod);

    let alt = null;



    if (p) {

      const mid01 = relFromKod(`7885.${p.mid}.01`);

      const mid01Abs = path.join(ROOT, "public", mid01.replace(/^\//, ""));

      if (classifyAbs(mid01Abs, p287Hashes) === "render") alt = mid01;

      else if (!dry && p.suffix !== "01") {

        const dl = downloadRender01(`7885.${p.mid}.01`);

        if (dl && classifyAbs(path.join(ROOT, "public", dl), p287Hashes) === "render") {

          alt = dl;

          fetched++;

          renderByMid.set(p.mid, dl);

        }

      }

      if (!alt) alt = renderByMid.get(p.mid) || null;

    }



    if (!alt) {

      const lk = lineKey(row.name);

      if (lk && renderByLine.has(lk)) alt = renderByLine.get(lk);

    }



    if (alt && alt !== rel) {

      if (!dry) row.images = [alt];

      changed++;

      stats.upgraded++;

    } else {

      stats.noFallback++;

    }

  }



  if (!dry && changed) {

    fs.writeFileSync(DEPT, JSON.stringify(rows), "utf8");

  }



  stats.fetched = fetched;

  console.log("[davlumbaz-plp-img] stats:", stats);

  console.log("[davlumbaz-plp-img] guncellenen:", changed, dry ? "(dry)" : "");

}



main();


