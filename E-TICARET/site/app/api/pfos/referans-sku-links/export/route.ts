import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { exportReferansSkuLinksToJson } from "@/lib/pfos/referans/export-sku-links";
import { invalidateReferansSkuLinksCache } from "@/lib/pfos/referans/referans-eslestirme";

export const dynamic = "force-dynamic";

/** Admin — DB onaylı SKU linklerini JSON dosyasına export */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const result = await exportReferansSkuLinksToJson();
    invalidateReferansSkuLinksCache();
    return adminOk({
      data: result,
      message: `${result.dbLinkCount} DB link export edildi (${result.totalKeys} toplam anahtar)`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SKU link export başarısız";
    return adminErr(msg, 503);
  }
}
