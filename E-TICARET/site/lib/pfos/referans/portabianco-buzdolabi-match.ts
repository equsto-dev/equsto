import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import {
  PORTABIANCO_MARKA,
  isPortabiancoBuzdolabiRow,
  isPortabiancoKatalogMarka,
} from "../core/portabianco-marka";
import type { BuzFamily } from "../core/ozti-buzdolabi-spec";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { extractOlcuFromNotlar } from "./yer-izgara-match";
import { isBuzdolabiReferans } from "./buzdolabi-match";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPortabiancoBuzdolabiReferans(
  isim: string,
  notlar?: string | null,
): boolean {
  return /portabianco/.test(norm(`${isim} ${notlar ?? ""}`));
}

/** Tip sözlüğü — Portabianco en ucuz referans SKU (pfos-tip-shop-links.json ile hizalı) */
export const PORTABIANCO_ECO_BUZ_SKUS: Partial<
  Record<BuzFamily | "makeup" | "derin", string>
> = {
  dik: "DT-1NGN-EKOP",
  tezgah: "TTS-2N70-E",
  cihazalti: "CAM-2N70",
  derin: "DTT-1NGNE",
  makeup: "SBHD-2N70E",
  bar: "BAR-150P",
};

function parseBuzFamily(isim: string, urunTipi?: string | null): BuzFamily {
  const n = norm(`${isim} ${urunTipi ?? ""}`);
  if (/bar\s*sogut|sishe\s*sogut|şişe\s*soğut|icecek\s*sogut|içecek\s*soğut|bar_buzdolabi|sise_sogutucu/.test(n)) {
    return "bar";
  }
  if (/dik\s*tip|depo\s*tip|dik_tip_buz|depo-buzdolabi|dik-buzdolab/.test(n)) {
    return "dik";
  }
  if (/setalti|setaltı|cihazalti|cihazaltı|tezgah\s*alti|tezgah\s*altı|yatay\s*tip|setalti_buz|tezgah_alti_buz/.test(n)) {
    return "cihazalti";
  }
  if (/make.?up|makeup|makyaj|saladette|pizza\s*prep|sogutma\s*tezgah|sogutmali\s*tezgah|tezgah_tip_buz|sogutma_tezgah/.test(n)) {
    return "tezgah";
  }
  if (/tezgah\s*tip|hazirlik\s*buzdolab|hazırlık\s*buzdolab/.test(n)) {
    return "tezgah";
  }
  if (/buzdolab/.test(n)) return "tezgah";
  if (/derin|dondurucu/.test(n)) return "dik";
  return null;
}

function isDerinDondurucu(isim: string): boolean {
  return /derin\s*donduruc|dondurucu/.test(norm(isim)) && !/buzdolab/.test(norm(isim));
}

function scorePortabiancoRow(
  row: AdminUrunRow,
  family: BuzFamily,
  targetSku: string | null,
  referansIsim: string,
): number {
  if (!isPortabiancoBuzdolabiRow(row)) return -9999;
  const sku = String(row.sku ?? "").toUpperCase();
  const ad = norm(row.ad ?? "");
  let score = 50;
  if (targetSku && norm(sku) === norm(targetSku)) score += 500;
  if (/ekop|-e\b|eco/i.test(sku)) score += 200;
  if (family === "dik" && /^DT-/i.test(sku)) score += 120;
  if (family === "tezgah" && /^TT[SRMX]-/i.test(sku)) score += 120;
  if (family === "cihazalti" && /^CAM-/i.test(sku)) score += 120;
  if (family === "bar" && /^BAR-/i.test(sku)) score += 120;
  if (isDerinDondurucu(referansIsim) && /^DTT-/i.test(sku)) score += 150;
  if (/make.?up|makeup|makyaj/.test(norm(referansIsim)) && /^SB/i.test(sku)) score += 120;
  if (row.fiyat_tl > 0) score += 10;
  if (row.gorsel_url) score += 5;
  if (!/buzdolab|donduruc|sogutuc|soğutuc|make.?up|bar/.test(ad)) score -= 500;
  return score;
}

export async function matchPortabiancoBuzdolabiByReferans(
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
  const familyKey = freezer ? "derin" : family;
  const targetSku =
    (familyKey && PORTABIANCO_ECO_BUZ_SKUS[familyKey]) ||
    (/make.?up|makeup|makyaj/.test(norm(isim))
      ? PORTABIANCO_ECO_BUZ_SKUS.makeup
      : null);

  if (targetSku) {
    const rows = (await loadLegacyCatalogRows()).filter((r) => r.durum === "aktif");
    const exact = rows.find(
      (r) =>
        norm(r.sku ?? "") === norm(targetSku) &&
        (r.fiyat_tl > 0 || isPortabiancoBuzdolabiRow(r)),
    );
    if (exact && exact.fiyat_tl > 0) {
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
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      (isPortabiancoBuzdolabiRow(r) || isPortabiancoKatalogMarka(r.marka_ad)),
  );

  const scored = rows
    .map((row) => ({
      row,
      score: scorePortabiancoRow(row, family, targetSku, isim),
    }))
    .filter((x) => x.score >= 100)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.row.fiyat_tl || 0) - (b.row.fiyat_tl || 0);
    });

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

  if (isBuzdolabiReferans(isim) && targetSku) {
    return {
      id: `portabianco-buz-${targetSku.toLowerCase()}`,
      sku: targetSku,
      ad: displayIsimFromSablon(isim),
      marka: PORTABIANCO_MARKA,
      model: targetSku,
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
