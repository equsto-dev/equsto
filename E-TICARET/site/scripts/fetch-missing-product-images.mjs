#!/usr/bin/env node
/**
 * Görselsiz 5 SKU için görsel indir + JSON güncelle
 *   node scripts/fetch-missing-product-images.mjs
 *   node scripts/fetch-missing-product-images.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIPMANLAR = path.join(ROOT, "public/data/ekipmanlar.json");
const PFOS_EK = path.join(ROOT, "public/data/pfos-ek-katalog.json");
const dryRun = process.argv.includes("--dry-run");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MIN_BYTES = 5000;

const JOBS = [
  {
    sku: "133094",
    id: "electrolux-professional__133094",
    url: "https://tools.electroluxprofessional.com/Mirror/Doc/PH_1000x1000/PH_133094_1_1_133094.jpg",
    destRel: "images/catalog/electrolux/133094/hero-1.jpg",
  },
  {
    sku: "505084",
    id: "electrolux-professional__505084",
    url: "https://tools.electroluxprofessional.com/Mirror/Doc/PH_1000x1000/PH_505089_1_3_505089_EPR.jpg",
    destRel: "images/catalog/electrolux/505084/hero-1.jpg",
    note: "505089 kardeş model (aynı green&clean giyotin serisi)",
  },
  {
    sku: "8799.70240.00",
    url: "https://oztiryakiler.com.tr/ax-images/images/8799.70240.00.jpg",
    destRel: "images/catalog/ozti/web/ozti-8799-70240-00.jpg",
    pfosEk: true,
  },
  {
    sku: "9805.CB416.HC",
    cafemarktQuery: "Brema CB416 B-QUBE",
    destRel: "images/catalog/brema/ozti-9805-cb416-hc.jpg",
    pfosEk: true,
  },
  {
    sku: "9805.CB425.HC",
    cafemarktQuery: "Brema CB425 B-QUBE",
    destRel: "images/catalog/brema/ozti-9805-cb425-hc.jpg",
    pfosEk: true,
  },
];

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function searchCafemarkt(term) {
  const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(term)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const urls = [];
  const re = /data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) urls.push(m[1]);
  const uniq = [...new Set(urls)];
  const brema = uniq.filter((u) => /brema|cb416|cb425|b-qube/i.test(u));
  return brema.length ? brema : uniq.filter((u) => /buz|ice/i.test(u));
}

async function resolveJob(job) {
  if (job.url) {
    return { src: job.url, rel: job.destRel };
  }
  const hits = await searchCafemarkt(job.cafemarktQuery);
  if (!hits.length) throw new Error(`Cafemarkt sonuç yok: ${job.cafemarktQuery}`);
  return { src: hits[0], rel: job.destRel };
}

async function saveImage(buf, rel) {
  const abs = path.join(ROOT, "public", rel);
  if (buf.length < MIN_BYTES) throw new Error(`küçük dosya ${buf.length} byte`);
  if (!dryRun) {
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, buf);
  }
  return rel;
}

function patchEkipmanlar(id, imageRel) {
  const rows = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8"));
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error(`ekipmanlar id yok: ${id}`);
  rows[idx].images = [imageRel];
  if (!dryRun) fs.writeFileSync(EKIPMANLAR, JSON.stringify(rows), "utf8");
  return true;
}

function patchPfosEk(sku, imageRel) {
  const raw = JSON.parse(fs.readFileSync(PFOS_EK, "utf8"));
  const item = raw.items?.find((r) => r.sku === sku);
  if (!item) throw new Error(`pfos-ek sku yok: ${sku}`);
  item.images = [imageRel];
  if (!dryRun) fs.writeFileSync(PFOS_EK, JSON.stringify(raw, null, 2), "utf8");
  return true;
}

async function main() {
  console.log(`[fetch-missing-images] ${dryRun ? "DRY-RUN" : "canlı"}`);
  const results = [];

  for (const job of JOBS) {
    try {
      const { src, rel } = await resolveJob(job);
      console.log(`  ${job.sku}: ${src.slice(0, 70)}…`);
      if (job.note) console.log(`    (${job.note})`);

      let buf;
      if (dryRun) {
        buf = Buffer.alloc(MIN_BYTES);
      } else {
        buf = await download(src);
      }
      await saveImage(buf, rel);

      if (job.pfosEk) patchPfosEk(job.sku, rel);
      else if (job.id) patchEkipmanlar(job.id, rel);

      results.push({ sku: job.sku, ok: true, rel });
      console.log(`    → ${rel}`);
    } catch (e) {
      results.push({ sku: job.sku, ok: false, err: e.message });
      console.error(`    HATA ${job.sku}: ${e.message}`);
    }
  }

  const ok = results.filter((r) => r.ok).length;
  console.log(`\n[fetch-missing-images] ${ok}/${results.length} tamam`);
  if (ok < results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
