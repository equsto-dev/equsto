/** wa.me handoff / mesaj gövdesinden equsto sayfa URL'si (istemci + sunucu). */
export function extractSayfaUrlFromWhatsAppText(text: string): string {
  const raw = String(text || "");
  const labeled = raw.match(
    /(?:Sayfa|İlgilendiğim sayfa|ilgilendiğim sayfa)\s*:\s*(https?:\/\/[^\s<>"']+)/i,
  );
  if (labeled?.[1]) return labeled[1].replace(/[.,;:!?)]+$/, "");
  const equsto = raw.match(
    /(https?:\/\/(?:www\.)?equsto\.com\/[^\s<>"']+)/i,
  );
  if (equsto?.[1]) return equsto[1].replace(/[.,;:!?)]+$/, "");
  const any = raw.match(/(https?:\/\/[^\s<>"']+)/i);
  if (any?.[1]) return any[1].replace(/[.,;:!?)]+$/, "");
  return "";
}

export function normalizeSayfaHref(raw: string | null | undefined): string | null {
  const s = String(raw || "").trim();
  if (!s || s === "whatsapp") return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/") && !s.startsWith("//")) {
    return `https://equsto.com${s}`;
  }
  return null;
}
