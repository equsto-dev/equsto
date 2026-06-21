/**
 * equsto_teklif_v14.xlsx ile birebir uyumlu teklif modeli.
 * UI önizleme, API yanıtı ve XLSX export aynı yapıyı kullanır.
 */

export type TeklifV14Ust = {
  projeAdi: string;
  musteri: string;
  sayi: string;
  tarih: string;
  eurTry: number | null;
};

export type TeklifV14Satir = {
  /** Bölüm no: "01" */
  bolumNo: string;
  /** Bölüm başlığı: "01. MUTFAK" / zone etiketi */
  bolumBaslik: string;
  poz: string;
  ek?: string;
  stokNo: string;
  tanim: string;
  marka: string;
  olcu: string;
  elkKw: number | null;
  gazKw: number | null;
  adet: number;
  /** Birim satış (v14 K sütunu — genelde EUR) */
  birimSatis: number | null;
  /** Satır toplamı (v14 L sütunu) */
  toplamSatis: number | null;
  doviz: "EUR" | "TRY" | "USD";
  originalFiyat?: number | null;
  originalDoviz?: "EUR" | "TRY" | "USD" | null;
  /** Katalog ürün görseli (URL) */
  fotoUrl?: string;
  /** Ürün fotoğrafı / not satırı (Excel metin yedek) */
  fotoNot?: string;
  /** Spec satırı — ürün açıklaması maddeleri */
  aciklama?: string;
};

export type TeklifV14Ozet = {
  toplamElektrikKw: number;
  toplamGazKw: number;
  genelToplam: number | null;
  doviz: "EUR" | "TRY" | "USD";
};

export type TeklifModelV14 = {
  version: "v14";
  formNo: string;
  ust: TeklifV14Ust;
  satirlar: TeklifV14Satir[];
  ozet: TeklifV14Ozet;
  sartlar: string[];
  meta: {
    konsept: string;
    konseptLabel: string;
    sehir: string;
    m2Toplam: number;
    bolumM2: Record<string, number>;
    teslimatAdresi: string;
  };
};
