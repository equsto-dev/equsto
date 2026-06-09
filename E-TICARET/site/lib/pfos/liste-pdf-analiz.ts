/**
 * PDF / Excel teklif listesi → Claude analiz (sunucu tarafı, public liste-fiyat için).
 */

import { runImportDocumentAnaliz } from "@/lib/claude/import-analiz.server";
import { parseProformaPdfBuffer } from "@/lib/pfos/liste-proforma-pdf";
import { loadTipSozluguEntries } from "@/lib/tip-sozlugu/store";
import type { TipSozlukEntry } from "@/lib/tip-sozlugu/types";

export type ListePdfKalem = {
  ham_isim: string;
  tip_kodu: string;
  kategori: string;
  adet?: number;
  poz?: string;
  olcu?: string;
};

function buildSystemPrompt(entries: TipSozlukEntry[]): string {
  const tipListesi = entries
    .map((t) => `${t.tip_kodu} → ${t.aciklama} (${t.kategori})`)
    .join("\n");

  return `Sen bir endüstriyel mutfak ekipman listesi çıkarıcısısın.
PDF veya Excel proforma/teklif dosyasındaki satırları BİREBİR kopyala — yorumlama veya stok kodu ekleme.

KURALLAR:
1. Yalnızca dosyada görünen Poz satırlarını al (A1, D7, K2 vb.). Dosyada olmayan kalem UYDURMA.
2. ham_isim = ürün tanımı (marka ve fiyat hariç), dosyadaki Türkçe metin aynen.
3. poz = dosyadaki poz numarası (A25A gibi).
4. olcu = varsa 140*70*85 formatında; yoksa null.
5. adet = dosyadaki adet sütunu.
6. kategori = dosyadaki bölüm başlığı (sıcak mutfak, bulaşık yıkama vb.) veya poz harfine göre tahmin.
7. tip_kodu alanını boş string bırak ("").

SADECE JSON dizi döndür:
[
  {
    "ham_isim": "MAKE-UP DOLABI, 3*2 ÇEKMECELİ, YÜKSEK BORULU",
    "tip_kodu": "",
    "kategori": "sıcak mutfak",
    "adet": 1,
    "poz": "A1",
    "olcu": "140*70*85/142"
  }
]`;
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function analyzeDocumentForListe(
  buffer: ArrayBuffer,
  dosya_tip: string,
  opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  const entries = await loadTipSozluguEntries();
  const system_prompt = buildSystemPrompt(entries);

  const trimmedNotes = opts?.notlar?.trim();
  const user_prompt = trimmedNotes
    ? `Dosyayı analiz et.\n\nListe notları:\n---\n${trimmedNotes}\n---`
    : "Dosyayı analiz et ve tüm ekipman kalemlerini çıkar:";

  return runImportDocumentAnaliz({
    dosya_base64: Buffer.from(buffer).toString("base64"),
    dosya_tip,
    system_prompt,
    user_prompt,
  });
}

/** PDF buffer → ekipman kalemleri */
export async function analyzePdfForListe(
  pdfBuffer: ArrayBuffer,
  opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  const structured = await parseProformaPdfBuffer(pdfBuffer);
  if (structured?.length) return structured;
  return analyzeDocumentForListe(pdfBuffer, "application/pdf", opts);
}

/** Excel (.xlsx) — Equsto şablonu dışı teklif listeleri */
export async function analyzeExcelForListe(
  xlsxBuffer: ArrayBuffer,
  opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  return analyzeDocumentForListe(xlsxBuffer, XLSX_MIME, opts);
}
