#!/usr/bin/env node
/** Mevcut urbanbar-web-catalog.json → koleksiyon eşleşmesi ekle */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = path.join(ROOT, "scripts/data/urbanbar/urbanbar-web-catalog.json");
const BASE = "https://www.urbanbar.com";
const UA = "EqustoImport/1.0 (+https://equsto.com; urbanbar-catalog)";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(800 * (i + 1));
    }
  }
}

async function main() {
  const catalog = JSON.parse(await fsp.readFile(OUT_JSON, "utf8"));
  const collections = catalog.collections || [];
  const map = new Map();

  for (let i = 0; i < collections.length; i++) {
    const col = collections[i];
    process.stdout.write(`[${i + 1}/${collections.length}] ${col.handle}… `);
    let page = 1;
    let count = 0;
    try {
      while (true) {
        const data = await fetchJson(`${BASE}/collections/${col.handle}/products.json?limit=250&page=${page}`);
        for (const p of data.products || []) {
          const entry = { handle: col.handle, title: col.title };
          const list = map.get(p.id) || [];
          if (!list.some((x) => x.handle === col.handle)) list.push(entry);
          map.set(p.id, list);
          count++;
        }
        if ((data.products || []).length < 250) break;
        page++;
        await sleep(200);
      }
      console.log(count);
    } catch (e) {
      console.log(`HATA: ${e.message}`);
    }
    await sleep(250);
  }

  let matched = 0;
  for (const p of catalog.products) {
    p.collections = map.get(p.productId) || [];
    p.collectionPath = p.collections.map((c) => c.title).join(" > ");
    if (p.collections.length) matched++;
  }

  catalog.patchedAt = new Date().toISOString();
  await fsp.writeFile(OUT_JSON, JSON.stringify(catalog, null, 2), "utf8");
  console.log(`\nKoleksiyon eşleşmesi: ${matched}/${catalog.products.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
