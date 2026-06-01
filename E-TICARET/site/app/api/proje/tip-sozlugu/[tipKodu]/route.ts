import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { upsertTipEntry } from "@/lib/tip-sozlugu/store";

type Ctx = { params: Promise<{ tipKodu: string }> };

export const runtime = "nodejs";

export async function PUT(req: NextRequest, ctx: Ctx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { tipKodu } = await ctx.params;
  const key = decodeURIComponent(tipKodu || "").trim();
  if (!key) return adminErr("tip_kodu gerekli", 400);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return adminErr("Geçersiz JSON", 400);
  }

  await upsertTipEntry(key, {
    ...(body.aciklama != null ? { aciklama: String(body.aciklama) } : {}),
    ...(body.kategori != null ? { kategori: String(body.kategori) } : {}),
    ...(body.alt_kategori !== undefined
      ? { alt_kategori: body.alt_kategori ? String(body.alt_kategori) : null }
      : {}),
    kaynak: "api",
  });

  return adminOk({ success: true });
}
