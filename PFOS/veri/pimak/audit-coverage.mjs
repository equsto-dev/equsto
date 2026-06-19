#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://www.pimak.com";

const BLOG_SLUG_RE =
  /(nasil|nedir|nelerdir|avantaj|ipucu|ipuclari|rehber|kurulumu|hizmeti|olmali|tercihi|kullanimi|deneyimi|cozum|tasarruf|tedbir|tasarim|danisman|listesi|modelleri|projeleri|firmalari|ureticileri|malzemeleri|gerecleri|onemli|dikkat|sayin-|programina|yonetim-kurulu)/i;

function isProductUrl(url) {
  const slug = new URL(url).pathname.replace(/^\//, "");
  if (!slug || slug.includes("/")) return false;
  if (BLOG_SLUG_RE.test(slug)) return false;
  if (slug.split("-").length > 6 && !/^[a-z]{1,4}\d/i.test(slug)) return false;
  return true;
}

async function main() {
  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const allLocs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const filtered = allLocs.filter(isProductUrl);

  const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "products-tr.json"), "utf8"));
  const pages = (await fs.readdir(path.join(ROOT, "urun-sayfalari"))).filter((f) => f.endsWith(".json"));

  let cp = { done: [] };
  try {
    cp = JSON.parse(await fs.readFile(path.join(ROOT, "scrape-checkpoint.json"), "utf8"));
  } catch {}

  const savedSlugs = new Set(manifest.products.map((p) => p.slug));
  const filteredSet = new Set(filtered.map((u) => new URL(u).pathname.replace(/^\//, "")));

  // Sitemap'te filtre sonrası var ama JSON'da yok
  const missingFromManifest = filtered.filter((u) => {
    const slug = new URL(u).pathname.replace(/^\//, "");
    return !savedSlugs.has(slug);
  });

  // Kategori sayfalarından ürün slug'ları topla
  const catUrls = allLocs.filter((u) => u.includes("/urunler/") && u !== `${BASE}/urunler`);
  const catSlugs = new Set();
  for (const catUrl of catUrls) {
    const html = await (await fetch(catUrl)).text();
    for (const m of html.matchAll(/href="([a-z0-9][a-z0-9-]+)"/gi)) {
      const s = m[1];
      if (s.length > 4 && !s.includes("urunler")) catSlugs.add(s);
    }
  }

  const onSiteNotSaved = [...catSlugs].filter((s) => !savedSlugs.has(s));

  console.log("Sitemap toplam loc:", allLocs.length);
  console.log("Sitemap filtre sonrası (ürün adayı):", filtered.length);
  console.log("Kayıtlı ürün (manifest):", manifest.urunSayisi);
  console.log("urun-sayfalari dosya:", pages.length);
  console.log("Checkpoint done:", cp.done?.length ?? 0);
  console.log("Kategori sayfalarından slug:", catSlugs.size);
  console.log("Kategoride var, manifestte yok:", onSiteNotSaved.length);
  if (onSiteNotSaved.length) console.log("  örnek:", onSiteNotSaved.slice(0, 15).join(", "));
  console.log("Filtreli sitemapte var, manifestte yok:", missingFromManifest.length);
  if (missingFromManifest.length) {
    console.log("  örnek:", missingFromManifest.slice(0, 10).map((u) => new URL(u).pathname).join("\n  "));
  }

  const noKategori = manifest.products.filter((p) => !p.kategori).length;
  const noGorsel = manifest.products.filter((p) => !p.gorselYerel).length;
  console.log("Kategori eksik:", noKategori);
  console.log("Yerel görsel eksik:", noGorsel);
}

main().catch(console.error);
