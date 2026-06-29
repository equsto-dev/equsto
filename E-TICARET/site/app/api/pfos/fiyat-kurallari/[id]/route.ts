import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { updatePfosFiyatKurali } from "@/lib/pfos/fiyat-kurali-admin";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/** Admin — fiyat kuralı güncelle */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const row = await updatePfosFiyatKurali(id, {
      kapsam: body.kapsam != null ? String(body.kapsam) : undefined,
      konseptSlug:
        body.konseptSlug !== undefined
          ? body.konseptSlug != null
            ? String(body.konseptSlug)
            : null
          : body.konsept_slug !== undefined
            ? body.konsept_slug != null
              ? String(body.konsept_slug)
              : null
            : undefined,
      listeKey:
        body.listeKey !== undefined
          ? body.listeKey != null
            ? String(body.listeKey)
            : null
          : body.liste_key !== undefined
            ? body.liste_key != null
              ? String(body.liste_key)
              : null
            : undefined,
      poz: body.poz !== undefined ? (body.poz != null ? String(body.poz) : null) : undefined,
      urunTipi:
        body.urunTipi !== undefined
          ? body.urunTipi != null
            ? String(body.urunTipi)
            : null
          : body.urun_tipi !== undefined
            ? body.urun_tipi != null
              ? String(body.urun_tipi)
              : null
            : undefined,
      isimKalibi:
        body.isimKalibi !== undefined
          ? body.isimKalibi != null
            ? String(body.isimKalibi)
            : null
          : body.isim_kalibi !== undefined
            ? body.isim_kalibi != null
              ? String(body.isim_kalibi)
              : null
            : undefined,
      kuralTipi:
        body.kuralTipi != null
          ? String(body.kuralTipi)
          : body.kural_tipi != null
            ? String(body.kural_tipi)
            : undefined,
      carpan: body.carpan !== undefined ? Number(body.carpan) : undefined,
      bazSku:
        body.bazSku !== undefined
          ? body.bazSku != null
            ? String(body.bazSku)
            : null
          : body.baz_sku !== undefined
            ? body.baz_sku != null
              ? String(body.baz_sku)
              : null
            : undefined,
      sabitFiyatEur:
        body.sabitFiyatEur !== undefined
          ? Number(body.sabitFiyatEur)
          : body.sabit_fiyat_eur !== undefined
            ? Number(body.sabit_fiyat_eur)
            : undefined,
      aciklama:
        body.aciklama !== undefined
          ? body.aciklama != null
            ? String(body.aciklama)
            : null
          : undefined,
      aktif: body.aktif !== undefined ? !!body.aktif : undefined,
    });
    return adminOk({ data: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Güncellenemedi";
    return adminErr(msg, 400);
  }
}
