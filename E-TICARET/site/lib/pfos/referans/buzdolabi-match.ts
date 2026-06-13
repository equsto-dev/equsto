import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { equstoSatisEurFromRow } from "../core/shop-catalog-match";
import {
  OZTI_MARKA,
  isOztiBuzdolabiRow,
} from "../core/ozti-marka";
import {
  oztiPreferredBuzSkus,
  scoreOztiBuzdolabiRow,
} from "../core/ozti-buzdolabi-spec";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
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

export function isBuzdolabiReferans(isim: string): boolean {
  const n = norm(isim);
  if (/buz\s*makin|ice\s*maker/.test(n)) return false;
  if (
    /panel tip soguk oda|panel tipi soguk oda|panel tip derin dondurucu|panel tipi derin dondurucu|panel tip dondurucu oda/.test(
      n,
    )
  ) {
    return false;
  }
  return /buzdolab|donduruc|sogutuc|soğutuc|sishe\s*sogut|şişe\s*soğut|saladette|sogutmali\s*tezgah|soğutmali\s*tezgah/.test(
    n,
  );
}

type BuzFamily = "tezgah" | "cihazalti" | "dik" | "bar" | null;

function parseBuzFamily(isim: string, urunTipi?: string | null): BuzFamily {
  const n = norm(`${isim} ${urunTipi ?? ""}`);
  if (/bar\s*sogut|sishe\s*sogut|şişe\s*soğut|icecek\s*sogut|içecek\s*soğut|bar_buzdolabi|sise_sogutucu/.test(n)) {
    return "bar";
  }
  if (/dik\s*tip|depo\s*tip|dik_tip_buz|depo-buzdolabi|dik-buzdolab/.test(n)) {
    return "dik";
  }
  if (
    /setalti|setaltı|cihazalti|cihazaltı|tezgah\s*alti|tezgah\s*altı|yatay\s*tip|setalti_buz|tezgah_alti_buz/.test(
      n,
    )
  ) {
    return "cihazalti";
  }
  if (
    /tezgah\s*tip|hazirlik\s*buzdolab|hazırlık\s*buzdolab|saladette|pizza\s*prep|sogutmali\s*tezgah|soğutmali\s*tezgah|tezgah_tip_buz|sogutma_tezgah/.test(
      n,
    )
  ) {
    return "tezgah";
  }
  if (/buzdolab/.test(n)) return "tezgah";
  if (/donduruc/.test(n)) return "dik";
  return null;
}

function isDerinDondurucu(isim: string): boolean {
  return /derin\s*donduruc|dondurucu/.test(norm(isim)) && !/buzdolab/.test(norm(isim));
}

function kapiSayisiFromIsim(isim: string): number | null {
  const n = norm(isim);
  const digit = n.match(/(\d)\s*kapili/);
  if (digit) return Number(digit[1]);
  if (/\buc\b|uc kap|3 kap|üç/.test(n)) return 3;
  if (/\biki\b|iki kap|2 kap|İki/i.test(isim)) return 2;
  if (/\bdort\b|dort kap|4 kap|dört|dörd/.test(n)) return 4;
  if (/tek\s*kap|1\s*kap/.test(n)) return 1;
  return null;
}

function olcuParts(olcu: string): [number, number, number] | null {
  const nums = [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
  if (nums.length < 2) return null;
  return [nums[0], nums[1], nums[2] ?? 0];
}

function snapDepthCm(depth: number): 60 | 70 {
  return Math.abs(depth - 60) <= Math.abs(depth - 70) ? 60 : 70;
}

function kapiFromGenislikCm(width: number): number | null {
  const w = Math.round(width);
  if (w >= 220) return 4;
  if (w >= 165) return 3;
  if (w >= 105) return 2;
  if (w >= 55) return 1;
  return null;
}

function modelFromRow(row: AdminUrunRow): string | null {
  const m =
    /(?:TT|CA|DT|BAR|PZA|PZAC|TTR|TTK|TTC|TTG|TTS|TTM|TTX)-[A-Z0-9-]+/i.exec(
      `${row.ad ?? ""} ${row.sku ?? ""}`,
    );
  return m ? m[0].toUpperCase() : null;
}

function isCamKapiliReferans(isim: string): boolean {
  return /cam\s*kapili|cam\s*kapı|camlı\s*kap/i.test(norm(isim));
}

async function findRowBySku(sku: string): Promise<AdminUrunRow | null> {
  const needle = norm(sku).replace(/\s+/g, "").toUpperCase();
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter((r) => r.durum === "aktif");
  return (
    rows.find(
      (r) =>
        isOztiBuzdolabiRow(r) &&
        norm(r.sku ?? "").replace(/\s+/g, "").toUpperCase() === needle,
    ) ??
    rows.find(
      (r) =>
        norm(r.sku ?? "").replace(/\s+/g, "").toUpperCase() === needle &&
        isOztiBuzdolabiRow(r) &&
        (r.fiyat_tl > 0 || equstoSatisEurFromRow(r)),
    ) ??
    null
  );
}

async function hydrateBuzdolabiFromSku(
  sku: string,
  isim: string,
  olcuDisplay: string | null,
  urunTipi?: string | null,
): Promise<EslesmisUrun | null> {
  const row = await findRowBySku(sku);
  if (!row || !(row.fiyat_tl > 0 || equstoSatisEurFromRow(row))) return null;
  const matched = katalogRowToEslesmis(row, {
    linkMarka: OZTI_MARKA,
    sablonIsim: isim,
    urunTipi: urunTipi ?? undefined,
  });
  return {
    ...matched,
    ad: displayIsimFromSablon(isim),
    marka: OZTI_MARKA,
    olcu: olcuDisplay,
  };
}

/** Buzdolabı / derin dondurucu — Öztiryakiler katalog */
export async function matchBuzdolabiByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const olcuDisplay = toOlcuMmDisplay(olcu) ?? (olcu || null);

  const family = parseBuzFamily(isim, urunTipi);
  const freezer = isDerinDondurucu(isim);
  const parts = olcuParts(olcu);
  const depth = parts ? snapDepthCm(parts[1]) : 70;
  let kapi = kapiSayisiFromIsim(isim);
  if (kapi == null && parts) kapi = kapiFromGenislikCm(parts[0]);
  if (kapi == null && family === "dik") kapi = 1;
  if (kapi == null && family === "bar") kapi = 3;

  const camKapili = isCamKapiliReferans(isim);
  const widthCm = parts?.[0] ?? 140;
  const skus =
    family && kapi != null
      ? oztiPreferredBuzSkus(family, kapi, widthCm, freezer, camKapili, depth)
      : [];

  for (const sku of skus) {
    const exact = await findRowBySku(sku);
    if (exact) {
      const matched = katalogRowToEslesmis(exact, {
        linkMarka: OZTI_MARKA,
        sablonIsim: isim,
        urunTipi: urunTipi ?? undefined,
      });
      return {
        ...matched,
        ad: displayIsimFromSablon(isim),
        marka: OZTI_MARKA,
        olcu: olcuDisplay,
      };
    }
  }

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0 && isOztiBuzdolabiRow(r),
  );

  const scored = rows
    .map((row) => ({
      row,
      score: scoreOztiBuzdolabiRow(
        row,
        family,
        skus,
        isim,
        freezer,
        camKapili,
        kapi,
        depth,
        !!parts,
      ),
    }))
    .filter((x) => x.score >= 120)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const matched = katalogRowToEslesmis(scored[0].row, {
      linkMarka: OZTI_MARKA,
      sablonIsim: isim,
      urunTipi: urunTipi ?? undefined,
    });
    return {
      ...matched,
      ad: displayIsimFromSablon(isim),
      marka: OZTI_MARKA,
      olcu: olcuDisplay,
    };
  }

  if (isBuzdolabiReferans(isim) && skus[0]) {
    for (const sku of skus) {
      const hydrated = await hydrateBuzdolabiFromSku(
        sku,
        isim,
        olcuDisplay,
        urunTipi,
      );
      if (hydrated) return hydrated;
    }

    const sku = skus[0];
    return {
      id: `ozti-buz-${sku.toLowerCase()}`,
      sku,
      ad: displayIsimFromSablon(isim),
      marka: OZTI_MARKA,
      model: sku,
      olcu: olcuDisplay,
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
