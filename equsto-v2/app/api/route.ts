import { adminOk } from "@/lib/admin-response";

/** GET /api — tarayıcıda 404 yerine kısa yönlendirme */
export async function GET() {
  return adminOk({
    message: "Equsto Admin API",
    endpoints: [
      "/api/urunler",
      "/api/urunler?meta=1",
      "/api/pfos",
      "/api/pfos?action=konseptler",
      "/api/pfos?action=calculate",
      "/api/market?kind=fiyatlar",
      "/api/musteriler",
      "/api/whatsapp",
      "/api/market?kind=kur",
      "/api/cms?kind=vitrin",
      "/api/search",
    ],
    auth: "Authorization: Bearer <EQUSTO_ADMIN_BEARER>",
  });
}
