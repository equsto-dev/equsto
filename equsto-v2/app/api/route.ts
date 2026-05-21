import { adminOk } from "@/lib/admin-response";

/** GET /api — tarayıcıda 404 yerine kısa yönlendirme */
export async function GET() {
  return adminOk({
    message: "Equsto Admin API",
    endpoints: [
      "/api/urunler",
      "/api/fiyatlar",
      "/api/musteriler",
      "/api/whatsapp",
      "/api/kur",
      "/api/vitrin-homepage",
      "/api/search",
    ],
    auth: "Authorization: Bearer <EQUSTO_ADMIN_BEARER>",
  });
}
