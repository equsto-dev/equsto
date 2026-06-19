/** PFOS yönetim — m² bantlı ekipman listesi (Steakhouse, Balıkçı) */

export type PfosKategoriBant = {
  id: string;
  label: string;
  referansM2: number;
};

export type PfosKategoriTanim = {
  id: string;
  label: string;
  ustKategori: string;
  planNot?: string;
  bantlar: PfosKategoriBant[];
};

export type PfosEkipmanSatir = {
  bolum: string;
  bolumAd: string;
  poz: string;
  ad: string;
  olcu: string;
  adet: number | string;
};

export type PfosKategoriListeKayit = {
  kategoriId: string;
  bantId: string;
  label: string;
  referansM2: number;
  kaynakDosya?: string;
  yukleme?: string;
  kalemSayisi: number;
  toplamAdet: number;
  kalemler: PfosEkipmanSatir[];
};

export type PfosKategoriBantMeta = {
  listeDosya: string;
  kalemSayisi: number;
  toplamAdet: number;
  kaynakDosya?: string;
  yukleme?: string;
};

export type PfosKategorilerManifest = {
  version: string;
  updated_at?: string;
  kategoriler: Array<{
    id: string;
    label: string;
    ustKategori: string;
    bantlar: Array<{
      id: string;
      label: string;
      referansM2: number;
      meta?: PfosKategoriBantMeta;
    }>;
  }>;
};
