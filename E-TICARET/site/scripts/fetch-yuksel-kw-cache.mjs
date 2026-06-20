#!/usr/bin/env node
/**
 * yukselsatis.com — eksik kW'lı ürün sayfalarından güç bilgisi önbelleği.
 *
 *   node scripts/fetch-yuksel-kw-cache.mjs
 *   node scripts/fetch-yuksel-kw-cache.mjs --brand portabianco
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseKwFromText } from "../lib/catalog/kw-resolve.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIP = path.join(ROOT, "var/catalog/ekipmanlar.json");
const OUT = path.join(ROOT, "scripts/data/yuksel-kw-cache.json");
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";

const brandFilter = process.argv.includes("--brand")
  ? process.argv[process.argv.indexOf("--brand") + 1]?.toLowerCase()
  : "";

function decodeHtml(s) {
  return String(s || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractProductText(html) {
  const chunks = [];
  for (const re of [
    /class="woocommerce-product-details__short-description"[^>]*>([\s\S]*?)<\/div/i,
    /id="tab-description"[^>]*>([\s\S]*?)<\/div/i,
    /woocommerce-product-attributes-item__label[^>]*>([\s\S]*?)<[\s\S]*?woocommerce-product-attributes-item__value[^>]*>([\s\S]*?)<\//gi,
  ]) {
    if (re.global) {
      for (const m of html.matchAll(re)) {
        if (m[2] != null) chunks.push(`${decodeHtml(m[1])}: ${decodeHtml(m[2])}`);
        else chunks.push(decodeHtml(m[1]));
      }
    } else {
      const m = html.match(re);
      if (m) chunks.push(decodeHtml(m[1]));
    }
  }
  return chunks.join("\n");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const rows = JSON.parse(fs.readFileSync(EKIP, "utf8"));
  let cache = {};
  if (fs.existsSync(OUT)) {
    try {
      cache = JSON.parse(fs.readFileSync(OUT, "utf8"));
    } catch (_) {}
  }

  const targets = rows.filter((row) => {
    const url = String(row.yukselsatis_url || "").trim();
    if (!url.includes("yukselsatis.com")) return false;
    if (brandFilter && !String(row.brand || "").toLowerCase().includes(brandFilter)) return false;
    if (row.el_guc > 0 || row.gaz_guc > 0 || row.olculer?.guc_kw) return false;
    return true;
  });

  let fetched = 0;
  let parsed = 0;

  for (const row of targets) {
    const url = row.yukselsatis_url.split("?")[0];
    if (cache[url]?.elektrikGucuKw != null || cache[url]?.gazGucuKw != null) continue;

    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        cache[url] = { ok: false, status: res.status, at: new Date().toISOString() };
        continue;
      }
      const html = await res.text();
      const blob = `${row.name}\n${extractProductText(html)}`;
      const kw = parseKwFromText(blob);
      cache[url] = {
        ok: true,
        sku: row.sku,
        name: row.name,
        brand: row.brand,
        elektrikGucuKw: kw.elektrikGucuKw,
        gazGucuKw: kw.gazGucuKw,
        at: new Date().toISOString(),
      };
      fetched++;
      if (kw.elektrikGucuKw != null || kw.gazGucuKw != null) parsed++;
    } catch (e) {
      cache[url] = { ok: false, error: String(e?.message || e), at: new Date().toISOString() };
    }
    await sleep(350);
  }

  fs.writeFileSync(OUT, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
  console.log(`[fetch-yuksel-kw] targets=${targets.length} fetched=${fetched} parsed=${parsed} → ${OUT}`);
}

main();
