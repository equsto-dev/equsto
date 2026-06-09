import {
  displayIsimFromSablon,
  OZEL_IMALAT_MARKA,
} from "../core/ozel-imalat";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  defaultPanelOdaInput,
  formatOlcuCm,
  formatOlcuMetre,
  hesaplaSogukOda,
  hesaplaSogukOdaFiyat,
  olcuCmToMetre,
  parseOlcuCm,
  teknikModelFromSonuc,
} from "../soguk-oda-calc";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPanelOdaReferansIsim(isim: string): boolean {
  const n = norm(isim);
  return (
    /panel tip soguk oda|panel tipi soguk oda/.test(n) ||
    /panel tip derin dondurucu|panel tipi derin dondurucu/.test(n) ||
    /panel tip dondurucu oda|panel tipi dondurucu oda/.test(n)
  );
}

export function isPanelSogukOdaPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  notlar?: string | null;
  altKategori?: string | null;
}): boolean {
  const tip = norm(String(opts.urunTipi ?? "")).replace(/_/g, "-");
  if (/^panel-soguk-oda|^soguk-oda-panel|^soguk-oda$/.test(tip)) return true;
  if (isPanelOdaReferansIsim(String(opts.isim ?? ""))) {
    return !/derin dondurucu|dondurucu oda|deep freeze|deep freezer/.test(
      norm(String(opts.isim ?? "")),
    );
  }
  const blob = norm(`${opts.altKategori ?? ""} ${opts.notlar ?? ""}`);
  if (/panel tip soguk oda|panel tipi soguk oda/.test(blob)) return true;
  return false;
}

export function isPanelDerinDondurucuOdaPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  notlar?: string | null;
  altKategori?: string | null;
}): boolean {
  const tip = norm(String(opts.urunTipi ?? "")).replace(/_/g, "-");
  if (
    /^panel-derin-dondurucu-oda|^derin-dondurucu-oda-panel|^panel-dondurucu-oda$/.test(
      tip,
    )
  ) {
    return true;
  }
  const n = norm(String(opts.isim ?? ""));
  if (
    /panel tip derin dondurucu|panel tipi derin dondurucu|panel tip dondurucu oda/.test(
      n,
    )
  ) {
    return true;
  }
  const blob = norm(`${opts.altKategori ?? ""} ${opts.notlar ?? ""}`);
  return /panel tip derin dondurucu|panel tipi derin dondurucu|panel tip dondurucu oda/.test(
    blob,
  );
}

export function isPanelSogukOdaPfosKalemAny(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  notlar?: string | null;
  altKategori?: string | null;
}): boolean {
  return (
    isPanelSogukOdaPfosKalem(opts) || isPanelDerinDondurucuOdaPfosKalem(opts)
  );
}

/** Panel tip soğuk / derin dondurucu oda — özel ölçü + hesap motoru (+5°C / -18°C) */
export async function matchSogukOdaByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const opts = { isim, urunTipi, notlar };
  const derin = isPanelDerinDondurucuOdaPfosKalem(opts);
  const soguk = isPanelSogukOdaPfosKalem(opts);
  if (!derin && !soguk) return null;

  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const cm = parseOlcuCm(olcu);
  if (!cm) return null;

  const metre = olcuCmToMetre(cm);
  const input = defaultPanelOdaInput(metre, derin);
  const sonuc = hesaplaSogukOda(input);
  if (!sonuc) return null;

  const fiyat = hesaplaSogukOdaFiyat(input, sonuc);
  const sku = derin
    ? `EQ-DF-${Math.round(cm.en)}x${Math.round(cm.boy)}x${Math.round(cm.yuk)}`
    : `EQ-SO-${Math.round(cm.en)}x${Math.round(cm.boy)}x${Math.round(cm.yuk)}`;

  return {
    id: `pfos-panel-oda-${sku}`,
    sku,
    ad: displayIsimFromSablon(isim),
    marka: OZEL_IMALAT_MARKA,
    model: teknikModelFromSonuc(sonuc),
    olcu: formatOlcuCm(cm),
    elektrikGucuKw:
      sonuc.cihaz?.elk_w != null ? sonuc.cihaz.elk_w / 1000 : null,
    gazGucuKw: null,
    fiyat: fiyat.fiyatTl,
    fiyatEur: null,
    doviz: "TRY",
    gorselUrl: "images/catalog/soguk-oda/soguk-oda-vitrin.png",
  };
}
