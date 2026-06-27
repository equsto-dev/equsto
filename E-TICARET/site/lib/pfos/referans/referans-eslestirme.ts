/**
 * Referans listesi → katalog fiyat eşlemesi (kalıcı politika).
 *
 * 1) pfos-referans-sku-links.json (listeKey|poz → SKU) — doğrulanmış
 * 2) pfos-tip-shop-links.json (urunTipi → SKU) — doğrulanmış tip eşlemesi
 * 3) Aile kuralları (yer ızgarası, make-up, fırın, vb.)
 * 4) İsim + ölçü ile sıkı katalog araması
 * 5) Özel imalat — tezgah/davlumbaz: en yakın EQUSTO katalog ölçüsünden fiyat; diğerleri boş
 */
import { readJsonFile } from "@/lib/legacy-data";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import {
  BULASIK_MARKA,
  isBulasikMakinesiTipKodu,
  isBulasikPfosKalem,
  isBulasikDisMarka,
  isBulasikReferansIsim,
  isInoksanKatalogMarka,
} from "../core/bulasik-marka";
import {
  HAZIRLIK_MARKA,
  inferHazirlikTipFromIsim,
  isHazirlikPfosKalem,
  isHazirlikTipKodu,
  isOztiKatalogMarka,
} from "../core/hazirlik-marka";
import {
  matchShopCatalog,
  productMatchesTipKodu,
} from "../core/shop-catalog-match";
import { resolveTipKodu } from "../core/tip-kodu";
import { buildOzelImalatEslesmis } from "../core/ozel-imalat-build";
import {
  isOzelImalatMotor,
} from "../core/ozel-imalat";
import { inferUrunTipiFromReferansSatir } from "./infer-urun-tipi";
import type { PfosEkipmanSatir } from "../kategoriler/types";
import {
  extractOlcuFromNotlar,
  isYerIzgarasiReferans,
  matchYerIzgarasiByOlcu,
} from "./yer-izgara-match";
import {
  isKomurluIzgaraReferans,
  matchKomurluIzgaraByReferans,
} from "./komurlu-izgara-match";
import {
  isBuzdolabiPfosKalem,
  isBuzdolabiReferansIsim,
  isMakeUpPfosKalem,
  isPortabiancoBuzdolabiRow,
  isPortabiancoBuzdolabiSku,
} from "../core/portabianco-marka";
import { isOztiBuzdolabiRow, isOztiPisirmeRow } from "../core/ozti-marka";
import {
  isPanelSogukOdaPfosKalemAny,
  matchSogukOdaByReferans,
} from "./soguk-oda-match";
import {
  matchBuzdolabiByReferans,
  matchBuzdolapByReferans,
  isBuroTipiDerinDondurucuReferans,
  matchSlimSetaltiDerinDondurucu,
} from "./buzdolabi-match";
import {
  matchBesosKokteylIstasyonByReferans,
  isKokteylIstasyonReferansIsim,
} from "./besos-kokteyl-match";
import {
  isDavlumbazReferans,
  matchDavlumbazByReferans,
} from "./davlumbaz-match";
import {
  isCaglayanTeshirPfosKalem,
  isTeshirReyonReferansIsim,
} from "../core/caglayan-marka";
import { matchTeshirReyonByReferans } from "./teshir-reyon-match";
import {
  ATALAY_MARKA,
  isAtalayPisirmePfosKalem,
  isAtalayPisirmeRow,
  isPisirmeReferansIsim,
  isTostMakinasiReferans,
} from "../core/atalay-marka";
import { ocakFuelFromRow, parseOcakFuelFromReferans } from "../core/atalay-ocak-spec";
import { matchPisirmeByReferans } from "./pisirme-match";
import {
  isDuvarRafiReferans,
  matchDuvarRafiByReferans,
} from "./duvar-raf-match";
import {
  isServisRafiReferans,
  matchServisRafiByReferans,
} from "./servis-raf-match";
import { matchSenoxByReferans } from "./senox-vakum-match";
import { isSenoxPfosKalem } from "../core/senox-marka";
import { isMakeUpReferans, matchMakeUpByReferans } from "./make-up-match";
import {
  isKombiKonveksiyonReferans,
  isTasFirinReferans,
  isPizzaFirinReferans,
  matchAtalayPizzaFirinByReferans,
  matchKombiFirinByReferans,
  matchKonveksiyonFirinByReferans,
  matchTasFirinByReferans,
} from "./firin-match";
import {
  isBuzMakinesiReferans,
  matchBuzMakinesiByReferans,
} from "./buz-makinesi-match";
import {
  isBulasikMakinesiReferans,
  matchBulasikByReferans,
} from "./bulasik-match";
import {
  isIstifRafiReferans,
  matchIstifRafiByReferans,
} from "./istif-raf-match";
import {
  isIstifRafiReferansIsim,
  isIstifRafiDisMarka,
  isIstifRafiTipKodu,
  isCopArabasiPfosKalem,
  isCopArabasiReferansIsim,
  isCopArabasiTipKodu,
  isPortashelfKatalogMarka,
  isPortashelfPfosKalem,
  isOztiIstifSku,
  isPortashelfSku,
} from "../core/portashelf-marka";
import {
  isCopArabasiReferans,
  matchCopArabasiByReferans,
} from "./cop-arabasi-match";
import {
  isCalismaTezgahiPfosKalem,
  isCalismaTezgahiReferansIsim,
  isEqustoTezgahRow,
  isSetUstuAraTezgahKatalog,
} from "../core/calisma-tezgah";
import {
  isCalismaTezgahiReferans,
  matchCalismaTezgahiByReferans,
} from "./calisma-tezgah-match";
import {
  referansKatalogCeliski,
  referansTeklifAciklamaCeliski,
  tipShopLinkUygun,
} from "./referans-nitelikleri";
import {
  extractEqustoKodFromText,
  matchEslesmisByEqustoGuess,
  matchEslesmisByEqustoKod,
} from "@/lib/catalog/equsto-kod-lookup";
import { formatPfosDisplayTanim, stripEmbeddedSupplierSku } from "../parse-upload/sanitize-tanim";
import { isEqustoDavlumbazRow } from "../core/davlumbaz-marka";

export type ReferansMatchInput = {
  isim: string;
  urunTipi: string;
  referansPoz?: string;
  referansListeKey?: string;
  notlar?: string | null;
  olcu?: string | null;
  fiyatStratejisi: FiyatStratejisi;
  sku?: string | null;
};

type SkuLinksFile = {
  links?: Record<
    string,
    { sku: string; marka?: string; name?: string; fiyat_try?: number }
  >;
};

let skuLinksCache: NonNullable<SkuLinksFile["links"]> | null = null;
let skuLinksCacheMtimeMs = 0;

export function invalidateReferansSkuLinksCache(): void {
  skuLinksCache = null;
  skuLinksCacheMtimeMs = 0;
}

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadReferansSkuLinks(): Promise<
  NonNullable<SkuLinksFile["links"]>
> {
  try {
    const { dataPath } = await import("@/lib/legacy-data-fs");
    const fs = await import("node:fs/promises");
    const abs = dataPath("pfos-referans-sku-links.json");
    const st = await fs.stat(abs).catch(() => null);
    const mtime = st?.mtimeMs ?? 0;
    if (skuLinksCache && mtime > 0 && mtime === skuLinksCacheMtimeMs) {
      return skuLinksCache;
    }
    const raw = await readJsonFile<SkuLinksFile>("pfos-referans-sku-links.json");
    skuLinksCache = raw?.links ?? {};
    skuLinksCacheMtimeMs = mtime;
  } catch {
    skuLinksCache = {};
    skuLinksCacheMtimeMs = 0;
  }
  return skuLinksCache;
}

type TipShopLinksFile = {
  links?: Record<
    string,
    { sku?: string; name?: string; brand?: string; marka?: string; fiyat_try?: number }
  >;
};

let tipShopLinksCache: NonNullable<TipShopLinksFile["links"]> | null = null;

async function loadTipShopLinks(): Promise<NonNullable<TipShopLinksFile["links"]>> {
  if (tipShopLinksCache) return tipShopLinksCache;
  try {
    const raw = await readJsonFile<TipShopLinksFile>("pfos-tip-shop-links.json");
    tipShopLinksCache = raw?.links ?? {};
  } catch {
    tipShopLinksCache = {};
  }
  return tipShopLinksCache;
}

function referansTipKodu(input: ReferansMatchInput): string {
  const fromItem = String(input.urunTipi ?? "").trim();
  if (fromItem && !fromItem.startsWith("pfos_")) {
    return resolveTipKodu(fromItem);
  }
  return resolveTipKodu(inferFamilyTip(input.isim, input.referansPoz ?? ""));
}

function isGenericReferansIsim(isim: string): boolean {
  const n = norm(isim);
  return n.length <= 24 || /^(firin|fırın|tas firin|taş fırın)$/.test(n);
}

function referansLinkKey(listeKey: string, poz: string): string {
  return `${listeKey.trim().toLowerCase()}|${poz.trim().toUpperCase()}`;
}

/** Bulut mutfak PDF listeleri — yalnızca pfos-referans-sku-links.json (doğrulanmış) */
export function isBulutReferansListe(listeKey?: string | null): boolean {
  return /^bulut-/i.test(String(listeKey ?? "").trim());
}

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  return katalogRowToEslesmis(row);
}

/** Referans satırı ile katalog adı çelişiyorsa reddet */
export function referansKatalogUyumsuz(
  sablonIsim: string,
  katalogAd: string,
  notlar?: string | null,
  katalogSku?: string | null,
): boolean {
  if (referansKatalogCeliski(sablonIsim, katalogAd, notlar)) return true;
  const s = norm(sablonIsim);
  const k = norm(`${katalogAd} ${katalogSku ?? ""}`);
  if (!s || !k) return false;

  if (/2\s*[\.\s]*el\b|ikinci\s*el\b/i.test(k)) return true;

  // Filter coffee capacity mismatch (e.g. 20 LT urn vs standard coffee brewer)
  if (
    /filtre\s*kahve|filter\s*coffee/i.test(s) &&
    !/20\s*lt|40\s*lt|10\s*lt|5\s*lt|lt\b/i.test(s) &&
    !/20\s*lt|40\s*lt|10\s*lt|5\s*lt|lt\b/i.test(notlar ?? "") &&
    /20\s*lt|40\s*lt|10\s*lt|5\s*lt/i.test(k)
  ) {
    return true;
  }

  // Cocktail station must be neutral (non-refrigerated) unless explicitly requested
  if (
    /kokteyl|cocktail/i.test(s) &&
    /sogutu|soğutu|buzdolab|dolabi|dolabı|sogutma|soğutma/i.test(k) &&
    !/sogutucu|soğutucu|buzdolab/i.test(s) &&
    !/sogutucu|soğutucu|buzdolab/i.test(notlar ?? "")
  ) {
    return true;
  }

  // GN 2/1 vs GN 1/1 mismatch
  const hasRef21 = /(2\/1|2-1)\b/.test(sablonIsim) || /(2\/1|2-1)\b/.test(notlar ?? "");
  const hasRef11 = /(1\/1|1-1)\b/.test(sablonIsim) || /(1\/1|1-1)\b/.test(notlar ?? "");
  const hasKat21 = /(2\/1|2-1)\b/.test(katalogAd) || /(2\/1|2-1)\b/.test(katalogSku ?? "");
  const hasKat11 = /(1\/1|1-1)\b/.test(katalogAd) || /(1\/1|1-1)\b/.test(katalogSku ?? "");
  if (hasRef21 && hasKat11 && !hasKat21) return true;
  if (hasRef11 && hasKat21 && !hasKat11) return true;

  if (/mayalama\s*dolab/.test(s)) {
    const skuNorm = norm(katalogSku ?? "");
    if (/70182\.(00|01|03)\b/.test(skuNorm)) return true;
    if (/banket\s*arab|isitmali\s*banket/.test(k) && !/mayalama/.test(k)) return true;
  }

  // 10. Tost makinesi vs döner sarma/kesme/döner
  const isKatTost = k.includes("tost") || /^aktm|^akek-0|^atm-|^vbl-/i.test(katalogSku ?? "");
  if (s.includes("tost") && (k.includes("doner") || k.includes("döner") || k.includes("sarma") || !isKatTost)) {
    return true;
  }
  if ((s.includes("doner") || s.includes("döner") || s.includes("sarma")) && isKatTost) {
    return true;
  }

  // 11. Taş fırın vs bıçak steril dolabı
  if (
    /firin|fırın/.test(s) &&
    !/firin|fırın|kuzine|ocak/.test(k) &&
    (/steril|dolap|dolab|dolabi/i.test(k) || /abs-\d+/i.test(katalogSku ?? ""))
  ) {
    return true;
  }

  // 15. Mikrodalga fırın vs pizza/taş fırın
  if (
    /mikrodalga|microwave|menumaster/i.test(s) &&
    !/mikrodalga|microwave|menumaster/i.test(k)
  ) {
    return true;
  }
  if (
    !/mikrodalga|microwave|menumaster/i.test(s) &&
    /mikrodalga|microwave/i.test(k)
  ) {
    return true;
  }

  // 16. Katı meyve sıkacağı vs portakal sıkma (citrus juicer)
  if (
    /kati\s*meyve|katı\s*meyve|centrifugal/i.test(s) &&
    /portakal|narenciye|citrus/i.test(k)
  ) {
    return true;
  }
  if (
    /portakal|narenciye|citrus/i.test(s) &&
    (/kati\s*meyve|katı\s*meyve|centrifugal|118\.km/i.test(k))
  ) {
    return true;
  }

  // 17. Çöp arabası/trolley vs static shelving/worktop
  if (
    /araba|tasima|ta[sş]ima|trolley/i.test(s) &&
    !/araba|tasima|ta[sş]ima|trolley/i.test(k) &&
    !/setalt|alt\s+tezgah/i.test(k)
  ) {
    return true;
  }

  if (
    /davlumbaz/.test(k) &&
    /tezgah|sehpa|raf|evye|masa|dolap|buzdolab|sogutu/i.test(s) &&
    !/davlumbaz/i.test(s)
  ) {
    return true;
  }
  if (
    isCalismaTezgahiReferansIsim(sablonIsim, notlar) &&
    isEqustoDavlumbazRow(katalogSku, katalogAd)
  ) {
    return true;
  }
  if (
    /induksiyon|indüksiyon|enduksiyon|endüksiyon/.test(s) &&
    /elektrik/.test(k) &&
    !/induksiyon|indüksiyon/.test(k)
  ) {
    return true;
  }
  if (
    /induksiyon|indüksiyon|enduksiyon|endüksiyon/.test(s) &&
    /teshir|teşhir|vitrin|display|pasta|cupcake|tatli|tatlı/.test(k) &&
    !/ocak|induksiyon/.test(k)
  ) {
    return true;
  }
  if (
    /davlumbaz/.test(s) &&
    /tezgah|sehpa|raf|evye|masa|dolap|buzdolab|sogutu/i.test(k) &&
    !/davlumbaz/i.test(k)
  ) {
    return true;
  }
  if (
    /(?:araba|tasima|ta[sş]ima)/.test(k) &&
    /raf|tezgah|sehpa|masa|dolap/i.test(s) &&
    !/(?:araba|tasima|ta[sş]ima)/i.test(s)
  ) {
    return true;
  }
  if (s.includes("karbuz") && k.includes("buz mak") && !k.includes("karbuz")) {
    return true;
  }
  if (
    s.includes("espresso") &&
    !k.includes("espresso") &&
    !k.includes("kahve mak")
  ) {
    return true;
  }
  if (s.includes("bardak yik") && k.includes("giyotin")) return true;
  if (s.includes("giyotin") && k.includes("bardak yik")) return true;
  if (
    (s.includes("bulasik yik") || s.includes("bulaşık yik")) &&
    /firin|konveksiyon|fritoz|izgara|ocak|kuzine/.test(k) &&
    !/bulasik|bulaşık|yikama mak/.test(k)
  ) {
    return true;
  }
  if (
    (s.includes("servis banko") || s.includes("dekoratif servis")) &&
    /davlumbaz/.test(k)
  ) {
    return true;
  }
  if (s.includes("banko") && /davlumbaz/.test(k) && !s.includes("davlumbaz")) {
    return true;
  }
  if (
    (s.includes("komurlu") || s.includes("kömürlü")) &&
    s.includes("izgar") &&
    (/yer\s*izgar|7960\.|pvc|sifon|tavali/.test(k) ||
      !/komurlu|kömürlü/.test(k))
  ) {
    return true;
  }
  if (
    (s.includes("vakum") || s.includes("vakuum")) &&
    s.includes("makin") &&
    /oztiryakiler|\bozti\b|8916\./.test(k)
  ) {
    return true;
  }
  if (
    isBulasikReferansIsim(sablonIsim) &&
    isBulasikDisMarka(katalogAd) &&
    !isInoksanKatalogMarka(katalogAd)
  ) {
    return true;
  }
  if (
    isBulasikReferansIsim(sablonIsim) &&
    /electrolux|rational|fagor|hobart|winterhalter/.test(k) &&
    !/inoksan|ino-bym|ino-byk/.test(k)
  ) {
    return true;
  }
  if (
    isIstifRafiReferansIsim(sablonIsim) &&
    isIstifRafiDisMarka(katalogAd) &&
    !isPortashelfKatalogMarka(katalogAd)
  ) {
    return true;
  }
  if (
    isIstifRafiReferansIsim(sablonIsim) &&
    (/8897\.|7897\.|oztiryakiler|\bozti\b/.test(k) ||
      isOztiIstifSku(katalogSku) ||
      (katalogSku && !isPortashelfSku(katalogSku)))
  ) {
    return true;
  }
  if (
    isCalismaTezgahiReferansIsim(sablonIsim, notlar) &&
    !isEqustoTezgahRow(katalogSku, katalogAd) &&
    (/7911\.n1\.|7711\.|7897\.|oztiryakiler|\bozti\b|electrolux|^132\d{3,6}\b|371\d/.test(k) ||
      isSetUstuAraTezgahKatalog(katalogAd, katalogSku))
  ) {
    return true;
  }
  if (
    isCalismaTezgahiReferansIsim(sablonIsim, notlar) &&
    /(?:firin|fırın|kuzine|ocak|fritoz|fritöz|izgara|ızgara)/.test(k) &&
    !/(?:alti|altı|sehpa|tezgah)/.test(k)
  ) {
    return true;
  }
  if (
    /davlumbaz/.test(s) &&
    (/7885\.|oztiryakiler|\bozti\b/.test(k) && !/^equsto\./i.test(k))
  ) {
    return true;
  }
  if (
    isBuzdolabiReferansIsim(sablonIsim) &&
    !/portabianco/.test(k) &&
    (/7919\.|8919\.|79e4\.|7885\.|371\d|electrolux|oztiryakiler|\bozti\b|equsto/.test(k))
  ) {
    return true;
  }
  if (
    isTeshirReyonReferansIsim(sablonIsim) &&
    !/caglayan|çağlayan/.test(k) &&
    (/8919\.tsv|8919\.ts|oztiryakiler|\bozti\b|electrolux|equsto/.test(k) && !/^eq-/i.test(k))
  ) {
    return true;
  }
  if (
    isKombiKonveksiyonReferans(sablonIsim) &&
    (/setalt|set alt|tezgah alt|easfe-|asfe-|easfg-|asfg-/.test(k))
  ) {
    return true;
  }
  if (/ocak|alevli/.test(s) && !/wok|krep|tost/.test(s)) {
    const refFuel = parseOcakFuelFromReferans(sablonIsim, notlar);
    if (refFuel && katalogSku) {
      const rowFuel = ocakFuelFromRow({
        sku: katalogSku,
        ad: katalogAd,
        kategori: katalogAd,
      });
      if (rowFuel && rowFuel !== refFuel) return true;
    }
  }
  if (
    isPisirmeReferansIsim(sablonIsim) &&
    !isKombiKonveksiyonReferans(sablonIsim) &&
    !s.includes("salamander") &&
    !/atalay/.test(k) &&
    !/plate\s*izgar|dokum\s*izgar|lavatas.*izgar/.test(s) &&
    /^78\d{2}\./i.test(String(katalogSku ?? "").trim())
  ) {
    return true;
  }
  if (
    /plate\s*izgar/.test(s) &&
    (/kuzine|firinli|elektrik/.test(k) && !/grill plate|plate duz|plate düz/.test(k))
  ) {
    return true;
  }
  if (
    /dokum\s*izgar/.test(s) &&
    (/kuzine|firinli|elektrik|grill plate|plate duz|lavatas/.test(k) &&
      !/dokum izgar/.test(k))
  ) {
    return true;
  }
  if (
    isCopArabasiReferansIsim(sablonIsim) &&
    /8893\.|oztiryakiler|\bozti\b|plastik|kova|8893\.00120/.test(k) &&
    !/portashelf|yuksel|mb126/.test(k)
  ) {
    return true;
  }
  if (
    isCopArabasiReferansIsim(sablonIsim) &&
    isIstifRafiDisMarka(katalogAd) &&
    !isPortashelfKatalogMarka(katalogAd) &&
    !/mb126|yuksel|portashelf/.test(k)
  ) {
    return true;
  }
  return false;
}

function olcuSayilari(olcu: string): number[] {
  return [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
}

/** Referans ölçüsü (cm) ↔ katalog adındaki mm/cm boyutları */
function olcuEslesmeSkoru(olcu: string, urunAd: string): number {
  const nums = olcuSayilari(olcu);
  if (!nums.length) return 0;
  const ad = norm(urunAd).replace(/[×x]/g, "*");
  let score = 0;

  if (nums.length >= 3) {
    const [a, b, c] = nums;
    const triples = [
      `${a}*${b}*${c}`,
      `${a}x${b}x${c}`,
      `${Math.round(a * 10)}*${Math.round(b * 10)}*${Math.round(c * 10)}`,
    ];
    if (triples.some((t) => ad.includes(t))) score += 120;
  }
  if (nums.length >= 2) {
    const [a, b] = nums;
    if (ad.includes(`${a}*${b}`) || ad.includes(`${a}x${b}`)) score += 70;
    const mmA = Math.round(a * 10);
    const mmB = Math.round(b * 10);
    if (ad.includes(`${mmA}*${mmB}`) || ad.includes(`${mmA}x${mmB}`)) score += 80;
  }

  for (const n of nums) {
    const mm = Math.round(n * 10);
    if (ad.includes(`${n}*`) || ad.includes(`${n}x`) || ad.includes(` ${n} `)) {
      score += 45;
    }
    if (ad.includes(`${mm}*`) || ad.includes(`${mm}x`)) score += 55;
    if (nums.length >= 2 && (ad.includes(String(n)) || ad.includes(String(mm)))) {
      score += 6;
    }
  }
  return score;
}

function isimEslesmeSkoru(isim: string, urunAd: string): number {
  const a = norm(isim);
  const b = norm(urunAd);
  if (!a || !b) return 0;
  if (a === b) return 200;

  const aClean = a.replace(/[,;.:|]/g, " ");
  const bClean = b.replace(/[,;.:|]/g, " ");
  if (bClean.includes(aClean) || aClean.includes(bClean)) return 120;

  const tokens = aClean
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !/^(gazli|elektrikli|setalti|dolapli)$/.test(w));
  if (!tokens.length) return 0;
  let hit = 0;
  for (const t of tokens) {
    if (bClean.includes(t)) hit++;
  }
  return hit >= 2 ? hit * 35 : hit * 15;
}

function inferFamilyTip(isim: string, poz: string): string {
  const satir: PfosEkipmanSatir = {
    bolum: "",
    bolumAd: "",
    poz,
    ad: isim,
    olcu: "",
    adet: 1,
  };
  return inferUrunTipiFromReferansSatir(satir);
}

async function findAdminRowBySku(sku: string): Promise<AdminUrunRow | null> {
  const needle = norm(sku);
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  const exact = rows.find((r) => norm(r.sku ?? "") === needle);
  if (exact) return exact;

  const prefixHits = rows.filter((r) => norm(r.sku ?? "").startsWith(needle));
  if (prefixHits.length === 1) return prefixHits[0];
  if (prefixHits.length > 1) {
    prefixHits.sort(
      (a, b) => norm(a.sku ?? "").length - norm(b.sku ?? "").length,
    );
    return prefixHits[0];
  }
  return null;
}

async function findAdminRowByExactSku(sku: string): Promise<AdminUrunRow | null> {
  const needle = norm(sku);
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  return rows.find((r) => norm(r.sku ?? "") === needle) ?? null;
}

async function matchByExplicitSku(
  sku: string,
  sablonIsim?: string | null,
  notlar?: string | null,
): Promise<EslesmisUrun | null> {
  const row = await findAdminRowBySku(sku);
  if (!row) return null;
  const matched = rowToEslesmis(row);
  if (
    sablonIsim &&
    referansKatalogUyumsuz(sablonIsim, matched.ad ?? "", notlar, matched.sku)
  ) {
    return null;
  }
  return matched;
}

/** Doğrulanmış tip_kodu → SKU (pfos-tip-shop-links) — yalnızca referans urunTipi ile */
async function matchByTipShopLink(
  input: ReferansMatchInput,
): Promise<EslesmisUrun | null> {
  const inferredHazirlik = inferHazirlikTipFromIsim(input.isim);
  const urunTipiRaw = String(input.urunTipi ?? "").trim();
  const urunTipi =
    urunTipiRaw && !urunTipiRaw.startsWith("pfos_")
      ? urunTipiRaw
      : inferredHazirlik ?? urunTipiRaw;
  if (!urunTipi || urunTipi.startsWith("pfos_")) return null;

  const tip = resolveTipKodu(inferredHazirlik ?? referansTipKodu(input));
  if (
    isCalismaTezgahiPfosKalem({
      isim: input.isim,
      urunTipi: input.urunTipi ?? tip,
      notlar: input.notlar,
    })
  ) {
    return null;
  }
  if (isDavlumbazReferans(input.isim)) {
    return null;
  }
  if (isBuzdolabiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    return null;
  }
  if (isSenoxPfosKalem({ isim: input.isim, urunTipi: input.urunTipi, notlar: input.notlar })) {
    return null;
  }
  if (isMakeUpPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    return null;
  }
  if (isCaglayanTeshirPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    return null;
  }
  if (
    isAtalayPisirmePfosKalem({ isim: input.isim, urunTipi: input.urunTipi }) &&
    !isTostMakinasiReferans(input.isim, input.urunTipi)
  ) {
    return null;
  }
  if (tip === "buz_makinesi" && isBuzMakinesiReferans(input.isim)) {
    return null;
  }
  if (
    isBulasikMakinesiTipKodu(tip) &&
    isBulasikPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })
  ) {
    return null;
  }
  if (
    isIstifRafiTipKodu(tip) &&
    isPortashelfPfosKalem({ isim: input.isim, urunTipi: input.urunTipi }) &&
    (extractOlcuFromNotlar(input.notlar) ||
      (input.notlar?.match(/(\d+\s*[*xX×]\s*\d+)/)?.[1] ?? "") ||
      input.sku)
  ) {
    return null;
  }
  if (
    isCopArabasiTipKodu(tip) &&
    isCopArabasiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi }) &&
    (extractOlcuFromNotlar(input.notlar) ||
      (input.notlar?.match(/(\d+\s*[*xX×]\s*\d+)/)?.[1] ?? "") ||
      input.sku)
  ) {
    return null;
  }
  if (
    tip === "yer_izgara" &&
    !isYerIzgarasiReferans(input.isim) &&
    !/^yer-izgara-\d+$/i.test(urunTipi)
  ) {
    return null;
  }
  if (tip === "vakum_makinesi") {
    return null;
  }

  const links = await loadTipShopLinks();
  const link = links[tip];
  if (!link?.sku && !(link?.name || link?.marka)) return null;
  if (!tipShopLinkUygun(input.isim, input.notlar, link.name ?? link.sku)) {
    return null;
  }

  const hazirlik = isHazirlikTipKodu(tip);
  const linkMarka = link.marka ?? (hazirlik ? HAZIRLIK_MARKA : undefined);

  if (link.sku) {
    const byRow = await findAdminRowBySku(link.sku);
    if (
      byRow &&
      !referansKatalogUyumsuz(input.isim, byRow.ad, input.notlar, byRow.sku)
    ) {
      return katalogRowToEslesmis(byRow, {
        linkMarka,
        sablonIsim: input.isim,
        urunTipi: tip,
      });
    }
  }

  if (link.fiyat_try && link.fiyat_try > 0) {
    return {
      id: `tip-link-${tip}`,
      sku: link.sku ?? "",
      ad: link.name ?? input.isim,
      marka: linkMarka ?? link.brand ?? (hazirlik ? HAZIRLIK_MARKA : BULASIK_MARKA),
      model: link.sku ?? null,
      olcu: extractOlcuFromNotlar(input.notlar) || null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: Math.round(link.fiyat_try),
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }

  if (tip === "montaj_nakliye") {
    return {
      id: `tip-link-${tip}`,
      sku: link.sku ?? null,
      ad: link.name ?? input.isim,
      marka: link.brand ?? "Equsto Proje Fabrikası",
      model: link.sku ?? null,
      olcu: null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: 0,
      doviz: "TRY",
      gorselUrl: null,
    };
  }
  return null;
}

async function matchByVerifiedLink(
  input: ReferansMatchInput,
): Promise<EslesmisUrun | null> {
  if (input.sku?.trim()) {
    const bySku = await matchByExplicitSku(input.sku, input.isim, input.notlar);
    if (bySku) return bySku;
  }
  const liste = input.referansListeKey?.trim();
  const poz = input.referansPoz?.trim();
  if (!liste || !poz) return null;

  const links = await loadReferansSkuLinks();
  const link = links[referansLinkKey(liste, poz)];
  if (!link?.sku) return null;

  const exactRow = await findAdminRowByExactSku(link.sku);
  if (exactRow) {
    const bySku = rowToEslesmis(exactRow);
    if (
      isIstifRafiReferansIsim(input.isim) &&
      isOztiIstifSku(bySku.sku ?? link.sku)
    ) {
      return null;
    }
    const aciklamaCeliski =
      bySku.teklifAciklama &&
      referansTeklifAciklamaCeliski(
        input.isim,
        bySku.teklifAciklama,
        input.notlar,
      );
    return {
      ...bySku,
      ad: input.isim,
      marka: link.marka?.trim() || bySku.marka,
      gorselUrl: aciklamaCeliski ? null : bySku.gorselUrl,
      teklifAciklama: aciklamaCeliski ? null : bySku.teklifAciklama,
    };
  }
  if (link.fiyat_try && link.fiyat_try > 0) {
    return {
      id: `ref-link-${liste}-${poz}`,
      sku: link.sku ?? null,
      ad: link.name ?? input.isim,
      marka: link.marka ?? "Öztiryakiler",
      model: link.sku ?? null,
      olcu: extractOlcuFromNotlar(input.notlar) || null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: Math.round(link.fiyat_try),
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }
  return null;
}

async function matchMixersByReferans(
  input: ReferansMatchInput,
  olcu: string,
): Promise<EslesmisUrun | null> {
  const name = norm(input.isim);
  const rows = await loadLegacyCatalogRows();

  if (isTostMakinasiReferans(input.isim, input.urunTipi)) {
    return null;
  }

  // Planet mikser ve setüstü mikserler
  if (
    /planet\s*mikser|planet\s*hamur|mikser\s*setustu|mikser\s*setüstü|stand\s*mikser/.test(name) ||
    (name.includes("mikser") && !name.includes("el mikser") && !name.includes("bar mikser") && !name.includes("cikolata") && !name.includes("choc"))
  ) {
    const capacity = norm(input.olcu || input.notlar || "");
    
    // a. Setüstü / küçük mikserler (4.5 lt, 5 lt, 7 lt, 8 lt, 10 lt)
    if (
      /4[.,]5|5\s*lt|7\s*lt|8\s*lt|10\s*lt|setustu|setüstü|mutfak\s*sefi|mutfak\s*şefi/.test(capacity) ||
      /setustu|setüstü|mutfak\s*sefi|mutfak\s*şefi/.test(name)
    ) {
      const sku = /10\s*lt/.test(capacity) ? "118.MS10" : "118.MS07";
      const found = rows.find((r) => r.sku === sku);
      if (found) {
        return katalogRowToEslesmis(found, { linkMarka: "Şenox" });
      }
    }

    // b. 60 lt Mikser
    if (/60\s*lt|60/.test(capacity)) {
      const found = rows.find((r) => r.sku === "BM.60S");
      if (found) {
        return katalogRowToEslesmis(found, { linkMarka: HAZIRLIK_MARKA });
      }
    }

    // c. 20 lt Mikser
    if (/20\s*lt|20/.test(capacity)) {
      const found = rows.find((r) => r.sku === "BM.20S");
      if (found) {
        return katalogRowToEslesmis(found, { linkMarka: HAZIRLIK_MARKA });
      }
    }

    // d. 40 lt Mikser
    if (/40\s*lt|40/.test(capacity)) {
      const found = rows.find((r) => r.sku === "BM.40S");
      if (found) {
        return katalogRowToEslesmis(found, { linkMarka: HAZIRLIK_MARKA });
      }
    }

    // Default fallback planet mikser
    const defLink = rows.find((r) => r.sku === "BM.20S");
    if (defLink) return katalogRowToEslesmis(defLink, { linkMarka: HAZIRLIK_MARKA });
  }

  // Hamur yoğurma makinesi (çatal kollu / spiral)
  if (/hamur\s*yogur|hamur\s*yoğur/.test(name)) {
    const capacity = norm(input.olcu || input.notlar || "");

    // 50 kg hamur yoğurma -> BHY.50
    if (/50\s*kg|50/.test(capacity)) {
      const found = rows.find((r) => r.sku === "BHY.50");
      if (found) {
        return katalogRowToEslesmis(found, { linkMarka: HAZIRLIK_MARKA });
      }
    }

    // Default fallback hamur yoğurma
    const defLink = rows.find((r) => r.sku === "BHY.50");
    if (defLink) return katalogRowToEslesmis(defLink, { linkMarka: HAZIRLIK_MARKA });
  }

  return null;
}

async function matchByFamilyRules(
  input: ReferansMatchInput,
  olcu: string,
): Promise<EslesmisUrun | null> {
  const mixer = await matchMixersByReferans(input, olcu);
  if (mixer) return mixer;

  if (isYerIzgarasiReferans(input.isim) || /^yer-izgara-\d+$/.test(input.urunTipi)) {
    return matchYerIzgarasiByOlcu(olcu, input.notlar, input.fiyatStratejisi);
  }
  if (isDavlumbazReferans(input.isim)) {
    return matchDavlumbazByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
  }
  if (
    isKomurluIzgaraReferans(input.isim) ||
    input.urunTipi === "komurlu-izgara" ||
    referansTipKodu(input) === "komurlu_izgara"
  ) {
    return matchKomurluIzgaraByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.fiyatStratejisi,
    );
  }
  if (isMakeUpReferans(input.isim)) {
    return matchMakeUpByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.fiyatStratejisi,
      input.urunTipi,
    );
  }
  if (
    isBuzdolabiReferansIsim(input.isim) ||
    isBuzdolabiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })
  ) {
    return matchBuzdolapByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
  }
  if (isBuzMakinesiReferans(input.isim)) {
    return matchBuzMakinesiByReferans(
      input.isim,
      input.notlar,
      input.fiyatStratejisi,
    );
  }
  if (isBulasikMakinesiReferans(input.isim)) {
    return matchBulasikByReferans(
      input.isim,
      input.notlar,
      input.fiyatStratejisi,
    );
  }
  if (isIstifRafiReferans(input.isim)) {
    return matchIstifRafiByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.fiyatStratejisi,
    );
  }
  if (isCopArabasiReferans(input.isim)) {
    return matchCopArabasiByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.fiyatStratejisi,
    );
  }
  if (isCalismaTezgahiReferans(input.isim)) {
    return matchCalismaTezgahiByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
  }
  if (
    isTasFirinReferans(input.isim) ||
    input.urunTipi === "tas-firin" ||
    referansTipKodu(input) === "tas_tabanli_firin"
  ) {
    return matchTasFirinByReferans(input.isim, input.fiyatStratejisi);
  }
  if (
    (input.urunTipi === "konveksiyon-firin-pastane" ||
      input.urunTipi === "konveksiyon-firin-unox" ||
      (isGenericReferansIsim(input.isim) && /firin|fırın/.test(norm(input.isim)))) &&
    input.urunTipi !== "firin-arabasi" &&
    input.urunTipi !== "firin-tezgahi" &&
    !/araba|trolley|tezgah|sehpa|stand/.test(norm(input.isim))
  ) {
    return matchKonveksiyonFirinByReferans(
      input.isim,
      input.fiyatStratejisi,
    );
  }
  return null;
}

const MIN_STRICT_SCORE = 95;
/** Sadece ölçü eşleşmesiyle yanlış ürün tipi seçilmesin */
const MIN_STRICT_ISIM_SCORE = 30;

/** İsim + ölçü — pfos-tip-shop-links tek-SKU kısayolu kullanılmaz */
async function matchStrictCatalog(
  input: ReferansMatchInput,
  olcu: string,
): Promise<EslesmisUrun | null> {
  const familyTip = referansTipKodu(input);
  if (familyTip === "firin_arabasi") {
    return null;
  }
  const tipLinks = await loadTipShopLinks();
  const preferredSku = familyTip ? tipLinks[familyTip]?.sku : null;

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );

  const scored = rows
    .map((row) => {
      if (referansKatalogUyumsuz(input.isim, row.ad, input.notlar, row.sku)) {
        return { row, score: -9999 };
      }
      if (
        isHazirlikPfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        isOztiKatalogMarka(row.marka_ad)
      ) {
        return { row, score: -9999 };
      }
      if (
        isSenoxPfosKalem({ isim: input.isim, urunTipi: familyTip, notlar: input.notlar }) &&
        isOztiKatalogMarka(row.marka_ad)
      ) {
        return { row, score: -9999 };
      }
      if (
        isMakeUpPfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        (isPortabiancoBuzdolabiRow(row) ||
          isPortabiancoBuzdolabiSku(row.sku))
      ) {
        return { row, score: -9999 };
      }
      if (
        isBuzdolabiPfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        !isOztiBuzdolabiRow(row)
      ) {
        return { row, score: -9999 };
      }
      if (
        isAtalayPisirmePfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        !isOztiPisirmeRow(row)
      ) {
        return { row, score: -9999 };
      }
      if (
        isBulasikPfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        !isInoksanKatalogMarka(row.marka_ad) &&
        !norm(`${row.ad} ${row.sku ?? ""}`).includes("ino-bym") &&
        !norm(`${row.ad} ${row.sku ?? ""}`).includes("ino-byk")
      ) {
        return { row, score: -9999 };
      }
      if (
        isPortashelfPfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        (isOztiIstifSku(row.sku) ||
          (!isPortashelfSku(row.sku) && !isPortashelfKatalogMarka(row.marka_ad)))
      ) {
        return { row, score: -9999 };
      }
      if (
        isCopArabasiPfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        !isPortashelfKatalogMarka(row.marka_ad) &&
        !/portashelf|yuksel|mb126/i.test(`${row.ad} ${row.sku ?? ""} ${row.marka_ad}`)
      ) {
        return { row, score: -9999 };
      }
      if (
        isCalismaTezgahiPfosKalem({
          isim: input.isim,
          urunTipi: familyTip,
          notlar: input.notlar,
        }) &&
        !isEqustoTezgahRow(row.sku, row.ad)
      ) {
        return { row, score: -9999 };
      }
      if (
        isEqustoDavlumbazRow(row.sku, row.ad) &&
        !isDavlumbazReferans(input.isim)
      ) {
        return { row, score: -9999 };
      }
      if (
        /^(7885|9885)\./i.test(String(row.sku ?? "")) &&
        !isDavlumbazReferans(input.isim)
      ) {
        return { row, score: -9999 };
      }
      const isimScore = isimEslesmeSkoru(input.isim, row.ad);
      if (isimScore < MIN_STRICT_ISIM_SCORE) {
        return { row, score: -9999 };
      }
      let score = isimScore;
      if (preferredSku && row.sku === preferredSku) {
        score += 150;
      }
      if (olcu) score += olcuEslesmeSkoru(olcu, row.ad);
      if (familyTip && !familyTip.startsWith("pfos_")) {
        if (productMatchesTipKodu(row, familyTip)) score += 40;
        else score -= 30;
      }
      if (row.gorsel_url) score += 5;
      return { row, score };
    })
    .filter((x) => x.score >= MIN_STRICT_SCORE)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  return katalogRowToEslesmis(scored[0].row, {
    sablonIsim: input.isim,
    urunTipi: familyTip,
  });
}

async function getOzelImalatPrice(isim: string, olcu: string, urunTipi?: string | null): Promise<number> {
  let ozelFiyat = 0;
  try {
    const { loadLegacyCatalogRows } = await import("@/lib/legacy-catalog");
    const { findClosestEqustoTezgahPriceRow, findClosestEqustoDavlumbazPriceRow } = await import("../core/ozel-imalat-yakin-olcu");
    const { isCalismaTezgahiPfosKalem } = await import("../core/calisma-tezgah");
    const { isDavlumbazReferans } = await import("./davlumbaz-match");
    const { dimsCmFromOlcu } = await import("../core/davlumbaz-marka");

    const rows = await loadLegacyCatalogRows();
    if (isCalismaTezgahiPfosKalem({ isim, urunTipi })) {
      const closest = findClosestEqustoTezgahPriceRow(rows, isim, olcu);
      if (closest) {
        ozelFiyat = closest.fiyat_tl;
      }
    } else if (isDavlumbazReferans(isim)) {
      const targetDims = dimsCmFromOlcu(olcu);
      const isOrta = /orta\s*tip/i.test(`${isim} ${urunTipi ?? ""}`);
      const isFiltreli = !/filtresiz/i.test(`${isim} ${urunTipi ?? ""}`);
      const filter = (row: AdminUrunRow) => {
        const sku = String(row.sku ?? "").toUpperCase();
        const isRowOrta = sku.includes("KDAVO");
        const isRowFiltreli = sku.includes("KDAVDTF") || sku.includes("KDAVOTF");
        return isRowOrta === isOrta && isRowFiltreli === isFiltreli;
      };
      const closest = findClosestEqustoDavlumbazPriceRow(rows, targetDims, filter);
      if (closest) {
        ozelFiyat = closest.fiyat_tl;
      }
    }
  } catch (e) {
    console.error("Error in getOzelImalatPrice:", e);
  }
  return ozelFiyat;
}

async function fallbackOzelImalat(input: ReferansMatchInput): Promise<EslesmisUrun> {
  const olcu =
    extractOlcuFromNotlar(input.notlar) ||
    (input.notlar?.match(/(\d+\s*[*xX×]\s*\d+(?:\s*[*xX×]\s*\d+)?)/)?.[1] ?? "");
  const ozelFiyat = await getOzelImalatPrice(input.isim, olcu, input.urunTipi);
  return buildOzelImalatEslesmis({
    isim: input.isim,
    urunTipi: input.urunTipi,
    notlar: input.notlar,
    fiyatTry: ozelFiyat,
    fiyatEur: null,
  });
}

/** Ana besleyici master tablo — EQ- kodu önceliği */
async function matchByMasterEqustoKod(
  input: ReferansMatchInput,
): Promise<EslesmisUrun | null> {
  if (
    isCalismaTezgahiPfosKalem({
      isim: input.isim,
      urunTipi: input.urunTipi,
      notlar: input.notlar,
    })
  ) {
    return null;
  }
  const cleanedIsim = formatPfosDisplayTanim(input.isim);
  const fromText =
    extractEqustoKodFromText(cleanedIsim) ||
    extractEqustoKodFromText(input.notlar ?? "");
  if (fromText) {
    const direct = await matchEslesmisByEqustoKod(fromText);
    if (direct && !referansKatalogUyumsuz(cleanedIsim, direct.ad ?? "", input.notlar, direct.sku)) {
      return direct;
    }
  }
  const guess = await matchEslesmisByEqustoGuess({
    tanim: cleanedIsim,
    marka_urun_kodu: input.sku ?? undefined,
  });
  if (guess && !referansKatalogUyumsuz(cleanedIsim, guess.ad ?? "", input.notlar, guess.sku)) {
    return guess;
  }
  return null;
}

/** İsim + ölçü ile sıkı katalog araması (özel imalat / zone fallback için) */
export async function matchCatalogByIsimOlcu(
  isim: string,
  notlar: string | null | undefined,
  urunTipi = "",
  fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const byEq = await matchEslesmisByEqustoGuess({
    tanim: [isim, notlar].filter(Boolean).join(" "),
  });
  if (byEq && !referansKatalogUyumsuz(isim, byEq.ad ?? "", notlar, byEq.sku)) {
    return byEq;
  }

  const olcu =
    extractOlcuFromNotlar(notlar) ||
    (notlar?.match(/(\d+\s*[*xX×]\s*\d+)/)?.[1] ?? "");
  return matchStrictCatalog(
    {
      isim,
      urunTipi,
      notlar,
      fiyatStratejisi,
    },
    olcu,
  );
}

export function isUnSekerArabasiReferans(isim: string): boolean {
  const n = norm(isim);
  const hasUn = /\bun\b/i.test(n) || n.includes("un-seker") || n.includes("un seker");
  const hasSeker = /\bseker\b/i.test(n);
  const hasAraba = /araba|trolley|container|konteyner/i.test(n);
  return (hasUn || hasSeker) && hasAraba;
}

export async function matchUnSekerArabasiByReferans(
  isim: string,
  fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const fc100 = await matchEslesmisByEqustoKod("EQ-PIMAK.FC-100");
  if (fc100) return fc100;

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      (r.fiyat_tl > 0 || (r.satis_fiyat_eur ?? 0) > 0),
  );

  const unSekerRows = rows.filter((r) => {
    const name = String(r.ad ?? "").toLowerCase();
    const hasUn = /\bun\b/i.test(name) || name.includes("un-şeker") || name.includes("un şeker") || name.includes("un-seker");
    const hasSeker = /\bseker\b/i.test(name) || /\bşeker\b/i.test(name);
    const hasAraba = /araba/i.test(name) || /trolley/i.test(name) || /container/i.test(name) || /konteyner/i.test(name);
    return (hasUn || hasSeker) && hasAraba;
  });

  if (!unSekerRows.length) return null;

  let selected = unSekerRows[0];
  if (fiyatStratejisi === "premium") {
    const ozti = unSekerRows.find((r) => /oztiryakiler|ozti/i.test(r.marka_ad ?? ""));
    if (ozti) selected = ozti;
  } else {
    const pimak = unSekerRows.find((r) => /pimak/i.test(r.marka_ad ?? "") || r.sku === "FC-100");
    if (pimak) selected = pimak;
  }

  return katalogRowToEslesmis(selected);
}

/** Referans satırı için güvenli katalog eşlemesi */
export async function matchReferansKalem(
  rawInput: ReferansMatchInput,
): Promise<EslesmisUrun | null> {
  const cleanedIsim = stripEmbeddedSupplierSku(
    formatPfosDisplayTanim(rawInput.isim),
  );
  let input: ReferansMatchInput = { ...rawInput, isim: cleanedIsim };
  const normalizedIsim = norm(input.isim);
  if (normalizedIsim.includes("duvar rafi") && normalizedIsim.includes("aydinlatmali")) {
    const newIsim = rawInput.isim
      .replace(/aydinlatmali|aydınlatmalı/gi, "")
      .replace(/,\s*,/g, ",")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^,\s*|,\s*$/g, "")
      .trim();
    input = {
      ...rawInput,
      isim: newIsim,
    };
  }

  const olcu =
    extractOlcuFromNotlar(input.notlar) ||
    (input.notlar?.match(/(\d+\s*[*xX×]\s*\d+(?:\s*[*xX×]\s*\d+)?)/)?.[1] ?? "");

  const verified = await matchByVerifiedLink(input);
  if (verified) return verified;

  if (isBuroTipiDerinDondurucuReferans(input.isim, olcu, input.notlar)) {
    const slim = await matchSlimSetaltiDerinDondurucu(input.isim, olcu, input.notlar);
    if (slim) return slim;
    return null;
  }

  if (isCalismaTezgahiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi, notlar: input.notlar })) {
    const tezgah = await matchCalismaTezgahiByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (tezgah) return tezgah;
  }

  if (isSenoxPfosKalem({ isim: input.isim, urunTipi: input.urunTipi, notlar: input.notlar })) {
    const senox = await matchSenoxByReferans(input.isim, input.urunTipi, input.notlar);
    if (senox) return senox;
  }

  if (
    isPanelSogukOdaPfosKalemAny({
      isim: input.isim,
      urunTipi: input.urunTipi,
      notlar: input.notlar,
    })
  ) {
    const panelOda = await matchSogukOdaByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (panelOda) return panelOda;
  }

  if (isBulasikPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    const bulasik = await matchBulasikByReferans(
      input.isim,
      input.notlar,
      input.fiyatStratejisi,
    );
    if (bulasik) return bulasik;
  }

  if (isBuzdolabiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    const buz = await matchBuzdolapByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (buz) return buz;
  }

  if (isCaglayanTeshirPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    const teshir = await matchTeshirReyonByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (teshir) return teshir;
  }

  if (isPizzaFirinReferans(input.isim, input.urunTipi)) {
    const pizza = await matchAtalayPizzaFirinByReferans(input.isim, olcu, input.notlar);
    if (pizza) return pizza;
  }

  if (isKombiKonveksiyonReferans(input.isim, input.urunTipi)) {
    const kombi = await matchKombiFirinByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (kombi) return kombi;
  }

  if (isTostMakinasiReferans(input.isim, input.urunTipi)) {
    const tost = await matchByTipShopLink(input);
    if (
      tost &&
      !referansKatalogUyumsuz(input.isim, tost.ad, input.notlar, tost.sku)
    ) {
      return tost;
    }
  }

  if (
    isAtalayPisirmePfosKalem({ isim: input.isim, urunTipi: input.urunTipi }) &&
    !isTostMakinasiReferans(input.isim, input.urunTipi)
  ) {
    const pisirme = await matchPisirmeByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (pisirme) return pisirme;
  }

  if (isPortashelfPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    const istif = await matchIstifRafiByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.fiyatStratejisi,
    );
    if (istif) return istif;
  }

  if (isCopArabasiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    const cop = await matchCopArabasiByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.fiyatStratejisi,
    );
    if (cop) return cop;
  }

  if (isDuvarRafiReferans(input.isim)) {
    const duvarRaf = await matchDuvarRafiByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.fiyatStratejisi,
    );
    if (duvarRaf) return duvarRaf;
  }

  if (isServisRafiReferans(input.isim)) {
    const servisRaf = await matchServisRafiByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.fiyatStratejisi,
    );
    if (servisRaf) return servisRaf;
  }

  if (isKokteylIstasyonReferansIsim(input.isim)) {
    const besos = await matchBesosKokteylIstasyonByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (besos) return besos;
  }

  if (isUnSekerArabasiReferans(input.isim)) {
    const unSeker = await matchUnSekerArabasiByReferans(input.isim, input.fiyatStratejisi);
    if (unSeker) return unSeker;
  }

  if (isDavlumbazReferans(input.isim)) {
    const dav = await matchDavlumbazByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (dav) return dav;
  }

  if (/ara\s*tezgah|notr\s*ara|notr\s*tezgah|nötr\s*ara|nötr\s*tezgah/.test(String(input.isim).toLowerCase())) {
    const oztiAra = await matchOztiAraTezgahByReferans(input.isim, olcu);
    if (oztiAra) return oztiAra;
    const atalayAra = await matchAtalayAraTezgahByReferans(input.isim, olcu);
    if (atalayAra) return atalayAra;
  }

  const hazirlikTip = inferHazirlikTipFromIsim(input.isim);
  if (hazirlikTip && hazirlikTip !== "planet_mikser" && hazirlikTip !== "spiral_hamur") {
    const shop = await matchShopCatalog(hazirlikTip, input.fiyatStratejisi);
    if (shop) return { ...shop, marka: HAZIRLIK_MARKA };
  }

  const family = await matchByFamilyRules(input, olcu);
  if (family && !referansKatalogUyumsuz(input.isim, family.ad, input.notlar, family.sku)) {
    return family;
  }

  const strict = await matchStrictCatalog(input, olcu);
  if (strict) return strict;

  const byMasterEq = await matchByMasterEqustoKod(input);
  if (byMasterEq) return byMasterEq;

  const tipLinked = await matchByTipShopLink(input);
  if (
    tipLinked &&
    !referansKatalogUyumsuz(input.isim, tipLinked.ad, input.notlar, tipLinked.sku)
  ) {
    return tipLinked;
  }

  if (
    isOzelImalatMotor({ sablonIsim: input.isim, urunTipi: input.urunTipi }) ||
    isOzelImalatMotor({ sablonIsim: input.isim })
  ) {
    if (isCalismaTezgahiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi, notlar: input.notlar })) {
      const tezgah = await matchCalismaTezgahiByReferans(
        input.isim,
        olcu,
        input.notlar,
        input.urunTipi,
        input.fiyatStratejisi,
      );
      if (tezgah) return tezgah;
    }
    if (isDavlumbazReferans(input.isim)) {
      const dav = await matchDavlumbazByReferans(
        input.isim,
        olcu,
        input.notlar,
        input.urunTipi,
        input.fiyatStratejisi,
      );
      if (dav) return dav;
    }
    if (isBuzdolabiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
      const buz = await matchBuzdolapByReferans(
        input.isim,
        olcu,
        input.notlar,
        input.urunTipi,
        input.fiyatStratejisi,
      );
      if (buz) return buz;
    }
    if (isCaglayanTeshirPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
      const teshir = await matchTeshirReyonByReferans(
        input.isim,
        olcu,
        input.notlar,
        input.urunTipi,
        input.fiyatStratejisi,
      );
      if (teshir) return teshir;
    }
    if (isKombiKonveksiyonReferans(input.isim, input.urunTipi)) {
      const kombi = await matchKombiFirinByReferans(
        input.isim,
        olcu,
        input.notlar,
        input.urunTipi,
        input.fiyatStratejisi,
      );
      if (kombi) return kombi;
    }
    if (isTostMakinasiReferans(input.isim, input.urunTipi)) {
      const tost = await matchByTipShopLink(input);
      if (
        tost &&
        !referansKatalogUyumsuz(input.isim, tost.ad, input.notlar, tost.sku)
      ) {
        return tost;
      }
    }
    if (
      isAtalayPisirmePfosKalem({ isim: input.isim, urunTipi: input.urunTipi }) &&
      !isTostMakinasiReferans(input.isim, input.urunTipi)
    ) {
      const pisirme = await matchPisirmeByReferans(
        input.isim,
        olcu,
        input.notlar,
        input.urunTipi,
        input.fiyatStratejisi,
      );
      if (pisirme) return pisirme;
    }
    const ozelFiyat = await getOzelImalatPrice(input.isim, olcu, input.urunTipi);
    return buildOzelImalatEslesmis({
      isim: input.isim,
      urunTipi: input.urunTipi,
      notlar: input.notlar,
      fiyatTry: ozelFiyat,
      fiyatEur: null,
    });
  }

  if (isBuzdolabiPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    const buz = await matchBuzdolapByReferans(
      input.isim,
      olcu,
      input.notlar,
      input.urunTipi,
      input.fiyatStratejisi,
    );
    if (buz) return buz;
  }

  return await fallbackOzelImalat(input);
}

function extractWidth(s: string): number {
  const nums = s.match(/(\d+)/g)?.map(Number) || [];
  return nums[0] || 40;
}
function extractDepth(s: string): number {
  const nums = s.match(/(\d+)/g)?.map(Number) || [];
  return nums[1] || 70;
}

export async function matchAtalayAraTezgahByReferans(
  isim: string,
  olcu: string,
): Promise<EslesmisUrun | null> {
  const width = extractWidth(olcu || isim);
  const depth = extractDepth(olcu || isim) || 70;
  
  let sku = "AAT-470";
  if (depth === 70) {
    if (width >= 80) sku = "AAT-870";
    else if (width >= 60) sku = "AAT-670";
    else sku = "AAT-470";
  } else if (depth === 90) {
    if (width >= 80) sku = "AAT-890S";
    else sku = "AAT-490S";
  }
  
  const rows = await loadLegacyCatalogRows();
  const found = rows.find(
    (r) =>
      r.durum === "aktif" &&
      isAtalayPisirmeRow(r) &&
      String(r.sku ?? "").replace(/\s+/g, "").toUpperCase() === sku.toUpperCase(),
  );
  if (found) {
    const matched = katalogRowToEslesmis(found, {
      linkMarka: ATALAY_MARKA,
      sablonIsim: isim,
    });
    return {
      ...matched,
      ad: `Atalay Ara Tezgah, Setüstü ${sku.replace("AAT-", "")}`,
      marka: ATALAY_MARKA,
      olcu: olcu || `${width}*${depth}*30`,
    };
  }
  return null;
}

/** Öztiryakiler setüstü nötr ara tezgah eşlemesi */
export async function matchOztiAraTezgahByReferans(
  isim: string,
  olcu: string,
): Promise<EslesmisUrun | null> {
  const width = extractWidth(olcu || isim);
  const depth = extractDepth(olcu || isim) || 70;

  let sku = "";
  if (depth === 70) {
    if (width >= 80) sku = "7911.N1.80703.00";
    else sku = "7911.N1.40703.00";
  } else if (depth === 90) {
    if (width >= 80) sku = "7911.N1.80903.00";
    else sku = "7911.N1.40903.00";
  } else if (depth === 60) {
    if (width >= 60) sku = "7911.N1.60603.00";
    else sku = "7911.N1.40603.00";
  } else {
    sku = "7911.N1.40703.00";
  }

  const rows = await loadLegacyCatalogRows();
  const found = rows.find(
    (r) =>
      r.durum === "aktif" &&
      r.sku &&
      r.sku.replace(/\s+/g, "").toUpperCase() === sku.toUpperCase()
  );

  if (found) {
    const matched = katalogRowToEslesmis(found, {
      linkMarka: "Öztiryakiler",
      sablonIsim: isim,
    });
    return {
      ...matched,
      ad: matched.ad,
      marka: "Öztiryakiler",
      olcu: olcu || `${width}*${depth}*30`,
    };
  }

  return null;
}
