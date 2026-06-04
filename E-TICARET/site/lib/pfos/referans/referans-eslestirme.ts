/**
 * Referans listesi → katalog fiyat eşlemesi (kalıcı politika).
 *
 * 1) pfos-referans-sku-links.json (listeKey|poz → SKU) — doğrulanmış
 * 2) pfos-tip-shop-links.json (urunTipi → SKU) — doğrulanmış tip eşlemesi
 * 3) Aile kuralları (yer ızgarası, make-up, fırın, vb.)
 * 4) İsim + ölçü ile sıkı katalog araması
 * 5) Özel imalat (Equsto) — yanlış SKU asla dönmez
 */
import { dataPath, readJsonFile } from "@/lib/legacy-data";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { enrichEslesmisFromKatalogRow } from "../core/catalog-enrich";
import { productMatchesTipKodu } from "../core/shop-catalog-match";
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
    const raw = await readJsonFile<SkuLinksFile>(
      dataPath("pfos-referans-sku-links.json"),
    );
    skuLinksCache = raw?.links ?? {};
  } catch {
    skuLinksCache = {};
  }
  return skuLinksCache;
}

type TipShopLinksFile = {
  links?: Record<string, { sku?: string; name?: string; brand?: string; fiyat_try?: number }>;
};

let tipShopLinksCache: NonNullable<TipShopLinksFile["links"]> | null = null;

async function loadTipShopLinks(): Promise<NonNullable<TipShopLinksFile["links"]>> {
  if (tipShopLinksCache) return tipShopLinksCache;
  try {
    const raw = await readJsonFile<TipShopLinksFile>(
      dataPath("pfos-tip-shop-links.json"),
    );
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
  const enriched = enrichEslesmisFromKatalogRow(row, {});
  return {
    id: row.id,
    slug: row.id.replace(/^ecom_/, ""),
    sku: row.sku,
    ad: row.ad,
    marka: enriched.marka,
    model: enriched.model,
    olcu: enriched.olcu,
    elektrikGucuKw: row.el_guc,
    gazGucuKw: row.gaz_guc,
    fiyat: row.fiyat_tl,
    doviz: "TRY",
    gorselUrl: row.gorsel_url,
  };
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
  const ad = norm(urunAd);
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

async function matchByExplicitSku(
  sku: string,
): Promise<EslesmisUrun | null> {
  const needle = norm(sku);
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  const exact = rows.find((r) => norm(r.sku ?? "") === needle);
  if (exact) return rowToEslesmis(exact);

  const prefixHits = rows.filter((r) => norm(r.sku ?? "").startsWith(needle));
  if (prefixHits.length === 1) return rowToEslesmis(prefixHits[0]);
  if (prefixHits.length > 1) {
    prefixHits.sort(
      (a, b) => norm(a.sku ?? "").length - norm(b.sku ?? "").length,
    );
    return rowToEslesmis(prefixHits[0]);
  }
  return null;
}

/** Doğrulanmış tip_kodu → SKU (pfos-tip-shop-links) — yalnızca referans urunTipi ile */
async function matchByTipShopLink(
  input: ReferansMatchInput,
): Promise<EslesmisUrun | null> {
  const urunTipi = String(input.urunTipi ?? "").trim();
  if (!urunTipi || urunTipi.startsWith("pfos_")) return null;

  const tip = referansTipKodu(input);
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
    (tip === "bulasik_giyotin_1000" || tip === "bardak_yikama") &&
    isBulasikMakinesiReferans(input.isim)
  ) {
    return null;
  }

  const links = await loadTipShopLinks();
  const link = links[tip];
  if (!link?.sku) return null;
  if (!tipShopLinkUygun(input.isim, input.notlar, link.name ?? link.sku)) {
    return null;
  }

  const bySku = await matchByExplicitSku(link.sku);
  if (bySku && !referansKatalogUyumsuz(input.isim, bySku.ad, input.notlar)) {
    return bySku;
  }

  if (link.fiyat_try && link.fiyat_try > 0) {
    return {
      id: `tip-link-${tip}`,
      sku: link.sku,
      ad: link.name ?? input.isim,
      marka: link.brand ?? "Öztiryakiler",
      model: link.sku,
      olcu: extractOlcuFromNotlar(input.notlar) || null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: Math.round(link.fiyat_try),
      doviz: "TRY",
      gorselUrl: null,
    };
  }

  if (tip === "montaj_nakliye") {
    return {
      id: `tip-link-${tip}`,
      sku: link.sku,
      ad: link.name ?? input.isim,
      marka: link.brand ?? "Equsto Proje Fabrikası",
      model: link.sku,
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
      sku: link.sku,
      ad: link.name ?? input.isim,
      marka: link.marka ?? "Öztiryakiler",
      model: link.sku,
      olcu: extractOlcuFromNotlar(input.notlar) || null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: Math.round(link.fiyat_try),
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
      let score = isimEslesmeSkoru(input.isim, row.ad);
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
  return rowToEslesmis(scored[0].row);
}

async function fallbackOzelImalat(input: ReferansMatchInput): Promise<EslesmisUrun> {
  return buildOzelImalatEslesmis({
    isim: input.isim,
    urunTipi: input.urunTipi,
    notlar: input.notlar,
    fiyatTry: 0,
  });
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

  const family = await matchByFamilyRules(input, olcu);
  if (family && !referansKatalogUyumsuz(input.isim, family.ad, input.notlar)) {
    return family;
  }

  if (isOzelImalatMotor({ sablonIsim: input.isim, urunTipi: input.urunTipi })) {
    return await buildOzelImalatEslesmis({
      isim: input.isim,
      urunTipi: input.urunTipi,
      notlar: input.notlar,
    });
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

  if (isOzelImalatMotor({ sablonIsim: input.isim })) {
    return await buildOzelImalatEslesmis({
      isim: input.isim,
      urunTipi: input.urunTipi,
      notlar: input.notlar,
    });
  }

  return await fallbackOzelImalat(input);
}
