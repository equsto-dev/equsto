
import type { TeklifModelV14 } from "./teklif-v14.types";
import { resolveGorselUrlBySku } from "../core/katalog-gorsel";
import {
  normalizePfosGorselUrl,
  oztiWebImageRelFromSku,
} from "../core/katalog-gorsel-url";

/** PDF / e-posta öncesi — stok kodundan fotoUrl doldur */
export async function enrichTeklifV14ModelGorsel(
  model: TeklifModelV14,
): Promise<TeklifModelV14> {
  const satirlar = await Promise.all(
    model.satirlar.map(async (s) => {
      const existing = normalizePfosGorselUrl(s.fotoUrl);
      if (existing) return { ...s, fotoUrl: existing };

      const sku = s.stokNo?.trim();
      if (!sku) return s;

      const resolved = await resolveGorselUrlBySku(sku, s.fotoUrl, s.tanim);
      const ozti = normalizePfosGorselUrl(oztiWebImageRelFromSku(sku));
      const fotoUrl = resolved ?? ozti;
      return fotoUrl ? { ...s, fotoUrl } : s;
    }),
  );
  return { ...model, satirlar };
}
