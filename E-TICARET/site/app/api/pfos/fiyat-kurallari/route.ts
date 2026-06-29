import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  createPfosFiyatKurali,
  listAllPfosFiyatKurallari,
} from "@/lib/pfos/fiyat-kurali-admin";

export const dynamic = "force-dynamic";

/** Admin — PFOS fiyat kuralları listesi */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const aktifOnly = req.nextUrl.searchParams.get("aktif") === "1";

  try {
    const rows = await listAllPfosFiyatKurallari(aktifOnly);
    return adminOk({ data: rows, count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fiyat kuralları alınamadı";
    return adminErr(msg, 503);
  }
}

/** Admin — yeni fiyat kuralı */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const row = await createPfosFiyatKurali({
      kapsam: body.kapsam != null ? String(body.kapsam) : undefined,
      konseptSlug:
        body.konseptSlug != null
          ? String(body.konseptSlug)
          : body.konsept_slug != null
            ? String(body.konsept_slug)
            : null,
      listeKey:
        body.listeKey != null
          ? String(body.listeKey)
          : body.liste_key != null
            ? String(body.liste_key)
            : null,
      poz: body.poz != null ? String(body.poz) : null,
      urunTipi:
        body.urunTipi != null
          ? String(body.urunTipi)
          : body.urun_tipi != null
            ? String(body.urun_tipi)
            : null,
      isimKalibi:
        body.isimKalibi != null
          ? String(body.isimKalibi)
          : body.isim_kalibi != null
            ? String(body.isim_kalibi)
            : null,
      kuralTipi: String(body.kuralTipi ?? body.kural_tipi ?? "carp"),
      carpan: body.carpan != null ? Number(body.carpan) : null,
      bazSku:
        body.bazSku != null
          ? String(body.bazSku)
          : body.baz_sku != null
            ? String(body.baz_sku)
            : null,
      sabitFiyatEur:
        body.sabitFiyatEur != null
          ? Number(body.sabitFiyatEur)
          : body.sabit_fiyat_eur != null
            ? Number(body.sabit_fiyat_eur)
            : null,
      aciklama: body.aciklama != null ? String(body.aciklama) : null,
      aktif: body.aktif !== false,
    });
    return adminOk({ data: row }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kural oluşturulamadı";
    return adminErr(msg, 400);
  }
}
