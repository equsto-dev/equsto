
import type { TeklifModelV14 } from "./teklif-v14.types";
import {
  pfosGorselFileExists,
  resolveGorselUrlBySku,
} from "../core/katalog-gorsel";
import {
  normalizePfosGorselUrl,
  oztiAxImageUrlFromSku,
  oztiWebImageRelFromSku,
} from "../core/katalog-gorsel-url";
import { equstoPimakGorselRelFromSku } from "../core/equsto-pimak-gorsel";
import { isCalismaTezgahiReferansIsim } from "../core/calisma-tezgah";
import { matchEqustoFiyatListesiTezgah } from "../core/equsto-fiyat-listesi-pfos";
import { isIstifRafiReferansIsim } from "../core/portashelf-marka";
import { PORTASHELF_304_GORSEL_REL } from "../core/portashelf-fiyat";
import { matchIstifRafiByReferans } from "../referans/istif-raf-match";

/** PDF / e-posta öncesi — stok kodu veya tanımdan fotoUrl doldur */
export async function enrichTeklifV14ModelGorsel(
  model: TeklifModelV14,
): Promise<TeklifModelV14> {
  const satirlar = await Promise.all(
    model.satirlar.map(async (s) => {
      const tanim = s.tanim?.trim() ?? "";
      const olcu = s.olcu?.trim() ?? "";
      let stokNo = s.stokNo?.trim() ?? "";

      const existing = normalizePfosGorselUrl(s.fotoUrl);
      if (existing && pfosGorselFileExists(existing)) {
        return { ...s, fotoUrl: existing };
      }

      if (stokNo) {
        const resolved = await resolveGorselUrlBySku(stokNo, s.fotoUrl, tanim);
        const oztiLocal = normalizePfosGorselUrl(oztiWebImageRelFromSku(stokNo));
        const oztiAx = normalizePfosGorselUrl(oztiAxImageUrlFromSku(stokNo));
        if (resolved && pfosGorselFileExists(resolved)) {
          return { ...s, fotoUrl: resolved };
        }
        if (oztiLocal && pfosGorselFileExists(oztiLocal)) {
          return { ...s, fotoUrl: oztiLocal };
        }
        if (oztiAx) {
          return { ...s, fotoUrl: oztiAx };
        }
      }

      if (isIstifRafiReferansIsim(tanim)) {
        const matched = await matchIstifRafiByReferans(tanim, olcu, null);
        const sku = matched?.sku?.trim() || stokNo;
        const fotoUrl =
          normalizePfosGorselUrl(matched?.gorselUrl ?? PORTASHELF_304_GORSEL_REL) ??
          undefined;
        return {
          ...s,
          stokNo: sku || s.stokNo,
          olcu: matched?.olcu ?? s.olcu,
          fotoUrl,
        };
      }

      if (isCalismaTezgahiReferansIsim(tanim, olcu)) {
        const matched = await matchEqustoFiyatListesiTezgah(tanim, olcu);
        if (matched?.sku) {
          const gorsel = await resolveGorselUrlBySku(
            matched.sku,
            matched.gorselUrl,
            tanim,
          );
          const pimak = normalizePfosGorselUrl(
            equstoPimakGorselRelFromSku(matched.sku, tanim),
          );
          const fotoUrl = gorsel ?? pimak ?? normalizePfosGorselUrl(matched.gorselUrl);
          return {
            ...s,
            stokNo: matched.sku,
            fotoUrl: fotoUrl ?? undefined,
          };
        }
        const pimak = normalizePfosGorselUrl(
          equstoPimakGorselRelFromSku(stokNo, tanim),
        );
        if (pimak && pfosGorselFileExists(pimak)) {
          return { ...s, fotoUrl: pimak };
        }
      }

      return s;
    }),
  );
  return { ...model, satirlar };
}
