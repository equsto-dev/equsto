type WaWindow = Window & { EQUSTO_WHATSAPP_E164?: string };

const DEFAULT_WA = "905326840152";

export function vitrinWhatsAppPhoneClient(): string {
  if (typeof window === "undefined") return DEFAULT_WA;
  const raw = (window as WaWindow).EQUSTO_WHATSAPP_E164 || DEFAULT_WA;
  const digits = String(raw).replace(/\D/g, "");
  return digits || DEFAULT_WA;
}

export function buildListeKalemWhatsAppUrl(opts: {
  poz: string;
  tanim: string;
  teklifSayi?: string;
}): string {
  const phone = vitrinWhatsAppPhoneClient();
  const lines = [
    "Merhaba Equsto,",
    "PFOS listemde katalog eşlemesi veya fiyatı bulunamayan bir kalem var:",
    `${opts.poz} — ${opts.tanim}`,
  ];
  if (opts.teklifSayi?.trim()) {
    lines.push(`Teklif no: ${opts.teklifSayi.trim()}`);
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
