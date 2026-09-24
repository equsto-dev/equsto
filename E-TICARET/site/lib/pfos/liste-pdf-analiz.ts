/**
 * PDF / Excel teklif listesi → yalnızca yerel parse (Anthropic/Claude yok).
 */

import ExcelJS from "exceljs";
import { parseEkipmanWorksheet } from "@/lib/pfos/kategoriler/parse-ekipman-xlsx";
import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import { pickBestProformaWorkbook } from "@/lib/pfos/liste-proforma-excel";
import { parseProformaPdfBuffer } from "@/lib/pfos/liste-proforma-pdf";

export type ListePdfKalem = {
  ham_isim: string;
  tip_kodu: string;
  kategori: string;
  adet?: number;
  poz?: string;
  olcu?: string;
  marka?: string;
  birim_fiyat_eur?: number | null;
  mevcut?: boolean;
};

export const LISTE_LOCAL_PARSE_MISSING_MSG =
  "Bu liste otomatik okunamadı. Ürün/tanım ve adet sütunları olan bir Excel (.xlsx) veya metin içeren proforma PDF yükleyin.";

function satirToListeKalem(row: PfosEkipmanSatir): ListePdfKalem | null {
  const ham_isim = String(row.ad ?? "").trim();
  if (!ham_isim) return null;
  const adetRaw = row.adet;
  const adet =
    typeof adetRaw === "number" && adetRaw > 0
      ? Math.round(adetRaw)
      : parseInt(String(adetRaw ?? "1"), 10) || 1;
  const olcu = String(row.olcu ?? "").trim();
  const marka = String(row.marka ?? "").trim();
  return {
    ham_isim,
    tip_kodu: "",
    kategori: String(row.bolumAd || row.bolum || "").trim() || "diger",
    adet,
    poz: String(row.poz ?? "").trim() || undefined,
    olcu: olcu && olcu !== "—" ? olcu : undefined,
    marka: marka || undefined,
    birim_fiyat_eur:
      row.birim_fiyat_eur != null && Number(row.birim_fiyat_eur) > 0
        ? Number(row.birim_fiyat_eur)
        : null,
    mevcut: row.mevcut === true,
  };
}

/** PDF buffer → ekipman kalemleri (Claude kullanılmaz) */
export async function analyzePdfForListe(
  pdfBuffer: ArrayBuffer,
  _opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  const structured = await parseProformaPdfBuffer(pdfBuffer);
  if (structured?.length) return structured;

  const soft = await parseProformaPdfBuffer(pdfBuffer, { minKalem: 1 });
  if (soft?.length) return soft;

  throw new Error(LISTE_LOCAL_PARSE_MISSING_MSG);
}

/** Excel (.xlsx) → yerel proforma ayrıştırıcılar (Claude kullanılmaz) */
export async function analyzeExcelForListe(
  xlsxBuffer: ArrayBuffer,
  _opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(xlsxBuffer);
  if (!wb.worksheets.length) throw new Error("Excel sayfası bulunamadı");

  const satirlar = pickBestProformaWorkbook(wb, [parseEkipmanWorksheet]);
  const kalemler = satirlar
    .map(satirToListeKalem)
    .filter((k): k is ListePdfKalem => Boolean(k));
  if (!kalemler.length) throw new Error(LISTE_LOCAL_PARSE_MISSING_MSG);
  return kalemler;
}
