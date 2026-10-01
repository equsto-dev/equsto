#!/usr/bin/env node
/**
 * Katalog görsel gap audit
 *
 *   node scripts/audit-product-images.mjs
 *   node scripts/audit-product-images.mjs --out=scripts/data/image-enrich/audit.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectValidPhotos } from "./lib/image-enrich/photos.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIPMANLAR = path.join(ROOT, "var/catalog/ekipmanlar.json");

const outArg = process.argv.find((a) => a.startsWith("--out="));
const OUT = path.resolve(
  ROOT,
  outArg ? outArg.slice("--out=".length) : "scripts/data/image-enrich/audit.json",
);

function main() {
  const rows = JSON.parse(fs.readFileSync(EKIPMANLAR, "utf8"));
  if (!Array.isArray(rows)) throw new Error("ekipmanlar.json array değil");

  const byBrand = new Map();
  const buckets = { none: 0, single: 0, multi: 0 };
  const withCm = { none: 0, single: 0, multi: 0 };
  const gaps = [];

  for (const row of rows) {
    const photos = collectValidPhotos(row.images);
    const n = photos.length;
    const bucket = n === 0 ? "none" : n === 1 ? "single" : "multi";
    buckets[bucket]++;

    const brand = String(row.brand || "unknown").trim() || "unknown";
    if (!byBrand.has(brand)) {
      byBrand.set(brand, { brand, total: 0, none: 0, single: 0, multi: 0, cafemarkt_url: 0, kaynak_url: 0 });
    }
    const b = byBrand.get(brand);
    b.total++;
    b[bucket]++;
    if (row.cafemarkt_url) b.cafemarkt_url++;
    if (row.kaynak_url) b.kaynak_url++;

    if (row.cafemarkt_url) withCm[bucket]++;

    if (n < 2) {
      gaps.push({
        id: row.id || null,
        sku: row.sku || row.model || null,
        brand,
        dept: row.dept || null,
        name: String(row.name || "").slice(0, 120),
        photoCount: n,
        cafemarkt_url: row.cafemarkt_url || null,
        kaynak_url: row.kaynak_url || null,
        hero: photos[0] || null,
      });
    }
  }

  const brands = [...byBrand.values()].sort(
    (a, b) => b.single + b.none - (a.single + a.none),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    buckets,
    withCafemarktUrl: withCm,
    multiPhotoPct: Number(((100 * buckets.multi) / Math.max(1, rows.length)).toFixed(2)),
    brands,
    gapCount: gaps.length,
    /** İlk 500 gap — tam liste CSV’de */
    gapsSample: gaps.slice(0, 500),
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");

  const csvPath = OUT.replace(/\.json$/i, "-gaps.csv");
  const csvLines = [
    "sku,brand,dept,photoCount,cafemarkt_url,kaynak_url,name",
    ...gaps.map((g) =>
      [
        JSON.stringify(g.sku || ""),
        JSON.stringify(g.brand || ""),
        JSON.stringify(g.dept || ""),
        g.photoCount,
        JSON.stringify(g.cafemarkt_url || ""),
        JSON.stringify(g.kaynak_url || ""),
        JSON.stringify(g.name || ""),
      ].join(","),
    ),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  console.log(
    JSON.stringify(
      {
        out: path.relative(ROOT, OUT),
        csv: path.relative(ROOT, csvPath),
        total: report.total,
        buckets: report.buckets,
        withCafemarktUrl: report.withCafemarktUrl,
        multiPhotoPct: report.multiPhotoPct,
        topBrands: brands.slice(0, 12).map((b) => ({
          brand: b.brand,
          single: b.single,
          none: b.none,
          multi: b.multi,
          cm: b.cafemarkt_url,
        })),
      },
      null,
      2,
    ),
  );
}

main();
