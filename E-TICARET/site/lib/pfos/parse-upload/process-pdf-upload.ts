import { analyzePdfForListe } from "@/lib/pfos/liste-pdf-analiz";
import { calculateListeQuote } from "@/lib/pfos/liste-fiyat";
import { clearMatchProductCache } from "../core/match-product";
import type { PFOSResponse } from "../schemas/pfos.schema";

export type ProcessPdfUploadInput = {
  buffer: ArrayBuffer;
  kaynakDosya: string;
  projeAdi?: string;
  sehir?: string;
  notlar?: string;
};

export type ProcessPdfUploadResult = PFOSResponse & {
  kaynak_dosya: string;
  toplam_kalem: number;
};

/** PDF → yapılandırılmış satırlar → birebir teklif (katalog eşlemesi yok) */
export async function processPdfUpload(
  input: ProcessPdfUploadInput,
): Promise<ProcessPdfUploadResult> {
  clearMatchProductCache();
  const sehir = input.sehir?.trim() || "İstanbul";
  const baseName = input.kaynakDosya.replace(/\.pdf$/i, "");
  const projeAdi = input.projeAdi?.trim() || baseName;

  const importKalemler = await analyzePdfForListe(input.buffer, {
    notlar: input.notlar,
  });
  if (importKalemler.length === 0) {
    throw new Error("PDF'den kalem çıkarılamadı. Dosya formatını kontrol edin.");
  }

  const quote = await calculateListeQuote({
    importKalemler,
    kaynakDosya: input.kaynakDosya,
    kaynakTip: "pdf",
    projeAdi,
    sehir,
  });

  return {
    ...quote,
    kaynak_dosya: input.kaynakDosya,
    toplam_kalem: importKalemler.length,
  };
}
