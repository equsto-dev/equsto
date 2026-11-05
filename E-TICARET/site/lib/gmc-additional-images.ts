/**
 * GMC / mağaza kalitesi — fırsat başına görsel.
 * Tek fotoğraflı ürünlere detay kırpımları ekler (additional_image_link + PDP/JSON-LD).
 */

import fs from "node:fs";
import path from "node:path";
import { absoluteAssetUrl } from "@/lib/asset-cdn";
import { resolveCatalogImagePath } from "@/lib/catalog-image-resolve";
import { getSiteOrigin } from "@/lib/site-origin";

export const GMC_MIN_IMAGES_PER_OFFER = 4;
export const GMC_MAX_ADDITIONAL_IMAGES = 10;
/** GMC image_link minimum (Google: 500×500, Ocak 2027 zorunlu). */
export const GMC_MIN_IMAGE_PX = 500;

export const GMC_CROP_VARIANTS = ["detail", "upper", "closeup"] as const;
export type GmcCropVariant = (typeof GMC_CROP_VARIANTS)[number];

/** Ana görsel: kırpma yok, yalnızca min kenar güvence. */
export const GMC_HERO_VARIANT = "hero" as const;
export type GmcHeroVariant = typeof GMC_HERO_VARIANT;
export type GmcImgVariant = GmcCropVariant | GmcHeroVariant;

export function isGmcImgVariant(v: string): v is GmcImgVariant {
  return v === GMC_HERO_VARIANT || isGmcCropVariant(v);
}

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

export function buildGmcCropApiPath(variant: GmcImgVariant, sourceRel: string): string {
  const rel = sanitizeGmcSourceRel(sourceRel);
  if (!rel) return "";
  return `/api/gmc/img/${variant}?src=${encodeURIComponent(rel)}`;
}

export function buildGmcCropApiUrl(
  origin: string,
  variant: GmcImgVariant,
  sourceRel: string,
): string {
  const path = buildGmcCropApiPath(variant, sourceRel);
  if (!path) return "";
  const base = String(origin || getSiteOrigin() || "").replace(/\/$/, "");
  return `${base}${path}`;
}

/** image_link için min-px güvence URL’si (kaynak küçükse sunucu büyütür). */
export function buildGmcEnsureHeroUrl(origin: string, sourceRel: string): string {
  return buildGmcCropApiUrl(origin, GMC_HERO_VARIANT, sourceRel);
}

/**
 * Yerel dosya çok küçükse (tipik 400×400 CafeMarkt ~9–12KB) GMC hero API’ye yönlendir.
 * Büyük / CDN-only dosyalara dokunmaz.
 */
export function shouldEnsureGmcHeroRel(rel: string): boolean {
  const clean = sanitizeGmcSourceRel(rel);
  if (!clean) return false;
  try {
    const abs = path.join(process.cwd(), "public", clean);
    const st = fs.statSync(abs);
    // 800×800 -B ~20–40KB; 400×400 hash ~8–12KB
    return st.size > 0 && st.size < 18_000;
  } catch {
    return false;
  }
}

/**
 * Ana görsel + ek fotoğraflar (+ gerekirse kırpım API).
 * Feed, JSON-LD ve istemci galeri için ortak.
 */
export function expandOfferImageUrls(
  photoRels: string[],
  origin: string,
  opts?: {
    minTotal?: number;
    maxAdditional?: number;
    includeSynthetic?: boolean;
    /** true: küçük yerel hero → /api/gmc/img/hero (GMC 500×500) */
    ensureHeroMin?: boolean;
    /**
     * true: CDN yerine site origin kullan.
     * Hetzner public/ güncel, S3/CloudFront gecikmeli olduğunda GMC eski 400px görmesin.
     */
    preferOrigin?: boolean;
  },
): { imageLink: string; additionalImageLinks: string[] } {
  const minTotal = opts?.minTotal ?? GMC_MIN_IMAGES_PER_OFFER;
  const maxAdditional = opts?.maxAdditional ?? GMC_MAX_ADDITIONAL_IMAGES;
  const includeSynthetic = opts?.includeSynthetic !== false;
  const ensureHeroMin = opts?.ensureHeroMin === true;
  // Feed yolu: ensureHeroMin ile birlikte origin tercih et (CDN lag güvenliği).
  const preferOrigin = opts?.preferOrigin === true || ensureHeroMin;

  const abs = photoRels
    .map((rel) => {
      const path = rel.startsWith("/") ? rel : `/${rel}`;
      if (preferOrigin) {
        const base = String(origin || getSiteOrigin() || "").replace(/\/$/, "");
        return base ? `${base}${path}` : absoluteAssetUrl(path, origin);
      }
      return absoluteAssetUrl(path, origin);
    })
    .filter(Boolean);
  if (!abs.length) return { imageLink: "", additionalImageLinks: [] };

  let imageLink = abs[0];
  if (ensureHeroMin && shouldEnsureGmcHeroRel(photoRels[0])) {
    const ensured = buildGmcEnsureHeroUrl(origin, photoRels[0]);
    if (ensured) imageLink = ensured;
  }
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
