import { normalizeWaRecipient, vitrinWhatsAppE164 } from "./config";

export type WaLinkTarget = "app" | "web";

/** wa.me — mobil WhatsApp uygulaması */
export function buildWaMeUrl(phoneE164: string, text?: string): string {
  const phone = normalizeWaRecipient(phoneE164);
  if (!phone) return "";
  const base = `https://wa.me/${phone}`;
  const msg = String(text || "").trim();
  if (!msg) return base;
  return `${base}?text=${encodeURIComponent(msg)}`;
}

/** web.whatsapp.com — masaüstü tarayıcı */
export function buildWebWhatsAppUrl(phoneE164: string, text?: string): string {
  const phone = normalizeWaRecipient(phoneE164);
  if (!phone) return "";
  const base = `https://web.whatsapp.com/send?phone=${phone}`;
  const msg = String(text || "").trim();
  if (!msg) return base;
  return `${base}&text=${encodeURIComponent(msg)}`;
}

export function buildWhatsAppLink(
  text?: string,
  target: WaLinkTarget = "app",
  phoneE164?: string
): { url: string; phone: string; target: WaLinkTarget } {
  const phone = normalizeWaRecipient(phoneE164 || vitrinWhatsAppE164());
  const url =
    target === "web" ? buildWebWhatsAppUrl(phone, text) : buildWaMeUrl(phone, text);
  return { url, phone, target };
}

export function whatsAppLinkReady(): boolean {
  return Boolean(normalizeWaRecipient(vitrinWhatsAppE164()));
}
