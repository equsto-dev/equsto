/**
 * Türkçe katalog fiyat metni → sayısal TL (KDV hariç öncelik: "+ KDV" satırı).
 * Örn. "₺18.221,49 + KDV" → 18221.49
 */

export function parsePriceTLFromCatalog(price, opts = {}) {
  if (price == null || price === '') return 0;
  const raw = String(price);
  if (/teklif|iletişim|fiyat alınız/i.test(raw)) return 0;

  const harics = raw.match(/([\d.,]+)\s*\+\s*K\s*D\s*V/i);
  if (harics) {
    const n = parseFloat(
      harics[1].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'),
    );
    if (Number.isFinite(n) && n > 0) return n;
  }

  const dahil = raw.match(/K\s*D\s*V\s*Dahil[^\d]*([\d.,]+)/i);
  if (dahil && opts.preferKdvDahil) {
    const n2 = parseFloat(
      dahil[1].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'),
    );
    if (Number.isFinite(n2) && n2 > 0) return n2;
  }

  const firstLine = raw.split('\n')[0];
  const s = firstLine
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
  const n3 = parseFloat(s);
  return Number.isFinite(n3) && n3 > 0 ? n3 : 0;
}
