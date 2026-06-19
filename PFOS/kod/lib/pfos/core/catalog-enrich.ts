import type { AdminUrunRow } from "@/lib/admin-urun";
import { olcuMmFromSku, toOlcuMmDisplay, formatOlcuMm } from "../teklif/olcu-mm";
import {
  isOzelImalatMotor,
  isOzelImalatSablon,
  OZEL_IMALAT_MARKA,
} from "./ozel-imalat";
import {
  HAZIRLIK_MARKA,
  isHazirlikPfosKalem,
} from "./hazirlik-marka";
import {
  isSenoxPfosKalem,
  SENOX_MARKA,
} from "./senox-marka";
import {
  BULASIK_MARKA,
  isBulasikPfosKalem,
} from "./bulasik-marka";
import {
  PORTASHELF_MARKA,
  isPortashelfMarkaKalem,
} from "./portashelf-marka";
import {
  isBuzdolabiPfosKalem,
  isMakeUpPfosKalem,
} from "./portabianco-marka";
import { OZTI_MARKA, isOztiBuzdolabiRow, isOztiBuzdolabiSku, isOztiPisirmeRow } from "./ozti-marka";
import {
  CAGLAYAN_MARKA,
  isCaglayanTeshirPfosKalem,
} from "./caglayan-marka";
import {
  isAtalayPisirmePfosKalem,
  isAtalayPisirmeRow,
} from "./atalay-marka";
import {
  CALISMA_TEZGAH_MARKA,
  isCalismaTezgahiPfosKalem,
  isPimakTezgahSku,
  PIMAK_TEZGAH_MARKA,
} from "./calisma-tezgah";
import { isPimakDavlumbazSku } from "./davlumbaz-marka";
import {
  DUVAR_RAF_MARKA,
  isDuvarRafiPfosKalem,
} from "./duvar-raf-marka";

/** Tanınan imalat markaları — uzun eşleşme önce */
const IMALAT_MARKALAR = [
  "Nuova Simonelli",
  "Electrolux Professional",
  "Bravilor Bonamat",
  "Bravilor",
  "Hamilton Beach",
  "Robot Coupe",
  "Electrolux",
  "Rational",
  "Menumaster",
  "Hoshizaki",
  "Animo",
  "Unox",
  "Hobart",
  "Brema",
  "Santos",
  "Atalay",
  "Boğaziçi",
  "Öztiryakiler",
  "WMF",
  "Empero",
  "Fagor",
  "Inoksan",
  "Bunn",
  "Simag",
  "MKN",
  "Fetco",
  "Behmor",
] as const;

function foldTr(s: string): string {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i");
}

function normKod(v: string | null | undefined): string {
  return String(v ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

/** Öztiryakiler katalog satıcısı; ürün adında başka marka yoksa kendi markası geçerli */
function isOztiDistributorMarka(marka: string | null | undefined): boolean {
  const n = foldTr(marka ?? "");
  return n.includes("oztiryakiler");
}

function markaCanonLabel(marka: string): string {
  const raw = String(marka ?? "").trim();
  if (!raw) return "—";
  const n = foldTr(raw);
  for (const label of [...IMALAT_MARKALAR].sort((a, b) => b.length - a.length)) {
    if (n.includes(foldTr(label))) return label;
  }
  return raw
    .replace(/\s+Endüstriyel\b.*$/i, "")
    .replace(/\s+Mutfak\b.*$/i, "")
    .replace(/\s+Ekipman(lar[ıi])?\b.*$/i, "")
    .replace(/\s+Professional\b.*$/i, "")
    .trim() || raw;
}

/** Ürün adı / specs / açıklama metninden imalat markası */
export function markaFromUrunAdi(ad: string | null | undefined): string | null {
  const text = String(ad ?? "").trim();
  if (!text) return null;

  const markaLine =
    /(?:urun\s*)?markasi?\s*[:|]\s*([^\n|]+)/i.exec(text) ??
    /(?:product\s*)?brand\s*[:|]\s*([^\n|]+)/i.exec(text);
  if (markaLine) {
    const parsed = markaCanonLabel(markaLine[1].trim());
    if (parsed !== "—" && !isOztiDistributorMarka(parsed)) return parsed;
  }

  const n = foldTr(text);
  for (const brand of [...IMALAT_MARKALAR].sort((a, b) => b.length - a.length)) {
    const b = foldTr(brand);
    if (n.startsWith(b) || new RegExp(`\\b${b}\\b`).test(n)) {
      return brand;
    }
  }
  return null;
}

function markaFromKatalogMetin(
  ...parts: Array<string | null | undefined>
): string | null {
  return markaFromUrunAdi(parts.filter(Boolean).join("\n"));
}

/** Şablon tanımı: "Kombi fırın (Rational)" — yalnızca gerçek marka adları */
const PARANTEZ_DEGIL_MARKA =
  /^(gazli|elektrikli|elektrik|gaz|manuel|otomatik|dokum|lavash|opsiyonel|tavsiye|kucuk|buyuk|tek|cift|dual|setustu|yer)$/i;

export function markaFromSablonIsim(isim: string | null | undefined): string | null {
  const m = /\(([^)]+)\)\s*$/.exec(String(isim ?? "").trim());
  if (!m) return null;
  const inner = m[1].trim();
  if (!inner || /^\d/.test(inner)) return null;
  if (PARANTEZ_DEGIL_MARKA.test(foldTr(inner))) return null;
  if (foldTr(inner) === "portashelf" || foldTr(inner) === "equsto") {
    return OZEL_IMALAT_MARKA;
  }
  for (const brand of IMALAT_MARKALAR) {
    if (foldTr(inner) === foldTr(brand)) return brand;
  }
  const canon = markaCanonLabel(inner);
  for (const brand of IMALAT_MARKALAR) {
    if (foldTr(canon) === foldTr(brand)) return brand;
  }
  if (canon && canon !== "—") return canon;
  return null;
}

/**
 * v14 Marka sütunu — ürünün gerçek imalat markası.
 * Öztiryakiler katalog satıcısıdır; ad/şablon/zone/link'te imalat markası varsa o kullanılır.
 */
export function resolveTeklifMarka(opts: {
  katalogMarka?: string | null;
  urunAd?: string | null;
  urunMetin?: string | null;
  sablonIsim?: string | null;
  linkMarka?: string | null;
  zoneMarka?: string | null;
  urunTipi?: string | null;
  sku?: string | null;
  ignoreSablonMarka?: boolean;
}): string {
  const sku = String(opts.sku ?? "").trim();
  if (isPimakTezgahSku(sku) || isPimakDavlumbazSku(sku)) {
    return PIMAK_TEZGAH_MARKA;
  }

  if (
    isOztiBuzdolabiSku(opts.sku) ||
    isOztiBuzdolabiRow({ sku: opts.sku, marka_ad: opts.katalogMarka, ad: opts.urunAd })
  ) {
    return OZTI_MARKA;
  }

  if (
    isMakeUpPfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    return OZTI_MARKA;
  }

  if (
    isBuzdolabiPfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    return OZTI_MARKA;
  }

  if (
    isSenoxPfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    return SENOX_MARKA;
  }

  if (isOzelImalatMotor({ sablonIsim: opts.sablonIsim })) return OZEL_IMALAT_MARKA;
  if (isOzelImalatSablon(opts.sablonIsim)) return OZEL_IMALAT_MARKA;

  if (
    isBulasikPfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    return BULASIK_MARKA;
  }

  if (
    isPortashelfMarkaKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    return PORTASHELF_MARKA;
  }

  if (
    isCaglayanTeshirPfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    return CAGLAYAN_MARKA;
  }

  if (
    isAtalayPisirmePfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    const m = (String(opts.katalogMarka || "") + " " + String(opts.urunAd || "")).toLowerCase();
    if (m.includes("rational")) return "Rational";
    if (m.includes("unox")) return "Unox";
    if (m.includes("electrolux")) return "Electrolux";
    if (isAtalayPisirmeRow({ sku: opts.sku, marka_ad: opts.katalogMarka })) {
      return "Atalay";
    }
    if (isOztiPisirmeRow({ sku: opts.sku, marka_ad: opts.katalogMarka, ad: opts.urunAd })) {
      return OZTI_MARKA;
    }
    return OZTI_MARKA;
  }

  if (
    isCalismaTezgahiPfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    if (opts.katalogMarka?.trim() && foldTr(opts.katalogMarka) === foldTr(PIMAK_TEZGAH_MARKA)) {
      return PIMAK_TEZGAH_MARKA;
    }
    return CALISMA_TEZGAH_MARKA;
  }

  if (
    isDuvarRafiPfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    return DUVAR_RAF_MARKA;
  }

  if (
    isHazirlikPfosKalem({
      isim: opts.sablonIsim ?? opts.urunAd,
      urunTipi: opts.urunTipi,
    })
  ) {
    return HAZIRLIK_MARKA;
  }

  if (opts.linkMarka?.trim()) return markaCanonLabel(opts.linkMarka);

  if (!opts.ignoreSablonMarka) {
    const fromIsim = markaFromSablonIsim(opts.sablonIsim);
    if (fromIsim && fromIsim !== "—") return fromIsim;
  }

  const fromMetin = markaFromKatalogMetin(opts.urunAd, opts.urunMetin);
  if (fromMetin) return markaCanonLabel(fromMetin);

  if (opts.zoneMarka?.trim() && !isOztiDistributorMarka(opts.zoneMarka)) {
    return markaCanonLabel(opts.zoneMarka);
  }

  if (opts.katalogMarka?.trim() && !isOztiDistributorMarka(opts.katalogMarka)) {
    return markaCanonLabel(opts.katalogMarka);
  }

  if (opts.katalogMarka?.trim()) return markaCanonLabel(opts.katalogMarka);

  return "—";
}

function parseMmFromTeknik(lines: string[]): {
  g?: number;
  d?: number;
  y?: number;
} {
  const out: { g?: number; d?: number; y?: number } = {};
  for (const line of lines) {
    const g = /genişlik:\s*(\d+)/i.exec(line);
    const d = /derinlik:\s*(\d+)/i.exec(line);
    const y = /yükseklik:\s*(\d+)/i.exec(line);
    if (g) out.g = Number(g[1]);
    if (d) out.d = Number(d[1]);
    if (y) out.y = Number(y[1]);
  }
  return out;
}

/** "800 x 700 x 300" → "800×700×300 mm" */
function parseBoyutFromAd(ad: string): string | null {
  const m = /(\d{2,4})\s*[*×xX]\s*(\d{2,4})(?:\s*[*×xX]\s*(\d{2,4}))?/.exec(ad);
  if (!m) return null;
  const parts = [Number(m[1]), Number(m[2])];
  if (m[3]) parts.push(Number(m[3]));
  return formatOlcuMm(parts);
}

export function formatKatalogOlcu(
  row: Pick<AdminUrunRow, "sku" | "olculer" | "ad" | "aciklama" | "teknik_ozellikler">,
  zoneOlcu?: string | null,
): string | null {
  const fromSku = olcuMmFromSku(row.sku);
  if (fromSku) return fromSku;

  const o = row.olculer;
  if (o?.genislik_mm && o.derinlik_mm && o.yukseklik_mm) {
    return formatOlcuMm([o.genislik_mm, o.derinlik_mm, o.yukseklik_mm]);
  }

  const teknik = parseMmFromTeknik(row.teknik_ozellikler ?? []);
  if (teknik.g && teknik.d && teknik.y) {
    return formatOlcuMm([teknik.g, teknik.d, teknik.y]);
  }

  const fromDim = parseBoyutFromAd(row.ad);
  if (fromDim && !/tepsi|kizak|gn\s/i.test(foldTr(row.ad))) return fromDim;

  const zone = toOlcuMmDisplay(zoneOlcu);
  if (zone) return zone;

  return null;
}

/** Katalog model kodu — SKU ile aynıysa specs/ad içinden çıkar */
export function resolveKatalogModel(row: AdminUrunRow): string | null {
  const sku = normKod(row.sku);
  if (/^\d+-X-\d+-X-\d+$/i.test(String(row.sku ?? "").trim())) return null;
  const model = String(row.model ?? "").trim();
  if (model && normKod(model) !== sku) return model;

  const hay = `${row.ad}\n${row.aciklama ?? ""}`;
  const tipMatch =
    /\b(OK[A-Z]{2,}\s*\d[\w/]*|[A-Z]{2,}\s*\d{3,}[A-Z0-9/-]*)\b/.exec(hay);
  if (tipMatch) return tipMatch[1].replace(/\s+/g, " ").trim();

  return null;
}

export function enrichEslesmisFromKatalogRow(
  row: AdminUrunRow,
  ctx?: {
    linkMarka?: string | null;
    zoneMarka?: string | null;
    zoneOlcu?: string | null;
    sablonIsim?: string | null;
    urunTipi?: string | null;
  },
): {
  marka: string;
  model: string | null;
  olcu: string | null;
} {
  return {
    marka: resolveTeklifMarka({
      katalogMarka: row.marka_ad,
      urunAd: row.ad,
      urunMetin: row.aciklama,
      sablonIsim: ctx?.sablonIsim,
      linkMarka: ctx?.linkMarka,
      zoneMarka: ctx?.zoneMarka,
      urunTipi: ctx?.urunTipi,
      sku: row.sku,
    }),
    model: resolveKatalogModel(row),
    olcu: formatKatalogOlcu(row, ctx?.zoneOlcu),
  };
}
