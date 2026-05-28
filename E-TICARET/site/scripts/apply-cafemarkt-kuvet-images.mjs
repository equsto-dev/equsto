#!/usr/bin/env node
/**
 * Küvetler (gastronom-kuvetler) — Cafemarkt vitrin görsellerini indir ve dept JSON'a yaz.
 *
 *   node scripts/apply-cafemarkt-kuvet-images.mjs
 *   node scripts/apply-cafemarkt-kuvet-images.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCafemarktKuvetSignature, parseKuvetSignature } from "./lib/kuvet-signature.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const DEST_SUB = "images/catalog/ozti/cafemarkt";
const CM_CATALOG_OUT = path.join(ROOT, "scripts/data/cafemarkt-kuvet-catalog.json");
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const DELAY_MS = 350;

const TARGET_JSON = [
  path.join(ROOT, "public/data/dept/set-ustu-mutfak.json"),
  path.join(ROOT, "public/data/ekipmanlar.json"),
];

const CATEGORY_URLS = [
  "https://www.cafemarkt.com/gastronorm-kuvetler",
  "https://www.cafemarkt.com/standart-gastronorm-kuvet",
  "https://www.cafemarkt.com/delikli-gastronorm-kuvetler",
  "https://www.cafemarkt.com/sapli-gastronorm-kuvetler",
  "https://www.cafemarkt.com/yapismaz-gastronorm-kuvetler",
  "https://www.cafemarkt.com/gastronorm-kuvet-kapaklari",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isKuvetRow(row) {
  const n = String(row.name || "");
  if (!/öztiryakiler/i.test(String(row.brand || ""))) return false;
  if (row.category === "gastronom-kuvetler") return true;
  if (!/(küvet|kuvet)/i.test(n)) return false;
  if (/gastronom/i.test(n)) return true;
  if (/GN\s*\d/i.test(n) && /KAPAK|POLIKARBON|POLIPROPILEN|DELIKLI|SAPLI/i.test(n)) return true;
  return false;
}

function slugFromSku(sku) {
  return (
    "ozti-" +
    String(sku || "")
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

function extFromUrl(url) {
  const m = String(url).match(/\.(jpe?g|webp|png)(\?|$)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

function parseProductItems(html) {
  const out = [];
  const items = html.matchAll(
    /<div class="col-[^"]* product-item">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi
  );
  for (const m of items) {
    const block = m[1];
    const titleM = block.match(/class="product-title">([^<]+)</);
    const imgM = block.match(/data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/);
    const hrefM = block.match(/href="(\/[^"]+)"/);
    if (!titleM || !imgM) continue;
    const title = titleM[1].trim();
    if (!/öztiryakiler/i.test(title)) continue;
    out.push({
      title,
      img: imgM[1],
      href: hrefM ? `https://www.cafemarkt.com${hrefM[1]}` : "",
      sig: parseCafemarktKuvetSignature(title),
    });
  }
  return out;
}

async function scrapeCafemarktCatalog() {
  const byKey = new Map();
  for (const base of CATEGORY_URLS) {
    let html;
    try {
      html = await fetchHtml(base);
    } catch (e) {
      console.warn("[skip]", base, e.message);
      continue;
    }
    for (const it of parseProductItems(html)) {
      if (it.sig.key) byKey.set(it.sig.key, it);
    }
    await sleep(DELAY_MS);
  }
  return [...byKey.values()];
}

async function searchCafemarktImage(sku, name) {
  const queries = [
    String(sku || "").trim(),
    String(name || "")
      .replace(/^GASTRONOM\s+/i, "")
      .replace(/\s+KÖŞE DESENLİ.*/i, "")
      .trim(),
  ].filter(Boolean);

  for (const q of queries) {
    const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(q)}`;
    let html;
    try {
      html = await fetchHtml(url);
    } catch {
      continue;
    }
    const items = parseProductItems(html);
    if (items.length) return items[0];
    const imgM = html.match(/data-src="(https:\/\/witcdn\.cafemarkt\.com\/gastronorm-kuvet[^"]+)"/i);
    const titleM = html.match(/class="product-title">(Öztiryakiler[^<]+Gastronorm[^<]*)</i);
    if (imgM && titleM) {
      return {
        title: titleM[1].trim(),
        img: imgM[1],
        sig: parseCafemarktKuvetSignature(titleM[1]),
      };
    }
    await sleep(DELAY_MS);
  }
  return null;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`IMG ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 800) throw new Error("IMG too small");
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
}

async function main() {
  console.log("[cafemarkt-kuvet] katalog taranıyor…");
  const catalog = await scrapeCafemarktCatalog();
  console.log("[cafemarkt-kuvet] öztiryakiler benzersiz:", catalog.length);

  if (!dryRun) {
    fs.writeFileSync(
      CM_CATALOG_OUT,
      JSON.stringify(
        { generated: new Date().toISOString(), items: catalog },
        null,
        2
      ),
      "utf8"
    );
  }

  const catalogMap = new Map(catalog.map((c) => [c.sig.key, c]));
  const stats = { rows: 0, matched: 0, searched: 0, downloaded: 0, updated: 0, miss: 0 };

  for (const jsonPath of TARGET_JSON) {
    if (!fs.existsSync(jsonPath)) continue;
    const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    let changed = 0;
    const destDir = path.join(ROOT, "public", DEST_SUB);
    fs.mkdirSync(destDir, { recursive: true });

    for (const row of rows) {
      if (!isKuvetRow(row)) continue;
      stats.rows++;
      const sig = parseKuvetSignature(row.name);
      let hit = catalogMap.get(sig.key);
      if (!hit?.img && !dryRun) {
        hit = await searchCafemarktImage(row.sku || row.model, row.name);
        if (hit?.sig?.key) catalogMap.set(hit.sig.key, hit);
        if (hit) stats.searched++;
        if (stats.searched % 25 === 0) {
          console.log(`  … arama ${stats.searched}, eşleşen ${stats.matched}`);
        }
        await sleep(DELAY_MS);
      }
      if (!hit?.img) {
        stats.miss++;
        continue;
      }
      stats.matched++;
      const sku = String(row.sku || row.model || row.id || "kuvet").trim();
      const ext = extFromUrl(hit.img);
      const file = `${slugFromSku(sku)}.${ext}`;
      const rel = `${DEST_SUB}/${file}`;
      const destPath = path.join(ROOT, "public", rel);

      if (!dryRun) {
        try {
          if (!fs.existsSync(destPath)) {
            await downloadImage(hit.img, destPath);
            stats.downloaded++;
          }
          const relNorm = rel.replace(/\\/g, "/");
          if (JSON.stringify(row.images) !== JSON.stringify([relNorm])) {
            row.images = [relNorm];
            row.cafemarktImage = hit.img;
            changed++;
            stats.updated++;
          }
        } catch (e) {
          console.warn("[img]", row.name?.slice(0, 50), e.message);
          stats.miss++;
        }
        await sleep(80);
      } else {
        console.log("[dry]", sig.key, "→", hit.img.slice(-50));
      }
    }

    if (!dryRun && changed) {
      fs.writeFileSync(jsonPath, JSON.stringify(rows), "utf8");
      console.log(`  ${path.basename(jsonPath)}: ${changed} gorsel`);
    }
  }

  console.log("\n[cafemarkt-kuvet]", stats);
  if (!dryRun) console.log("→", CM_CATALOG_OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
