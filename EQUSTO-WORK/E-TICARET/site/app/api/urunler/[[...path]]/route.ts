import { NextRequest } from "next/server";
import type { Prisma } from "@/lib/prisma";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { parseAdminUrunPayload } from "@/lib/admin-urun";
import {
  deleteLegacyCatalogIndex,
  loadLegacyCatalogRows,
  legacyCatalogExists,
} from "@/lib/legacy-catalog";
import { db } from "@/lib/db";
import { slugifyTr } from "@/lib/slug";

type Ctx = { params: Promise<{ path?: string[] }> };

async function productId(ctx: Ctx): Promise<string | null> {
  const { path } = await ctx.params;
  if (!path?.length || path.length !== 1) return null;
  return path[0];
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const id = await productId(ctx);
  if (id) return adminErr("Tek ürün GET desteklenmiyor", 405);

  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  if (sp.get("meta") === "1") {
    try {
      const [brands, categories] = await Promise.all([
        db.brand.findMany({
          orderBy: { name: "asc" },
          select: { id: true, slug: true, name: true },
        }),
        db.category.findMany({
          orderBy: { name: "asc" },
          select: { id: true, slug: true, name: true },
        }),
      ]);
      return adminOk({ brands, categories });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Meta okunamadı";
      return adminErr(msg, 503);
    }
  }

  const marka = sp.get("marka")?.trim() || "";
  const kategori = sp.get("kategori")?.trim() || "";
  const q = sp.get("q")?.trim() || "";

  try {
    const products = await db.product.findMany({
      where: {
        ...(marka ? { brand: { slug: marka } } : {}),
        ...(kategori ? { category: { slug: kategori } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                { modelCode: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { brand: true, category: true, images: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    if (products.length > 0) {
      const { prismaToAdminUrun } = await import("@/lib/admin-urun");
      return adminOk({
        data: products.map(prismaToAdminUrun),
        count: products.length,
        source: "db",
      });
    }
  } catch (e) {
    console.warn("[GET /urunler] db:", e);
  }

  try {
    if (await legacyCatalogExists()) {
      const data = await loadLegacyCatalogRows();
      return adminOk({ data, count: data.length, source: "legacy" });
    }
  } catch (e) {
    console.warn("[GET /urunler] legacy:", e);
  }

  return adminOk({ data: [], count: 0, source: "empty" });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const id = await productId(ctx);
  if (id) return adminErr("POST yalnızca /api/urunler", 400);

  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseAdminUrunPayload(body);
  if ("error" in parsed) return adminErr(parsed.error);

  try {
    const brand = await db.brand.upsert({
      where: { slug: parsed.brandSlug },
      update: {},
      create: { slug: parsed.brandSlug, name: parsed.brandSlug },
    });
    const category = await db.category.upsert({
      where: { slug: parsed.categorySlug },
      update: {},
      create: { slug: parsed.categorySlug, name: parsed.categorySlug },
    });

    const slug = slugifyTr(`${brand.slug}-${parsed.modelCode}`) || slugifyTr(parsed.name);
    const product = await db.product.create({
      data: {
        slug,
        modelCode: parsed.modelCode,
        sku: parsed.sku,
        name: parsed.name,
        description: parsed.description,
        priceListTl: parsed.priceListTl,
        stok: parsed.stok,
        elektrikGucuKw: parsed.elektrikGucuKw,
        gazGucuKw: parsed.gazGucuKw,
        pfosAktif: parsed.pfosAktif,
        status: parsed.status,
        brandId: brand.id,
        categoryId: category.id,
        specs: parsed.specs as Prisma.InputJsonValue,
      },
    });

    return adminOk({
      data: {
        id: product.id,
        ad: product.name,
        tip_kodu: product.modelCode,
        kategori: category.slug,
        marka_id: brand.slug,
        durum: parsed.status === "PUBLISHED" ? "aktif" : "pasif",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Veritabanı kaydı başarısız";
    return adminErr(
      `Supabase bağlantısı yok veya şema eksik: ${msg}. Önce db:migrate:deploy çalıştırın.`,
      503,
    );
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const id = await productId(ctx);
  if (!id) return adminErr("Ürün id gerekli: /api/urunler/{id}", 400);

  if (String(id).startsWith("ecom_")) {
    return adminErr("Katalog satırı (ecom_*) — silip yeniden ekleyin.", 400);
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseAdminUrunPayload(body);
  if ("error" in parsed) return adminErr(parsed.error);

  try {
    const brand = await db.brand.upsert({
      where: { slug: parsed.brandSlug },
      update: {},
      create: { slug: parsed.brandSlug, name: parsed.brandSlug },
    });
    const category = await db.category.upsert({
      where: { slug: parsed.categorySlug },
      update: {},
      create: { slug: parsed.categorySlug, name: parsed.categorySlug },
    });

    const product = await db.product.update({
      where: { id },
      data: {
        name: parsed.name,
        modelCode: parsed.modelCode,
        sku: parsed.sku,
        description: parsed.description,
        priceListTl: parsed.priceListTl,
        stok: parsed.stok,
        elektrikGucuKw: parsed.elektrikGucuKw,
        gazGucuKw: parsed.gazGucuKw,
        pfosAktif: parsed.pfosAktif,
        status: parsed.status,
        brandId: brand.id,
        categoryId: category.id,
        specs: parsed.specs as Prisma.InputJsonValue,
      },
    });

    return adminOk({ data: { id: product.id } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Güncelleme başarısız";
    return adminErr(msg, 503);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const id = await productId(ctx);
  if (!id) {
    const raw = req.nextUrl.searchParams.get("katalogIndex");
    if (raw == null || raw === "") {
      return adminErr("katalogIndex veya /api/urunler/{id} gerekli", 400);
    }
    const i = parseInt(raw, 10);
    if (Number.isNaN(i) || i < 0) return adminErr("Geçersiz indeks", 400);
    try {
      const ok = await deleteLegacyCatalogIndex(i);
      if (!ok) return adminErr("Katalog indeksi bulunamadı", 404);
      return adminOk({ index: i });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Katalog silinemedi";
      return adminErr(msg, 500);
    }
  }

  if (String(id).startsWith("ecom_")) {
    return adminErr("Katalog satırı için ?katalogIndex= kullanın.", 400);
  }

  try {
    await db.product.delete({ where: { id } });
    return adminOk({});
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Silme başarısız";
    return adminErr(msg, 503);
  }
}
