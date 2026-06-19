import type { BesosProduct } from "@/lib/besos/types";

/** Vitrum / Besos bar modülü standart derinlik × yükseklik (cm) */
export const BESOS_BAR_DEPTH_CM = 70;
export const BESOS_BAR_HEIGHT_CM = 85;

const KOKTEYL_CATEGORIES = new Set(["Bar Module", "Signature Bar"]);

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[×x]/g, "*")
    .replace(/\s+/g, " ")
    .trim();
}

export function isKokteylIstasyonReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(isim ?? "");
  return (
    /kokteyl\s*istasyon|kokteyl\s*tezgah|cocktail\s*station|bar\s*istasyon/.test(n) &&
    !/bardak|shaker|jigger|mixology\s*kit/.test(n)
  );
}

export function olcuCmParts(olcuRaw: string | null | undefined): [number, number, number] | null {
  const nums = [...String(olcuRaw ?? "").matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
  if (nums.length < 2) return null;
  return [nums[0], nums[1], nums[2] ?? BESOS_BAR_HEIGHT_CM];
}

/** Ürün kodundan modül genişliği (cm) — Vitrum fiyat listesi sonekleri */
export function besosWidthCmFromCode(code: string | null | undefined): number | null {
  const s = String(code ?? "").trim();
  if (!s) return null;
  const tail = s.match(/-(\d{2})$/);
  if (tail) return Number(tail[1]) * 10;
  const bl = s.match(/BM-(\d{2})(?:\.|$|[/])/);
  if (bl) return Number(bl[1]) * 10;
  const ml = s.match(/BM\.(\d+)-(\d+)/);
  if (ml) return Number(ml[2]) * 10;
  return null;
}

export function besosProductOlcuCm(product: BesosProduct): [number, number, number] | null {
  if (product.totalDimensionsMm) {
    const parts = olcuCmParts(product.totalDimensionsMm.replace(/mm/gi, ""));
    if (parts) return parts;
  }
  const w = besosWidthCmFromCode(product.code);
  if (w == null) return null;
  return [w, BESOS_BAR_DEPTH_CM, BESOS_BAR_HEIGHT_CM];
}

function manhattan3(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

export function scoreBesosBarProductForOlcu(
  product: BesosProduct,
  target: [number, number, number],
  referansIsim: string,
): number {
  if (!KOKTEYL_CATEGORIES.has(product.category)) return -9999;
  const olcu = besosProductOlcuCm(product);
  if (!olcu) return -9999;

  let score = 500 - manhattan3(target, olcu);
  const code = String(product.code ?? "");
  if (/\.F\./.test(code)) score += 40;
  if (/BM\.F\./.test(code)) score += 20;
  if (product.category === "Signature Bar") score += 15;
  if (/dishwash|bula[sş]ik/.test(norm(product.description ?? ""))) score -= 30;

  const n = norm(referansIsim);
  if (/donduruc|freezer|evye|sink|speed\s*rail|buz\s*kuyu/.test(n)) {
    if (/donduruc|freezer|evye|sink|speed|buz/.test(norm(product.description ?? ""))) {
      score += 25;
    }
  }
  return score;
}

export function pickClosestBesosBarProduct(
  products: BesosProduct[],
  olcuRaw: string,
  referansIsim: string,
): BesosProduct | null {
  const target = olcuCmParts(olcuRaw) ?? [220, BESOS_BAR_DEPTH_CM, BESOS_BAR_HEIGHT_CM];
  const scored = products
    .map((product) => ({
      product,
      score: scoreBesosBarProductForOlcu(product, target, referansIsim),
    }))
    .filter((x) => x.score >= 400)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ae = a.product.fiyatEurKdvDahil ?? a.product.pricing?.fiyatEurKdvDahil ?? 999999;
      const be = b.product.fiyatEurKdvDahil ?? b.product.pricing?.fiyatEurKdvDahil ?? 999999;
      return ae - be;
    });
  return scored[0]?.product ?? null;
}

/** Besos KDV dahil EUR → PFOS proforma net EUR (KDV %20) */
export function besosNetEurFromProduct(product: BesosProduct): number | null {
  const gross =
    product.pricing?.fiyatEurKdvDahil ?? product.fiyatEurKdvDahil ?? null;
  if (gross == null || !Number.isFinite(gross) || gross <= 0) return null;
  const kdv = product.pricing?.kdvOran ?? 0.2;
  return Math.round((gross / (1 + kdv)) * 100) / 100;
}
