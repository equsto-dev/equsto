import { NextRequest } from "next/server";
import { adminErr, adminOk } from "@/lib/admin-response";
import { recordProductPageView } from "@/lib/analytics/product-dwell";

export const dynamic = "force-dynamic";

/** Vitrin PDP süre kaydı — auth yok (anonim sessionId) */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const sessionId = String(body.sessionId ?? body.session_id ?? "").trim();
    const slug = String(body.slug ?? "").trim();
    const durationMs = Number(body.durationMs ?? body.duration_ms ?? 0);

    if (!sessionId || !slug) return adminErr("sessionId ve slug gerekli", 400);

    const result = await recordProductPageView({
      sessionId,
      path: String(body.path ?? ""),
      slug,
      productId:
        body.productId != null
          ? String(body.productId)
          : body.product_id != null
            ? String(body.product_id)
            : null,
      dept: String(body.dept ?? ""),
      title: String(body.title ?? ""),
      brand: String(body.brand ?? ""),
      durationMs,
      locale: String(body.locale ?? "tr"),
      memberId:
        body.memberId != null
          ? String(body.memberId)
          : body.member_id != null
            ? String(body.member_id)
            : null,
      referrer: String(body.referrer ?? ""),
    });

    if (result.skipped) {
      return adminOk({ skipped: true, reason: result.reason });
    }
    return adminOk({ recorded: true }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt başarısız";
    return adminErr(msg, 503);
  }
}
