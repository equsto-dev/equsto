#!/usr/bin/env node
/**
 * Cafemarkt Portabianco araması → JSON (ld+json ItemList)
 *   node scripts/fetch-cafemarkt-portabianco.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts/data/cafemarkt-portabianco.json");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Equsto";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseItemList(html) {
  const m = html.match(
    /<script type="application\/ld\+json">\s*(\{"@context"[^<]*"@type":"ItemList"[\s\S]*?)\s*<\/script>/i,
  );
  if (!m) return [];
  const data = JSON.parse(m[1]);
  return (data.itemListElement || []).map((li) => {
    const p = li.item || {};
    return {
      cafemarkt_id: String(p.productID || ""),
      name: p.name || "",
      code: p.sku || "",
      brand: p.brand?.name || "Portabianco",
      category: p.category || "",
      url: p.url || "",
      image: (p.image || [])[0] || "",
      images: p.image || [],
      price_try_kdv_dahil: p.offers?.price ? Number(p.offers.price) : null,
      gtin13: p.gtin13 || "",
      fetched_at: new Date().toISOString().slice(0, 10),
    };
  });
}

async function fetchPage(pg) {
  const qs = new URLSearchParams({ q: "portabianco", Arama: "portabianco" });
  if (pg > 1) qs.set("pg", String(pg));
  const url = `https://www.cafemarkt.com/arama?${qs.toString()}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const html = await res.text();
  const items = parseItemList(html);
  const totalM = html.match(/<strong>(\d+)<\/strong>\s*ürün görüntüleniyor/);
  const lastPgM = html.match(/class="last"[^>]+href="[^"]*pg=(\d+)"/);
  return {
    pg,
    items,
    total: totalM ? Number(totalM[1]) : items.length,
    lastPg: lastPgM ? Number(lastPgM[1]) : pg,
  };
}

async function main() {
  const map = new Map();
  const first = await fetchPage(1);
  const lastPg = first.lastPg || 1;
  console.log(`[cafemarkt-pb] toplam ~${first.total} urun, ${lastPg} sayfa`);

  for (let pg = 1; pg <= lastPg; pg++) {
    const page = pg === 1 ? first : await fetchPage(pg);
    for (const row of page.items) {
      if (!/portabianco/i.test(`${row.brand} ${row.name}`)) continue;
      const key = row.cafemarkt_id || row.code || row.url;
      map.set(key, row);
    }
    console.log(`[cafemarkt-pb] sayfa ${pg}: +${page.items.length} → birlesik ${map.size}`);
    if (pg < lastPg) await sleep(350);
  }

  const rows = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2), "utf8");
  console.log(`[cafemarkt-pb] yazildi: ${OUT} (${rows.length} urun)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
