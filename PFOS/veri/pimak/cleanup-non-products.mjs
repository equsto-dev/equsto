#!/usr/bin/env node
/** Blog/makale kayıtlarını urun-sayfalari ve manifest'ten temizle */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.join(ROOT, "urun-sayfalari");
const manifestPath = path.join(ROOT, "products-tr.json");

const files = await fs.readdir(pagesDir);
let removed = 0;
const kept = [];

for (const f of files) {
  if (!f.endsWith(".json")) continue;
  const fp = path.join(pagesDir, f);
  const data = JSON.parse(await fs.readFile(fp, "utf8"));
  const ok =
    data.urunKodu &&
    data.baslik &&
    (data.teknikDetaylar?.satirlar?.length > 0 ||
      (data.temelOzellikler?.length > 0) ||
      data.gorsel);
  if (!ok) {
    await fs.unlink(fp);
    removed++;
  } else {
    kept.push({
      slug: data.slug,
      urunKodu: data.urunKodu,
      baslik: data.baslik,
      url: data.url,
      kategori: data.kategori?.slug ?? null,
      gorsel: data.gorsel,
      gorselYerel: data.gorselYerel?.local ?? null,
      temelOzellikSayisi: (data.temelOzellikler || []).length,
      teknikSatirSayisi: data.teknikDetaylar.satirlar.length,
    });
  }
}

kept.sort((a, b) => a.baslik.localeCompare(b.baslik, "tr"));
await fs.writeFile(
  manifestPath,
  JSON.stringify(
    {
      kaynak: "https://www.pimak.com/",
      cekilme: new Date().toISOString(),
      urunSayisi: kept.length,
      products: kept,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`Silinen: ${removed}, kalan ürün: ${kept.length}`);
