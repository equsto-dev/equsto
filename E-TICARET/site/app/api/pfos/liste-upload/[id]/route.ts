import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr } from "@/lib/admin-response";
import { readListeUploadFile } from "@/lib/pfos/liste-upload-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function disposition(name: string): string {
  const ascii = name.replace(/[^\w.\-]+/g, "_") || "liste";
  const encoded = encodeURIComponent(name);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/** Admin — üyenin yüklediği orijinal PDF/Excel */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!id?.trim()) return adminErr("id gerekli", 400);

  try {
    const file = await readListeUploadFile(id);
    if (!file) return adminErr("Kaynak dosya bulunamadı", 404);
    return new Response(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mime || "application/octet-stream",
        "Content-Disposition": disposition(file.originalName),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Dosya okunamadı";
    return adminErr(msg, 503);
  }
}
