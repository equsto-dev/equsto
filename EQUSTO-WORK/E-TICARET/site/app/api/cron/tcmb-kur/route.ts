import { NextRequest } from "next/server";
import { assertCronSecret } from "@/lib/cron-auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { euroSiteToTryTl } from "@/lib/equsto-pricing";
import { db } from "@/lib/db";
import { parseProductSpecs } from "@/lib/product-specs";
import { fetchTcmbEurEfektifSatis, kurToApiPayload } from "@/lib/tcmb-kur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron — TCMB kuru ile EUR bazlı ürünlerin priceListTl alanını günceller.
 * Hafta içi 15:30 TR (12:30 UTC) — bülten sonrası.
 */
export async function GET(req: NextRequest) {
  const denied = assertCronSecret(req);
  if (denied) return denied;

  try {
    const kur = await fetchTcmbEurEfektifSatis();
    if (kur.fallback) {
      return adminErr("TCMB kuru alınamadı; DB güncellenmedi", 502);
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

    return adminOk({
      kur: kurToApiPayload(kur),
      productsChecked: products.length,
      productsUpdated: updated,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cron başarısız";
    return adminErr(msg, 500);
  }
}
