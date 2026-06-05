import { NextRequest } from "next/server";
import { adminOk } from "@/lib/admin-response";
import { loadMagazaAyarlari } from "@/lib/magaza-ayarlari";

export const dynamic = "force-dynamic";

/** Vitrin — mağaza ayarları (WhatsApp, kargo, KDV) */
export async function GET(_req: NextRequest) {
  const a = await loadMagazaAyarlari();
  return adminOk({
    data: {
      whatsapp_e164: a.whatsapp_e164,
      whatsapp_prefill: a.whatsapp_prefill,
      ucretsiz_kargo: a.ucretsiz_kargo,
      ucretsiz_kargo_limit_tl: a.ucretsiz_kargo_limit_tl,
      kargo_bolgeleri: a.kargo_bolgeleri,
      kdv_gosterim: a.kdv_gosterim,
      kdv_oran: a.kdv_oran,
    },
  });
}
