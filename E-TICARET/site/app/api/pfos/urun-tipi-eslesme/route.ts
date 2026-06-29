import { NextRequest } from "next/server";
import type { PfosKategoriKodu } from "@/lib/prisma";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  listPfosUrunTipiEslesme,
  upsertPfosUrunTipiEslesme,
} from "@/lib/pfos/urun-tipi-eslesme-admin";

export const dynamic = "force-dynamic";

const KATEGORI_KODLARI = ["A", "B", "C", "D", "E", "F", "G", "H", "X"] as const;

function parseKategori(v: unknown): PfosKategoriKodu {
  const s = String(v ?? "G").trim().toUpperCase();
  if ((KATEGORI_KODLARI as readonly string[]).includes(s)) {
    return s as PfosKategoriKodu;
  }
  return "G";
}

/** Admin — konsept × urunTipi eşlemeleri */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(sp.get("limit") || 300), 1), 2000);

  try {
    const rows = await listPfosUrunTipiEslesme({
      konseptSlug: sp.get("konsept") || sp.get("konseptSlug") || undefined,
      pfosUrunTipi: sp.get("urunTipi") || sp.get("pfosUrunTipi") || undefined,
      limit,
    });
    return adminOk({ data: rows, count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Tip eşlemeleri alınamadı";
    return adminErr(msg, 503);
  }
}

/** Admin — tip eşlemesi upsert */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const row = await upsertPfosUrunTipiEslesme({
      konseptSlug: String(body.konseptSlug ?? body.konsept_slug ?? body.konsept ?? ""),
      pfosUrunTipi: String(body.pfosUrunTipi ?? body.pfos_urun_tipi ?? body.urunTipi ?? ""),
      pfosKategoriKodu: parseKategori(body.pfosKategoriKodu ?? body.pfos_kategori_kodu),
      productId: String(body.productId ?? body.product_id ?? ""),
      pfosAltKod:
        body.pfosAltKod != null
          ? String(body.pfosAltKod)
          : body.pfos_alt_kod != null
            ? String(body.pfos_alt_kod)
            : null,
      oncelik: body.oncelik != null ? Number(body.oncelik) : undefined,
      zorunlu: body.zorunlu != null ? !!body.zorunlu : undefined,
    });
    return adminOk({ data: row }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Eşleme kaydedilemedi";
    return adminErr(msg, 400);
  }
}
