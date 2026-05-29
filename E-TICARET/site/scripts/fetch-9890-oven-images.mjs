#!/usr/bin/env node
/**
 * 9890.* RATIONAL / UNOX fırın görselleri — eksik web dosyalarını ax-images + Cafemarkt ile tamamlar.
 *
 *   node scripts/fetch-9890-oven-images.mjs --dry-run
 *   node scripts/fetch-9890-oven-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_FILE = path.join(ROOT, "public/data/dept/pisirme.json");
const WEB_DIR = path.join(ROOT, "public/images/catalog/ozti/web");
const CAFE_DIR = path.join(ROOT, "public/images/catalog/ozti/cafemarkt");
const WEB_SUB = "images/catalog/ozti/web";
const CAFE_SUB = "images/catalog/ozti/cafemarkt";
const MANIFEST = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_BYTES = 8000;
const dryRun = process.argv.includes("--dry-run");

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

function publicAbs(rel) {
  return path.join(ROOT, "public", String(rel || "").replace(/^\//, ""));
}

function hasFile(rel) {
  const abs = publicAbs(rel);
  return fs.existsSync(abs) && fs.statSync(abs).size >= MIN_BYTES;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function downloadAx(kod, dest) {
  if (dryRun) return fs.existsSync(dest) && fs.statSync(dest).size >= MIN_BYTES;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const url = `${AX}/${encodeURIComponent(normKod(kod))}.jpg`;
  const r = spawnSync("curl.exe", ["-sL", "-k", "--max-time", "45", "-o", dest, url], {
    stdio: "pipe",
  });
  if (r.status !== 0 || !fs.existsSync(dest) || fs.statSync(dest).size < MIN_BYTES) {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    return false;
  }
  return true;
}

async function searchCafemarkt(queries) {
  for (const q of queries) {
    const term = String(q || "").trim();
    if (!term || term.length < 3) continue;
    try {
      const res = await fetch(`https://www.cafemarkt.com/arama?q=${encodeURIComponent(term)}`, {
        headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const urls = [...html.matchAll(/data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/gi)].map(
        (m) => m[1]
      );
      const uniq = [...new Set(urls)];
      if (uniq.length) return uniq;
    } catch (_) {}
    await sleep(150);
  }
  return [];
}

function pickUnoxUrl(urls, row) {
  const name = String(row.name || "").toLocaleUpperCase("tr");
  const sku = normHay(row.sku || "");
  const scored = (urls || []).map((u) => {
    const uh = normHay(u);
    let score = 0;
    if (/unox/i.test(u)) score += 20;
    if (/roberta/i.test(name) && /roberta/i.test(uh)) score += 50;
    if (/chef.?top|cheftop/i.test(name) && /chef-top|cheftop/i.test(uh)) score += 50;
    if (/xecc|523/i.test(name) && /xecc|523/i.test(uh)) score += 40;
    if (/xbc|tas-taban|tastaban/i.test(name) && /xbc|tas-taban|tastaban/i.test(uh)) score += 40;
    if (/xf003|342x242|342-242/i.test(name) && /roberta|342/i.test(uh)) score += 35;
    if (sku && uh.includes(sku.replace(/\./g, ""))) score += 30;
    if (/bulasik|buzdolab|davlumbaz|kiyma|makarna|anna-manuel/i.test(uh)) score -= 80;
    return { u, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 15 ? scored[0].u : urls.find((u) => /unox/i.test(u)) || "";
}

function normHay(s) {
  return String(s || "")
    .toLocaleUpperCase("tr")
    .replace(/[^A-Z0-9]/g, "");
}

async function downloadCafe(url, dest) {
  if (dryRun) return true;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error("too small");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return true;
}

async function resolveRow(row, stats) {
  const kod = normKod(row.sku || row.model || row.urun_kodu);
  if (!kod.startsWith("9890.")) return row.images?.[0] || "";

  const webRel = `${WEB_SUB}/${slugFile(kod)}.jpg`;
  const webAbs = path.join(WEB_DIR, `${slugFile(kod)}.jpg`);
  const cur = String((row.images || [])[0] || "").replace(/\\/g, "/");

  if (hasFile(webRel) || hasFile(cur)) {
    stats.skip++;
    return hasFile(webRel) ? webRel : cur;
  }

  if (downloadAx(kod, webAbs)) {
    stats.ax++;
    console.log("  ax", kod);
    return webRel;
  }

  const queries = [
    row.name,
    kod,
    kod.replace(/\./g, " "),
    /roberta/i.test(row.name || "") ? "UNOX ROBERTA 3 tepsi" : "",
    /chef top/i.test(row.name || "") ? "UNOX CHEF TOP GN" : "",
    /xecc/i.test(row.name || "") ? "UNOX XECC 523" : "",
    /xbc01/i.test(kod) ? "UNOX XBC01 tas tabanli firin" : "",
  ].filter(Boolean);

  const urls = await searchCafemarkt(queries);
  const best = pickUnoxUrl(urls, row);
  if (best) {
    const cafeRel = `${CAFE_SUB}/${slugFile(kod)}.jpg`;
    const cafeAbs = path.join(CAFE_DIR, `${slugFile(kod)}.jpg`);
    try {
      await downloadCafe(best, cafeAbs);
      stats.cafe++;
      console.log("  cafe", kod, best.slice(0, 80));
      return cafeRel;
    } catch (e) {
      console.warn("  cafe fail", kod, e.message);
    }
  }

  stats.miss++;
  console.warn("  MISS", kod, (row.name || "").slice(0, 50));
  return cur;
}

async function main() {
  const rows = JSON.parse(fs.readFileSync(DEPT_FILE, "utf8"));
  const targets = rows.filter((r) => /^9890\./i.test(r.sku || ""));
  const stats = { skip: 0, ax: 0, cafe: 0, miss: 0, updated: 0 };

  console.log("[9890-images] dry=%s targets=%s", dryRun, targets.length);

  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};

  for (const row of targets) {
    const kod = normKod(row.sku);
    const next = await resolveRow(row, stats);
    if (!next || next === (row.images || [])[0]) continue;
    if (!dryRun) {
      row.images = [next];
      row.imageSource = next.includes("/cafemarkt/") ? "cafemarkt" : "ozti-ax";
      manifest[kod] = next;
      stats.updated++;
    }
    await sleep(120);
  }

  if (!dryRun && stats.updated) {
    fs.writeFileSync(DEPT_FILE, JSON.stringify(rows), "utf8");
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
    console.log("[9890-images] pisirme.json updated:", stats.updated);
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    spawnSync(process.execPath, ["scripts/sync-ozti-web-manifest.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  console.log("\n[9890-images]", stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
