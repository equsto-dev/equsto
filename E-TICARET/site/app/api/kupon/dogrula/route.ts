import { NextRequest } from "next/server";
import { adminErr, adminOk } from "@/lib/admin-response";
import { dogrulaKupon } from "@/lib/kupon";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kod = String(body.kod ?? body.kupon ?? "").trim();
  const sepetToplam = Number(body.sepet_toplam_tl ?? body.toplam_tl ?? 0) || 0;

  const result = await dogrulaKupon(kod, sepetToplam);
  if (!result.ok) {
    return adminErr(result.error || "Geçersiz kupon", 400);
  }

  return adminOk({
    data: {
      kod: result.kod,
      indirim_tl: result.indirim_tl,
      indirim_yuzde: result.indirim_yuzde,
      yeni_toplam_tl: result.yeni_toplam_tl,
    },
  });
}
