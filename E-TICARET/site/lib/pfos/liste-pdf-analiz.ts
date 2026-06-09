/**
 * PDF / Excel teklif listesi → Claude analiz (sunucu tarafı, public liste-fiyat için).
 */

import { runImportDocumentAnaliz } from "@/lib/claude/import-analiz.server";
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

  return `Sen bir endüstriyel mutfak ekipmanı uzmanısın.
Kullanıcı sana bir PDF veya Excel teklif / proforma / ekipman listesi yükleyecek.
Bu dosyadan ekipman kalemlerini çıkar ve aşağıdaki tip_sozlugu ile eşleştir.

TİP SÖZLÜĞÜ (mevcut):
${tipListesi}

GÖREV:
1. Dosyadaki her ekipman kalemini tespit et (adet ve ölçü varsa al)
2. Mevcut tip_sozlugu'ndan en uygun tip_kodu'nu bul
3. Uygun yoksa yeni bir tip_kodu öner (snake_case, Türkçe karaktersiz)
4. Her kalem için kategori: pisirme / icecek / sogutma / yikama / hazirlik / tezgah_davlumbaz / depolama / diger

SADECE JSON dizi döndür:
[
  {
    "ham_isim": "dosyadan gelen orijinal metin",
    "tip_kodu": "mevcut_veya_yeni_kod",
    "kategori": "kategori_adi",
    "adet": 1,
    "poz": "A1 veya satır no",
    "olcu": "152*46*160 veya null",
    "durum": "eslesti" | "yeni" | "belirsiz"
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
  return analyzeDocumentForListe(pdfBuffer, "application/pdf", opts);
}

/** Excel (.xlsx) — Equsto şablonu dışı teklif listeleri */
export async function analyzeExcelForListe(
  xlsxBuffer: ArrayBuffer,
  opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  return analyzeDocumentForListe(xlsxBuffer, XLSX_MIME, opts);
}
