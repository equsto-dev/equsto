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
} from "../core/calisma-tezgah";
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
  if (!isEqustoTezgahRow(row.sku)) return -9999;
  const ad = norm(row.ad);
  if (/bulasik.*giris|bym|suzme\s*havuz|set\s*alti\s*dolap/.test(ad) && !/calisma|çalışma|evyeli|tezgah/.test(ad)) {
    return -9999;
  }

  if (targetSku && norm(row.sku ?? "") === norm(targetSku)) return 9999;

  let score = 100;
  const prefix = equstoTezgahSizePrefix(olcu);
  if (prefix && row.sku?.includes(`.${prefix}.`)) score += 400;

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
  if (/cekmeceli|çekmeceli/i.test(n) && /cekmeceli|çekmeceli|blok/.test(ad)) score += 60;

  if (row.gorsel_url) score += 10;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

async function findEqustoRowBySku(sku: string): Promise<AdminUrunRow | null> {
  const needle = norm(sku).replace(/\s+/g, "");
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && isEqustoTezgahRow(r.sku),
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
  if (!prefix) return null;
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      isEqustoTezgahRow(r.sku) &&
      r.sku?.includes(`.${prefix}.`) &&
      r.gorsel_url,
  );
  if (!rows.length) return null;

  const scored = rows
    .map((row) => ({
      row,
      score: scoreEqustoTezgahRow(row, isim, olcu, generatedSku),
    }))
    .filter((x) => x.score >= 200)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.row ?? rows.find((r) => r.gorsel_url) ?? null;
}

function buildGeneratedEqustoTezgah(
  isim: string,
  olcu: string,
  sku: string,
  urunTipi: string,
  notlar: string | null | undefined,
  row?: AdminUrunRow | null,
  imageRow?: AdminUrunRow | null,
): EslesmisUrun {
  if (row && row.fiyat_tl > 0) {
    return katalogRowToEslesmis(row, {
      linkMarka: CALISMA_TEZGAH_MARKA,
      sablonIsim: isim,
      urunTipi,
    });
  }

  const img =
    row?.gorsel_url ?? imageRow?.gorsel_url ?? null;
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
    fiyat: row?.fiyat_tl && row.fiyat_tl > 0 ? row.fiyat_tl : 0,
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
      );
    }

    const rows = (await loadLegacyCatalogRows()).filter(
      (r) => r.durum === "aktif" && r.fiyat_tl > 0 && isEqustoTezgahRow(r.sku),
    );
    const scored = rows
      .map((row) => ({
        row,
        score: scoreEqustoTezgahRow(row, isim, olcuText, generatedSku),
      }))
      .filter((x) => x.score >= 280)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const pick = scored[0].row;
      return katalogRowToEslesmis(pick, {
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
