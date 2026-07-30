import { NextRequest } from "next/server";
import { adminErr, adminOk } from "@/lib/admin-response";
import { incrementKuponUsage } from "@/lib/kupon";
import { initTepeplatformCheckout } from "@/lib/odeme/tepeplatform-checkout";

export const dynamic = "force-dynamic";

/**
 * Sepet → TepePlatform hosted checkout (kart + 3DS TepePlatform'da).
 * equsto sunucusunda IYZICO_* anahtarı yoktur.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
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
          sessionId: result.sessionId,
          orderRef: result.orderRef,
          /** Geriye uyum — eski sepet JS paymentPageUrl bekleyebilir */
          paymentPageUrl: result.checkoutUrl,
        },
      },
      201,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ödeme başlatılamadı";
    return adminErr(msg, 400);
  }
}
