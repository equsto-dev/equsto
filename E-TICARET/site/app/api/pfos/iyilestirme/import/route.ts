import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { importIyilestirmeMarkdown } from "@/lib/pfos/import-iyilestirme";

export const dynamic = "force-dynamic";

const DEFAULT_FILE = path.join(
  process.cwd(),
  "PFOS/veri/proje-veri/iyileştirme.md",
);

/** Admin — iyileştirme.md → SKU öneri + fiyat kuralı (sunucu DB) */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const listeKey = String(body.listeKey ?? body.liste_key ?? "").trim();
  const teklifSayi = String(body.teklif ?? body.teklifSayi ?? body.teklif_sayi ?? "").trim();
  const dryRun = body.dryRun === true || body.dry_run === true;

  if (!listeKey) {
    return adminErr("listeKey zorunlu", 400);
  }

  const filePath = body.file
    ? path.resolve(process.cwd(), String(body.file))
    : DEFAULT_FILE;

  if (!fs.existsSync(filePath)) {
    return adminErr(`Dosya bulunamadı: ${filePath}`, 404);
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const result = await importIyilestirmeMarkdown({
      content,
      listeKey,
      teklifSayi: teklifSayi || undefined,
      dryRun,
    });
    return adminOk({
      data: result,
      message: dryRun
        ? `Dry-run: ${result.parsed} kayıt parse edildi`
        : `Import: ${result.skuOneriCreated} öneri, ${result.fiyatKuraliCreated} fiyat kuralı`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "iyileştirme import başarısız";
    return adminErr(msg, 503);
  }
}
