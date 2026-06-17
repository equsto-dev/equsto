/** WhatsApp entegrasyonu — Facebook hesabı zorunlu değil */

function env(name: string): string {
  return process.env[name]?.trim() || "";
}

export type WhatsAppMode = "link" | "green-api" | "meta";

/**
 * link      — wa.me / kedi sohbet (varsayılan, Facebook gerekmez)
 * green-api — QR ile bağlanır (GREEN_API_*), Facebook gerekmez
 * meta      — Meta Cloud API (Facebook Developer)
 */
export function whatsAppMode(): WhatsAppMode {
  const raw = env("EQUSTO_WHATSAPP_MODE").toLowerCase();
  if (raw === "green-api" || raw === "greenapi" || raw === "green") return "green-api";
  if (raw === "meta" || raw === "cloud" || raw === "facebook") return "meta";
  return "link";
}

export function greenApiConfigured(): boolean {
  return Boolean(env("GREEN_API_INSTANCE_ID") && env("GREEN_API_TOKEN"));
}

// —— Meta Cloud API (yalnızca mode=meta) ——

export function whatsAppAccessToken(): string {
  return env("WHATSAPP_ACCESS_TOKEN");
}

export function whatsAppPhoneNumberId(): string {
  return env("WHATSAPP_PHONE_NUMBER_ID");
}

export function whatsAppVerifyToken(): string {
  return env("WHATSAPP_VERIFY_TOKEN");
}

export function whatsAppAppSecret(): string {
  return env("WHATSAPP_APP_SECRET");
}

export function whatsAppMetaConfigured(): boolean {
  return Boolean(whatsAppAccessToken() && whatsAppPhoneNumberId());
}

export function whatsAppWebhookConfigured(): boolean {
  const mode = whatsAppMode();
  if (mode === "meta") {
    return whatsAppMetaConfigured() && Boolean(whatsAppVerifyToken());
  }
  if (mode === "green-api") return greenApiConfigured();
  return false;
}

// —— Bildirimler ——

export function whatsAppNotifyTo(): string {
  const raw =
    env("WHATSAPP_NOTIFY_TO") ||
    env("EQUSTO_NOTIFY_SMS_E164") ||
    env("EQUSTO_WHATSAPP_E164");
  return raw.replace(/\D/g, "");
}

/** Green API QR ile bağlı WhatsApp hattı (kendine mesaj bildirim vermez). */
export function greenApiInstancePhone(): string {
  const raw =
    env("GREEN_API_INSTANCE_WID") ||
    env("GREEN_API_INSTANCE_PHONE") ||
    env("EQUSTO_WHATSAPP_E164");
  return normalizeWaRecipient(raw);
}

/** Sahip bildirimi — WHATSAPP_NOTIFY_TO (Green API ile aynı hat: doğrudan cevap için). */
export function ownerWhatsAppNotifyPhone(): string {
  return normalizeWaRecipient(whatsAppNotifyTo());
}

export function vitrinWhatsAppE164(): string {
  const raw = env("EQUSTO_WHATSAPP_E164") || "905326840152";
  return raw.replace(/\D/g, "");
}

export function normalizeWaRecipient(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0") && d.length === 11) d = `90${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("5")) d = `90${d}`;
  return d;
}

export function whatsAppEnvHints() {
  const mode = whatsAppMode();
  const hints: Record<string, string> = {
    EQUSTO_WHATSAPP_MODE: mode,
    EQUSTO_WHATSAPP_E164: vitrinWhatsAppE164() ? "set" : "missing",
    WHATSAPP_NOTIFY_TO: whatsAppNotifyTo() ? "set" : "missing",
  };

  if (mode === "meta") {
    hints.WHATSAPP_ACCESS_TOKEN = whatsAppAccessToken() ? "set" : "missing";
    hints.WHATSAPP_PHONE_NUMBER_ID = whatsAppPhoneNumberId() ? "set" : "missing";
    hints.WHATSAPP_VERIFY_TOKEN = whatsAppVerifyToken() ? "set" : "missing";
    hints.WHATSAPP_APP_SECRET = whatsAppAppSecret() ? "set" : "missing";
  }

  if (mode === "green-api") {
    hints.GREEN_API_INSTANCE_ID = env("GREEN_API_INSTANCE_ID") ? "set" : "missing";
    hints.GREEN_API_TOKEN = env("GREEN_API_TOKEN") ? "set" : "missing";
  }

  return hints;
}
