import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { normalizePfosGorselUrl } from "../core/katalog-gorsel-url";
import {
  CALISMA_TEZGAH_MARKA,
  equstoTezgahSizePrefix,
  generateEqustoTezgahSku,
  inferEqustoTezgahVariantSuffix,
  isCalismaTezgahiReferansIsim,
  isEqustoTezgahRow,
  isBulasikSiyirmaTezgahReferans,
} from "../core/calisma-tezgah";
import { findClosestEqustoTezgahPriceRow, findClosestEqustoTezgahImageRow } from "../core/ozel-imalat-yakin-olcu";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

function norm(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[×x]/g, "*")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCalismaTezgahiReferans(isim: string): boolean {
  return isCalismaTezgahiReferansIsim(isim);
}

function evyeCountFromIsim(isim: string): number | null {
  const n = norm(isim);
  if (/tek\s*evyeli|\b1\s*evye/.test(n)) return 1;
  if (/çift\s*evyeli|cift\s*evyeli|iki\s*evyeli|\b2\s*evye/.test(n)) return 2;
  if (/üç\s*evyeli|uc\s*evyeli|\b3\s*evye/.test(n)) return 3;
  return null;
}

function scoreEqustoTezgahRow(
  row: AdminUrunRow,
  isim: string,
  olcu: string,
  targetSku?: string | null,
): number {
  if (!isEqustoTezgahRow(row.sku, row.ad)) return -9999;
  const ad = norm(row.ad);
  if (/bulasik.*giris|bym|suzme\s*havuz|set\s*alti\s*dolap/.test(ad) && !/calisma|çalışma|evyeli|tezgah/.test(ad)) {
    return -9999;
  }

  if (targetSku && norm(row.sku ?? "") === norm(targetSku)) return 9999;

  let score = 100;
  const prefix = equstoTezgahSizePrefix(olcu);
  if (prefix) {
    if (row.sku?.includes(`.${prefix}.`)) {
      score += 400;
    } else {
      return -9999;
    }
  }

  const wantSuffix = inferEqustoTezgahVariantSuffix(isim);
  if (wantSuffix && row.sku?.endsWith(`.${wantSuffix}`)) score += 250;

  const evye = evyeCountFromIsim(isim);
  if (evye === 1 && /tek\s*evyeli/.test(ad)) score += 200;
  if (evye === 2 && /çift|iki|2\s*evye/.test(ad)) score += 200;
  if (evye === 3 && /üç|uc|3\s*evye/.test(ad)) score += 200;
  if (evye === 2 && !/çift|iki|2\s*evye/.test(ad)) score -= 80;

  const n = norm(isim);
  if (/taban\s*rafl/i.test(n) && /taban\s*rafl/i.test(ad)) score += 60;
  if (/taban\s*ve\s*ara\s*rafl/i.test(n) && /taban\s*ve\s*ara\s*rafl/i.test(ad)) score += 80;
  if (/dolap/i.test(n) && /dolap/i.test(ad)) score += 70;
  if (/mermer/i.test(n) && /mermer/i.test(ad)) score += 80;
  if (/polietilen/i.test(n) && /polietilen/i.test(ad)) score += 80;
  if (/hareketli/i.test(n) && /hareketli/i.test(ad)) score += 80;
  if (/balik|balık/.test(ad) && !/balik|balık/.test(n)) score -= 8000;
  if (/dolap/i.test(n) && /\.25$/i.test(String(row.sku ?? ""))) score -= 8000;
  if (/cekmeceli|çekmeceli|blok/.test(n) && /\.13$/i.test(String(row.sku ?? ""))) score -= 200;
  if (/cekmeceli|çekmeceli/i.test(n) && /cekmeceli|çekmeceli|blok/.test(ad)) score += 60;

  if (isBulasikSiyirmaTezgahReferans(isim)) {
    if (/suzme\s*havuz|\.31\b/.test(ad) || /\.31$/i.test(String(row.sku ?? ""))) {
      score += 220;
    }
    if (/by[mf]\d|yikama\s*mak|bulasik\s*yik/.test(ad)) score -= 8000;
  }

  if (row.gorsel_url) score += 10;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

async function findEqustoRowBySku(sku: string): Promise<AdminUrunRow | null> {
  const needle = norm(sku).replace(/\s+/g, "");
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && isEqustoTezgahRow(r.sku, r.ad),
  );
  return (
    rows.find((r) => norm(r.sku ?? "").replace(/\s+/g, "") === needle) ?? null
  );
}

async function fallbackImageRow(
  isim: string,
  olcu: string,
  generatedSku: string,
): Promise<AdminUrunRow | null> {
  const prefix = equstoTezgahSizePrefix(olcu);
  const wantSuffix = inferEqustoTezgahVariantSuffix(isim);
  if (prefix) {
    const rows = (await loadLegacyCatalogRows()).filter(
      (r) =>
        r.durum === "aktif" &&
        isEqustoTezgahRow(r.sku, r.ad) &&
        r.sku?.includes(`.${prefix}.`) &&
        r.gorsel_url,
    );
    if (rows.length) {
      const exactSuffix = rows.filter((r) =>
        r.sku?.endsWith(`.${wantSuffix}`),
      );
      if (exactSuffix.length) {
        return exactSuffix[0] ?? null;
      }

      if (!wantSuffix) {
        const scored = rows
          .map((row) => ({
            row,
            score: scoreEqustoTezgahRow(row, isim, olcu, generatedSku),
          }))
          .filter((x) => x.score >= 200)
          .sort((a, b) => b.score - a.score);

        if (scored[0]?.row) return scored[0].row;
      }
    }
  }

  const catalogRows = await loadLegacyCatalogRows();
  return findClosestEqustoTezgahImageRow(
    catalogRows,
    isim,
    olcu,
    generatedSku,
  );
}

function buildGeneratedEqustoTezgah(
  isim: string,
  olcu: string,
  sku: string,
  urunTipi: string,
  notlar: string | null | undefined,
  row?: AdminUrunRow | null,
  imageRow?: AdminUrunRow | null,
  priceRow?: AdminUrunRow | null,
): EslesmisUrun {
  if (row && row.fiyat_tl > 0) {
    return katalogRowToEslesmis(row, {
      linkMarka: CALISMA_TEZGAH_MARKA,
      sablonIsim: isim,
      urunTipi,
    });
  }

  const priced = priceRow ?? row;
  const img =
    row?.gorsel_url ?? imageRow?.gorsel_url ?? priceRow?.gorsel_url ?? null;
  const olcuText = olcu.trim() || null;

  return {
    id: `equsto-tezgah-${sku.toLowerCase()}`,
    sku,
    ad: isim.trim(),
    marka: CALISMA_TEZGAH_MARKA,
    model: sku,
    olcu: olcuText,
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat:
      priced?.fiyat_tl && priced.fiyat_tl > 0 ? priced.fiyat_tl : 0,
    fiyatEur: null,
    doviz: "TRY",
    gorselUrl: normalizePfosGorselUrl(img),
  };
}

/**
 * Yerden çalışma tezgahı — EQUSTO SKU üret/eşle (ölçü + varyant).
 * Öztiryakiler 7911.N1.* kullanılmaz; katalog yoksa boş fiyatlı EQUSTO kodu.
 */
export async function matchCalismaTezgahiByReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const olcuText =
    olcu.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();

  if (!isCalismaTezgahiReferansIsim(isim, notlar) && !olcuText) {
    return null;
  }

  const tip = urunTipi ?? "calisma_tezgahi";
  const generatedSku = generateEqustoTezgahSku(isim, olcuText);

  if (generatedSku) {
    const exact = await findEqustoRowBySku(generatedSku);
    if (exact) {
      return buildGeneratedEqustoTezgah(
        isim,
        olcuText,
        generatedSku,
        tip,
        notlar,
        exact,
      );
    }

    const catalogRows = await loadLegacyCatalogRows();
    const closestPrice = findClosestEqustoTezgahPriceRow(
      catalogRows,
      isim,
      olcuText,
      generatedSku,
    );

    const evye = evyeCountFromIsim(isim);
    const suffix = inferEqustoTezgahVariantSuffix(isim);
    if (evye === 2 && suffix === "12") {
      const imageRow = await fallbackImageRow(isim, olcuText, generatedSku);
      return buildGeneratedEqustoTezgah(
        isim,
        olcuText,
        generatedSku,
        tip,
        notlar,
        null,
        imageRow,
        closestPrice,
      );
    }

    const rows = catalogRows.filter(
      (r) => r.durum === "aktif" && r.fiyat_tl > 0 && isEqustoTezgahRow(r.sku, r.ad),
    );
    const scored = rows
      .map((row) => ({
        row,
        score: scoreEqustoTezgahRow(row, isim, olcuText, generatedSku),
      }))
      .filter((x) => x.score >= 280)
      .sort((a, b) => b.score - a.score);

    const exactScored = scored.find(
      (x) => norm(x.row.sku ?? "") === norm(generatedSku),
    );
    if (exactScored) {
      return katalogRowToEslesmis(exactScored.row, {
        linkMarka: CALISMA_TEZGAH_MARKA,
        sablonIsim: isim,
        urunTipi: tip,
      });
    }

    const imageRow = await fallbackImageRow(isim, olcuText, generatedSku);
    return buildGeneratedEqustoTezgah(
      isim,
      olcuText,
      generatedSku,
      tip,
      notlar,
      null,
      imageRow,
      closestPrice,
    );
  }

  if (isCalismaTezgahiReferansIsim(isim, notlar)) {
    return {
      id: `equsto-tezgah-ozel-${tip}`,
      sku: "",
      ad: isim.trim(),
      marka: CALISMA_TEZGAH_MARKA,
      model: null,
      olcu: olcuText || null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: 0,
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }
  return null;
}

