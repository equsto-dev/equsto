/**
 * PDF / Excel teklif listesi → Claude analiz (sunucu tarafı, public liste-fiyat için).
 */

import {
  runImportDocumentAnaliz,
  runImportTextAnaliz,
} from "@/lib/claude/import-analiz.server";
import { parseProformaPdfBuffer } from "@/lib/pfos/liste-proforma-pdf";
import { worksheetToPlainText } from "@/lib/pfos/liste-proforma-excel";
import ExcelJS from "exceljs";

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

function buildSystemPrompt(): string {
  return `Sen bir endüstriyel mutfak ekipman listesi çıkarıcısısın.
PDF veya Excel proforma/teklif dosyasındaki satırları BİREBİR kopyala — yorumlama veya stok kodu ekleme.

KURALLAR:
1. Yalnızca dosyada görünen Poz satırlarını al (A1, D7, K2 vb.). Dosyada olmayan kalem UYDURMA.
2. ham_isim = ürün tanımı (marka ve fiyat hariç), dosyadaki Türkçe metin aynen.
3. poz = dosyadaki poz numarası (A25A gibi).
4. olcu = varsa 140*70*85 formatında; yoksa null.
5. adet = dosyadaki adet sütunu.
6. marka = satırdaki marka (sktürk, electrolux vb.); yoksa null.
7. birim_fiyat_eur = dosyadaki birim fiyat (EUR, sayı); yoksa null.
8. mevcut = müşteri temini / mevcut satırlarda true.
9. kategori = dosyadaki bölüm başlığı (sıcak mutfak, bulaşık yıkama vb.) veya poz harfine göre tahmin.
10. tip_kodu alanını boş string bırak ("").

SADECE JSON dizi döndür:
[
  {
    "ham_isim": "MAKE-UP DOLABI, 3*2 ÇEKMECELİ, YÜKSEK BORULU",
    "tip_kodu": "",
    "kategori": "sıcak mutfak",
    "adet": 1,
    "poz": "A1",
    "olcu": "140*70*85/142",
    "marka": "sktürk",
    "birim_fiyat_eur": 1900,
    "mevcut": false
  }
]`;
}

async function analyzeDocumentForListe(
  buffer: ArrayBuffer,
  dosya_tip: string,
  opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  const system_prompt = buildSystemPrompt();
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

/** Excel (.xlsx) — önce düz metin (ucuz); PDF document API kullanılmaz */
export async function analyzeExcelForListe(
  xlsxBuffer: ArrayBuffer,
  opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(xlsxBuffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel sayfası bulunamadı");

  const plain = worksheetToPlainText(ws);
  const system_prompt = buildSystemPrompt();
  const trimmedNotes = opts?.notlar?.trim();
  const user_prompt = trimmedNotes
    ? `Aşağıdaki teklif listesi metninden kalemleri çıkar.\n\nNotlar:\n---\n${trimmedNotes}\n---\n\n${plain}`
    : `Aşağıdaki teklif listesi metninden tüm ekipman kalemlerini çıkar:\n\n${plain}`;

  return runImportTextAnaliz({ system_prompt, user_prompt });
}
