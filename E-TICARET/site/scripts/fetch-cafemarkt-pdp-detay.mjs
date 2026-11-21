/**
 * Cafemarkt ürün sayfalarından açıklama gövdesi + özellik tablosu (önbellek, kaldığı yerden devam).
 *
 *   node scripts/fetch-cafemarkt-pdp-detay.mjs [--limit=50] [--conc=3]
 * Çıktı: scripts/data/cafemarkt-pdp/detay.jsonl (url başına bir satır)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEPT = path.join(ROOT, "public/data/dept");
const OUT_DIR = path.join(ROOT, "scripts/data/cafemarkt-pdp");
const OUT = path.join(OUT_DIR, "detay.jsonl");
const arg = (k, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? Number(a.split("=")[1]) : d;
};
const LIMIT = arg("limit", Infinity);
const CONC = arg("conc", 3);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

fs.mkdirSync(OUT_DIR, { recursive: true });
const done = new Set();
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const j = JSON.parse(line);
      if (j.ok) done.add(j.url);
    } catch {}
  }
}

const urls = [];
const seen = new Set();
for (const f of fs.readdirSync(DEPT)) {
  if (!f.endsWith(".json") || f.includes("brema")) continue;
  for (const row of JSON.parse(fs.readFileSync(path.join(DEPT, f), "utf8"))) {
    const u = row && row.kaynak_fiyat_listesi === "cafemarkt-plp" ? row.cafemarkt_url : null;
    if (!u || seen.has(u) || done.has(u)) continue;
    seen.add(u);
    urls.push(u);
  }
}
const queue = urls.slice(0, LIMIT);
console.log("onbellekte", done.size, "kalan", urls.length, "bu tur", queue.length);

function sliceBlock(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return "";
  const rest = html.slice(i);
  const end = rest.search(/<div class="d-flex justify-content-center">|<div id="product-comments"/);
  return end > 0 ? rest.slice(0, end) : rest.slice(0, 20000);
}

function features(html) {
  const block = sliceBlock(html, 'id="product-features"');
  const out = [];
  const re = /<div class="col-6 py-1 border-right">([\s\S]*?)<\/div>\s*<div class="col-6 py-1">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(block))) {
    const k = m[1].replace(/<[^>]+>/g, "").trim();
    const v = m[2].replace(/<[^>]+>/g, "").trim();
    if (k && v) out.push([k, v]);
  }
  return out;
}

async function fetchOne(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "tr-TR" } });
      if (res.status === 404) return { url, ok: true, status: 404, body: "", features: [] };
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      const body = sliceBlock(html, '<div class="product-fullbody">');
      const sku = (html.match(/id="product-supplier-code" value="([^"]*)"/) || [])[1] || "";
      return { url, ok: true, status: 200, sku, body, features: features(html) };
    } catch (e) {
      if (attempt === 3) return { url, ok: false, error: String(e.message || e) };
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

let idx = 0;
let n = 0;
let fail = 0;
const stream = fs.createWriteStream(OUT, { flags: "a" });
async function worker() {
  while (idx < queue.length) {
    const url = queue[idx++];
    const rec = await fetchOne(url);
    stream.write(JSON.stringify(rec) + "\n");
    n++;
    if (!rec.ok) fail++;
    if (n % 100 === 0) console.log("ilerleme", n, "/", queue.length, "hata", fail);
    await new Promise((r) => setTimeout(r, 250));
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
stream.end();
console.log("bitti", n, "hata", fail);
