/**
 * Rakip URL → Equsto ürün / departman yolu eşlemesi.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { categoryToDeptSeg, productSlug, productPath } from "../eq-seo-lib.mjs";
import { classifyProduct } from "./catalog-classify.mjs";
import { isCompetitorUrl, normTr } from "./competitor-domains.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..", "..");
export const INDEX_PATH = join(ROOT, "public", "data", "competitor-url-index.json");
export const MAP_PATH = join(ROOT, "public", "data", "competitor-url-map.json");
export const REDIRECTS_PATH = join(ROOT, "public", "data", "competitor-slug-redirects.json");

export function equstoProductPath(p) {
  const { dept } = classifyProduct(p);
  const deptSeg = dept || categoryToDeptSeg(p.category) || "pisirme";
  const slug = productSlug(p.brand, p.name);
  return productPath(deptSeg, slug);
}

export function equstoDeptPath(dept) {
  const d = String(dept || "pisirme").trim();
  return `/shop/${d}`;
}

function normKey(s) {
  return normTr(s).replace(/[^a-z0-9]+/g, "");
}

function normUrlKey(url) {
  try {
    const u = new URL(String(url).trim());
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "").toLowerCase()}`;
  } catch {
    return normTr(url);
  }
}

/** @param {unknown[]} catalog */
export function buildUrlIndex(catalog, manualMap = null) {
  const byUrl = {};
  const bySku = {};
  const byBarcode = {};
  const byName = {};

  for (const p of catalog) {
    if (!p || !p.name) continue;
  const path = equstoProductPath(p);
    if (p.sku) bySku[normKey(p.sku)] = path;
    if (p.barcode) byBarcode[normKey(p.barcode)] = path;
    byName[normKey(p.name)] = path;
    if (p.sourceUrl && !isCompetitorUrl(p.sourceUrl)) {
      byUrl[normUrlKey(p.sourceUrl)] = path;
    }
  }

  const overrides = manualMap?.overrides || [];
  for (const row of overrides) {
    const from = row.competitorUrl || row.from;
    const to = row.equstoPath || row.to;
    if (from && to) byUrl[normUrlKey(from)] = to.startsWith("/") ? to : `/${to}`;
  }

  return {
    version: 1,
    generated: new Date().toISOString().slice(0, 10),
    byUrl,
    bySku,
    byBarcode,
    byName,
  };
}

export function loadUrlIndex() {
  if (!existsSync(INDEX_PATH)) return null;
  return JSON.parse(readFileSync(INDEX_PATH, "utf8"));
}

export function loadManualMap() {
  if (!existsSync(MAP_PATH)) return { overrides: [] };
  return JSON.parse(readFileSync(MAP_PATH, "utf8"));
}

/**
 * Rakip URL → Equsto yolu; eşleşmezse departman veya /shop.
 * @param {string} url
 * @param {object|null} index
 * @param {{ dept?: string, sku?: string, barcode?: string, name?: string }} [ctx]
 */
export function resolveCompetitorUrl(url, index, ctx = {}) {
  if (!url || !isCompetitorUrl(url)) return null;
  const key = normUrlKey(url);
  if (index?.byUrl?.[key]) return index.byUrl[key];

  if (ctx.sku && index?.bySku?.[normKey(ctx.sku)]) return index.bySku[normKey(ctx.sku)];
  if (ctx.barcode && index?.byBarcode?.[normKey(ctx.barcode)]) return index.byBarcode[normKey(ctx.barcode)];
  if (ctx.name && index?.byName?.[normKey(ctx.name)]) return index.byName[normKey(ctx.name)];

  if (ctx.dept) return equstoDeptPath(ctx.dept);
  return "/shop";
}

export function replaceCompetitorUrlsInText(text, index, ctx = {}) {
  if (text == null || text === "") return text;
  let t = String(text);
  const urls = [...new Set((t.match(/https?:\/\/[^\s<"')]+/gi) || []).filter(isCompetitorUrl))];
  for (const raw of urls) {
    const dest = resolveCompetitorUrl(raw, index, ctx);
    const rep = dest ? `https://equsto.com${dest.startsWith("/") ? dest : "/" + dest}` : "https://equsto.com/shop";
    t = t.split(raw).join(rep);
  }
  for (const host of ["kariyermutfak.com", "cafemarkt.com", "globalmutfak.com", "iles.com.tr"]) {
    t = t.replace(new RegExp(`\\b${host.replace(/\./g, "\\.")}\\b`, "gi"), "equsto.com");
  }
  return t;
}
