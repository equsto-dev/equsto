import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { resolveTipKodu } from "../core/tip-kodu";
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

export function isTasFirinReferans(isim: string): boolean {
  const n = norm(isim);
  return (
    n.includes("tas firin") ||
    n.includes("taş fırın") ||
    n.includes("tas taban") ||
    n.includes("taş taban")
  );
}

export function isPizzaFirinReferans(isim: string, urunTipi?: string | null): boolean {
  const n = norm(`${isim} ${urunTipi ?? ""}`);
  return n.includes("pizza") && /firin|fırın/.test(n);
}

export function isKombiKonveksiyonReferans(
  isim: string | null | undefined,
  urunTipi?: string | null,
): boolean {
  const tip = resolveTipKodu(String(urunTipi ?? "").trim());
  if (tip === "davlumbaz_dekoratif") return false;
  if (tip === "kombi_firin_6t") return true;
  const n = norm(`${isim} ${urunTipi ?? ""}`);
  if (!n) return false;
  if (/firin\s*davlumbaz|fırın\s*davlumbaz/.test(n)) return false;
  if (/setalt|set alt|tezgah alt|mikrodalga|pizza|blender|robot coupe/.test(n)) {
    return false;
  }
  if (/kombili|icombi|\bcombi\b|konveksiyon|yemekcilik|yemekçilik/.test(n) && /firin/.test(n)) {
    return true;
  }
  return (
    /\bkombi\b/.test(n) &&
    /firin/.test(n) &&
    !/kombin|kombine|kombi tip/.test(n)
  );
}

type GnSpec = { trays?: number; format?: "1/1" | "2/1" };

function parseGnSpec(...parts: Array<string | null | undefined>): GnSpec {
  const blob = norm(parts.filter(Boolean).join(" "));
  const gn = blob.match(/(\d+)\s*gn\s*(1\/1|2\/1)/);
  if (gn) {
    return { trays: Number(gn[1]), format: gn[2] as GnSpec["format"] };
  }
  const tepsi = blob.match(/(\d+)\s*tepsi/);
  if (tepsi) return { trays: Number(tepsi[1]) };
  return {};
}

function isSetaltiFirinRow(row: AdminUrunRow): boolean {
  const ad = norm(`${row.ad} ${row.kategori ?? ""}`);
  const sku = String(row.sku ?? "").toUpperCase();
  return (
    /setalt|set alt|tezgah alt|firin alt tezgah/.test(ad) ||
    /^(EASFE|EASFG|ASFE|ASFG)-/.test(sku)
  );
}

function isKombiOvenRow(row: AdminUrunRow): boolean {
  if (isSetaltiFirinRow(row)) return false;
  const ad = norm(`${row.ad} ${row.kategori ?? ""}`);
  if (/havalandir|davlumbaz|hood|kondens|blender|robot coupe|firin alt tezgah/.test(ad)) {
    return false;
  }
  return (
    (/kombi|combi|konveksiyon|cheftop|bakertop|icombi|rational|skyline/.test(ad) &&
      /firin|oven|buharli/.test(ad)) ||
    /unox.*(cheftop|bakertop).*(kombi|combi|konveksiyon)/.test(ad)
  );
}

function scoreKombiRow(row: AdminUrunRow, gn: GnSpec, referansIsim: string): number {
  if (!isKombiOvenRow(row)) return -9999;
  let score = 100;
  const ad = norm(row.ad);
  if (/unox|electrolux|rational/.test(ad)) score += 40;
  if (/kombi|combi/.test(ad)) score += 30;

  // Prefer Rational for Yemekçilik/Catering Oven
  if (/yemekcilik|yemekçilik/i.test(referansIsim) && /rational/i.test(ad)) {
    score += 500;
  }

  if (gn.trays) {
    const trayHit = new RegExp(`\\b${gn.trays}\\s*(gn|tepsi)`).test(ad);
    if (trayHit) score += 500;
    else if (new RegExp(`\\b${gn.trays}\\b`).test(ad)) score += 250;
  }
  if (gn.format) {
    const fmt = gn.format.replace("/", "\\/");
    if (new RegExp(gn.format === "1/1" ? "gn\\s*1\\/1|gn1\\/1" : "gn\\s*2\\/1|gn2\\/1").test(ad)) {
      score += 200;
    } else if (ad.includes(fmt)) {
      score += 120;
    }
  }
  const refN = norm(referansIsim);
  if (/gaz/.test(refN) && /gaz/.test(ad)) score += 40;
  if (/elektrik|elk/.test(refN) && /elektrik|elk/.test(ad)) score += 40;
  if (row.gorsel_url) score += 5;
  if (row.fiyat_tl > 0) score += 5;
  return score;
}

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  return katalogRowToEslesmis(row);
}

/** Taş fırın → UNOX taş tabanlı kombi (1 veya 2 tepsi) */
export async function matchTasFirinByReferans(
  _isim: string,
  _fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  const hits = rows.filter((r) => /tas taban|taş taban/i.test(r.ad));
  if (!hits.length) return null;
  hits.sort((a, b) => a.fiyat_tl - b.fiyat_tl);
  return rowToEslesmis(hits[0]);
}

/** Kombi / konveksiyon fırın — Atalay setaltı değil; GN kapasitesine göre UNOX / Electrolux */
export async function matchKombiFirinByReferans(
  isim: string,
  olcuRaw: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  if (!isKombiKonveksiyonReferans(isim, urunTipi)) return null;

  const olcu =
    olcuRaw.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const olcuDisplay = toOlcuMmDisplay(olcu) ?? (olcu || null);
  const gn = parseGnSpec(olcu, notlar, isim);

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  const scored = rows
    .map((row) => ({ row, score: scoreKombiRow(row, gn, isim) }))
    .filter((x) => x.score >= 100)
    .sort((a, b) => b.score - a.score || a.row.fiyat_tl - b.row.fiyat_tl);

  if (!scored.length) {
    return {
      id: `kombi-firin-${norm(isim).replace(/\s+/g, "-").slice(0, 48)}`,
      sku: null,
      ad: displayIsimFromSablon(isim),
      marka: "—",
      model: null,
      olcu: olcuDisplay,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: 0,
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }

  const matched = katalogRowToEslesmis(scored[0].row, {
    sablonIsim: isim,
    urunTipi: urunTipi ?? undefined,
  });
  return {
    ...matched,
    ad: displayIsimFromSablon(isim),
    olcu: olcuDisplay,
  };
}

/** Genel "Fırın" (pastane/Unox) — katalogda UNOX BAKERTOP */
export async function matchKonveksiyonFirinByReferans(
  isim: string,
  _fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const n = norm(isim);
  if (n.includes("pizza") || n.includes("tas firin") || n.includes("taş")) {
    return null;
  }
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0,
  );
  const hits = rows.filter(
    (r) =>
      /unox.*bakertop|bakertop.*unox/i.test(r.ad) &&
      /kombi|combi|konveksiyon/i.test(r.ad),
  );
  if (!hits.length) return null;
  hits.sort((a, b) => a.fiyat_tl - b.fiyat_tl);
  return rowToEslesmis(hits[0]);
}

/** Atalay pizza fırını eşlemesi (APF- serisi, çift katlı veya tek katlı) */
export async function matchAtalayPizzaFirinByReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
): Promise<EslesmisUrun | null> {
  const n = norm(`${isim} ${olcu} ${notlar ?? ""}`);
  const isCiftKatli = /cift|çift|2\s*kat|iki\s*kat/.test(n) || n.includes("/2");
  const isTekKatli = /tek|1\s*kat/.test(n) || n.includes("/1");

  let sizeKey = "";
  if (n.includes("9262") || n.includes("962")) {
    sizeKey = "962";
  } else if (n.includes("92")) {
    sizeKey = "92";
  } else if (n.includes("62")) {
    sizeKey = "62";
  } else if (n.includes("50")) {
    sizeKey = "50";
  } else if (n.includes("40")) {
    sizeKey = "40";
  } else {
    sizeKey = "962"; // Default
  }

  const suffix = (isTekKatli && !isCiftKatli) ? "1" : "2"; // Default to double deck
  const targetSku = `APF-${sizeKey}/${suffix}`;

  const rows = await loadLegacyCatalogRows();
  const found = rows.find(
    (r) =>
      r.durum === "aktif" &&
      r.sku &&
      r.sku.toUpperCase() === targetSku.toUpperCase()
  );

  if (found) {
    const matched = katalogRowToEslesmis(found, {
      linkMarka: "Atalay",
      sablonIsim: isim,
    });
    return {
      ...matched,
      ad: displayIsimFromSablon(isim),
      marka: "Atalay",
      olcu: olcu || found.model || null,
    };
  }

  return null;
}
