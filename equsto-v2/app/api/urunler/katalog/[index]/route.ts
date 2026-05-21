import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { deleteLegacyCatalogIndex } from "@/lib/legacy-catalog";

type Params = { params: Promise<{ index: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = assertAdminBearer(_req);
  if (denied) return denied;

  const { index } = await params;
  const i = parseInt(index, 10);
  if (Number.isNaN(i) || i < 0) return adminErr("Geçersiz indeks", 400);

  try {
    const ok = await deleteLegacyCatalogIndex(i);
    if (!ok) return adminErr("Katalog indeksi bulunamadı", 404);
    return adminOk({ index: i });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Katalog silinemedi";
    return adminErr(msg, 500);
  }
}
