/** Meslek adımı — büyük seçim satırları için alt açıklamalar */
export const PFOS_MESLEK_SUBTITLES: Record<string, string> = {
  Yatırımcı: "Yeni restoran açıyorum.",
  "Şef / Aşçı": "Mutfağı ben kuruyorum.",
  Mimar: "Projeyi çiziyorum.",
  Satınalma: "Teklif topluyorum.",
  "İşletme Müdürü": "Günlük operasyonu yönetiyorum.",
  Franchise: "Zincir marka açıyorum.",
};

export const PFOS_MESLEK_PRIMARY = [
  "Yatırımcı",
  "Şef / Aşçı",
  "Mimar",
  "Satınalma",
] as const;

export const PFOS_MESLEK_SECONDARY = [
  "İşletme Müdürü",
  "Franchise",
] as const;
