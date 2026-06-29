import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  listReferansSkuLinks,
  upsertReferansSkuLink,
} from "@/lib/pfos/referans/sku-link-db";
import { invalidateReferansSkuLinksCache } from "@/lib/pfos/referans/referans-eslestirme";

export const dynamic = "force-dynamic";

/** Admin — onaylı referans SKU linkleri */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const limit = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get("limit") || 500), 1),
    5000,
  );

  try {
    const rows = await listReferansSkuLinks(limit);
    return adminOk({ data: rows, count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SKU link listesi alınamadı";
    return adminErr(msg, 503);
  }
}

/** Admin — manuel veya onay sonrası SKU link upsert */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const listeKey = String(body.listeKey ?? body.liste_key ?? "").trim();
  const poz = String(body.poz ?? "").trim();
  const sku = String(body.sku ?? "").trim();

  if (!listeKey || !poz || !sku) {
    return adminErr("listeKey, poz ve sku zorunlu", 400);
  }

  try {
    const row = await upsertReferansSkuLink({
      listeKey,
      poz,
      sku,
      name: body.name != null ? String(body.name) : null,
      marka: body.marka != null ? String(body.marka) : null,
      kaynak: String(body.kaynak ?? "manual"),
      oneriId:
        body.oneriId != null
          ? String(body.oneriId)
          : body.oneri_id != null
            ? String(body.oneri_id)
            : null,
      onaylayan:
        body.onaylayan != null ? String(body.onaylayan) : null,
    });
    invalidateReferansSkuLinksCache();
    return adminOk({ data: row }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SKU link kaydedilemedi";
    return adminErr(msg, 503);
  }
}
