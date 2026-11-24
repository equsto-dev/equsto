/**
 * WhatsApp Web `Cross-Origin-Opener-Policy: same-origin` gönderir.
 * Bu yüzden target adı tutmaz; her tıklama yeni sekme açar ve sohbeti yeniden yükler.
 * Uygulama protokolü tarayıcı sekmesi açmaz, yüklü WhatsApp penceresini öne alır.
 */
export function waHref(tel: string, text?: string): string | null {
  const d = String(tel || "").replace(/\D/g, "");
  if (d.length < 10) return null;
  const e164 = d.startsWith("90") ? d : `90${d.replace(/^0/, "")}`;
  const base = `whatsapp://send?phone=${e164}`;
  const msg = String(text || "").trim();
  return msg ? `${base}&text=${encodeURIComponent(msg)}` : base;
}

export function telHref(tel: string): string | null {
  const d = String(tel || "").replace(/[^\d+]/g, "");
  if (d.replace(/\D/g, "").length < 10) return null;
  return `tel:${d}`;
}

export function mailHref(mail: string, subject?: string): string | null {
  const v = String(mail || "").trim();
  if (!v.includes("@")) return null;
  const sub = String(subject || "").trim();
  return sub ? `mailto:${v}?subject=${encodeURIComponent(sub)}` : `mailto:${v}`;
}

export function mapsHref(adres: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adres)}`;
}
