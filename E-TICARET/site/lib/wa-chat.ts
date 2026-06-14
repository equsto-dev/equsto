import { db } from "@/lib/db";
import { normalizeWaRecipient, vitrinWhatsAppE164, whatsAppNotifyTo } from "@/lib/whatsapp/config";

export type WaChatRole = "user" | "team";

export function normalizeChatPhone(raw: string): string {
  return normalizeWaRecipient(raw);
}

/** Equsto iş numarası — müşteri sohbeti değil */
export function isInternalWhatsAppPhone(raw: string): boolean {
  const d = normalizeChatPhone(raw);
  if (!d) return true;
  const vitrin = vitrinWhatsAppE164();
  const notify = whatsAppNotifyTo();
  if (d === vitrin) return true;
  if (notify && d === notify) return true;
  return false;
}

export async function appendWaChatMessage(opts: {
  phone: string;
  role: WaChatRole;
  body: string;
  waMessageId?: string | null;
  memberId?: string | null;
}): Promise<{ id: string; created: boolean } | null> {
  const phone = normalizeChatPhone(opts.phone);
  const body = String(opts.body || "").trim().slice(0, 8000);
  if (!phone || !body || isInternalWhatsAppPhone(phone)) return null;

  const waMessageId = opts.waMessageId ? String(opts.waMessageId).trim() : null;
  if (waMessageId) {
    const existing = await db.waChatMessage.findUnique({
      where: { waMessageId },
      select: { id: true },
    });
    if (existing) return { id: existing.id, created: false };
  }

  const row = await db.waChatMessage.create({
    data: {
      phone,
      role: opts.role === "user" ? "user" : "team",
      body,
      waMessageId,
      memberId: opts.memberId || null,
    },
  });
  return { id: row.id, created: true };
}

export async function listWaChatMessages(
  phone: string,
  opts?: { since?: Date; limit?: number },
) {
  const p = normalizeChatPhone(phone);
  if (!p) return [];
  return db.waChatMessage.findMany({
    where: {
      phone: p,
      ...(opts?.since ? { createdAt: { gt: opts.since } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(opts?.limit ?? 80, 1), 120),
  });
}

export function waChatRowToClient(row: {
  id: string;
  role: string;
  body: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    role: row.role === "user" ? ("user" as const) : ("team" as const),
    body: row.body,
    ts: row.createdAt.getTime(),
  };
}
