#!/usr/bin/env node
/**
 * Cafemarkt ana sayfa Popüler Kategoriler (slider-2601…26012) görsellerini indirir.
 *   node scripts/fetch-cafemarkt-home-pop-cats.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "images", "home", "pop-cats");

const ID_TO_SLUG = {
  1: "hazirlik-makineleri",
  2: "kampanyalar",
  3: "outlet-urunler",
  4: "bulasikhane-ekipmanlari",
  5: "gastronorm-kuvetler",
  6: "acik-bufe-ekipmanlari",
  7: "cay-makineleri",
  8: "soguk-teshir-dolaplari",
  9: "bar-blenderlari",
  10: "pizza-firinlari",
  11: "filtre-kahve-makineleri",
  12: "kahve-degirmenleri",
};

function absUrl(u) {
  if (!u) return "";
  const s = u.replace(/&amp;/g, "&");
  if (s.startsWith("//")) return "https:" + s;
  if (s.startsWith("http")) return s;
  return "";
}

function pickImage(chunk) {
  const dataSrc = chunk.match(/data-srcset="([^"]+)"/)?.[1] || chunk.match(/data-src="([^"]+)"/)?.[1];
  if (dataSrc) {
    const first = dataSrc.split(/\s*,\s*/)[0].trim().split(/\s+/)[0];
    return absUrl(first);
  }
  const srcset = chunk.match(/srcset="([^"]+)"/)?.[1];
  if (srcset) return absUrl(srcset.split(/\s*,\s*/)[0].trim().split(/\s+/)[0]);
  const src = chunk.match(/src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)?.[1];
  return absUrl(src);
}

async function main() {
  const res = await fetch("https://www.cafemarkt.com/", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Equsto/1.0)" },
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const html = await res.text();
  const slides = [
    ...html.matchAll(
      /<a id="slider-260(\d+)"[^>]*href="([^"]+)"[^>]*aria-label="([^"]*)"[\s\S]{0,4000}?<\/a>/gi,
    ),
  ];
  if (!slides.length) throw new Error("slider-260x slides not found");
  console.log("[fetch-cafemarkt-home-pop-cats] slides", slides.length);

  fs.mkdirSync(OUT, { recursive: true });
  const manifest = [];

  for (const s of slides) {
    const num = Number(s[1]);
    const slug = ID_TO_SLUG[num] || `cat-${num}`;
    const label = s[3];
    const url = pickImage(s[0]);
    if (!url) {
      console.warn("no image", num, label);
      continue;
    }
    let ext = path.extname(new URL(url).pathname);
    if (!ext || ext.length > 6) ext = ".jpg";
    const file = `cm-${slug}${ext}`;
    const dest = path.join(OUT, file);
    const imgRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Equsto/1.0)" },
    });
    if (!imgRes.ok) {
      console.warn("fetch fail", file, imgRes.status);
      continue;
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(dest, buf);
    manifest.push({
      num,
      slug,
      label,
      file: `/images/home/pop-cats/${file}`,
      source: url,
    });
    console.log("OK", file, buf.length, label);
  }

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ fetched: new Date().toISOString(), items: manifest }, null, 2) + "\n",
    "utf8",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
