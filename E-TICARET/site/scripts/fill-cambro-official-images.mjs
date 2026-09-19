#!/usr/bin/env node
/**
 * Cambro resmi görseller — www.cambro.com/tr (Widen CDN).
 *
 *   node scripts/fill-cambro-official-images.mjs
 *   node scripts/fill-cambro-official-images.mjs --dry-run --limit 20
 *   node scripts/fill-cambro-official-images.mjs --istif-only
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const DEST_SUB = "images/catalog/cambro";
const DEST = path.join(ROOT, "public", DEST_SUB);
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_BYTES = 3000;

const dryRun = process.argv.includes("--dry-run");
const istifOnly = process.argv.includes("--istif-only");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg >= 0 ? Number(process.argv[limitArg + 1]) || 0 : 0;

const ISTIF_HERO =
  "https://cambro.widen.net/content/ycgakmahym/webp/MPU4617S4PKG_A1L0_1018_S01.webp?w=1200&h=1200&crop=false&q=85&color=ffffff";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isIstifCambroRow(row) {
  const kod = String(row.sku || row.urun_kodu || row.model || "")
    .replace(/\s+/g, "")
    .toUpperCase();
  if (/^8897\.(36|46|56).*\.P0$/i.test(kod)) return true;
  if (String(row.category || "") === "polipropilen-tablali-istif-raflari") return true;
  return false;
}

function isRealCambroRow(row) {
  return String(row.id || "").startsWith("cambro__") || /^cambro$/i.test(String(row.brand || "").trim());
}

function shortName(sku, url) {
  const base = String(sku || "cambro")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const h = crypto.createHash("sha1").update(String(url)).digest("hex").slice(0, 10);
  const ext = /\.jpe?g/i.test(url) ? ".jpg" : /\.png/i.test(url) ? ".png" : ".webp";
  return `${base}-${h}${ext}`;
}

async function download(url, abs) {
  if (fs.existsSync(abs) && fs.statSync(abs).size >= MIN_BYTES) return true;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*", Referer: "https://www.cambro.com/" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) return false;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, buf);
  return true;
}

function pickHeroFromHtml(html, sku) {
  const skuU = String(sku || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const imgs = [...html.matchAll(/src="(https:\/\/cambro\.widen\.net\/content\/[^"]+)"(?:[^>]*alt="([^"]*)")?/g)].map(
    (m) => ({
      src: m[1].replace(/&amp;/g, "&"),
      alt: (m[2] || "").replace(/&#x([0-9A-F]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))),
    }),
  );
  const scored = imgs
    .map((img) => {
      let score = 0;
      const u = img.src.toLowerCase();
      const a = img.alt.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (/w=48&h=48|\/48x48/i.test(img.src)) score -= 50;
      if (/logo|icon|nav/i.test(u + img.alt)) score -= 40;
      if (skuU && (u.toUpperCase().replace(/[^A-Z0-9]/g, "").includes(skuU) || a.includes(skuU))) score += 80;
      if (/w=1200|w=765|w=640|w=800/i.test(img.src)) score += 20;
      if (/_s0\d|_a\d/i.test(u)) score += 10;
      return { ...img, score };
    })
    .sort((x, y) => y.score - x.score);
  const best = scored[0];
  if (!best || best.score < 10) {
    const og = html.match(/property="og:image"\s+content="([^"]+)"/i);
    if (og && /cambro\.widen\.net/i.test(og[1])) {
      return og[1].replace(/&amp;/g, "&").replace(/w=\d+&h=\d+/i, "w=1200&h=1200");
    }
    return "";
  }
  return best.src.replace(/w=\d+&h=\d+/gi, "w=1200&h=1200");
}

async function resolveOfficialUrl(row) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await resolveOfficialUrlOnce(row);
    } catch (e) {
      console.warn(`[cambro-img] retry ${attempt + 1} ${row.id || row.sku}: ${e.message || e}`);
      await sleep(800 * (attempt + 1));
    }
  }
  return "";
}

async function resolveOfficialUrlOnce(row) {
  if (isIstifCambroRow(row)) return ISTIF_HERO;
  const sku = String(row.sku || row.marka_urun_kodu || row.model || "")
    .trim()
    .replace(/\s+/g, "");
  if (!sku) return "";
  const q = encodeURIComponent(sku);
  const url = `https://www.cambro.com/tr/search?q=${q}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) return "";
  const html = await res.text();
  return pickHeroFromHtml(html, sku);
}

async function main() {
  fs.mkdirSync(DEST, { recursive: true });
  let scanned = 0;
  let filled = 0;
  let failed = 0;
  let skipped = 0;

  for (const file of fs.readdirSync(DEPT).filter((f) => f.endsWith(".json") && !f.includes("_items"))) {
    const fp = path.join(DEPT, file);
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (!Array.isArray(rows)) continue;
    let changed = false;

    for (const row of rows) {
      const istif = isIstifCambroRow(row);
      const real = isRealCambroRow(row);
      if (!istif && !real) continue;
      if (istifOnly && !istif) continue;
      if (row.cambro_official_image && String(row.image || "").includes("catalog/cambro/")) {
        skipped++;
        continue;
      }
      scanned++;
      if (LIMIT && filled + failed + skipped >= LIMIT) break;

      const remote = await resolveOfficialUrl(row);
      if (!remote) {
        skipped++;
        console.warn(`[cambro-img] skip ${row.id || row.sku} — no official url`);
        await sleep(200);
        continue;
      }

      const sku = String(row.sku || row.marka_urun_kodu || row.id || "cambro").replace(/[^A-Za-z0-9._-]+/g, "-");
      const fn = shortName(sku, remote);
      const rel = `${DEST_SUB}/${fn}`.replace(/\\/g, "/");
      const abs = path.join(ROOT, "public", rel);

      if (!dryRun) {
        const ok = await download(remote, abs);
        if (!ok) {
          failed++;
          console.warn(`[cambro-img] FAIL ${row.id || row.sku} ${remote.slice(-70)}`);
          await sleep(300);
          continue;
        }
        await sleep(150);
      }

      row.image = rel;
      row.images = [rel];
      row.cambro_official_image = true;
      filled++;
      changed = true;
      if (filled % 25 === 0) console.log(`[cambro-img] filled=${filled} fail=${failed} skip=${skipped}`);
    }

    if (changed && !dryRun) fs.writeFileSync(fp, JSON.stringify(rows), "utf8");
    if (LIMIT && filled + failed + skipped >= LIMIT) break;
  }

  console.log(
    `[cambro-img] scanned=${scanned} filled=${filled} failed=${failed} skipped=${skipped} ${dryRun ? "DRY" : "APPLY"}`,
  );

  if (!dryRun && filled > 0) {
    const r = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (r.status) process.exit(r.status);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
