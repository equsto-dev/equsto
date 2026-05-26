/**
 * Rakip / tedarikçi site marka sızıntılarını katalog metinlerinden temizler.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isCompetitorUrl,
  isResellerBrand as isResellerBrandHost,
  normTr,
} from "./competitor-domains.mjs";
import {
  replaceCompetitorUrlsInText,
  resolveCompetitorUrl,
} from "./competitor-url-resolve.mjs";

export { normTr } from "./competitor-domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..", "..");

export const NEUTRAL_BRAND = "Equsto";

export function isResellerBrand(brand) {
  return isResellerBrandHost(brand);
}

const NAME_PREFIX_RE =
  /^(kariyermutfak|kariyer\s*mutfak|cafemarkt|global\s*mutfak|iles(\s*end[uü]striyel)?)\s+/giu;

export function cleanVendorFromName(name) {
  let n = String(name ?? "").trim();
  if (!n) return n;
  n = n.replace(NAME_PREFIX_RE, "");
  n = n.replace(/^kar[iİIıİ̇]yer(\s*mutfak)?\s+/gi, "");
  n = n.replace(/\s+kar[iİIı]yer[\s\-_]*[a-z0-9\-]*\s*$/gi, "");
  n = n.replace(/\s+KARİYER[\s\-_]*[A-Z0-9\-]*\s*$/gi, "");
  return n.replace(/\s+/g, " ").trim();
}

export function scrubSpecsText(text, index = null, ctx = {}) {
  if (text == null || text === "") return text;
  let t = String(text);
  t = t.replace(/\bKariyer\s*Mutfak\b/gi, NEUTRAL_BRAND);
  t = t.replace(/\bKariyermutfak\b/gi, NEUTRAL_BRAND);
  t = t.replace(/\bCafemarkt\b/gi, NEUTRAL_BRAND);
  t = t.replace(/\bGlobal\s*Mutfak\b/gi, NEUTRAL_BRAND);
  t = t.replace(/\bKARİYERMUTFAK\b/g, NEUTRAL_BRAND);
  t = t.replace(/\bKARİYER[\s\-_]*[A-Z0-9\-]+\b/g, (m) =>
    m.replace(/^KARİYER[\s\-_]*/i, "EQ-")
  );
  const lines = t.split(/\r?\n/);
  if (lines[0]) lines[0] = cleanVendorFromName(lines[0]);
  t = lines.join("\n");
  return replaceCompetitorUrlsInText(t, index, ctx);
}

export function neutralizeSku(sku) {
  const s = String(sku ?? "").trim();
  if (!s) return s;
  if (/^kar[iİIı]yer/i.test(s)) {
    return s.replace(/^kar[iİIı]yer[\s\-_]*/i, "EQ-");
  }
  return s;
}

function productCtx(p) {
  return {
    dept: p.dept,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
  };
}

/** @param {Record<string, unknown>} p @param {object|null} [index] */
export function sanitizeCatalogProduct(p, index = null) {
  if (!p || typeof p !== "object") return p;
  const ctx = productCtx(p);
  const out = { ...p };
  if (isResellerBrand(out.brand)) out.brand = NEUTRAL_BRAND;
  if (out.name) out.name = cleanVendorFromName(out.name);
  if (out.specs) out.specs = scrubSpecsText(out.specs, index, ctx);
  if (out.description) out.description = scrubSpecsText(out.description, index, ctx);
  if (out.aciklama) out.aciklama = scrubSpecsText(out.aciklama, index, ctx);
  if (out.sku) out.sku = neutralizeSku(out.sku);
  if (out.sourceUrl && isCompetitorUrl(String(out.sourceUrl))) {
    const dest = resolveCompetitorUrl(String(out.sourceUrl), index, ctx);
    if (dest) out.sourceUrl = `https://equsto.com${dest}`;
    else delete out.sourceUrl;
  }
  return out;
}

export function sanitizeCatalogList(list, index = null) {
  if (!Array.isArray(list)) return list;
  let n = 0;
  for (let i = 0; i < list.length; i++) {
    const before = JSON.stringify(list[i]);
    list[i] = sanitizeCatalogProduct(list[i], index);
    if (JSON.stringify(list[i]) !== before) n++;
  }
  return { list, changed: n };
}

const LEAK_HOST_RE =
  /kariyermutfak\.com|cafemarkt\.com|globalmutfak\.com|iles\.com\.tr/i;

export function catalogHasVendorLeak(p) {
  if (!p) return false;
  if (isResellerBrand(p.brand)) return true;
  const n = String(p.name || "");
  if (/kariyer|kariyermutfak|cafemarkt|globalmutfak/i.test(n)) return true;
  const blob = [p.specs, p.description, p.sourceUrl].join(" ");
  if (LEAK_HOST_RE.test(blob)) return true;
  if (p.sku && /^kar[iİIı]yer/i.test(String(p.sku))) return true;
  return false;
}
