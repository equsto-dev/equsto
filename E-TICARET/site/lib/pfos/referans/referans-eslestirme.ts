/**
 * Referans listesi → katalog fiyat eşlemesi (kalıcı politika).
 *
 * 1) pfos-referans-sku-links.json (listeKey|poz → SKU) — doğrulanmış
 * 2) pfos-tip-shop-links.json (urunTipi → SKU) — doğrulanmış tip eşlemesi
 * 3) Aile kuralları (yer ızgarası, make-up, fırın, vb.)
 * 4) İsim + ölçü ile sıkı katalog araması
 * 5) Özel imalat (Equsto) — katalogda fiyat yoksa boş; formül/tahmin yok
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
  isDavlumbazReferans,
  matchDavlumbazByReferans,
} from "./davlumbaz-match";
import { matchSenoxVakumByReferans } from "./senox-vakum-match";
import { isSenoxVakumPfosKalem } from "../core/senox-marka";
import { isMakeUpReferans, matchMakeUpByReferans } from "./make-up-match";
import {
  isTasFirinReferans,
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
  referansKatalogCeliski,
  tipShopLinkUygun,
} from "./referans-nitelikleri";

export type ReferansMatchInput = {
  isim: string;
  urunTipi: string;
  referansPoz?: string;
  referansListeKey?: string;
  notlar?: string | null;
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
  if (skuLinksCache) return skuLinksCache;
  try {
    const raw = await readJsonFile<SkuLinksFile>("pfos-referans-sku-links.json");
    skuLinksCache = raw?.links ?? {};
  } catch {
    skuLinksCache = {};
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

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  return katalogRowToEslesmis(row);
}

/** Referans satırı ile katalog adı çelişiyorsa reddet */
export function referansKatalogUyumsuz(
  sablonIsim: string,
  katalogAd: string,
  notlar?: string | null,
): boolean {
  if (referansKatalogCeliski(sablonIsim, katalogAd, notlar)) return true;
  const s = norm(sablonIsim);
  const k = norm(katalogAd);
  if (!s || !k) return false;
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
  if (b.includes(a) || a.includes(b)) return 120;

  const tokens = a
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !/^(gazli|elektrikli|setalti|dolapli)$/.test(w));
  if (!tokens.length) return 0;
  let hit = 0;
  for (const t of tokens) {
    if (b.includes(t)) hit++;
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

async function matchByExplicitSku(
  sku: string,
): Promise<EslesmisUrun | null> {
  const row = await findAdminRowBySku(sku);
  return row ? rowToEslesmis(row) : null;
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
    (tip === "calisma_tezgahi" || tip === "calisma_tezgahi_dolap") &&
    /tek\s*evyeli|mermer\s*tabla|\(imalat\)/i.test(input.isim)
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
    if (byRow && !referansKatalogUyumsuz(input.isim, byRow.ad, input.notlar)) {
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
    return matchByExplicitSku(input.sku);
  }
  const liste = input.referansListeKey?.trim();
  const poz = input.referansPoz?.trim();
  if (!liste || !poz) return null;

  const links = await loadReferansSkuLinks();
  const link = links[referansLinkKey(liste, poz)];
  if (!link?.sku) return null;

  const bySku = await matchByExplicitSku(link.sku);
  if (bySku) {
    return {
      ...bySku,
      ad: link.name ?? bySku.ad,
      marka: link.marka?.trim() || bySku.marka,
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

async function matchByFamilyRules(
  input: ReferansMatchInput,
  olcu: string,
): Promise<EslesmisUrun | null> {
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
  if (
    isTasFirinReferans(input.isim) ||
    input.urunTipi === "tas-firin" ||
    referansTipKodu(input) === "tas_tabanli_firin"
  ) {
    return matchTasFirinByReferans(input.isim, input.fiyatStratejisi);
  }
  if (
    input.urunTipi === "konveksiyon-firin-pastane" ||
    input.urunTipi === "konveksiyon-firin-unox" ||
    (isGenericReferansIsim(input.isim) && /firin|fırın/.test(norm(input.isim)))
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
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );

  const scored = rows
    .map((row) => {
      if (referansKatalogUyumsuz(input.isim, row.ad, input.notlar)) {
        return { row, score: -9999 };
      }
      if (
        isHazirlikPfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        isOztiKatalogMarka(row.marka_ad)
      ) {
        return { row, score: -9999 };
      }
      if (
        isSenoxVakumPfosKalem({ isim: input.isim, urunTipi: familyTip }) &&
        isOztiKatalogMarka(row.marka_ad)
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
      const isimScore = isimEslesmeSkoru(input.isim, row.ad);
      if (isimScore < MIN_STRICT_ISIM_SCORE) {
        return { row, score: -9999 };
      }
      let score = isimScore;
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

async function fallbackOzelImalat(input: ReferansMatchInput): Promise<EslesmisUrun> {
  return buildOzelImalatEslesmis({
    isim: input.isim,
    urunTipi: input.urunTipi,
    notlar: input.notlar,
    fiyatTry: 0,
    fiyatEur: null,
  });
}

/** İsim + ölçü ile sıkı katalog araması (özel imalat / zone fallback için) */
export async function matchCatalogByIsimOlcu(
  isim: string,
  notlar: string | null | undefined,
  urunTipi = "",
  fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
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

/** Referans satırı için güvenli katalog eşlemesi */
export async function matchReferansKalem(
  input: ReferansMatchInput,
): Promise<EslesmisUrun | null> {
  const olcu =
    extractOlcuFromNotlar(input.notlar) ||
    (input.notlar?.match(/(\d+\s*[*xX×]\s*\d+)/)?.[1] ?? "");

  const verified = await matchByVerifiedLink(input);
  if (verified) return verified;

  if (isSenoxVakumPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    const senox = await matchSenoxVakumByReferans(input.isim);
    if (senox) return senox;
  }

  if (isBulasikPfosKalem({ isim: input.isim, urunTipi: input.urunTipi })) {
    const bulasik = await matchBulasikByReferans(
      input.isim,
      input.notlar,
      input.fiyatStratejisi,
    );
    if (bulasik) return bulasik;
  }

  const hazirlikTip = inferHazirlikTipFromIsim(input.isim);
  if (hazirlikTip) {
    const shop = await matchShopCatalog(hazirlikTip, input.fiyatStratejisi);
    if (shop) return { ...shop, marka: HAZIRLIK_MARKA };
  }

  const family = await matchByFamilyRules(input, olcu);
  if (family && !referansKatalogUyumsuz(input.isim, family.ad, input.notlar)) {
    return family;
  }

  const tipLinked = await matchByTipShopLink(input);
  if (
    tipLinked &&
    !referansKatalogUyumsuz(input.isim, tipLinked.ad, input.notlar)
  ) {
    return tipLinked;
  }

  const strict = await matchStrictCatalog(input, olcu);
  if (strict) return strict;

  if (
    isOzelImalatMotor({ sablonIsim: input.isim, urunTipi: input.urunTipi }) ||
    isOzelImalatMotor({ sablonIsim: input.isim })
  ) {
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
    return buildOzelImalatEslesmis({
      isim: input.isim,
      urunTipi: input.urunTipi,
      notlar: input.notlar,
      fiyatTry: 0,
      fiyatEur: null,
    });
  }

  return await fallbackOzelImalat(input);
}
