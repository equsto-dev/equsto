/**
 * Popüler Kategoriler — Bar Design kartı: gri zemin → beyaz (yalnız popcat dosyası).
 *   node scripts/derive-hero-bar-popcat-white.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(siteDir, "public/images/home/hero-bar-cocktailstation.png");
const dest = path.join(siteDir, "public/images/home/hero-bar-cocktailstation-popcat-white.png");

const py = `
from PIL import Image
import math

src = r"${src.replace(/\\/g, "\\\\")}"
dest = r"${dest.replace(/\\/g, "\\\\")}"

bg = (53, 58, 56)
thresh = 42

im = Image.open(src).convert("RGB")
px = im.load()
w, h = im.size

def near_bg(rgb):
    dr = rgb[0] - bg[0]
    dg = rgb[1] - bg[1]
    db = rgb[2] - bg[2]
    return math.sqrt(dr * dr + dg * dg + db * db) <= thresh

for y in range(h):
    for x in range(w):
        c = px[x, y]
        if near_bg(c):
            px[x, y] = (255, 255, 255)

im.save(dest, optimize=True)
print("OK", dest, w, "x", h)
`;

if (!fs.existsSync(src)) {
  console.error("[derive-hero-bar-popcat-white] kaynak yok:", src);
  process.exit(1);
}

const r = spawnSync("python", ["-c", py], { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status || 1);
}
process.stdout.write(r.stdout || "");
