import fs from "node:fs";

const url = process.argv[2] || "https://www.pimak.com/m098-elektrikli-krep-makinasi";
const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 PFOS-scraper/1.0" } });
const html = await r.text();

// urunresim block
const resim = html.match(/class="urunresim"[\s\S]{0,3000}/i)?.[0];
console.log("urunresim block:\n", resim?.slice(0, 1500));

// urunaciklama
const acik = html.match(/class="urunaciklama"[\s\S]{0,4000}/i)?.[0];
console.log("\nurunaciklama:\n", acik?.slice(0, 2000));

// ozellikler / teknik
for (const cls of ["ozelliklerbaslik", "tenikdetay", "urundetay", "urunkod"]) {
  const m = html.match(new RegExp(`class="${cls}"[\\s\\S]{0,2500}`, "i"))?.[0];
  if (m) console.log(`\n${cls}:\n`, m.slice(0, 1200));
}

// all img in urundetay
const detay = html.match(/class="urundetay"[\s\S]*?(?=class="footer|id="footer|<footer)/i)?.[0] || html;
const allImgs = [...detay.matchAll(/<img[^>]+>/gi)].map((m) => m[0]);
console.log("\nimgs in detay:", allImgs.slice(0, 5));

// sitemap product urls pattern
const sm = await (await fetch("https://www.pimak.com/sitemap.xml")).text();
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const cats = locs.filter((u) => u.includes("/urunler/"));
const products = locs.filter((u) => !u.includes("/urunler/") && u !== "https://www.pimak.com/" && !/\/(iletisim|kurumsal|haberler|kilavuzlar|servisler|projeler|insan-kaynaklari|kataloglarimiz|yurt-)/.test(u));
console.log("\nsitemap cats", cats.length, "product-ish", products.length);
console.log("product samples:", products.slice(0, 15).join("\n"));
