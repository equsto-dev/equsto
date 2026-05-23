/**
 * Ana sayfa hero görselleri (eksikse equsto.com'dan indir).
 *   node scripts/fetch-home-heroes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const BASE = "https://equsto.com";

const FILES = [
  "images/home/hero-yer-sofrasi-bufe.png",
  "images/home/hero-bar-cocktailstation.png",
  "images/home/hero-pfos-cover.jpg",
  "images/equsto-logo.png",
];

async function download(rel) {
  const url = `${BASE}/${rel.replace(/^\//, "")}`;
  const dest = path.join(PUBLIC, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: { Accept: "*/*" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  let ok = 0;
  for (const rel of FILES) {
    const dest = path.join(PUBLIC, rel);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      console.log("  skip", rel);
      continue;
    }
    try {
      const n = await download(rel);
      console.log("  OK", rel, (n / 1024).toFixed(1), "KB");
      ok++;
    } catch (e) {
      console.warn("  FAIL", rel, e.message);
    }
  }
  console.log("[fetch-home-heroes] indirilen:", ok);
}

main();
