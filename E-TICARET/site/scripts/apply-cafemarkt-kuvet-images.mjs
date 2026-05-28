#!/usr/bin/env node
/**
 * Küvetler — görselleri public/images/catalog/cafemarkt-images/ klasöründen bağla.
 * Eksik paslanmaz/delikli/saplı için isteğe bağlı: --online (Cafemarkt arama + witcdn)
 *
 *   node scripts/apply-cafemarkt-kuvet-images.mjs
 *   node scripts/apply-cafemarkt-kuvet-images.mjs --online
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCafemarktImagesIndex,
  parseCafemarktImagesFile,
  parseKuvetSignature,
} from "./lib/kuvet-signature.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const useOnline = process.argv.includes("--online");
const LOCAL_DIR = path.join(ROOT, "public/images/catalog/cafemarkt-images");
const LOCAL_SUB = "images/catalog/cafemarkt-images";
const FALLBACK_SUB = "images/catalog/ozti/cafemarkt";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";

const TARGET_JSON = [
  path.join(ROOT, "public/data/dept/set-ustu-mutfak.json"),
  path.join(ROOT, "public/data/ekipmanlar.json"),
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
  if (/GN\s*\d/i.test(n) && /KAPAK|POLIKARBON|POLIPROPILEN|DELIKLI|SAPLI/i.test(n)) {
    return true;
  }
  return false;
}

function publicFileExists(rel) {
  return fs.existsSync(path.join(ROOT, "public", rel.replace(/^\//, "")));
}

async function searchCafemarktImage(sku, name) {
  const queries = [String(sku || "").trim(), String(name || "").trim()].filter(Boolean);
  for (const q of queries) {
    const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
    });
    if (!res.ok) continue;
    const html = await res.text();
    const imgM = html.match(/data-src="(https:\/\/witcdn\.cafemarkt\.com\/gastronorm-kuvet[^"]+)"/i);
    if (!imgM) continue;
    return imgM[1];
  }
  return null;
}

async function downloadToFallback(url, sku) {
  const ext = (url.match(/\.(jpe?g|webp|png)(\?|$)/i) || [, "jpg"])[1].toLowerCase();
  const file =
    "ozti-" +
    String(sku || "kuvet")
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "." +
    ext.replace("jpeg", "jpg");
  const rel = `${FALLBACK_SUB}/${file}`;
  const dest = path.join(ROOT, "public", rel);
  if (!fs.existsSync(dest)) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`IMG ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 800) throw new Error("IMG too small");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
  }
  return rel.replace(/\\/g, "/");
}

async function main() {
  const localIndex = buildCafemarktImagesIndex(LOCAL_DIR, fs.readdirSync);
  console.log("[cafemarkt-kuvet] yerel dosya:", localIndex.size, LOCAL_DIR);

  const stats = {
    rows: 0,
    local: 0,
    kept: 0,
    online: 0,
    miss: 0,
    updated: 0,
  };

  for (const jsonPath of TARGET_JSON) {
    if (!fs.existsSync(jsonPath)) continue;
    const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    let changed = 0;

    for (const row of rows) {
      if (!isKuvetRow(row)) continue;
      stats.rows++;

      const sig = parseKuvetSignature(row.name);
      let rel = "";

      const localFile = localIndex.get(sig.key);
      if (localFile) {
        rel = `${LOCAL_SUB}/${localFile}`.replace(/\\/g, "/");
        stats.local++;
      } else if (row.images?.[0] && publicFileExists(row.images[0])) {
        rel = String(row.images[0]).replace(/\\/g, "/");
        stats.kept++;
      } else if (useOnline && !dryRun) {
        try {
          const url = await searchCafemarktImage(row.sku || row.model, row.name);
          if (url) {
            rel = await downloadToFallback(url, row.sku || row.model);
            stats.online++;
            await sleep(300);
          }
        } catch (e) {
          console.warn("[online]", row.name?.slice(0, 48), e.message);
        }
      }

      if (!rel) {
        stats.miss++;
        continue;
      }

      if (!dryRun && JSON.stringify(row.images) !== JSON.stringify([rel])) {
        row.images = [rel];
        row.cafemarktImageSource = localFile ? "cafemarkt-images" : "fallback";
        changed++;
        stats.updated++;
      } else if (dryRun && localFile) {
        console.log("[dry]", sig.key, "→", localFile);
      }
    }

    if (!dryRun && changed) {
      fs.writeFileSync(jsonPath, JSON.stringify(rows), "utf8");
      console.log(`  ${path.basename(jsonPath)}: ${changed} gorsel`);
    }
  }

  console.log("\n[cafemarkt-kuvet]", stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
