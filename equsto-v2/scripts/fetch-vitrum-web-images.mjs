/**
 * Besos / Vitrum — resmi vitrumgroup.org CDN görsellerini indir,
 * ürün koduna göre public/images/catalog/besos/web/ altına kaydet,
 * vitrum-bars-catalogue.json image alanlarını güncelle.
 *
 *   node scripts/fetch-vitrum-web-images.mjs
 *   node scripts/fetch-vitrum-web-images.mjs --code BES-P23
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOGUE = path.join(ROOT, "public/data/vitrum-bars-catalogue.json");
const DRAWINGS = path.join(ROOT, "public/data/vitrum-drawings");
const OUT_DIR = path.join(ROOT, "public/images/catalog/besos/web");
const MANIFEST = path.join(ROOT, "public/images/catalog/besos/_manifest.json");
const CDN = "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d";
const MIN_BYTES = 4000;

const SIGNATURE_URL = {
  "BES-P23": `${CDN}/6797f675c6587180a2de3da2_The_Manhattan_Bar.avif`,
  "BES-P24": `${CDN}/679213166e78e143c7905338_The%20Boulevardier_bar.avif`,
  "BES-P25": `${CDN}/6792131632c0b70a8c552b74_The%20Clover_bar.avif`,
};

function barModuleUrl(n) {
  const suffix = n === 0 ? "bar%20module-0%20" : `bar%20module-${n}`;
  const ids = {
    0: "6790bd324f7cba4550ab6f64",
    1: "6790bd32193fb32b7992f7b6",
    2: "6790bd3209d3d0d6c9bd55bd",
    3: "6790bd32a31e3ddf7a52a225",
    4: "6790bd32d33ae1e2d1552681",
    5: "6790bd8482a7fef92738ba59",
    6: "6790bd32323bae5c9c9659c6",
    7: "6790bd326c8bedb4eb75a61b",
    8: "6790bd336250c18bcd649d0a",
    9: "6790bd32fc7fb3cf6626714a",
    10: "6790bd9703dcdbc60b22b6af",
    11: "6790bd32378ca18fb9c8bb03",
    12: "6790bd33794dfeab7e0b36da",
    13: "6790bd32a50373df9b51d137",
    14: "6790bd32851c2c6ddf78b322",
    15: "6790bd32254c4889d2056e0a",
    16: "6790bd33962ed5245d764e86",
    17: "6790bd3209d3d0d6c9bd55ef",
    18: "6790bd3324cac00b731f95bb",
    19: "6790bd33e88fb5b1d254086e",
  };
  const id = ids[n];
  if (!id) return "";
  return `${CDN}/${id}_${suffix}.avif`;
}

function slugFile(code) {
  return (
    "besos-" +
    String(code)
      .toLowerCase()
      .replace(/\//g, "-")
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

function curlGet(url, dest) {
  const r = spawnSync(
    "curl.exe",
    ["-k", "-sSL", "-f", "-o", dest, "-H", "User-Agent: Mozilla/5.0", url],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  );
  return r.status === 0 && fs.existsSync(dest) && fs.statSync(dest).size >= MIN_BYTES;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let code = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--code") code = args[++i] || "";
  }
  return { code };
}

function resolveUrl(product, index) {
  const code = product.code;
  if (SIGNATURE_URL[code]) return SIGNATURE_URL[code];
  // Katalog sırası 4–23: vitrum.com bar module-0 … 19
  if (index >= 3 && index <= 22) {
    return barModuleUrl(index - 3);
  }
  // Diğer modüller: Vitrum katalog PDF sayfa görselleri (canlı equsto veya yerel yedek)
  const page = product.page;
  if (!page) return "";
  const hero = `https://equsto.com/data/vitrum-drawings/hero_p${page}.png`;
  const tech = `https://equsto.com/data/vitrum-drawings/tech_p${page}.png`;
  return { hero, tech };
}

function copyOrDownload(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const ext = src.includes(".avif") ? ".avif" : src.includes(".png") ? ".png" : ".jpg";
  const out = dest.replace(/\.[^.]+$/, ext);
  if (curlGet(src, out)) return true;
  // equsto erişilemezse yerel vitrum-drawings yedek
  for (const kind of ["hero", "tech"]) {
    const m = src.match(new RegExp(`${kind}_p(\\d+)\\.png`, "i"));
    if (!m) continue;
    const local = path.join(DRAWINGS, `${kind}_p${m[1]}.png`);
    if (fs.existsSync(local)) {
      const pngOut = out.replace(/\.[^.]+$/, ".png");
      fs.copyFileSync(local, pngOut);
      return fs.statSync(pngOut).size >= MIN_BYTES;
    }
  }
  return false;
}

function main() {
  const opts = parseArgs();
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE, "utf8"));
  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  let fail = 0;

  catalogue.products.forEach((p, index) => {
    if (opts.code && p.code !== opts.code) return;
    const url = resolveUrl(p, index);
    if (!url) {
      console.warn("SKIP no source", p.code);
      fail++;
      return;
    }
    const base = slugFile(p.code);
    const destAvif = path.join(OUT_DIR, `${base}.avif`);
    const destPng = path.join(OUT_DIR, `${base}.png`);
    let saved = "";
    let used = "";
    const tryList =
      typeof url === "string"
        ? [url]
        : [url.hero, url.tech];
    for (const u of tryList) {
      if (!u) continue;
      if (u.includes(".avif") && copyOrDownload(u, destAvif)) {
        saved = `images/catalog/besos/web/${base}.avif`;
        used = u;
        break;
      }
      if (copyOrDownload(u, destPng)) {
        saved = `images/catalog/besos/web/${base}.png`;
        used = u;
        break;
      }
    }
    if (!saved) {
      console.warn("FAIL", p.code, tryList.join(" | ").slice(0, 120));
      fail++;
      return;
    }
    manifest[p.code] = saved;
    p.image = saved;
    p.imageSource = used.includes("vitrumgroup.org")
      ? "vitrumgroup.org-cdn"
      : used.includes("equsto.com")
        ? "equsto.com/vitrum-drawings"
        : "local-fallback";
    console.log("OK", p.code, "->", saved);
    ok++;
  });

  catalogue.imageRoot = "images/catalog/besos/web";
  catalogue.imagesFetchedAt = new Date().toISOString();
  fs.writeFileSync(CATALOGUE, JSON.stringify(catalogue, null, 2) + "\n", "utf8");
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Done: ${ok} ok, ${fail} failed`);
}

main();
