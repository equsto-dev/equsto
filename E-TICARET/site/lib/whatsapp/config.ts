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

/** Green API QR hattı kendine WA bildirimi alamaz (notify === instance). */
export function isOwnerSelfWhatsAppNotifyBlocked(): boolean {
  if (whatsAppMode() !== "green-api") return false;
  const owner = normalizeWaRecipient(whatsAppNotifyTo());
  const instance = greenApiInstancePhone();
  if (!owner || !instance) return false;
  return owner === instance;
}

/**
 * Sahip bildirimi hedef(ler)i.
 * Green API hattı (532) ile notify aynıysa ALT (554) + instance kopyası birlikte gider.
 */
export function ownerWhatsAppNotifyPhones(): string[] {
  const owner = normalizeWaRecipient(whatsAppNotifyTo());
  const alt = normalizeWaRecipient(env("WHATSAPP_NOTIFY_ALT_TO"));
  const out: string[] = [];

  if (isOwnerSelfWhatsAppNotifyBlocked()) {
    if (alt && alt !== owner) out.push(alt);
    // owner === Green API hattı — kendine mesaj push vermez, atla
  } else {
    if (owner) out.push(owner);
    if (alt && alt !== owner) out.push(alt);
  }

  return [...new Set(out.filter(Boolean))];
}

/** İlk WA bildirim hedefi (geriye uyumluluk). */
export function ownerWhatsAppNotifyPhone(): string {
  return ownerWhatsAppNotifyPhones()[0] ?? "";
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
    WHATSAPP_NOTIFY_ALT_TO: env("WHATSAPP_NOTIFY_ALT_TO") ? "set" : "missing",
    owner_self_notify_blocked: isOwnerSelfWhatsAppNotifyBlocked() ? "yes" : "no",
    owner_notify_target: ownerWhatsAppNotifyPhone() ? "set" : "missing",
    owner_wa_notify_count: String(ownerWhatsAppNotifyPhones().length),
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

