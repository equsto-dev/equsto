import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(root, "public/data/ekipmanlar.json");
const imgRoot = path.join(root, "public/data");

const raw = fs.readFileSync(jsonPath, "utf8");
const data = JSON.parse(raw);
const items = Array.isArray(data) ? data : data.items || [];

let withImg = 0;
let missing = 0;
let missingSamples = [];
const prefixCounts = {};

for (const x of items) {
  const img = x?.images?.[0] || x?.localImage || "";
  if (!img) continue;
  withImg++;
  const norm = String(img).replace(/\\/g, "/").replace(/^\.\//, "");
  const key = norm.split("/").slice(0, 3).join("/");
  prefixCounts[key] = (prefixCounts[key] || 0) + 1;
  const rel = norm.replace(/^data\//, "");
  const disk = path.join(imgRoot, rel);
  if (!fs.existsSync(disk)) {
    missing++;
    if (missingSamples.length < 15) missingSamples.push({ name: (x.name || "").slice(0, 50), img: norm, disk });
  }
}

const sog = items.filter((x) => String(x?.category || "").includes("sogutma"));
const sogWith = sog.filter((x) => x?.images?.[0] || x?.localImage);
let sogMissing = 0;
for (const x of sogWith) {
  const img = x.images?.[0] || x.localImage;
  const rel = String(img).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^data\//, "");
  if (!fs.existsSync(path.join(imgRoot, rel))) sogMissing++;
}

console.log(JSON.stringify({
  total: items.length,
  withImgField: withImg,
  missingOnDisk: missing,
  pctMissing: ((missing / withImg) * 100).toFixed(1) + "%",
  sogutma: sog.length,
  sogWithImg: sogWith.length,
  sogMissingOnDisk: sogMissing,
  topPrefixes: Object.entries(prefixCounts).sort((a, b) => b[1] - a[1]).slice(0, 8),
  missingSamples,
  distHasImages: fs.existsSync(path.join(root, "dist/data/images")),
  publicHasImages: fs.existsSync(path.join(path.join(root, "public/data/images"))),
}, null, 2));
