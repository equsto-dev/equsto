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
 * Sahip WhatsApp bildirimi — gönderen bilgileri her zaman üstte (önizlemede de görünsün).
 * Telegram’daki “Hazır mesaj / wa.me” satırları yok.
 */
export function leadBodyForWhatsApp(m: LeadNotifyFields): string {
  const name = String(m.yetkili || "").trim() || "Ziyaretçi";
  const tel = String(m.tel || "").trim() || "—";
  const mail = String(m.mail || "").trim() || "—";
  const msg = String(m.mesaj || m.not || "").trim() || "—";
  const kaynak = String(m.kaynak || "").trim();
  const sayfa = String(m.sayfa || "").trim();

  const lines = [
    `Gönderen: ${name}`,
    `Telefon: ${tel}`,
    `E-posta: ${mail}`,
  ];
  if (kaynak) lines.push(`Kaynak: ${kaynak}`);
  if (sayfa) lines.push(`Sayfa: ${sayfa}`);
  lines.push("", "Mesaj:", msg, "", `Panel: ${siteUrl()}/yonetim/isletme`);
  return lines.join("\n");
}

export function ownerWhatsAppAlertText(
  title: string,
  m: LeadNotifyFields,
): string {
  const name = String(m.yetkili || "").trim() || "Ziyaretçi";
  const tel = String(m.tel || "").trim();
  const head = tel ? `${title} — ${name} · ${tel}` : `${title} — ${name}`;
  return `${head}\n\n${leadBodyForWhatsApp(m)}`.trim();
}
