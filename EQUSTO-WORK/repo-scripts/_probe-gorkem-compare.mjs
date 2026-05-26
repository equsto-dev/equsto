import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const IMG = path.join(ROOT, "public", "data", "images");
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/.kariyer_product_index.json"), "utf8"));

function normKey(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "");
}

function get(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
        const c = [];
        res.on("data", (x) => c.push(x));
        res.on("end", () => resolve({ s: res.statusCode, buf: Buffer.concat(c) }));
      })
      .on("error", () => resolve({ s: 0, buf: Buffer.alloc(0) }));
  });
}

const p = {
  name: "Görkem 1/1 3+1 Setüstü Benmari 515",
  images: ["images\\görkem-1-1-3-1-setüstü-benmari-515_1.jpg"],
};
const fn = p.images[0].replace(/^images[\\/]/i, "").replace(/\\/g, "/");
const local = path.join(IMG, fn);
console.log("local", fs.existsSync(local) ? fs.statSync(local).size : "missing", fn);

const sub = idx[normKey(p.name)];
const page = `https://www.kariyermutfak.com${sub}`;
const html = (await get(page)).buf.toString("utf8");
const m = html.match(/https:\/\/static\.ticimax\.cloud\/3562\/Uploads\/UrunResimleri\/buyuk\/[^"'\s<>]+/i);
if (m) {
  const r = await get(m[0]);
  console.log("buyuk", r.buf.length, m[0].slice(-60));
}
