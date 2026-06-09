import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { runImportDocumentAnaliz } from "@/lib/claude/import-analiz.server";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST /api/import/analiz — PDF/Excel ekipman analizi (Anthropic veya yerel proxy) */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  let body: {
    dosya_base64?: string;
    dosya_tip?: string;
    system_prompt?: string;
    user_prompt?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return adminErr("Geçersiz JSON", 400);
  }

  if (!body.dosya_base64) {
    return adminErr("dosya_base64 gerekli", 400);
  }

  try {
    const data = await runImportDocumentAnaliz({
      dosya_base64: body.dosya_base64,
      dosya_tip: body.dosya_tip || "application/pdf",
      system_prompt: body.system_prompt || "",
      user_prompt: body.user_prompt || "Dosyayı analiz et:",
    });
    return adminOk({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = /Anthropic|proxy ulaşılamad|ANTHROPIC_API_KEY/i.test(msg)
      ? 502
      : 500;
    return adminErr(msg, status);
  }
}
