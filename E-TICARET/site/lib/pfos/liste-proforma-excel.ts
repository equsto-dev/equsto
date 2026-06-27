/**
 * Müşteri / tedarikçi proforma Excel — Equsto şablonu dışı listeler (Claude'sız).
 * Birden fazla tablo düzeni denenir; en çok geçerli kalem üreten sonuç seçilir.
 */

import type { Worksheet } from "exceljs";
import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import { formatPfosDisplayTanim } from "@/lib/pfos/parse-upload/sanitize-tanim";

const POZ_RE = /^[A-Z]\s*\d{1,3}A?$/i;
const NUM_POZ_RE = /^\d{1,3}$/;
const BOLUM_HARF_RE = /^[A-Z]$/i;
const OLCU_RE =
  /\d{2,}(?:[.,]\d+)?(?:\*\d{2,}(?:[.,]\d+)?){1,2}(?:\/\d{2,})?/;

const BOLUM_BY_POZ: Record<string, string> = {
  K: "kuru depo",
  C: "panel tip soğuk oda",
  F: "panel tip derin dondurucu oda",
  A: "sıcak mutfak",
  D: "bulaşık yıkama",
};

function sectionBaslikNorm(s: string): string {
  return String(s ?? "")
    .split("\0")[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

/** Bölüm başlığından kalıcı bolum kodu (bulut referans listeleriyle uyumlu) */
function bolumKodFromBaslik(baslik: string, harf: string): string {
  const t = sectionBaslikNorm(baslik);
  if (/deepfreeze|deep\s*freeze|derin\s*dondurucu\s*depo/.test(t)) {
    return "DEEPFREEZE_DEPO";
  }
  if (/soguk\s*oda|soğuk\s*oda/.test(t) && !/deepfreeze|deep\s*freeze/.test(t)) {
    return "SOGUK_ODA";
  }
  if (/kuru\s*depo/.test(t)) return "KURU_DEPO";
  return harf.toUpperCase();
}

function resolveSatirBolumFields(
  poz: string,
  bolum: string,
  bolumAd: string,
): { bolum: string; bolumAd: string } {
  const harf = poz.charAt(0).toUpperCase();
  const displayBaslik = bolumAd.split("\0")[0].trim();
  const sectionSuffix = bolumAd.includes("\0")
    ? bolumAd.slice(bolumAd.indexOf("\0"))
    : "";

  const resolvedBolum =
    bolum && !BOLUM_HARF_RE.test(bolum)
      ? bolum
      : displayBaslik
        ? bolumKodFromBaslik(displayBaslik, harf)
        : bolum || harf;

  let resolvedBaslik = displayBaslik;
  if (!resolvedBaslik) {
    if (resolvedBolum === "DEEPFREEZE_DEPO") {
      resolvedBaslik = `${harf}- DEEPFREEZE DEPO`;
    } else if (resolvedBolum === "SOGUK_ODA") {
      resolvedBaslik = `${harf}- SOĞUK ODA`;
    } else {
      resolvedBaslik = BOLUM_BY_POZ[harf] || "";
    }
  }

  return {
    bolum: resolvedBolum,
    bolumAd: resolvedBaslik ? `${resolvedBaslik}${sectionSuffix}` : bolumAd,
  };
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") {
    const s = v.trim();
    return s.toLowerCase() === "[object object]" ? "" : s;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v).trim();
  if (v instanceof Date) return v.toISOString().trim();

  if (typeof v === "object") {
    if ("result" in v && v.result != null) {
      return cellStr(v.result);
    }
    if ("formula" in v && v.formula != null) {
      const s = String(v.formula).trim();
      return s.toLowerCase() === "[object object]" ? "" : s;
    }
    if ("text" in v && v.text != null) {
      return cellStr(v.text);
    }
    if ("richText" in v && Array.isArray((v as any).richText)) {
      return (v as any).richText
        .map((rt: any) =>
          rt && typeof rt === "object" && "text" in rt
            ? cellStr(rt.text)
            : cellStr(rt)
        )
        .filter(Boolean)
        .join("");
    }
  }

  const s = String(v).trim();
  return s.toLowerCase() === "[object object]" ? "" : s;
}

function rowCells(row: { values: unknown }): string[] {
  const raw = row.values as unknown[];
  const out: string[] = [];
  for (let i = 1; i < raw.length; i++) {
    out.push(cellStr(raw[i]));
  }
  return out;
}

function parseAdet(raw: string): number {
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return 1;
  if (n > 99) return 1;
  return n;
}

function cleanProformaAd(raw: string): string {
  return formatPfosDisplayTanim(raw);
}

function parsePriceEur(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "");
  if (!s || /^mevcut$/i.test(s) || s === "-") return null;
  const n = parseFloat(s.replace(",", "."));
  // Proforma birim fiyatları genelde ≥10 EUR; adet sütunu (1–9) ile karışmasın
  if (!Number.isFinite(n) || n < 10 || n > 500_000) return null;
  return Math.round(n * 100) / 100;
}

function isMevcutCell(raw: string): boolean {
  return /^mevcut$/i.test(raw.trim());
}

function isKnownMarkaCell(raw: string): boolean {
  const s = raw.trim();
  if (!s || s === "-") return false;
  if (OLCU_RE.test(s) || /^\d+$/.test(s)) return false;
  if (
    /^(sktürk|skturk|öztiryakiler|ozti|equsto|electrolux|senox|inoksan|simag|brema|unox|rational|fagor|atalay|vosco|portashelf)$/i.test(
      s,
    )
  ) {
    return true;
  }
  if (s.length > 12) return false;
  if (/montaj|tezgah|dolab|firin|fritoz|izgar|ocak|davlumbaz|\brafi\b|\braf\b|makina|makinasi|buzdolab|salamander|davlumbaz/i.test(s)) {
    return false;
  }
  return s.length <= 10;
}

/** Poz sonrası hücreler — marka, adet, birim fiyat, mevcut ayrıştır */
function parseProformaMetaFields(cells: string[]): {
  head: string[];
  adet: number;
  marka?: string;
  birim_fiyat_eur?: number;
  mevcut?: boolean;
} {
  const rest = cells.map((c) => c.trim());
  let adet = 1;
  let birim_fiyat_eur: number | undefined;
  let mevcut = false;
  const prices: number[] = [];

  while (rest.length > 0) {
    const last = rest[rest.length - 1] ?? "";
    if (!last) {
      rest.pop();
      continue;
    }
    if (isMevcutCell(last)) {
      mevcut = true;
      rest.pop();
      continue;
    }
    const price = parsePriceEur(last);
    if (price != null && /^\d/.test(last)) {
      prices.unshift(price);
      rest.pop();
      continue;
    }
    if (/^\d{1,2}$/.test(last)) {
      adet = parseAdet(last);
      rest.pop();
      continue;
    }
    break;
  }

  if (prices.length) birim_fiyat_eur = prices[0];

  const textParts = rest.filter((c) => c && c !== "-" && !OLCU_RE.test(c));
  const markaCell = textParts.find((c) => isKnownMarkaCell(c));
  const tanimParts = textParts.filter((c) => c !== markaCell);
  const head = rest.filter((c) => {
    if (!c || c === "-") return false;
    if (OLCU_RE.test(c)) return true;
    return tanimParts.includes(c);
  });

  return {
    head,
    adet,
    marka: markaCell && markaCell !== "-" ? markaCell : undefined,
    birim_fiyat_eur,
    mevcut: mevcut || undefined,
  };
}

function findPozIndex(cells: string[]): number {
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i].trim().toUpperCase();
    if (POZ_RE.test(c)) return i;
  }
  return -1;
}

function extractOlcu(text: string): { ad: string; olcu: string } {
  const m = text.match(OLCU_RE);
  if (!m || m.index == null) return { ad: text.trim(), olcu: "" };
  const olcu = m[0];
  const ad = (text.slice(0, m.index) + text.slice(m.index + olcu.length))
    .replace(/[,\s]+$/, "")
    .trim();
  return { ad: ad || text.trim(), olcu };
}

function parseRowFromPoz(
  cells: string[],
  pozIdx: number,
  bolum: string,
  bolumAd: string,
): PfosEkipmanSatir | null {
  const poz = normalizePoz(cells[pozIdx]);
  const meta = parseProformaMetaFields(cells.slice(pozIdx + 1));
  const rest = meta.head.filter(Boolean);
  if (!rest.length && !meta.mevcut && !meta.marka) return null;

  let tanim = rest.filter((c) => !OLCU_RE.test(c)).join(" ").trim();
  let olcu = rest.find((c) => OLCU_RE.test(c))?.match(OLCU_RE)?.[0] ?? "";

  if (!tanim && !meta.mevcut) {
    const split = extractOlcu(rest.join(" "));
    tanim = split.ad;
    if (!olcu) olcu = split.olcu;
  }

  tanim = cleanProformaAd(tanim);
  if (!tanim && !meta.mevcut) return null;

  const row: PfosEkipmanSatir = {
    ...resolveSatirBolumFields(poz, bolum || poz.charAt(0), bolumAd),
    poz,
    ad: tanim || poz,
    olcu: olcu || "—",
    adet: meta.adet,
  };
  if (meta.marka) row.marka = meta.marka;
  if (meta.birim_fiyat_eur != null) row.birim_fiyat_eur = meta.birim_fiyat_eur;
  if (meta.mevcut) row.mevcut = true;
  return row;
}

function normalizePoz(poz: string): string {
  return poz.replace(/\s+/g, "").toUpperCase();
}

type ColumnarHeader = {
  poz: number;
  tanim: number;
  adet: number;
  stok: number;
  boy: number;
  en: number;
  yuk: number;
};

function findColumnarHeader(cells: string[]): ColumnarHeader | null {
  const lower = cells.map(normHeaderCell);
  const pozIdx = lower.findIndex(
    (c) =>
      c === "poz" ||
      c === "p.no" ||
      c === "pno" ||
      c === "p.no." ||
      c === "poz no" ||
      c === "poz no.",
  );
  const tanimIdx = lower.findIndex(
    (c) =>
      c.includes("tanim") ||
      c === "aciklama" ||
      c.includes("malzeme cinsi") ||
      c.includes("malzeme") ||
      c.includes("ekipman") ||
      c.includes("cinsi") ||
      c.includes("urun") ||
      c.includes("adi"),
  );
  if (pozIdx < 0 || tanimIdx < 0) return null;
  return {
    poz: pozIdx,
    tanim: tanimIdx,
    adet: lower.findIndex((c) => c === "adet"),
    stok: lower.findIndex((c) => c.includes("stok") || c.includes("kaynak")),
    boy: lower.findIndex((c) => c === "boy" || c === "derinlik"),
    en: lower.findIndex((c) => c === "en" || c === "genislik"),
    yuk: lower.findIndex((c) => c.includes("yuk")),
  };
}

/**
 * Boyut sütunlu proforma: Poz | Tanım | Boy | En | Yük | Adet
 */
export function parseColumnarProformaWorksheet(ws: Worksheet): PfosEkipmanSatir[] {
  const rows: PfosEkipmanSatir[] = [];
  let header: ColumnarHeader | null = null;

  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells = rowCells(row);
    if (!cells.some(Boolean)) return;

    if (!header) {
      header = findColumnarHeader(cells);
      return;
    }

    const pozRaw = cells[header.poz]?.trim();
    if (!pozRaw || !/^[A-Za-z]/.test(pozRaw)) return;
    if (/^poz$/i.test(pozRaw)) return;

    const poz = normalizePoz(pozRaw);
    const ad = cleanProformaAd(cells[header.tanim] || "");
    if (!ad) return;

    let adet = 1;
    if (header.adet >= 0) {
      const raw = cells[header.adet];
      const n =
        typeof raw === "number"
          ? Math.round(raw)
          : parseInt(String(raw ?? "").replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(n) && n > 0) adet = n;
    }

    const dims = [header.en, header.boy, header.yuk]
      .filter((idx) => idx >= 0)
      .map((idx) => {
        const v = cells[idx];
        if (v == null || v === "") return "";
        return String(v).trim();
      })
      .filter(Boolean);
    const olcu = dims.length ? dims.join("*") : "—";

    const stok = header.stok >= 0 ? cells[header.stok]?.trim() : "";
    const fullAd = stok ? `${ad} (${stok})` : ad;

    rows.push({
      bolum: poz.charAt(0),
      bolumAd: BOLUM_BY_POZ[poz.charAt(0)] || "",
      poz,
      ad: fullAd,
      olcu,
      adet,
    });
  });

  return rows;
}

type TabularHeader = {
  no: number;
  poz: number;
  malzeme: number;
  aciklama: number;
  olcu: number;
  adet: number;
  marka: number;
  birimFiyat: number;
  tutar: number;
  headerRow: number;
};

function normHeaderCell(c: string): string {
  return c
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

function isTanimHeaderLabel(c: string): boolean {
  const n = normHeaderCell(c);
  if (!n || /aciklama.*gorsel|gorsel.*aciklama/.test(n)) return false;
  return (
    n.includes("tanim") ||
    n.includes("malzeme cinsi") ||
    n.includes("malzeme") ||
    n.includes("ekipman") ||
    n.includes("urun adi") ||
    n.includes("urun ad") ||
    (n.includes("urun") && n.includes("adi")) ||
    n === "cinsi"
  );
}

function findTabularHeaderInCells(cells: string[]): Omit<TabularHeader, "headerRow"> | null {
  const lower = cells.map(normHeaderCell);
  const malzemeIdx = lower.findIndex((c) =>
    c.includes("malzeme cinsi") || (c.includes("malzeme") && !c.includes("aciklama")),
  );
  const aciklamaIdx = lower.findIndex(
    (c) => c.includes("aciklama") && !c.includes("malzeme") && !/gorsel/.test(c),
  );
  const pozIdx = lower.findIndex(
    (c) =>
      c === "poz" ||
      c === "p.no" ||
      c === "pno" ||
      c === "p.no." ||
      c === "poz no" ||
      c === "poz no.",
  );
  const noIdx = lower.findIndex((c) => c === "no" || c === "sira" || c === "s.no");
  let tanimIdx = malzemeIdx;
  if (tanimIdx < 0) {
    tanimIdx = lower.findIndex((c) => isTanimHeaderLabel(c));
  }
  if (tanimIdx < 0 && aciklamaIdx >= 0) tanimIdx = aciklamaIdx;

  if (tanimIdx < 0) return null;

  return {
    no: noIdx,
    poz: pozIdx,
    malzeme: tanimIdx,
    aciklama: aciklamaIdx,
    olcu: lower.findIndex(
      (c) => c.includes("olcu") || c.includes("olçü") || c.includes("kapasite"),
    ),
    adet: lower.findIndex(
      (c) => c === "ad" || c === "ad." || c === "adet" || c === "miktar",
    ),
    marka: lower.findIndex((c) => c.includes("marka")),
    birimFiyat: lower.findIndex(
      (c) =>
        c.includes("birim fiyat") ||
        c === "fiyat" ||
        c.includes("birim fiyat eur") ||
        c.includes("eur"),
    ),
    tutar: lower.findIndex(
      (c) => c === "tutar" || c.includes("toplam") || c.includes("tutar eur"),
    ),
  };
}

function mergeTabularHeaderRows(
  merged: Omit<TabularHeader, "headerRow">,
  hit: Omit<TabularHeader, "headerRow">,
  cells: string[],
): Omit<TabularHeader, "headerRow"> {
  const out = { ...merged };
  for (const key of Object.keys(hit) as Array<keyof Omit<TabularHeader, "headerRow">>) {
    if (key === "malzeme" || key === "aciklama") {
      if (out[key] < 0 && hit[key] >= 0) out[key] = hit[key];
      if (key === "malzeme" && hit.malzeme >= 0 && isTanimHeaderLabel(cells[hit.malzeme] ?? "")) {
        out.malzeme = hit.malzeme;
      }
      continue;
    }
    if (out[key] < 0 && hit[key] >= 0) out[key] = hit[key];
  }
  return out;
}

function findTabularHeader(ws: Worksheet): TabularHeader | null {
  const acc: {
    merged: Omit<TabularHeader, "headerRow"> | null;
    headerRow: number;
  } = { merged: null, headerRow: 0 };

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 35) return;
    const cells = rowCells(row);
    if (!cells.some(Boolean)) return;
    const hit = findTabularHeaderInCells(cells);
    if (!hit) return;
    if (!acc.merged) {
      acc.merged = { ...hit };
      acc.headerRow = rowNumber;
      return;
    }
    acc.headerRow = Math.min(acc.headerRow, rowNumber);
    acc.merged = mergeTabularHeaderRows(acc.merged, hit, cells);
  });

  if (!acc.merged || acc.merged.poz < 0 || acc.merged.malzeme < 0) return null;
  return { ...acc.merged, headerRow: acc.headerRow };
}

function resolveTabularPoz(
  pozRaw: string,
  noRaw: string,
  bolum: string,
): string | null {
  const poz = normalizePoz(pozRaw);
  if (poz && POZ_RE.test(poz)) return poz;
  const no = noRaw.replace(/\D/g, "");
  if (NUM_POZ_RE.test(no)) {
    const harf = bolum.trim().toUpperCase().charAt(0);
    return harf && BOLUM_HARF_RE.test(harf) ? `${harf}${no}` : no;
  }
  if (NUM_POZ_RE.test(poz.replace(/\D/g, ""))) {
    const n = poz.replace(/\D/g, "");
    const harf = bolum.trim().toUpperCase().charAt(0);
    return harf && BOLUM_HARF_RE.test(harf) ? `${harf}${n}` : n;
  }
  return null;
}

/**
 * Sütun başlıklı proforma tablosu (yaygın mühendislik listeleri):
 * No | Poz | Malzeme/Tanım | Açıklama | Ölçü | Adet — sayısal ve harfli poz birlikte.
 */
export function parseTabularProformaWorksheet(ws: Worksheet): PfosEkipmanSatir[] {
  const rows: PfosEkipmanSatir[] = [];
  const header = findTabularHeader(ws);
  if (!header) return rows;

  let bolum = "";
  let bolumAd = "";
  let sectionIndex = 0;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= header.headerRow) return;
    const cells = rowCells(row);
    if (!cells.some(Boolean)) return;

    const firstCell = cells[0]?.trim();
    const isEmptyOthers = firstCell &&
      (header.malzeme < 0 || !cells[header.malzeme]?.trim()) &&
      (header.poz < 0 || !cells[header.poz]?.trim()) &&
      (header.no < 0 || !cells[header.no]?.trim()) &&
      (header.aciklama < 0 || !cells[header.aciklama]?.trim());

    const isMergedOthers = firstCell &&
      (header.malzeme < 0 || cells[header.malzeme]?.trim() === firstCell) &&
      (header.poz < 0 || cells[header.poz]?.trim() === firstCell) &&
      (header.no < 0 || cells[header.no]?.trim() === firstCell) &&
      (header.aciklama < 0 || cells[header.aciklama]?.trim() === firstCell);

    if (isEmptyOthers || isMergedOthers) {
      sectionIndex++;
      bolumAd = `${firstCell}\0${sectionIndex}`;
      const harf = firstCell.match(/\b([A-Z])\s*[-–]/i)?.[1] || firstCell.charAt(0).toUpperCase();
      if (harf && BOLUM_HARF_RE.test(harf)) {
        bolum = bolumKodFromBaslik(firstCell, harf);
      }
      return;
    }

    const malzeme = cleanProformaAd(cells[header.malzeme] || "");
    const aciklama =
      header.aciklama >= 0
        ? cleanProformaAd(cells[header.aciklama] || "")
        : "";
    const pozRaw = header.poz >= 0 ? cells[header.poz]?.trim() ?? "" : "";
    const noRaw = header.no >= 0 ? cells[header.no]?.trim() ?? "" : "";

    if (!malzeme && !aciklama) return;
    if (/^toplam|proforma|fatura|mutabakat/i.test(malzeme)) return;

    const adBase = malzeme || aciklama;
    if (
      BOLUM_HARF_RE.test(pozRaw) &&
      adBase.length > 4 &&
      !NUM_POZ_RE.test(noRaw.replace(/\D/g, ""))
    ) {
      bolum = pozRaw.toUpperCase();
      if (BOLUM_HARF_RE.test(bolum)) {
        bolum = bolumKodFromBaslik(adBase, bolum);
      }
      sectionIndex++;
      bolumAd = `${adBase}\0${sectionIndex}`;
      return;
    }

    if (
      !pozRaw &&
      !noRaw &&
      adBase.length >= 3 &&
      !OLCU_RE.test(adBase) &&
      !/^\d+$/.test(adBase)
    ) {
      sectionIndex++;
      bolumAd = `${adBase}\0${sectionIndex}`;
      const harf = adBase.match(/\b([A-Z])\s*[-–]/i)?.[1];
      if (harf) bolum = bolumKodFromBaslik(adBase, harf.toUpperCase());
      return;
    }

    const poz = resolveTabularPoz(pozRaw, noRaw, bolum);
    if (!poz) return;

    let ad = malzeme;
    if (aciklama && aciklama !== malzeme) {
      ad = malzeme ? `${malzeme} — ${aciklama}` : aciklama;
    }
    ad = cleanProformaAd(ad);
    if (!ad) return;

    let olcu = "—";
    if (header.olcu >= 0) {
      let raw = cells[header.olcu]?.trim();
      if (!raw) {
        for (let i = header.olcu + 1; i < cells.length; i++) {
          if (i === header.adet || i === header.malzeme) break;
          const val = cells[i]?.trim();
          if (val) {
            raw = val;
            break;
          }
        }
      }
      if (raw) olcu = OLCU_RE.test(raw) ? (raw.match(OLCU_RE)?.[0] ?? raw) : raw;
    }
    if (olcu === "—") {
      const split = extractOlcu(ad);
      if (split.olcu) {
        olcu = split.olcu;
        ad = split.ad;
      }
    }

    let adet = 1;
    if (header.adet >= 0) {
      const raw = cells[header.adet];
      const n =
        typeof raw === "number"
          ? Math.round(raw)
          : parseInt(String(raw ?? "").replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(n) && n > 0) adet = Math.min(99, n);
    }

    let marka: string | undefined;
    if (header.marka >= 0) {
      const raw = cells[header.marka]?.trim();
      if (raw && raw !== "-") marka = raw;
    }

    let birim_fiyat_eur: number | undefined;
    if (header.birimFiyat >= 0) {
      const price = parsePriceEur(cells[header.birimFiyat] ?? "");
      if (price != null) birim_fiyat_eur = price;
    }

    let mevcut = false;
    if (header.tutar >= 0 && isMevcutCell(cells[header.tutar] ?? "")) {
      mevcut = true;
    }

    const harf = poz.charAt(0).toUpperCase();
    const bolumFields = resolveSatirBolumFields(poz, bolum, bolumAd);
    const satir: PfosEkipmanSatir = {
      bolum: bolumFields.bolum,
      bolumAd: bolumFields.bolumAd,
      poz,
      ad,
      olcu,
      adet,
    };
    if (marka) satir.marka = marka;
    if (birim_fiyat_eur != null) satir.birim_fiyat_eur = birim_fiyat_eur;
    if (mevcut) satir.mevcut = true;
    rows.push(satir);
  });

  return rows;
}

/** Tüm proforma ayrıştırıcıları — en çok satırı veren seçilir */
export function pickBestProformaRows(
  ws: Worksheet,
  extra: Array<(w: Worksheet) => PfosEkipmanSatir[]> = [],
): PfosEkipmanSatir[] {
  const parsers = [
    parseTabularProformaWorksheet,
    parseColumnarProformaWorksheet,
    parseProformaExcelWorksheet,
    ...extra,
  ];
  let best: PfosEkipmanSatir[] = [];
  let bestScore = -1;
  for (const parse of parsers) {
    const rows = parse(ws);
    const validOlcuCount = rows.filter((r) => r.olcu && r.olcu !== "—").length;
    const validAdetCount = rows.filter((r) => r.adet && Number(r.adet) > 1).length;
    const fiyatCount = rows.filter((r) => (r.birim_fiyat_eur ?? 0) > 0).length;
    const score =
      rows.length +
      validOlcuCount * 5 +
      validAdetCount * 2 +
      fiyatCount * 8;
    if (score > bestScore) {
      bestScore = score;
      best = rows;
    }
  }
  return best;
}

/** Proforma Excel — poz sütunu esnek (A1, K2 … herhangi bir sütunda) */
export function parseProformaExcelWorksheet(ws: Worksheet): PfosEkipmanSatir[] {
  const rows: PfosEkipmanSatir[] = [];
  let bolum = "";
  let bolumAd = "";
  let sectionIndex = 0;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 2) return;
    const cells = rowCells(row);
    if (!cells.some(Boolean)) return;

    const joined = cells.join(" ").toLowerCase();
    if (/^toplam|p\.?no|böl\.?/i.test(cells[0] ?? "")) return;

    const pozIdx = findPozIndex(cells);
    if (pozIdx < 0) {
      const header = cells.filter(Boolean).join(" ");
      if (
        header.length >= 3 &&
        !/tanim|açıklama|ölçü|adet|fiyat/i.test(header) &&
        cells.length <= 2
      ) {
        sectionIndex++;
        bolumAd = `${header}\0${sectionIndex}`;
        const harf = header.charAt(0).toUpperCase();
        bolum = bolumKodFromBaslik(header, harf);
      }
      return;
    }

    const parsed = parseRowFromPoz(cells, pozIdx, bolum, bolumAd);
    if (parsed) rows.push(parsed);
  });

  return rows;
}

/** Claude yedek — sayfa metni (binär xlsx göndermekten ucuz) */
export function worksheetToPlainText(ws: Worksheet, maxChars = 120_000): string {
  const lines: string[] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells = rowCells(row).filter(Boolean);
    if (cells.length) lines.push(cells.join("\t"));
  });
  return lines.join("\n").slice(0, maxChars);
}
