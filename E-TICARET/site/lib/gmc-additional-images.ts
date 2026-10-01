/**
 * GMC / mağaza kalitesi — fırsat başına görsel.
 * Tek fotoğraflı ürünlere detay kırpımları ekler (additional_image_link + PDP/JSON-LD).
 */

import { absoluteAssetUrl } from "@/lib/asset-cdn";
import { resolveCatalogImagePath } from "@/lib/catalog-image-resolve";
import { getSiteOrigin } from "@/lib/site-origin";

export const GMC_MIN_IMAGES_PER_OFFER = 4;
export const GMC_MAX_ADDITIONAL_IMAGES = 10;

export const GMC_CROP_VARIANTS = ["detail", "upper", "closeup"] as const;
export type GmcCropVariant = (typeof GMC_CROP_VARIANTS)[number];

const PHOTO_EXT = /\.(jpe?g|png|webp|gif|bmp|tiff?)(\?|#|$)/i;
const TECH_IMG =
  /kesit|wireframe|placeholder|model-\d+\.|\.svg(\?|#|$)|\.pdf(\?|#|$)/i;

export function isGmcPhotoRef(raw: string): boolean {
  const s = String(raw || "").trim();
  if (!s) return false;
  if (!PHOTO_EXT.test(s)) return false;
  if (TECH_IMG.test(s)) return false;
  return true;
}

/** Teknik çizim / svg / pdf hariç katalog foto yolları (sıra korunur, tekilleştirilir). */
export function collectGmcPhotoRels(images: unknown[] | undefined | null): string[] {
  if (!Array.isArray(images) || !images.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of images) {
    const s = String(raw || "").trim();
    if (!isGmcPhotoRef(s)) continue;
    const resolved = resolveCatalogImagePath(s);
    if (!resolved) continue;
    const key = resolved.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(resolved.startsWith("/") ? resolved.slice(1) : resolved);
  }
  return out;
}

export function isGmcCropVariant(v: string): v is GmcCropVariant {
  return (GMC_CROP_VARIANTS as readonly string[]).includes(v);
}

/** Güvenli katalog göreli yolu — SSRF yok; yalnızca images/ veya data/ altı. */
export function sanitizeGmcSourceRel(raw: string): string {
  let s = String(raw || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep */
  }
  s = s.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!s || s.includes("..") || s.includes("\0")) return "";
  if (/^https?:\/\//i.test(s)) return "";
  if (!(s.startsWith("images/") || s.startsWith("data/"))) return "";
  if (!PHOTO_EXT.test(s)) return "";
  if (TECH_IMG.test(s)) return "";
  return s;
}

export function buildGmcCropApiPath(variant: GmcCropVariant, sourceRel: string): string {
  const rel = sanitizeGmcSourceRel(sourceRel);
  if (!rel) return "";
  return `/api/gmc/img/${variant}?src=${encodeURIComponent(rel)}`;
}

export function buildGmcCropApiUrl(
  origin: string,
  variant: GmcCropVariant,
  sourceRel: string,
): string {
  const path = buildGmcCropApiPath(variant, sourceRel);
  if (!path) return "";
  const base = String(origin || getSiteOrigin() || "").replace(/\/$/, "");
  return `${base}${path}`;
}

/**
 * Ana görsel + ek fotoğraflar (+ gerekirse kırpım API).
 * Feed, JSON-LD ve istemci galeri için ortak.
 */
export function expandOfferImageUrls(
  photoRels: string[],
  origin: string,
  opts?: { minTotal?: number; maxAdditional?: number; includeSynthetic?: boolean },
): { imageLink: string; additionalImageLinks: string[] } {
  const minTotal = opts?.minTotal ?? GMC_MIN_IMAGES_PER_OFFER;
  const maxAdditional = opts?.maxAdditional ?? GMC_MAX_ADDITIONAL_IMAGES;
  const includeSynthetic = opts?.includeSynthetic !== false;

  const abs = photoRels
    .map((rel) => absoluteAssetUrl(rel.startsWith("/") ? rel : `/${rel}`, origin))
    .filter(Boolean);
  if (!abs.length) return { imageLink: "", additionalImageLinks: [] };

  const imageLink = abs[0];
  const additional: string[] = [];
  const seen = new Set<string>([imageLink.toLowerCase()]);

  const push = (url: string) => {
    if (!url) return;
    const k = url.toLowerCase();
    if (seen.has(k)) return;
    if (additional.length >= maxAdditional) return;
    seen.add(k);
    additional.push(url);
  };

  for (const u of abs.slice(1)) push(u);

  if (includeSynthetic && abs.length + additional.length < minTotal) {
    const heroRel = photoRels[0];
    for (const variant of GMC_CROP_VARIANTS) {
      if (1 + additional.length >= minTotal) break;
      push(buildGmcCropApiUrl(origin, variant, heroRel));
    }
  }

  return { imageLink, additionalImageLinks: additional };
}

/** PDP / JSON-LD: tüm görsel URL listesi (ana + ek). */
export function expandOfferImageUrlList(
  photoRels: string[],
  origin: string,
  opts?: { minTotal?: number; maxAdditional?: number; includeSynthetic?: boolean },
): string[] {
  const { imageLink, additionalImageLinks } = expandOfferImageUrls(photoRels, origin, opts);
  if (!imageLink) return [];
  return [imageLink, ...additionalImageLinks];
}
