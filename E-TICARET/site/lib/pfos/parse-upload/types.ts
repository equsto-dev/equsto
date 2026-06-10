/** Claude proforma çıktısı */
export type ParsedItem = {
  poz: string;
  tanim: string;
  olcu: string;
  adet: number;
  marka_orijinal: string;
  bolum: string;
  mevcut: boolean;
};

/** Meilisearch hit — API yanıtı için normalize DTO */
export type MeilisearchHitDto = {
  id: string;
  urun_adi: string;
  stok_no: string;
  marka: string;
  olcu?: string;
  satis_fiyati_eur: number;
  elk_kw?: number;
  gaz_kw?: number;
  kategori?: string;
};

export type MatchedItem = ParsedItem & {
  eslesen_urun: MeilisearchHitDto | null;
  eslesen_skor: number;
  birim_fiyat_eur: number | null;
  toplam_eur: number | null;
  not_found: boolean;
};

export type ParseUploadOzet = {
  eslesen: number;
  mevcut_atlandi: number;
  bulunamayan: number;
  genel_toplam_eur: number;
};

/** PFOS teklif motoru iç eşlemesi */
export type MeiliKalemEslestirme = {
  kalem: ParsedItem;
  matched: MatchedItem;
  urun: import("../schemas/pfos.schema").EslesmisUrun | null;
};
