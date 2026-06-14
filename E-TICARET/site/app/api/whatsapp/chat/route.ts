import { NextRequest } from "next/server";
import { adminErr, adminOk } from "@/lib/admin-response";
import { requireMemberSession } from "@/lib/member-auth";
import { normalizeWaRecipient } from "@/lib/whatsapp/config";
import { listWaChatMessages, waChatRowToClient } from "@/lib/wa-chat";

export const dynamic = "force-dynamic";

function memberPhone(session: { user: { telefon?: string; phone?: string } }): string {
  return normalizeWaRecipient(session.user.telefon || session.user.phone || "");
}

/** GET /api/whatsapp/chat — Mr. Equsto modal sohbet senkronu (üye oturumu) */
export async function GET(req: NextRequest) {
  const check = await requireMemberSession(req);
  if (check instanceof Response) return check;

  const phone = memberPhone(check.session);
  if (!phone) {
    return adminErr("Mesaj geçmişi için cep telefonu gerekli", 400);
  }

  const sinceRaw = req.nextUrl.searchParams.get("since")?.trim();
  let since: Date | undefined;
  if (sinceRaw) {
    const ms = Date.parse(sinceRaw);
    if (Number.isFinite(ms)) since = new Date(ms);
  }

  try {
    const rows = await listWaChatMessages(phone, { since, limit: since ? 40 : 80 });
    const messages = rows.map(waChatRowToClient);
    const lastTs = messages.length ? messages[messages.length - 1].ts : Date.now();
    return adminOk({ messages, phone, lastTs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sohbet alınamadı";
    return adminErr(msg, 503);
  }
}
