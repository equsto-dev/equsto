/**
 * GMC ek görsel kırpımı — tek fotoğraflı ürünler için detay / üst / yakın plan.
 * GET /api/gmc/img/:variant?src=images/catalog/...
 */
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import sharp from "sharp";
import {
  GMC_CROP_VARIANTS,
  isGmcCropVariant,
  sanitizeGmcSourceRel,
  type GmcCropVariant,
} from "@/lib/gmc-additional-images";
import { getAssetCdnBase } from "@/lib/asset-cdn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_PX = 500;
const OUT_PX = 1000;
const CACHE_DIR = path.join(process.cwd(), "var", "gmc-img-cache");

type CropSpec = { left: number; top: number; width: number; height: number };

function cropForVariant(
  variant: GmcCropVariant,
  width: number,
  height: number,
): CropSpec {
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  if (variant === "detail") {
    const w = Math.max(1, Math.round(width * 0.72));
    const h = Math.max(1, Math.round(height * 0.72));
    return {
      left: clamp(Math.round((width - w) / 2), 0, Math.max(0, width - w)),
      top: clamp(Math.round((height - h) / 2), 0, Math.max(0, height - h)),
      width: Math.min(w, width),
      height: Math.min(h, height),
    };
  }
  if (variant === "upper") {
    const w = Math.max(1, Math.round(width * 0.78));
    const h = Math.max(1, Math.round(height * 0.62));
    const top = clamp(Math.round(height * 0.06), 0, Math.max(0, height - h));
    return {
      left: clamp(Math.round((width - w) / 2), 0, Math.max(0, width - w)),
      top,
      width: Math.min(w, width),
      height: Math.min(h, height - top),
    };
  }
  const w = Math.max(1, Math.round(width * 0.52));
  const h = Math.max(1, Math.round(height * 0.52));
  return {
    left: clamp(Math.round((width - w) / 2), 0, Math.max(0, width - w)),
    top: clamp(Math.round((height - h) / 2), 0, Math.max(0, height - h)),
    width: Math.min(w, width),
    height: Math.min(h, height),
  };
}

async function loadSourceBuffer(rel: string): Promise<Buffer | null> {
  const local = path.join(process.cwd(), "public", rel);
  try {
    return await fs.readFile(local);
  } catch {
    /* CDN fallback */
  }

  const cdn = getAssetCdnBase();
  if (!cdn) return null;
  const url = `${cdn}/${rel.split("/").map(encodeURIComponent).join("/")}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Equsto-GMC-Img/1.0 (+https://equsto.com)" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct && !/^image\//i.test(ct) && !/octet-stream/i.test(ct)) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function renderCrop(variant: GmcCropVariant, rel: string): Promise<Buffer | null> {
  const src = await loadSourceBuffer(rel);
  if (!src?.length) return null;

  const meta = await sharp(src, { failOn: "none" }).rotate().metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (width < 64 || height < 64) return null;

  const crop = cropForVariant(variant, width, height);
  const side = Math.max(MIN_PX, Math.min(OUT_PX, Math.max(crop.width, crop.height, MIN_PX)));

  return sharp(src, { failOn: "none" })
    .rotate()
    .extract(crop)
    .resize({
      width: side,
      height: side,
      fit: "cover",
      position: "centre",
      withoutEnlargement: false,
    })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

function cacheKey(variant: string, rel: string): string {
  return createHash("sha1").update(`${variant}|${rel}`).digest("hex");
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ variant: string }> },
) {
  const { variant: rawVariant } = await ctx.params;
  const variant = String(rawVariant || "").toLowerCase();
  if (!isGmcCropVariant(variant)) {
    return new Response(`variant must be one of: ${GMC_CROP_VARIANTS.join(", ")}`, {
      status: 400,
    });
  }

  const src = sanitizeGmcSourceRel(req.nextUrl.searchParams.get("src") || "");
  if (!src) {
    return new Response("invalid src", { status: 400 });
  }

  const key = cacheKey(variant, src);
  const cachePath = path.join(CACHE_DIR, `${key}.jpg`);

  try {
    const cached = await fs.readFile(cachePath);
    if (cached.length > 1000) {
      return new Response(new Uint8Array(cached), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
          "X-Equsto-Gmc-Img": "cache",
        },
      });
    }
  } catch {
    /* miss */
  }

  const buf = await renderCrop(variant, src);
  if (!buf?.length) {
    return new Response("image unavailable", { status: 404 });
  }

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cachePath, buf);
  } catch {
    /* cache write best-effort */
  }

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      "X-Equsto-Gmc-Img": "miss",
    },
  });
}
