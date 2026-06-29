import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { deletePfosUrunTipiEslesme } from "@/lib/pfos/urun-tipi-eslesme-admin";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/** Admin — tip eşlemesi sil */
export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const denied = assertAdminBearer(_req);
  if (denied) return denied;

  const { id } = await ctx.params;

  try {
    const ok = await deletePfosUrunTipiEslesme(id);
    if (!ok) return adminErr("Eşleme bulunamadı", 404);
    return adminOk({ deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Silinemedi";
    return adminErr(msg, 400);
  }
}
