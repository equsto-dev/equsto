/**
 * Canlı sitede urun gorselleri var mi? (ornek HEAD istekleri)
 * npm run deploy:verify:live
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = String(process.env.EQUSTO_VERIFY_HOST || "https://equsto.com").replace(/\/$/, "");
const SAMPLE = Number(process.env.EQUSTO_VERIFY_SAMPLE || 24);

const catalogPath = path.join(root, "public/data/ekipmanlar.json");
if (!fs.existsSync(catalogPath)) {
  console.error("[verify] public/data/ekipmanlar.json yok");
  process.exit(1);
}

const items = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const list = Array.isArray(items) ? items : items.items || [];
const withImg = list.filter((x) => x?.images?.[0]);
const picks = [];
for (let i = 0; i < SAMPLE; i++) {
  const idx = Math.floor((i / SAMPLE) * withImg.length);
  picks.push(withImg[idx]);
}

function filePart(rel) {
  return String(rel)
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^data\/images\//i, "")
    .replace(/^images\//i, "");
}

function toUrl(rel) {
  rel = String(rel).replace(/\\/g, "/").replace(/^\.\//, "");
  if (!/^data\//i.test(rel)) rel = "data/" + rel.replace(/^data\//i, "");
  const enc = rel
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(seg) : ""))
    .join("/");
  return HOST + "/" + enc;
}

if (process.env.EQUSTO_VERIFY_INSECURE === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

async function head(url) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    return r.status;
  } catch (e) {
    return 0;
  }
}

console.log("[verify] Host:", HOST);
console.log("[verify] Ornek urun gorseli:", SAMPLE, "adet\n");

let ok = 0;
let fail = 0;
for (const x of picks) {
  const rel = x.images[0];
  const url = toUrl(rel);
  const st = await head(url);
  const mark = st === 200 ? "OK" : "FAIL";
  if (st === 200) ok++;
  else fail++;
  console.log(`${mark} ${st} ${rel.slice(0, 70)}`);
}

const jsonSt = await head(HOST + "/data/ekipmanlar.json");
console.log("\n[verify] ekipmanlar.json:", jsonSt === 200 ? "OK" : "FAIL " + jsonSt);
console.log(`[verify] Sonuc: ${ok}/${picks.length} gorsel 200`);

let altOk = 0;
for (const x of picks.slice(0, 6)) {
  const fn = filePart(x.images[0]);
  const enc = fn.split("/").map((s) => (s ? encodeURIComponent(s) : "")).join("/");
  const st = await head(HOST + "/images/" + enc);
  if (st === 200) altOk++;
}
if (altOk >= 3 && fail > ok) {
  console.log(
    "\n[verify] Bazi dosyalar yalnizca /images/ altinda (data/images degil).\n" +
      "  Site __eqImgFail ile /images/ yoluna duser; eq-site-urls.js guncel mi kontrol edin."
  );
}
if (fail > picks.length * 0.5 && altOk < 2) {
  console.log(
    "\n[verify] COGU GORSEL 404 — dosya adi eslesmiyor veya hic yuklenmemis.\n" +
      "  Katalog: images\\dosya.jpg → tarayici /data/images/dosya.jpg (encodeURI).\n" +
      "  Eksik dosyalar: npm run deploy:data-images veya FTP ile public_html/data/images/"
  );
  process.exit(1);
}

console.log("\n[verify] Gorseller canlida erisilebilir gorunuyor.");
