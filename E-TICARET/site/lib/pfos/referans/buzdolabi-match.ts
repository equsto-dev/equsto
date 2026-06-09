import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { equstoSatisEurFromRow } from "../core/shop-catalog-match";
import {
  PORTABIANCO_MARKA,
  isPortabiancoBuzdolabiRow,
  isPortabiancoKatalogMarka,
} from "../core/portabianco-marka";
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

function preferredSkus(
  family: BuzFamily,
  kapi: number,
  depth: 60 | 70,
  freezer: boolean,
  referansIsim: string,
): string[] {
  const cool = freezer ? "D" : "N";
  const camKapili = isCamKapiliReferans(referansIsim);
  if (family === "tezgah") {
    if (kapi === 1) return [`TT-1${cool}${depth}`];
    if (kapi === 2) {
      if (camKapili) {
        return [`TTR-2${cool}${depth}`, `TTC-2${cool}${depth}`, `TTK-2${cool}${depth}`];
      }
      return [`TTK-2${cool}${depth}`, `TTR-2${cool}${depth}`, `TTC-2${cool}${depth}`];
    }
    if (kapi === 3) return [`TT-3${cool}${depth}`];
    if (kapi === 4) {
      if (camKapili) {
        return [`TTR-4${cool}${depth}`, `TTK-4${cool}${depth}`, `TT-4ND${depth}`];
      }
      return [`TT-4ND${depth}`, `TTK-4${cool}${depth}`, `TTR-4${cool}${depth}`];
    }
  }
  if (family === "cihazalti") {
    if (kapi === 1) return [`CA-1${cool}${depth}`];
    if (kapi === 2) return [`CA-1${cool}${depth}`];
    if (kapi === 3) return [`CA-3${cool}${depth}`];
  }
  if (family === "dik") {
    if (freezer) {
      if (kapi === 1) return ["DT-1DGN-EKO", "DT-1DGN"];
      if (kapi === 2) return ["DT-2DGN-EKO", "DT-2DGN"];
    }
    if (kapi === 1) return ["DT-1NGN-EKO", "DT-1NGN"];
    if (kapi === 2) return ["DT-2NGN-EKO", "DT-2NGN"];
  }
  if (family === "bar") {
    const w = kapi;
    if (w >= 3) return ["BAR-350", "BAR-350P"];
    if (w === 2) return ["BAR-250", "BAR-250P"];
    return ["BAR-150", "BAR-150P"];
  }
  return [];
}

function scorePortabiancoRow(
  row: AdminUrunRow,
  family: BuzFamily,
  targetModels: string[],
  targetSkus: string[],
  referansIsim: string,
  freezer: boolean,
  camKapili: boolean,
): number {
  if (!isPortabiancoBuzdolabiRow(row)) return -9999;
  const ad = norm(row.ad);
  const sku = String(row.sku ?? "").toUpperCase();
  if (!/buzdolab|donduruc|sogutuc|soğutuc|bar\s*sise|bar\s*şişe|tezgah tip|cihaz alt|dik tip/.test(ad)) {
    return -9999;
  }

  if (freezer && !/donduruc|derin/.test(ad) && !/DGN|D70|D60|D80/.test(sku)) {
    return -9999;
  }
  if (!freezer && /derin\s*donduruc/.test(ad) && !/buzdolab/.test(ad)) {
    return -9999;
  }

  let score = 50;
  if (isPortabiancoKatalogMarka(row.marka_ad)) score += 40;

  if (targetSkus.some((t) => norm(sku) === norm(t))) score += 500;

  const model = modelFromRow(row);
  if (model && targetModels.some((t) => norm(model).startsWith(norm(t.split("-E")[0])))) {
    score += 350;
  }
  for (const t of targetModels) {
    if (ad.includes(norm(t).toLowerCase())) score += 280;
  }

  if (family === "tezgah" && /tezgah tipi buzdolab/.test(ad)) score += 80;
  if (family === "cihazalti" && /cihaz alti buzdolab/.test(ad)) score += 80;
  if (family === "dik" && /dik tip/.test(ad)) score += 80;
  if (family === "bar" && /bar.*sise|bar.*şişe/.test(ad)) score += 80;

  if (/^TT-\d+N\d+$/.test(sku) || /^TT-\d+ND\d+$/.test(sku)) score += 30;
  if (/^TTR-/.test(sku)) {
    score += camKapili ? 40 : -5;
  } else if (/^TTK-|^PZA-|^PZAC-/.test(sku)) {
    score += camKapili ? -15 : -5;
  }
  if (/-E$/.test(sku) && !/eko|ekop|ekon/.test(norm(referansIsim))) score -= 8;

  if (row.gorsel_url) score += 5;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

async function findRowBySku(sku: string): Promise<AdminUrunRow | null> {
  const needle = norm(sku).replace(/\s+/g, "").toUpperCase();
  if (!needle) return null;
  const rows = (await loadLegacyCatalogRows()).filter((r) => r.durum === "aktif");
  return (
    rows.find(
      (r) =>
        isPortabiancoBuzdolabiRow(r) &&
        norm(r.sku ?? "").replace(/\s+/g, "").toUpperCase() === needle,
    ) ??
    rows.find(
      (r) =>
        norm(r.sku ?? "").replace(/\s+/g, "").toUpperCase() === needle &&
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
    linkMarka: PORTABIANCO_MARKA,
    sablonIsim: isim,
    urunTipi: urunTipi ?? undefined,
  });
  return {
    ...matched,
    ad: displayIsimFromSablon(isim),
    marka: PORTABIANCO_MARKA,
    olcu: olcuDisplay,
  };
}

/** Buzdolabı / derin dondurucu — Portabianco katalog; Öztiryakiler / Electrolux kullanılmaz */
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
  const models =
    family && kapi != null
      ? preferredSkus(family, kapi, depth, freezer, isim).map((s) =>
          s.replace(/-EKO$/, "").replace(/^TTK-2N(\d+)$/, "TT-2N$1"),
        )
      : [];
  const skus =
    family && kapi != null
      ? preferredSkus(family, kapi, depth, freezer, isim)
      : [];

  for (const sku of skus) {
    const exact = await findRowBySku(sku);
    if (exact) {
      const matched = katalogRowToEslesmis(exact, {
        linkMarka: PORTABIANCO_MARKA,
        sablonIsim: isim,
        urunTipi: urunTipi ?? undefined,
      });
      return {
        ...matched,
        ad: displayIsimFromSablon(isim),
        marka: PORTABIANCO_MARKA,
        olcu: olcuDisplay,
      };
    }
  }

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0 && isPortabiancoBuzdolabiRow(r),
  );

  const scored = rows
    .map((row) => ({
      row,
      score: scorePortabiancoRow(
        row,
        family,
        models,
        skus,
        isim,
        freezer,
        camKapili,
      ),
    }))
    .filter((x) => x.score >= 120)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const matched = katalogRowToEslesmis(scored[0].row, {
      linkMarka: PORTABIANCO_MARKA,
      sablonIsim: isim,
      urunTipi: urunTipi ?? undefined,
    });
    return {
      ...matched,
      ad: displayIsimFromSablon(isim),
      marka: PORTABIANCO_MARKA,
      olcu: olcuDisplay,
    };
  }

  if (isBuzdolabiReferans(isim) && (skus[0] || models[0])) {
    for (const sku of skus.length ? skus : models) {
      const hydrated = await hydrateBuzdolabiFromSku(
        sku,
        isim,
        olcuDisplay,
        urunTipi,
      );
      if (hydrated) return hydrated;
    }

    const sku = skus[0] ?? models[0];
    return {
      id: `portabianco-buz-${sku.toLowerCase()}`,
      sku,
      ad: displayIsimFromSablon(isim),
      marka: PORTABIANCO_MARKA,
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
