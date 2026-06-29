import { NextRequest } from "next/server";
import { assertAdminBearer, readBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { approvePfosSkuLinkOneri } from "@/lib/pfos/sku-link-oneri";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/** Admin — SKU link önerisini onayla → PfosReferansSkuLink */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const onaylayan =
    body.onaylayan != null
      ? String(body.onaylayan)
      : readBearer(req) || "admin";

  try {
    const row = await approvePfosSkuLinkOneri(id, {
      onaylayan,
      yeniSku:
        body.yeniSku != null
          ? String(body.yeniSku)
          : body.yeni_sku != null
            ? String(body.yeni_sku)
            : null,
      yeniAd:
        body.yeniAd != null
          ? String(body.yeniAd)
          : body.yeni_ad != null
            ? String(body.yeni_ad)
            : null,
      yeniMarka:
        body.yeniMarka != null
          ? String(body.yeniMarka)
          : body.yeni_marka != null
            ? String(body.yeni_marka)
            : null,
      onayNotu:
        body.onayNotu != null
          ? String(body.onayNotu)
          : body.onay_notu != null
            ? String(body.onay_notu)
            : null,
    });
    return adminOk({ data: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onaylanamadı";
    return adminErr(msg, 400);
  }
}
