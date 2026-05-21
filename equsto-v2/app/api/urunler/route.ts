import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { parseAdminUrunPayload } from "@/lib/admin-urun";
import { loadLegacyCatalogRows, legacyCatalogExists } from "@/lib/legacy-catalog";
import { db } from "@/lib/db";
import { slugifyTr } from "@/lib/slug";

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    if (await legacyCatalogExists()) {
      const data = await loadLegacyCatalogRows();
      return adminOk({ data, count: data.length, source: "legacy" });
    }
  } catch (e) {
    console.warn("[GET /urunler] legacy:", e);
  }

  try {
    const products = await db.product.findMany({
      include: { brand: true, category: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    const { prismaToAdminUrun } = await import("@/lib/admin-urun");
    const data = products.map(prismaToAdminUrun);
    return adminOk({ data, count: data.length, source: "db" });
  } catch {
    return adminOk({ data: [], count: 0, source: "empty" });
  }
}

export async function POST(req: NextRequest) {
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
        name: parsed.name,
        description: parsed.description,
        priceListTl: parsed.priceListTl,
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
      503
    );
  }
}
