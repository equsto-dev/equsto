import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBrandRedirectPath } from "../lib/brand-shop-redirect.ts";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(siteDir, "lib/vitrin/bodies/index.ts");
let src = fs.readFileSync(indexPath, "utf8");

const re = /\/marka\.html\?b=([^"\\]+)/g;
const seen = new Map();
let m;
while ((m = re.exec(src))) {
  const encoded = m[1];
  const brand = decodeURIComponent(encoded.replace(/\+/g, " "));
  if (!seen.has(encoded)) {
    seen.set(encoded, resolveBrandRedirectPath(brand) || `/shop/marka/${encodeURIComponent(brand)}`);
  }
}

for (const [encoded, dest] of seen) {
  const from = `/marka.html?b=${encoded}`;
  src = src.split(from).join(dest);
}

fs.writeFileSync(indexPath, src);
console.log("[patch-home-marka-links]", seen.size, "marka linki guncellendi");
for (const [k, v] of seen) console.log(" ", decodeURIComponent(k.replace(/\+/g, " ")), "->", v);
