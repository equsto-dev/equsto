/** Kedi sohbet / lead bildirim gövdeleri (DB bağımlılığı yok). */

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "") || "https://equsto.com";
}

export type LeadNotifyFields = {
  yetkili?: string | null;
  tel?: string | null;
  mail?: string | null;
  mesaj?: string | null;
  not?: string | null;
  kaynak?: string | null;
  sayfa?: string | null;
};

/**
 * Sahip WhatsApp bildirimi — gönderen bilgileri her zaman üstte.
 * Telegram’daki “Hazır mesaj / wa.me” satırları yok (WA’da yalnızca içerik gibi duruyordu).
 */
export function leadBodyForWhatsApp(m: LeadNotifyFields): string {
  const msg = String(m.mesaj || m.not || "").trim() || "—";
  const lines = [
    `*Gönderen:* ${String(m.yetkili || "").trim() || "Ziyaretçi"}`,
    `*Telefon:* ${String(m.tel || "").trim() || "—"}`,
    `*E-posta:* ${String(m.mail || "").trim() || "—"}`,
  ];
  const kaynak = String(m.kaynak || "").trim();
  const sayfa = String(m.sayfa || "").trim();
  if (kaynak) lines.push(`*Kaynak:* ${kaynak}`);
  if (sayfa) lines.push(`*Sayfa:* ${sayfa}`);
  lines.push("", "*Mesaj:*", msg, "", `Panel: ${siteUrl()}/yonetim/isletme`);
  return lines.join("\n");
}

export function ownerWhatsAppAlertText(
  title: string,
  m: LeadNotifyFields,
): string {
  return `${title}\n\n${leadBodyForWhatsApp(m)}`.trim();
}
