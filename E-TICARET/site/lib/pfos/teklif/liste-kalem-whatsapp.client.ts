type WaWindow = Window & { EQUSTO_WHATSAPP_E164?: string };

const DEFAULT_WA = "905326840152";

export function vitrinWhatsAppPhoneClient(): string {
  if (typeof window === "undefined") return DEFAULT_WA;
  const raw = (window as WaWindow).EQUSTO_WHATSAPP_E164 || DEFAULT_WA;
  const digits = String(raw).replace(/\D/g, "");
  return digits || DEFAULT_WA;
}

const WA_TEXT_MAX = 1800;

export function buildListeKalemWhatsAppUrl(opts: {
  poz: string;
  tanim: string;
  teklifSayi?: string;
}): string {
  return buildListeBulkWhatsAppUrl({
    kalemler: [{ poz: opts.poz, tanim: opts.tanim }],
    teklifSayi: opts.teklifSayi,
    intro:
      "PFOS listemde katalog eşlemesi veya fiyatı bulunamayan bir kalem var:",
  });
}

export function buildListeBulkWhatsAppUrl(opts: {
  kalemler: Array<{ poz: string; tanim: string }>;
  teklifSayi?: string;
  intro?: string;
}): string {
  const phone = vitrinWhatsAppPhoneClient();
  const intro =
    opts.intro ??
    `PFOS listemde ${opts.kalemler.length} kalem için katalog eşlemesi veya fiyat bulunamadı:`;
  const lines = ["Merhaba Equsto,", intro];
  const maxLines = 12;
  const shown = opts.kalemler.slice(0, maxLines);
  for (const k of shown) {
    lines.push(`${k.poz} — ${k.tanim}`);
  }
  const rest = opts.kalemler.length - shown.length;
  if (rest > 0) {
    lines.push(`… ve ${rest} kalem daha`);
  }
  if (opts.teklifSayi?.trim()) {
    lines.push(`Teklif no: ${opts.teklifSayi.trim()}`);
  }
  let text = lines.join("\n");
  if (text.length > WA_TEXT_MAX) {
    text = `${text.slice(0, WA_TEXT_MAX - 1)}…`;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function countFiyatsizSatirlar(
  satirlar: Array<{ birimSatis: number | null }>,
): number {
  return satirlar.filter((s) => s.birimSatis == null).length;
}
