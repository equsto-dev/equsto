import { NextRequest } from "next/server";
import { assertAdminBearer, readBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { rejectPfosSkuLinkOneri } from "@/lib/pfos/sku-link-oneri";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/** Admin — SKU link önerisini reddet */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const onayNotu = String(body.onayNotu ?? body.onay_notu ?? "").trim();
  if (!onayNotu) return adminErr("onayNotu zorunlu", 400);

  const onaylayan =
    body.onaylayan != null
      ? String(body.onaylayan)
      : readBearer(req) || "admin";

  try {
    const row = await rejectPfosSkuLinkOneri(id, onayNotu, onaylayan);
    return adminOk({ data: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Reddedilemedi";
    return adminErr(msg, 400);
  }
}
