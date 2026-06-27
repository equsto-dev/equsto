#!/usr/bin/env node
/** NTV cihazaltı C1/C2 — ax-images 404 olan kodlara doğru aile fotoğrafı (çekmeceli/kapılı, .24 havuzlu değil). */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "public/images/catalog/ozti/web");
const AX = "https://oztiryakiler.com.tr/ax-images/images";

/** hedef SKU → CDN kaynak kodu */
const FIX = {
  "7919.26NTV.C1": "7919.26NTV.24",
  "7919.26NTV.C2": "7919.26NTV.24",
  "7919.27NTV.C1": "7919.27NTV.24",
  "7919.27NTV.C2": "7919.27NTV.24",
  "7919.36NTV.C1": "7919.36NTV.24",
  "7919.36NTV.C2": "7919.36NTV.24",
  "7919.46NTV.C1": "7919.37NTV.C1",
  "7919.46NTV.C2": "7919.37NTV.C2",
  "7919.47NTV.C1": "7919.37NTV.C1",
  "7919.47NTV.C2": "7919.37NTV.C2",
  "7919.37NTV.T1": "7919.27NTV.T1",
  "7919.47NTV.T1": "7919.27NTV.T1",
};

function slug(k) {
  return "ozti-" + k.toLowerCase().replace(/\./g, "-");
}

function download(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", () => resolve(null));
  });
}

fs.mkdirSync(WEB, { recursive: true });
const cache = new Map();

/** Doğrudan ax-images olan 37NTV C1/C2 */
for (const direct of ["7919.37NTV.C1", "7919.37NTV.C2"]) {
  const dest = path.join(WEB, `${slug(direct)}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 8000) {
    cache.set(direct, fs.readFileSync(dest));
    console.log("cache", direct);
    continue;
  }
  const buf = await download(`${AX}/${encodeURIComponent(direct)}.jpg`);
  if (!buf || buf.length < 8000) {
    console.error("FAIL direct", direct);
    continue;
  }
  fs.writeFileSync(dest, buf);
  cache.set(direct, buf);
  console.log("download", direct, buf.length);
}

for (const src of new Set(Object.values(FIX))) {
  if (cache.has(src)) continue;
  const dest = path.join(WEB, `${slug(src)}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 8000) {
    cache.set(src, fs.readFileSync(dest));
    console.log("cache", src);
    continue;
  }
  const buf = await download(`${AX}/${encodeURIComponent(src)}.jpg`);
  if (!buf || buf.length < 8000) {
    console.error("FAIL", src);
    continue;
  }
  fs.writeFileSync(dest, buf);
  cache.set(src, buf);
  console.log("download", src, buf.length);
}

for (const [sku, src] of Object.entries(FIX)) {
  const buf = cache.get(src);
  if (!buf) continue;
  fs.writeFileSync(path.join(WEB, `${slug(sku)}.jpg`), buf);
  console.log("fixed", sku);
}
