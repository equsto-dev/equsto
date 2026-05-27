/**
 * Vercel deploy boyutu — caglayan-market yerine kaynak CDN URL.
 *   node scripts/patch-caglayan-remote-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept/market-reyon.json");
const SRC_CANDIDATES = [
  path.resolve(ROOT, "../../PFOS/veri/proje-veri/caglayan-refrigeration/urun-sayfalari"),
  path.resolve(ROOT, "../../../PFOS/veri/proje-veri/caglayan-refrigeration/urun-sayfalari"),
  path.resolve(ROOT, "../../../../PFOS/veri/proje-veri/caglayan-refrigeration/urun-sayfalari"),
];
const SRC = SRC_CANDIDATES.find((p) => fs.existsSync(p));

function normUrl(u) {
  return String(u || "").replace(/\\\//g, "/").trim();
}

function remoteImages(slug) {
  const p = path.join(SRC, `${slug}.json`);
  if (!fs.existsSync(p)) return null;
  const u = JSON.parse(fs.readFileSync(p, "utf8"));
  const out = [];
  const seen = new Set();
  const add = (url) => {
    const x = normUrl(url);
    if (x.startsWith("http") && !seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  };
  add(u.kapak);
  const g = u.gorseller || {};
  for (const key of ["tum", "urun", "teknikCizim"]) {
    const list = g[key];
    if (!list) continue;
    for (const item of list) {
      if (typeof item === "string") add(item);
      else add(item.url);
    }
  }
  return out.length ? out : null;
}

if (!SRC) {
  console.error("Kaynak yok. Denenen:", SRC_CANDIDATES.join(" | "));
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(DEPT, "utf8"));
let n = 0;
for (const row of rows) {
  if (row.kaynak !== "caglayan-refrigeration" || !row.slug) continue;
  const imgs = remoteImages(row.slug);
  if (!imgs?.length) continue;
  row.images = imgs;
  row.imagesRemote = true;
  n++;
}
fs.writeFileSync(DEPT, JSON.stringify(rows), "utf8");
console.log("[patch-caglayan-remote-images]", n, "/", rows.length, "→ uzak URL");
