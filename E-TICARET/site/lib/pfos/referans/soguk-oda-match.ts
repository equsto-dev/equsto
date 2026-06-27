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
  type OlcuCm,
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

function isDeepfreezeBlob(blob: string): boolean {
  return /deepfreeze|deep\s*freeze|derin\s*dondurucu\s*depo/.test(blob);
}

/** Panel oda ölçüsü — yük eksikse 240 cm varsay (200×200 tip listeler) */
function parsePanelOdaOlcuCm(raw: string): OlcuCm | null {
  const cm = parseOlcuCm(raw);
  if (cm) return cm;
  const nums = [...String(raw).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 50);
  if (nums.length !== 2) return null;
  const [a, b] = nums.sort((x, y) => y - x);
  return { en: a, boy: b, yuk: 240 };
}

function panelOdaDisplayAd(isim: string, derin: boolean): string {
  const n = norm(isim);
  if (
    derin &&
    /panel tip soguk oda|panel tipi soguk oda/.test(n) &&
    !/derin dondurucu|dondurucu oda/.test(n)
  ) {
    return "PANEL TİP DERİN DONDURUCU ODA";
  }
  return displayIsimFromSablon(isim);
}

export function isPanelOdaReferansIsim(isim: string): boolean {
  const n = norm(isim);
  return (
    /panel tip soguk oda|panel tipi soguk oda/.test(n) ||
    /panel tip derin dondurucu|panel tipi derin dondurucu/.test(n) ||
    /panel tip dondurucu oda|panel tipi dondurucu oda/.test(n)
  );
}

function isIstifRafReferans(isim: string): boolean {
  return /istif raf/.test(norm(isim));
}

export function isPanelSogukOdaPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  notlar?: string | null;
  altKategori?: string | null;
}): boolean {
  if (isIstifRafReferans(String(opts.isim ?? ""))) return false;
  const tip = norm(String(opts.urunTipi ?? "")).replace(/_/g, "-");
  const blob = norm(`${opts.altKategori ?? ""} ${opts.notlar ?? ""}`);
  if (isDeepfreezeBlob(blob)) return false;
  if (/^panel-soguk-oda|^soguk-oda-panel|^soguk-oda$/.test(tip)) {
    return /panel tip|soguk oda/.test(norm(String(opts.isim ?? "")));
  }
  if (isPanelOdaReferansIsim(String(opts.isim ?? ""))) {
    return !/derin dondurucu|dondurucu oda|deep freeze|deep freezer/.test(
      norm(String(opts.isim ?? "")),
    );
  }
  if (/panel tip soguk oda|panel tipi soguk oda/.test(blob)) return true;
  return false;
}

export function isPanelDerinDondurucuOdaPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  notlar?: string | null;
  altKategori?: string | null;
}): boolean {
  if (isIstifRafReferans(String(opts.isim ?? ""))) return false;
  const tip = norm(String(opts.urunTipi ?? "")).replace(/_/g, "-");
  const n = norm(String(opts.isim ?? ""));
  const blob = norm(`${opts.altKategori ?? ""} ${opts.notlar ?? ""}`);
  if (isDeepfreezeBlob(blob) && /panel tip|soguk oda|derin|dondurucu/.test(n)) {
    return true;
  }
  if (
    /^panel-derin-dondurucu-oda|^derin-dondurucu-oda-panel|^panel-dondurucu-oda$/.test(
      tip,
    )
  ) {
    return /panel tip|derin dondurucu|dondurucu oda|soguk oda/.test(n);
  }
  if (
    /panel tip derin dondurucu|panel tipi derin dondurucu|panel tip dondurucu oda/.test(
      n,
    )
  ) {
    return true;
  }
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
  altKategori?: string | null,
): Promise<EslesmisUrun | null> {
  const opts = { isim, urunTipi, notlar, altKategori };
  const derin = isPanelDerinDondurucuOdaPfosKalem(opts);
  const soguk = isPanelSogukOdaPfosKalem(opts);
  if (!derin && !soguk) return null;

  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const cm = parsePanelOdaOlcuCm(olcu);
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
    ad: panelOdaDisplayAd(isim, derin),
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
