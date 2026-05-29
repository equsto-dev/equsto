/**
 * Vercel deploy boyutu — caglayan-market yerine kaynak CDN URL.
 * Galeri: 6 ürün + kesit + detay/ölçü (max 11).
 *   node scripts/patch-caglayan-remote-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCaglayanGalleryRemote } from "./lib/caglayan-gallery.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept/market-reyon.json");
const SRC_CANDIDATES = [
  path.resolve(ROOT, "../../PFOS/veri/proje-veri/caglayan-refrigeration/urun-sayfalari"),
  path.resolve(ROOT, "../../../PFOS/veri/proje-veri/caglayan-refrigeration/urun-sayfalari"),
  path.resolve(ROOT, "../../../../PFOS/veri/proje-veri/caglayan-refrigeration/urun-sayfalari"),
];
const SRC = SRC_CANDIDATES.find((p) => fs.existsSync(p));

if (!SRC) {
  console.error("Kaynak yok. Denenen:", SRC_CANDIDATES.join(" | "));
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(DEPT, "utf8"));
let n = 0;
for (const row of rows) {
  if (row.kaynak !== "caglayan-refrigeration" || !row.slug) continue;
  const modelSlug = row.caglayanModelSlug || row.slug;
  const p = path.join(SRC, `${modelSlug}.json`);
  if (!fs.existsSync(p)) continue;
  const urun = JSON.parse(fs.readFileSync(p, "utf8"));
  const imgs = buildCaglayanGalleryRemote(urun);
  if (!imgs.length) continue;
  row.images = imgs;
  row.imagesRemote = true;
  row.galleryCount = imgs.length;
  n++;
}
fs.writeFileSync(DEPT, JSON.stringify(rows), "utf8");
console.log("[patch-caglayan-remote-images]", n, "/", rows.length, "→ uzak URL, max 11 galeri");
