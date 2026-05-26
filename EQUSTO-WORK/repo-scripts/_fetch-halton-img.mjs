import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/data/images/halton-kch-i-davlumbaz_1.jpg");
const PAGE =
  "https://www.halton.com/products/kch-i-capture-jet-condensate-exhaust-hood/";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(get(new URL(res.headers.location, url).href));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

const html = (await get(PAGE)).toString("utf8");
const og = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
const img =
  og?.[1] ||
  [...html.matchAll(/https:\/\/www\.halton\.com\/wp-content\/uploads\/[^"'\s]+\.(?:jpe?g|png|webp)/gi)]
    .map((m) => m[0])
    .find((u) => /product|hood|kch|kitchen/i.test(u)) ||
  [...html.matchAll(/https:\/\/www\.halton\.com\/wp-content\/uploads\/[^"'\s]+\.(?:jpe?g|png|webp)/gi)][0]?.[0];

if (!img) {
  console.error("No image URL found");
  process.exit(1);
}
console.log("img", img);
const buf = await get(img);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buf);
console.log("saved", OUT, buf.length);
