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
import { buzdolabiDisplayIsimFromSablon } from "./buzdolabi-display";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { extractOlcuFromNotlar } from "./yer-izgara-match";
import {
  isPortabiancoBuzdolabiReferans,
  matchPortabiancoBuzdolabiByReferans,
} from "./portabianco-buzdolabi-match";

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

function parseBuzFamily(
  isim: string,
  urunTipi?: string | null,
  olcuRaw?: string | null,
  notlar?: string | null,
): BuzFamily {
  const n = norm(`${isim} ${urunTipi ?? ""}`);
  if (isBuroTipiDerinDondurucuReferans(isim, olcuRaw, notlar)) {
    return "cihazalti";
  }
  if (/bar\s*sogut|sishe\s*sogut|şişe\s*soğut|icecek\s*sogut|içecek\s*soğut|bar_buzdolabi|sise_sogutucu/.test(n)) {
    return "bar";
  }
  if (/dik\s*tip|depo\s*tip|dik_tip_buz|depo-buzdolabi|dik-buzdolab/.test(n)) {
    return "dik";
  }
  if (
    /setalti|setaltı|set\s*alti|set\s*altı|cihazalti|cihazaltı|cihaz\s*alti|tezgah\s*alti|tezgah\s*altı|yatay\s*tip|setalti_buz|tezgah_alti_buz/.test(
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
  const n = norm(isim);
  return (
    /derin\s*donduruc|dondurucu|deep\s*freeze|freezer/.test(n) &&
    !/buzdolab/.test(n)
  );
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

/** 60×60×80–95 kompakt büro / tezgah altı derin dondurucu (GN600 dik tip değil) */
export function isBuroTipiDerinDondurucuReferans(
  isim: string,
  olcuRaw?: string | null,
  notlar?: string | null,
): boolean {
  const n = norm(`${isim} ${notlar ?? ""}`);
  if (!/derin\s*donduruc|dondurucu|deep\s*freeze|freezer/.test(n)) return false;
  if (/dik\s*tip|depo\s*tip|gn\s*600|gn\s*1200/.test(n)) return false;
  if (
    /buro tip|büro tip|office type|slim|tezgah alti slim|set\s*alti|setalti|cihazalti|cihaz\s*alti|deep\s*freeze/.test(
      n,
    )
  ) {
    return true;
  }
  const olcu =
    String(olcuRaw ?? "").trim() ||
    extractOlcuFromNotlar(notlar) ||
    "";
  const parts = olcuParts(olcu);
  if (!parts) return false;
  const [w, d, h] = parts;
  if (w < 55 || w > 70 || d < 55 || d > 70) return false;
  if (h < 75 || h > 95) return false;
  return true;
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
    ad: buzdolabiDisplayIsimFromSablon(isim, {
      sku: row.sku,
      katalogAd: row.ad,
      olcu: olcuDisplay,
    }),
    marka: OZTI_MARKA,
    olcu: olcuDisplay,
  };
}

function buzAdFromSablon(
  isim: string,
  olcuDisplay: string | null,
  row?: AdminUrunRow | null,
  sku?: string | null,
): string {
  return buzdolabiDisplayIsimFromSablon(isim, {
    sku: sku ?? row?.sku,
    katalogAd: row?.ad,
    olcu: olcuDisplay,
  });
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

  if (isDerinDondurucu(isim) && isBuroTipiDerinDondurucuReferans(isim, olcu, notlar)) {
    const slim = await matchSlimSetaltiDerinDondurucu(isim, olcu, notlar);
    if (slim) return slim;
    return null;
  }

  const family = parseBuzFamily(isim, urunTipi, olcu, notlar);
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
      ? oztiPreferredBuzSkus(
          family,
          kapi,
          widthCm,
          freezer,
          camKapili,
          depth,
          isim,
        )
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
        ad: buzAdFromSablon(isim, olcuDisplay, exact),
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
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.row.fiyat_tl || 0) - (b.row.fiyat_tl || 0);
    });

  if (scored.length > 0) {
    const matched = katalogRowToEslesmis(scored[0].row, {
      linkMarka: OZTI_MARKA,
      sablonIsim: isim,
      urunTipi: urunTipi ?? undefined,
    });
    return {
      ...matched,
      ad: buzAdFromSablon(isim, olcuDisplay, scored[0].row),
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
      ad: buzAdFromSablon(isim, olcuDisplay, null, sku),
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

/** SLIM / setaltı kompakt derin dondurucu — 7919.10LTS / 7919.15LTS */
export async function matchSlimSetaltiDerinDondurucu(
  isim: string,
  olcuRaw: string,
  notlar?: string | null,
): Promise<EslesmisUrun | null> {
  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const parts = olcuParts(olcu);
  const widthCm = parts?.[0] ?? 69;
  const sku = widthCm >= 68 ? "7919.15LTS.00" : "7919.10LTS.00";
  const olcuDisplay = toOlcuMmDisplay(olcu) ?? (olcu || null);
  return hydrateBuzdolabiFromSku(sku, isim, olcuDisplay);
}

/** Buzdolabı — Portabianco referansında Portabianco eco; aksi halde Öztiryakiler 79K4/79E3 */
export async function matchBuzdolapByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  if (isPortabiancoBuzdolabiReferans(isim, notlar)) {
    return matchPortabiancoBuzdolabiByReferans(
      isim,
      olcuRaw,
      notlar,
      urunTipi,
      fiyatStratejisi,
    );
  }
  return matchBuzdolabiByReferans(
    isim,
    olcuRaw,
    notlar,
    urunTipi,
    fiyatStratejisi,
  );
}
