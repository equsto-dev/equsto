import type { ResolvedKw } from "./kw-resolve";

function foldTr(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCaglayanTeshirSku(sku: string | null | undefined): boolean {
  return /^EQ-[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü-]*-EQ\d+$/i.test(String(sku ?? "").trim());
}

export function isCaglayanTeshirBlob(blob: string): boolean {
  const n = foldTr(blob);
  if (/\bEQ-[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü-]*-EQ\d+\b/i.test(blob)) return true;
  if (!/caglayan|caglayan refrigeration/.test(n)) return false;
  return /yukleme alani|loading area/.test(n);
}

function lengthMmFromText(text: string): number | null {
  const m = String(text).match(/(\d{3,4})\s*[×xX*]\s*(\d{3,4})/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(a, b) < 900 ? Math.round(Math.max(a, b) * 10) : Math.round(Math.max(a, b));
}

/**
 * Çağlayan teşhir reyonu — katalogda elektrik gücü yok.
 * Uzunluk bandı: Öztiryakiler Leopard et teşhir (8919) ile aynı ölçek.
 */
export function estimateCaglayanTeshirKwByLengthMm(lengthMm: number): number {
  if (!Number.isFinite(lengthMm) || lengthMm < 400) return 0.28;
  if (lengthMm < 2600) return 0.28;
  return 0.37;
}

type CaglayanKwInput = {
  sku?: string | null;
  urunAd?: string | null;
  aciklama?: string | null;
  detay?: string | null;
  olculer?: { genislik_mm?: number; derinlik_mm?: number; yukseklik_mm?: number } | null;
};

export function resolveCaglayanTeshirKw(src: CaglayanKwInput): ResolvedKw {
  const blob = [src.sku, src.urunAd, src.aciklama, src.detay].filter(Boolean).join("\n");
  if (!isCaglayanTeshirBlob(blob)) {
    return { elektrikGucuKw: null, gazGucuKw: null };
  }

  const lengthMm =
    src.olculer?.genislik_mm ??
    lengthMmFromText(String(src.urunAd ?? "")) ??
    lengthMmFromText(String(src.aciklama ?? ""));

  if (!lengthMm) return { elektrikGucuKw: null, gazGucuKw: null };

  return {
    elektrikGucuKw: estimateCaglayanTeshirKwByLengthMm(lengthMm),
    gazGucuKw: null,
  };
}
