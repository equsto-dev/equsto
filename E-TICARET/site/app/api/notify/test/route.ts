import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { notifyChannelsConfigured, notifyEnvHints, sendInstantAlert } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Bearer ile bildirim kanallarını dene — POST /api/notify/test */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const configured = notifyChannelsConfigured();
  const hints = notifyEnvHints();
  if (!configured.length) {
    return adminErr(
      "Bildirim kanalı yapılandırılmamış. Vercel env + Production + Redeploy gerekli. " +
        JSON.stringify(hints),
      503
    );
  }

  const result = await sendInstantAlert(
    "Equsto — test bildirimi",
    "Kedi sohbet / sipariş uyarıları bu kanaldan gelecek.\n" +
      `Aktif: ${configured.join(", ")}`
  );

  if (!result.sent.length) {
    return adminErr(
      `Gönderilemedi: ${result.errors.join("; ") || "bilinmeyen hata"}`,
      502
    );
  }

  return adminOk({
    configured,
    sent: result.sent,
    skipped: result.skipped,
    errors: result.errors,
  });
}

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;
  return adminOk({
    configured: notifyChannelsConfigured(),
    env: notifyEnvHints(),
    note: "env missing ise Vercel → Settings → Environment Variables → Production → Redeploy",
  });
}
