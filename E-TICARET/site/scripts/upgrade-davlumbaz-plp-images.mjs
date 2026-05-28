/**
 * Davlumbaz PLP — ax-images wireframe yerine aynı ölçü grubunun .01 render görseli.
 * Katalog sayfası (p287) zaten sync ile web'e alındı; wireframe olanlar iyileştirilir.
 *
 *   node scripts/upgrade-davlumbaz-plp-images.mjs
 *   node scripts/upgrade-davlumbaz-plp-images.mjs --dry
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "public/images/catalog/ozti/web");
const DEPT = path.join(ROOT, "public/data/dept/davlumbaz.json");

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

function classifyAbs(abs) {
  if (!fs.existsSync(abs)) return "missing";
  const buf = fs.readFileSync(abs);
  const sz = jpegSize(buf);
  if (!sz) return "unknown";
  const ratio = sz.h / sz.w;
  if (ratio > 1.2) return "catalog";
  if (buf.length > 130000 && ratio < 1.15) return "render";
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

function main() {
  const dry = process.argv.includes("--dry");
  const renderByMid = new Map();

  for (const name of fs.readdirSync(WEB)) {
    if (!name.startsWith("ozti-7885") || !name.endsWith(".jpg")) continue;
    const m = name.match(/^ozti-7885-(\d+)-(\d+)\.jpg$/);
    if (!m) continue;
    const abs = path.join(WEB, name);
    if (classifyAbs(abs) !== "render") continue;
    const rel = `images/catalog/ozti/web/${name}`;
    const mid = m[1];
    if (!renderByMid.has(mid)) renderByMid.set(mid, rel);
  }

  const rows = JSON.parse(fs.readFileSync(DEPT, "utf8").replace(/\bNaN\b/g, "null"));
  let changed = 0;
  const stats = { wire: 0, catalog: 0, render: 0, upgraded: 0, noFallback: 0 };

  for (const row of rows) {
    if (!/öztiryaki|oztiryaki/i.test(row.brand || "")) continue;
    const kod = normKod(row.urun_kodu || row.sku || row.model);
    const rel = (row.images || [])[0];
    if (!rel) continue;
    const abs = path.join(ROOT, "public", rel.replace(/^\//, ""));
    const kind = classifyAbs(abs);
    stats[kind] = (stats[kind] || 0) + 1;

    if (kind === "render") continue;
    if (kind === "catalog") {
      const p = parse7885(kod);
      if (p) {
        const alt = renderByMid.get(p.mid);
        if (alt && alt !== rel) {
          if (!dry) row.images = [alt];
          changed++;
          stats.upgraded++;
          continue;
        }
      }
      stats.noFallback++;
      continue;
    }

    if (kind === "wire") {
      const p = parse7885(kod);
      if (p) {
        let alt = renderByMid.get(p.mid);
        if (!alt && p.suffix !== "01") {
          const altKod = `7885.${p.mid}.01`;
          const altName = slugFile(altKod) + ".jpg";
          const altAbs = path.join(WEB, altName);
          if (classifyAbs(altAbs) === "render") {
            alt = `images/catalog/ozti/web/${altName}`;
          }
        }
        if (alt && alt !== rel) {
          if (!dry) row.images = [alt];
          changed++;
          stats.upgraded++;
          continue;
        }
      }
      stats.noFallback++;
    }
  }

  if (!dry && changed) {
    fs.writeFileSync(DEPT, JSON.stringify(rows), "utf8");
  }

  console.log("[davlumbaz-plp-img] stats:", stats);
  console.log("[davlumbaz-plp-img] guncellenen:", changed, dry ? "(dry)" : "");
}

main();
