import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  createPfosSkuLinkOneri,
  listPfosSkuLinkOneri,
} from "@/lib/pfos/sku-link-oneri";

export const dynamic = "force-dynamic";

/** Admin — SKU link öneri kuyruğu */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(sp.get("limit") || 200), 1), 500);

  try {
    const rows = await listPfosSkuLinkOneri({
      durum: sp.get("durum") || undefined,
      listeKey: sp.get("listeKey") || sp.get("liste_key") || undefined,
      feedbackId: sp.get("feedbackId") || sp.get("feedback_id") || undefined,
      limit,
    });
    return adminOk({ data: rows, count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Öneri listesi alınamadı";
    return adminErr(msg, 503);
  }
}

/** Admin — manuel SKU link önerisi */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const row = await createPfosSkuLinkOneri({
      listeKey: String(body.listeKey ?? body.liste_key ?? ""),
      poz: String(body.poz ?? ""),
      yeniSku: String(body.yeniSku ?? body.yeni_sku ?? ""),
      yeniAd: body.yeniAd != null ? String(body.yeniAd) : body.yeni_ad != null ? String(body.yeni_ad) : null,
      yeniMarka:
        body.yeniMarka != null
          ? String(body.yeniMarka)
          : body.yeni_marka != null
            ? String(body.yeni_marka)
            : null,
      eskiSku:
        body.eskiSku != null
          ? String(body.eskiSku)
          : body.eski_sku != null
            ? String(body.eski_sku)
            : null,
      eskiAd:
        body.eskiAd != null
          ? String(body.eskiAd)
          : body.eski_ad != null
            ? String(body.eski_ad)
            : null,
      sorunTipi: String(body.sorunTipi ?? body.sorun_tipi ?? "genel"),
      onayNotu:
        body.onayNotu != null
          ? String(body.onayNotu)
          : body.onay_notu != null
            ? String(body.onay_notu)
            : null,
      feedbackId:
        body.feedbackId != null
          ? String(body.feedbackId)
          : body.feedback_id != null
            ? String(body.feedback_id)
            : null,
    });
    return adminOk({ data: row }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Öneri oluşturulamadı";
    return adminErr(msg, 400);
  }
}
