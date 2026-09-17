import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr } from "@/lib/admin-response";
import { generateTeklifV14ExcelBuffer } from "@/lib/pfos/teklif/export-teklif-v14.server";
import { resolveTeklifV14ForUsageSayi } from "@/lib/pfos/teklif/resolve-usage-teklif-v14";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function excelFilename(sayi: string): string {
  const safe = sayi.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return `equsto-teklif-${safe || "export"}.xlsx`;
}

/** Admin — teklif no ile v14 Excel indir */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const sayi = req.nextUrl.searchParams.get("teklifSayi")?.trim() || "";
  if (!sayi) return adminErr("teklifSayi gerekli", 400);

  try {
    const model = await resolveTeklifV14ForUsageSayi(sayi);
    if (!model || !model.satirlar.length) {
      return adminErr(
        "Bu teklifin kalem kaydı yok. Yeni üretilen teklifler Excel olarak iner.",
        404,
      );
    }
    const buffer = await generateTeklifV14ExcelBuffer(model);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${excelFilename(model.ust.sayi || sayi)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Excel oluşturulamadı";
    return adminErr(msg, 503);
  }
}
