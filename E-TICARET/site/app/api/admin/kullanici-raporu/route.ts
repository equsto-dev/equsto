import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { computeKullaniciRaporu } from "@/lib/analytics/product-dwell";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const days = Math.min(Number(sp.get("days") || 30), 365);
  const limit = Math.min(Number(sp.get("limit") || 30), 100);

  try {
    const data = await computeKullaniciRaporu(days, limit);
    return adminOk({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kullanıcı raporu alınamadı";
    return adminErr(msg, 503);
  }
}
