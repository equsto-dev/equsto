#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://www.pimak.com";
const EXCLUDE = new Set([
  "urunler", "iletisim", "kurumsal", "kilavuzlar", "servisler", "kataloglarimiz",
  "haberler", "insan-kaynaklari", "projeler", "yurt-disi", "yurt-ici", "videolar",
  "referanslar", "yardim", "arama", "404",
]);
const BLOG = /(nasil|nedir|nelerdir|kvkk|fuar|euroshop|adim-adim|hakkinda-bilmeniz|ziyaret|donusum)/i;

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "products-tr.json"), "utf8"));
const saved = new Set(manifest.products.map((p) => p.slug));

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const single = locs.filter((u) => {
  const slug = new URL(u).pathname.replace(/^\//, "");
  return slug && !slug.includes("/") && !EXCLUDE.has(slug);
});

const realProducts = [];
const blogs = [];
const missing = [];

for (const url of single) {
  const slug = new URL(url).pathname.replace(/^\//, "");
  if (saved.has(slug)) continue;
  if (BLOG.test(slug)) {
    blogs.push(slug);
    continue;
  }
  const html = await (await fetch(url)).text();
  const isProduct = /class="urundetay"/i.test(html) && /class="urunkod"/i.test(html);
  if (isProduct) {
    missing.push({ slug, url });
    realProducts.push(slug);
  } else {
    blogs.push(slug);
  }
}

const incomplete = manifest.products.filter((p) => p.teknikSatirSayisi === 0 && p.temelOzellikSayisi === 0);

console.log(JSON.stringify({
  kayitli: manifest.urunSayisi,
  sitemapTekSegment: single.length,
  eksikGercekUrun: missing.length,
  eksikOrnek: missing.slice(0, 10).map((m) => m.slug),
  teknikVeOzellikBos: incomplete.length,
  teknikVeOzellikBosOrnek: incomplete.slice(0, 5).map((p) => p.slug),
  kategoriEksik: manifest.products.filter((p) => !p.kategori).length,
}, null, 2));
