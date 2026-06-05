import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  computeBrandCategorySales,
  computeCartCoOccurrence,
  siparisOzet,
  teklifOzet,
  topSearchQueries,
} from "@/lib/raporlar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind") || "ozet";

  try {
    if (kind === "birlikte_sepet") {
      const limit = Math.min(Number(sp.get("limit") || 20), 50);
      const data = await computeCartCoOccurrence(limit);
      return adminOk({ data, kind });
    }

    if (kind === "marka_kategori") {
      const limit = Math.min(Number(sp.get("limit") || 30), 100);
      const data = await computeBrandCategorySales(limit);
      return adminOk({ data, kind });
    }

    if (kind === "arama") {
      const limit = Math.min(Number(sp.get("limit") || 30), 100);
      const days = Math.min(Number(sp.get("days") || 30), 365);
      const data = await topSearchQueries(limit, days);
      return adminOk({ data, kind, days });
    }

    const [siparis, teklif, birlikte, marka, arama] = await Promise.all([
      siparisOzet(),
      teklifOzet(),
      computeCartCoOccurrence(10),
      computeBrandCategorySales(10),
      topSearchQueries(10, 30),
    ]);

    return adminOk({
      data: {
        siparis,
        teklif,
        birlikte_sepet: birlikte,
        marka_kategori: marka,
        arama,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Rapor alınamadı";
    return adminErr(msg, 503);
  }
}
