/**
 * caglayanrefrigeration.com görsel URL → caglayan-market/{slug}/… (S3/CloudFront)
 *
 *   node scripts/patch-caglayan-local-images.mjs --dry-run
 *   node scripts/patch-caglayan-local-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept/market-reyon.json");
const DATA_IMG = path.join(ROOT, "public/data/caglayan-market");
const dryRun = process.argv.includes("--dry-run");

function modelSlugFromRow(row) {
  return String(row.caglayanModelSlug || row.slug || "").trim();
}

function remoteToLocal(url, modelSlug) {
  const u = String(url || "").trim();
  if (!/^https?:\/\//i.test(u)) return u;
  if (!/caglayanrefrigeration\.com/i.test(u)) return u;
  const slug = modelSlugFromRow({ caglayanModelSlug: modelSlug, slug: modelSlug });
  const fn = path.basename(u.split("?")[0]);
  if (!slug || !fn) return null;
  const rel = `caglayan-market/${slug}/${fn}`;
  const abs = path.join(DATA_IMG, slug, fn);
  if (!fs.existsSync(abs)) return null;
  return rel;
}

const rows = JSON.parse(fs.readFileSync(DEPT, "utf8"));
let rowsPatched = 0;
let urlsPatched = 0;
let urlsMissing = 0;
const missingSamples = [];

for (const row of rows) {
  const imgs = row.images;
  if (!Array.isArray(imgs) || !imgs.length) continue;
  const slug = modelSlugFromRow(row);
  let changed = false;
  const next = imgs.map((raw) => {
    const u = String(raw || "").trim();
    if (!/^https?:\/\//i.test(u) || !/caglayanrefrigeration\.com/i.test(u)) return raw;
    const rel = remoteToLocal(u, slug);
    if (!rel) {
      urlsMissing++;
      if (missingSamples.length < 8) missingSamples.push({ slug, u });
      return raw;
    }
    urlsPatched++;
    changed = true;
    return rel;
  });
  if (!changed) continue;
  row.images = next;
  delete row.imagesRemote;
  rowsPatched++;
}

if (urlsMissing) {
  console.warn("[patch-caglayan-local-images] yerel dosya yok:", urlsMissing);
  for (const s of missingSamples) console.warn(" ", s.slug, "←", s.u);
}

if (!dryRun) {
  fs.writeFileSync(DEPT, JSON.stringify(rows), "utf8");
}

console.log(
  "[patch-caglayan-local-images]",
  dryRun ? "(dry-run)" : "yazıldı →",
  DEPT
);
console.log("  satır:", rowsPatched, "| url:", urlsPatched, "| eksik:", urlsMissing);
