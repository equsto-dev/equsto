import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "products-tr.json"), "utf8"));
const saved = new Set(manifest.products.map((p) => p.slug));
const NAV = new Set([
  "kataloglarimiz", "kilavuzlar", "servisler", "insan-kaynaklari", "haberler",
  "videolar", "iletisim", "kurumsal", "referanslar", "projeler", "yardim",
]);

const xml = await (await fetch("https://www.pimak.com/sitemap.xml")).text();
const cats = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1])
  .filter((u) => u.includes("/urunler/"));

const missing = new Map();
for (const cat of cats) {
  const html = await (await fetch(cat)).text();
  for (const m of html.matchAll(/href="([a-z0-9][a-z0-9-]+)"/gi)) {
    const s = m[1];
    if (NAV.has(s) || saved.has(s) || s.length < 6) continue;
    missing.set(s, cat.split("/urunler/")[1]);
  }
}

console.log("Kategori sayfalarında olup manifestte olmayan:", missing.size);
for (const [slug, cat] of [...missing.entries()].slice(0, 30)) {
  const url = `https://www.pimak.com/${slug}`;
  const html = await (await fetch(url)).text();
  const isProduct = /class="urundetay"/i.test(html);
  console.log(isProduct ? "ÜRÜN" : "DEĞİL", slug, "←", cat);
}
