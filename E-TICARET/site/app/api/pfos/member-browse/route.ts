import { NextRequest } from "next/server";
import { adminErr, adminOk } from "@/lib/admin-response";
import { requireMemberSession } from "@/lib/member-auth";
import {
  PFOS_MEMBER_BROWSE_SOURCES,
  recordPfosMemberBrowse,
  type PfosMemberBrowseSource,
} from "@/lib/pfos/member-browse-log";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseSource(raw: unknown): PfosMemberBrowseSource {
  const s = String(raw ?? "pdp").trim() as PfosMemberBrowseSource;
  return PFOS_MEMBER_BROWSE_SOURCES.includes(s) ? s : "pdp";
}

/** Üye oturumu — PFOS / PDP ürün gezinme kaydı (Faz C) */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const auth = await requireMemberSession(req, body);
    if (auth instanceof Response) return auth;

    const slug = String(body.slug ?? "").trim();
    if (!slug) return adminErr("slug gerekli", 400);

    const memberRow = await db.shopMemberSession.findUnique({
      where: { token: auth.session.token },
      select: { memberId: true },
    });
    if (!memberRow) return adminErr("Üye oturumu geçersiz", 401);

    const result = await recordPfosMemberBrowse({
      memberId: memberRow.memberId,
      slug,
      productId:
        body.productId != null
          ? String(body.productId)
          : body.product_id != null
            ? String(body.product_id)
            : null,
      tipKodu:
        body.tipKodu != null
          ? String(body.tipKodu)
          : body.tip_kodu != null
            ? String(body.tip_kodu)
            : null,
      konseptLabel: String(body.konseptLabel ?? body.konsept_label ?? ""),
      dukkanTuru: String(body.dukkanTuru ?? body.dukkan_turu ?? ""),
      source: parseSource(body.source),
    });

    return adminOk({ deduped: result.deduped }, result.deduped ? 200 : 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gezinme kaydedilemedi";
    return adminErr(msg, 503);
  }
}
