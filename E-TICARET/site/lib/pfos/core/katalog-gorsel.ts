
import fs from "node:fs";
import path from "node:path";
import { loadLegacyCatalogRows } from "@/lib/legacy-catalog";
import type { EslesmisUrun, PFOSKalemi } from "../schemas/pfos.schema";
import {
  equstoGorselRelFromSku,
  normalizePfosGorselUrl,
  oztiWebImageRelFromSku,
  portashelfGorselRelFromSku,
} from "./katalog-gorsel-url";
import { isPortashelfSku, PORTASHELF_304_GORSEL_REL } from "./portashelf-fiyat";
import { equstoPimakGorselRelFromSku } from "./equsto-pimak-gorsel";
import { isEqustoDavlumbazRow } from "./davlumbaz-marka";
import { tezgahEvyeGorselRel } from "./tezgah-evye-gorsel";

export {
  equstoGorselRelFromSku,
  normalizePfosGorselUrl,
  oztiWebImageRelFromSku,
} from "./katalog-gorsel-url";

function normSku(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
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
    const relPath = clean.replace(/\//g, path.sep);
    const bases = [
      path.join(process.cwd(), "public", "data", relPath),
      path.join(process.cwd(), "public", relPath),
    ];
    return bases.some(
      (abs) => fs.existsSync(abs) && fs.statSync(abs).size > 512,
    );
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
  tanim?: string | null,
): Promise<string | null> {
  const key = normSku(sku);
  if (!key) return normalizePfosGorselUrl(existing);

  if (isPortashelfSku(key)) {
    return normalizePfosGorselUrl(PORTASHELF_304_GORSEL_REL);
  }

  const evyeRel = tezgahEvyeGorselRel(key, tanim);
  if (evyeRel) return evyeRel;

  const index = await loadSkuGorselIndex();
  const fromCatalog = index.get(key);

  const pimakTezgah = equstoPimakGorselRelFromSku(key, tanim);
  const legacyPimakTezgah = pimakTezgah
    ? pimakTezgah.replace(/^images\/catalog\/pimak\/pimak-/, "images/catalog/equsto/equsto-")
    : null;
  const ozti = oztiWebImageRelFromSku(key);
  const portashelf = portashelfGorselRelFromSku(key);
  const equstoDir = equstoGorselRelFromSku(key);
  const equstoCandidates = equstoDir
    ? [
        pimakTezgah,
        `${equstoDir}/p193-prod00.jpeg`,
        `${equstoDir}/p193-prod00.jpg`,
        `${equstoDir.replace("images/catalog/equsto/", "images/")}_1.jpg`,
      ]
    : [];

  const hit = firstExistingImageRel([
    existing,
    pimakTezgah,
    legacyPimakTezgah,
    portashelf,
    fromCatalog,
    ozti,
    ...equstoCandidates,
  ]);

  const tanimL = String(tanim ?? "").toLowerCase();
  const isDavSku =
    isEqustoDavlumbazRow(key) || /^(7885|9885)\./i.test(key);
  if (tanimL && !/davlumbaz/.test(tanimL) && isDavSku) {
    const safe = firstExistingImageRel([
      existing,
      pimakTezgah,
      portashelf,
      equstoPimakGorselRelFromSku(key, tanim),
    ]);
    return normalizePfosGorselUrl(safe ?? existing);
  }

  const finalHit = hit ?? existing ?? fromCatalog ?? ozti;
  if (
    tanimL &&
    /induksiyon|indüksiyon|ocak|mikser|mikser/.test(tanimL) &&
    finalHit &&
    /market|inci|vitrin|display|tatlı|tatli|caglayan|cupcake|cake/i.test(
      String(finalHit),
    )
  ) {
    const alt = equstoPimakGorselRelFromSku(key, tanim) ?? existing;
    if (alt) return normalizePfosGorselUrl(alt);
    return normalizePfosGorselUrl(existing);
  }

  if (
    tanim &&
    /pasta|pastane|tatli|tatlı|borek|börek/.test(tanim.toLowerCase())
  ) {
    if (finalHit && /market|inci|lale|nergis|lotus|nilufer/i.test(String(finalHit))) {
      return "/data/caglayan-market/krizantem/Krizantem-01-Caglayan-Refrigeration.webp";
    }
  }

  if (hit) return normalizePfosGorselUrl(hit);
  return normalizePfosGorselUrl(existing ?? fromCatalog ?? ozti);
}

export async function enrichEslesmisGorsel(
  urun: EslesmisUrun | null | undefined,
): Promise<EslesmisUrun | null> {
  if (!urun) return null;

  const sku = urun.sku?.trim();
  if (sku && isPortashelfSku(sku)) {
    const canonical = normalizePfosGorselUrl(PORTASHELF_304_GORSEL_REL);
    if (canonical && canonical !== urun.gorselUrl) {
      return { ...urun, gorselUrl: canonical };
    }
    return urun;
  }

  const evyeRel = tezgahEvyeGorselRel(sku, urun.ad);
  if (evyeRel) {
    return { ...urun, gorselUrl: evyeRel };
  }

  const normalizedExisting = normalizePfosGorselUrl(urun.gorselUrl);
  if (normalizedExisting && localPublicFileExists(normalizedExisting.replace(/^\/data\//, ""))) {
    if (
      urun.ad &&
      /pasta|pastane|tatli|tatlı|borek|börek/.test(urun.ad.toLowerCase()) &&
      /market|inci|lale|nergis|lotus|nilufer/i.test(normalizedExisting)
    ) {
      return { ...urun, gorselUrl: "/data/caglayan-market/krizantem/Krizantem-01-Caglayan-Refrigeration.webp" };
    }
    if (normalizedExisting !== urun.gorselUrl) {
      return { ...urun, gorselUrl: normalizedExisting };
    }
    return urun;
  }

  if (!sku) {
    return normalizedExisting ? { ...urun, gorselUrl: normalizedExisting } : urun;
  }

  const gorselUrl = await resolveGorselUrlBySku(sku, urun.gorselUrl, urun.ad ?? undefined);
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
    if (!u?.sku?.trim()) {
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
