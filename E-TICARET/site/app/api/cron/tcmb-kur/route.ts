import { NextRequest } from "next/server";
import { assertCronSecret } from "@/lib/cron-auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { euroSiteToTryTl } from "@/lib/equsto-pricing";
import { db } from "@/lib/db";
import { parseProductSpecs } from "@/lib/product-specs";
import { fetchTcmbEurEfektifSatis, kurToApiPayload } from "@/lib/tcmb-kur";
import { repriceDeptCatalogFromTcmb } from "@/lib/reprice-dept-catalog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * TCMB kuru: Prisma priceListTl + (yazılabilirse) dept JSON vitrin fiyatları.
 * Hafta içi 15:40 TR (12:40 UTC) — bülten sonrası.
 */
export async function GET(req: NextRequest) {
  const denied = assertCronSecret(req);
  if (denied) return denied;

  try {
    const kur = await fetchTcmbEurEfektifSatis();
    if (kur.fallback) {
      return adminErr("TCMB kuru alınamadı; katalog güncellenmedi", 502);
    }

    const products = await db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, specs: true, priceListTl: true },
    });

    let updated = 0;
    for (const p of products) {
      const specs = parseProductSpecs(p.specs);
      const euroSite = specs.fiyat_euro_site;
      if (euroSite == null || euroSite <= 0) continue;
      const tl = euroSiteToTryTl(euroSite, kur.rate);
      const prev = p.priceListTl != null ? Number(p.priceListTl) : null;
      if (prev === tl) continue;
      await db.product.update({
        where: { id: p.id },
        data: { priceListTl: tl },
      });
      updated += 1;
    }

    const catalog = await repriceDeptCatalogFromTcmb();

    return adminOk({
      kur: kurToApiPayload(kur),
      productsChecked: products.length,
      productsUpdated: updated,
      catalogJson: catalog,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cron başarısız";
    return adminErr(msg, 500);
  }
}
