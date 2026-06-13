import { parseWithClaude } from "./claude-proforma";
import { clearMatchProductCache } from "../core/match-product";
import { eslestirProformaKalemler } from "./meili-kalem-eslestir";
import { buildQuoteFromMeiliEslestirme } from "./build-quote";
import type { PFOSResponse } from "../schemas/pfos.schema";
import type { MatchedItem, ParseUploadOzet } from "./types";

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
  ozet_eslestirme: ParseUploadOzet;
  eslestirme_kalemler: MatchedItem[];
};

/** PDF → Claude → Meilisearch fuzzy → PFOS teklif taslağı */
export async function processPdfUpload(
  input: ProcessPdfUploadInput,
): Promise<ProcessPdfUploadResult> {
  clearMatchProductCache();
  const sehir = input.sehir?.trim() || "İstanbul";
  const baseName = input.kaynakDosya.replace(/\.pdf$/i, "");
  const projeAdi = input.projeAdi?.trim() || baseName;

  const parsedItems = await parseWithClaude(input.buffer, {
    notlar: input.notlar,
  });
  if (parsedItems.length === 0) {
    throw new Error("PDF'den kalem çıkarılamadı. Dosya formatını kontrol edin.");
  }

  const eslestirmeler = await eslestirProformaKalemler(parsedItems);
  const matchedItems = eslestirmeler.map((e) => e.matched);
  const quote = await buildQuoteFromMeiliEslestirme({
    eslestirmeler,
    kaynakDosya: input.kaynakDosya,
    projeAdi,
    sehir,
  });

  const bulunan = matchedItems.filter((i) => i.eslesen_urun !== null).length;
  const mevcut = matchedItems.filter((i) => i.mevcut).length;
  const bulunamayan = matchedItems.filter((i) => i.not_found).length;
  const genelToplam = matchedItems.reduce(
    (sum, i) => sum + (i.toplam_eur ?? 0),
    0,
  );

  return {
    ...quote,
    kaynak_dosya: input.kaynakDosya,
    toplam_kalem: parsedItems.length,
    ozet_eslestirme: {
      eslesen: bulunan,
      mevcut_atlandi: mevcut,
      bulunamayan,
      genel_toplam_eur: Math.round(genelToplam * 100) / 100,
    },
    eslestirme_kalemler: matchedItems,
  };
}
