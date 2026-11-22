import { NextRequest } from "next/server";
import { adminErr, adminOk } from "@/lib/admin-response";
import { incrementKuponUsage } from "@/lib/kupon";
import { initTepeplatformCheckout } from "@/lib/odeme/tepeplatform-checkout";

export const dynamic = "force-dynamic";

/** Geriye uyum: /api/odeme/init → TepePlatform checkout */
export async function POST(req: NextRequest) {
  let body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const { assertWebCheckout } = await import("@/lib/odeme/checkout-guard");
    body = assertWebCheckout({
      ...body,
      kaynak: String(body.kaynak || "web-sepet-kart"),
    });
    const result = await initTepeplatformCheckout(body);
    const kupon = String(body.kupon_kod ?? "").trim();
    if (kupon) {
      await incrementKuponUsage(kupon).catch(() => {});
    }
    return adminOk(
      {
        data: {
          siparis: result.siparis,
          checkoutUrl: result.checkoutUrl,
          paymentPageUrl: result.checkoutUrl,
          sessionId: result.sessionId,
          orderRef: result.orderRef,
        },
      },
      201,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ödeme başlatılamadı";
    return adminErr(msg, 400);
  }
}
