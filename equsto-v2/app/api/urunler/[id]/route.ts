import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { parseAdminUrunPayload } from "@/lib/admin-urun";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { id } = await params;
  if (String(id).startsWith("ecom_")) {
    return adminErr("Katalog satırı (ecom_*) — silip yeniden ekleyin veya JSON düzenleyin.", 400);
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
        description: parsed.description,
        priceListTl: parsed.priceListTl,
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

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = assertAdminBearer(_req);
  if (denied) return denied;

  const { id } = await params;
  if (String(id).startsWith("ecom_")) {
    return adminErr("Katalog satırı için DELETE /urunler/katalog/:index kullanın.", 400);
  }

  try {
    await db.product.delete({ where: { id } });
    return adminOk({});
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Silme başarısız";
    return adminErr(msg, 503);
  }
}
