#!/usr/bin/env node
/**
 * Portabianco BAR şişe soğutucu + ST teşhir görsellerini düzelt.
 * Kaynak: istocsepeti ürün fotoğrafları (watermark silinir).
 *
 *   node scripts/patch-portabianco-bar-st-images.mjs
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/images/catalog/yuksel");
const SOGUTMA = path.join(ROOT, "public/data/dept/sogutma.json");
const UA = "EqustoImport/1.0 (+https://equsto.com; portabianco-images)";

const BAR_SRC =
  "https://www.istocsepeti.com/shop/ar/31/myassets/products/393/bar-150p.jpg?revision=1697143329";
const ST_SRC =
  "https://www.istocsepeti.com/shop/ar/31/myassets/products/478/st-100.jpg?revision=1697143329";

const BAR_SKUS = ["BAR-150P", "BAR-250P", "BAR-350P"];
const ST_SKUS = ["ST-100", "ST-140", "ST-155", "ST-160", "ST-186", "ST-210", "ST-215"];

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/** istocsepeti logosunu sağ alttan beyazla kapat */
async function scrubWatermark(buf) {
  const img = sharp(buf);
  const meta = await img.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (!w || !h) return buf;
  const coverW = Math.round(w * 0.32);
  const coverH = Math.round(h * 0.12);
  const overlay = await sharp({
    create: {
      width: coverW,
      height: coverH,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();
  return img
    .composite([{ input: overlay, left: w - coverW, top: h - coverH }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function writeJpeg(buf, dest) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.writeFile(dest, buf);
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });

  const barRaw = await download(BAR_SRC);
  const barClean = await scrubWatermark(barRaw);
  const barMeta = await sharp(barClean).metadata();
  const bw = barMeta.width || 1;
  const bh = barMeta.height || 1;

  // Sol tek kapı ≈ %0–40, sağ çift kapı ≈ %52–100
  const bar150 = await scrubWatermark(
    await sharp(barClean)
      .extract({ left: 0, top: 0, width: Math.round(bw * 0.4), height: bh })
      .resize({ width: 900, height: 900, fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer(),
  );
  const left250 = Math.round(bw * 0.52);
  const bar250 = await scrubWatermark(
    await sharp(barClean)
      .extract({ left: left250, top: 0, width: bw - left250, height: bh })
      .resize({ width: 1000, height: 900, fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer(),
  );
  const bar350 = await scrubWatermark(
    await sharp(barClean)
      .resize({ width: 1100, height: 800, fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer(),
  );

  const barFiles = {
    "BAR-150P": "yuksel-bar-150p_1.jpg",
    "BAR-250P": "yuksel-bar-250p_1.jpg",
    "BAR-350P": "yuksel-bar-350p_1.jpg",
  };
  await writeJpeg(bar150, path.join(OUT_DIR, barFiles["BAR-150P"]));
  await writeJpeg(bar250, path.join(OUT_DIR, barFiles["BAR-250P"]));
  await writeJpeg(bar350, path.join(OUT_DIR, barFiles["BAR-350P"]));
  console.log("[bar] wrote", Object.values(barFiles).join(", "));

  const stRaw = await download(ST_SRC);
  const stClean = await scrubWatermark(stRaw);
  const stMeta = await sharp(stClean).metadata();
  const stH = stMeta.height || 1;
  // Üst frontal görünüm (kaynak diptych ise); tek kare ise tümü
  const stCropH = stH > 700 ? Math.round(stH * 0.48) : stH;
  const stSquare = await scrubWatermark(
    await sharp(stClean)
      .extract({ left: 0, top: 0, width: stMeta.width || 1, height: stCropH })
      .resize({ width: 1100, height: 700, fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer(),
  );

  const stFiles = {};
  for (const sku of ST_SKUS) {
    const file = `yuksel-${sku.toLowerCase()}_1.jpg`;
    stFiles[sku] = file;
    await writeJpeg(stSquare, path.join(OUT_DIR, file));
  }
  console.log("[st] wrote", Object.values(stFiles).join(", "));

  const rows = JSON.parse(fs.readFileSync(SOGUTMA, "utf8"));
  let n = 0;
  for (const row of rows) {
    const sku = String(row.sku || "").trim().toUpperCase();
    if (BAR_SKUS.includes(sku)) {
      const rel = `images/catalog/yuksel/${barFiles[sku]}`;
      row.images = [rel];
      row.image = rel;
      n++;
    } else if (ST_SKUS.includes(sku)) {
      const rel = `images/catalog/yuksel/${stFiles[sku]}`;
      row.images = [rel];
      row.image = rel;
      // yanlış "Bar Soğutucu" adı → teşhir / granite pizza
      if (/bar\s*soğutucu|bar\s*sogutucu/i.test(String(row.name || ""))) {
        row.name = `Portabianco Teşhir Buzdolabı ${sku}`;
      }
      if (/GRANITE PIZZA/i.test(String(row.specs || ""))) {
        row.category = row.category === "sogutma" || row.category === "sogutma-ekipmanlari"
          ? "tezgah-tipi-buzdolabi"
          : row.category;
        row.urun_alt_kategori = "Granit Pizza / Teşhir Buzdolabı";
      }
      n++;
    }
  }
  const tmp = `${SOGUTMA}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(rows), "utf8");
  fs.renameSync(tmp, SOGUTMA);
  console.log(`[sogutma] patched rows=${n}`);

  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log("[done]");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
