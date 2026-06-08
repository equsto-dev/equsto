import fs from "node:fs";
import path from "node:path";
import { loadLegacyCatalogRows } from "@/lib/legacy-catalog";
import type { EslesmisUrun, PFOSKalemi } from "../schemas/pfos.schema";

function normSku(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

/** PFOS teklif / UI — katalog görsel yolu → tarayıcı URL */
export function normalizePfosGorselUrl(
  url: string | null | undefined,
): string | null {
  const raw = String(url ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  let rel = raw.replace(/^\.\//, "").replace(/^\/+/, "");
  if (rel.startsWith("data/")) return `/${rel}`;
  if (rel.startsWith("images/")) return `/data/${rel}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/** Öztiryakiler SKU → `images/catalog/ozti/web/ozti-….jpg` (ozti-enrich ile hizalı) */
export function oztiWebImageRelFromSku(sku: string): string | null {
  const k = normSku(sku);
  if (!/^[0-9]{2,4}[A-Z0-9]*\.[A-Z0-9.\-]{2,}$/i.test(k)) return null;
  const slug =
    "ozti-" +
    k
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "");
  return `images/catalog/ozti/web/${slug}.jpg`;
}

/** Equsto SKU → `images/catalog/equsto/equsto-…/` veya flat görsel */
export function equstoGorselRelFromSku(sku: string): string | null {
  const k = normSku(sku);
  const m = /^EQUSTO\.(\d{2})(\d{2})(\d{2})\.(\d{2})$/i.exec(k);
  if (!m) return null;
  const slug = `equsto-${m[1]}${m[2]}${m[3]}-${m[4]}`.toLowerCase();
  return `images/catalog/equsto/${slug}`;
}

let skuGorselIndex: Map<string, string> | null = null;

async function loadSkuGorselIndex(): Promise<Map<string, string>> {
  if (skuGorselIndex) return skuGorselIndex;
  const map = new Map<string, string>();
  const rows = await loadLegacyCatalogRows();
  for (const row of rows) {
    const sku = normSku(row.sku);
    const url = String(row.gorsel_url ?? "").trim();
    if (!sku || !url || map.has(sku)) continue;
    map.set(sku, url);
  }
  skuGorselIndex = map;
  return map;
}

function localPublicFileExists(rel: string): boolean {
  try {
    const clean = rel
      .replace(/^\.\//, "")
      .replace(/^\/data\//, "")
      .replace(/^data\//, "")
      .replace(/^\/+/, "");
    const abs = path.join(process.cwd(), "public", clean.replace(/\//g, path.sep));
    return fs.existsSync(abs) && fs.statSync(abs).size > 512;
  } catch {
    return false;
  }
}

function firstExistingImageRel(candidates: Array<string | null | undefined>): string | null {
  for (const c of candidates) {
    const rel = String(c ?? "").trim();
    if (!rel) continue;
    const normalized = normalizePfosGorselUrl(rel);
    if (!normalized) continue;
    const fileRel = normalized.replace(/^\/data\//, "");
    if (localPublicFileExists(fileRel)) return rel.startsWith("images/") ? rel : fileRel;
  }
  return null;
}

function hasKnownProductPrice(urun: EslesmisUrun): boolean {
  return Number(urun.fiyat) > 0 || Number(urun.fiyatEur) > 0;
}

/**
 * Stok kodu + fiyatı belli ürünler için görsel URL.
 * Önce ekipmanlar.json, sonra Öztiryakiler / Equsto yerel dosyaları.
 */
export async function resolveGorselUrlBySku(
  sku: string | null | undefined,
  existing?: string | null,
): Promise<string | null> {
  const key = normSku(sku);
  if (!key) return normalizePfosGorselUrl(existing);

  const index = await loadSkuGorselIndex();
  const fromCatalog = index.get(key);

  const ozti = oztiWebImageRelFromSku(key);
  const equstoDir = equstoGorselRelFromSku(key);
  const equstoCandidates = equstoDir
    ? [
        `${equstoDir}/p193-prod00.jpeg`,
        `${equstoDir}/p193-prod00.jpg`,
        `${equstoDir.replace("images/catalog/equsto/", "images/")}_1.jpg`,
      ]
    : [];

  const hit = firstExistingImageRel([
    existing,
    fromCatalog,
    ozti,
    ...equstoCandidates,
  ]);

  if (hit) return normalizePfosGorselUrl(hit);
  return normalizePfosGorselUrl(existing ?? fromCatalog ?? ozti);
}

export async function enrichEslesmisGorsel(
  urun: EslesmisUrun | null | undefined,
): Promise<EslesmisUrun | null> {
  if (!urun) return null;

  const sku = urun.sku?.trim();
  const normalizedExisting = normalizePfosGorselUrl(urun.gorselUrl);
  if (normalizedExisting && localPublicFileExists(normalizedExisting.replace(/^\/data\//, ""))) {
    if (normalizedExisting !== urun.gorselUrl) {
      return { ...urun, gorselUrl: normalizedExisting };
    }
    return urun;
  }

  if (!sku || !hasKnownProductPrice(urun)) {
    return normalizedExisting ? { ...urun, gorselUrl: normalizedExisting } : urun;
  }

  const gorselUrl = await resolveGorselUrlBySku(sku, urun.gorselUrl);
  if (!gorselUrl || gorselUrl === urun.gorselUrl) return urun;
  return { ...urun, gorselUrl };
}

/** SKU + fiyatı belli tüm kalemlere katalog görseli ekle */
export async function enrichPfosKalemlerGorsel(
  kalemler: PFOSKalemi[],
): Promise<PFOSKalemi[]> {
  const out: PFOSKalemi[] = [];
  for (const k of kalemler) {
    const u = k.urun;
    if (!u?.sku?.trim() || !hasKnownProductPrice(u)) {
      out.push(k);
      continue;
    }
    const urun = await enrichEslesmisGorsel(u);
    out.push(urun !== u ? { ...k, urun: urun! } : k);
  }
  return out;
}

export function invalidateKatalogGorselCache(): void {
  skuGorselIndex = null;
}
