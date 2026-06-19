import katalogOlcuMm from "@/lib/pfos/data/pfos-katalog-olcu-mm.json";

/** SKU → G×D×Y (mm), Öztiryakiler PDF / katalog doğrulanmış */
type SkuOlcuMap = Record<string, string>;

const skuMap: SkuOlcuMap = katalogOlcuMm.olculer ?? {};

function normSku(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

export function olcuMmFromSku(sku: string | null | undefined): string | null {
  const key = normSku(sku);
  if (!key) return null;
  const hit = skuMap[key];
  if (!hit) return null;
  return toOlcuMmDisplay(hit);
}

/** Boyut dizisini "550×545×530" biçimine getirir (mm, birim ibaresi yok) */
export function formatOlcuMm(parts: number[]): string | null {
  const nums = parts.filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return null;
  return nums.map((n) => Math.round(n)).join("×");
}

/** Görünüm — mm/cm birim soneklerini kaldırır */
export function stripOlcuUnitSuffix(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/[x*]/gi, "×")
    .replace(/\s*(?:mm|cm)\b\.?/gi, "")
    .trim();
}

/** Teklif / vitrin ölçü hücresi */
export function displayOlcuMm(value: string | null | undefined): string {
  const s = String(value ?? "").trim();
  if (!s || s === "—") return s || "—";
  if (isTepsiKapasiteMetni(s)) return s;
  return toOlcuMmDisplay(s) ?? (stripOlcuUnitSuffix(s) || s);
}

/**
 * Tepsi/kızak kapasitesi (3×40×60 cm) — kabin ölçüsü değil; Ölçü sütununda kullanılmaz.
 */
export function isTepsiKapasiteMetni(value: string | null | undefined): boolean {
  const s = String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/mm|cm/gi, "");
  const m = /^(\d{1,2})[×x*](\d{2,4})[×x*](\d{2,4})$/.exec(s);
  if (!m) return false;
  const racks = Number(m[1]);
  if (racks < 1 || racks > 30) return false;
  const a = Number(m[2]);
  const b = Number(m[3]);
  const pair = [a, b].sort((x, y) => x - y);
  return pair[0] === 40 || pair[0] === 400;
}

/**
 * Metni v14 ölçü sütunu için mm biçimine çevirir.
 * Zone katalog cm (80×70×30) → 800×700×300 mm; zaten mm olanlar korunur.
 */
export function toOlcuMmDisplay(value: string | null | undefined): string | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  if (isTepsiKapasiteMetni(s)) return null;

  if (/\bmm\b/i.test(s)) {
    return stripOlcuUnitSuffix(s);
  }

  if (/gn\b|kutu\s*tipi|Ø|no\b/i.test(s) && !/\d\s*[×x*]\s*\d/.test(s)) {
    return s;
  }

  const m = /^(\d+(?:[.,]\d+)?)\s*[×x*]\s*(\d+(?:[.,]\d+)?)(?:\s*[×x*]\s*(\d+(?:[.,]\d+)?))?\s*(?:cm|mm)?\s*$/i.exec(
    s.replace(/\s/g, ""),
  );
  if (!m) return null;

  let g = Number(String(m[1]).replace(",", "."));
  let d = Number(String(m[2]).replace(",", "."));
  let y = m[3] ? Number(String(m[3]).replace(",", ".")) : null;
  const max = Math.max(g, d, y ?? 0);

  if (max > 0 && max < 250) {
    g = Math.round(g * 10);
    d = Math.round(d * 10);
    if (y != null) y = Math.round(y * 10);
  } else {
    g = Math.round(g);
    d = Math.round(d);
    if (y != null) y = Math.round(y);
  }

  if (y != null) return `${g}×${d}×${y}`;
  return `${g}×${d}`;
}
