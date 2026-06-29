export const PFOS_FEEDBACK_VOTES = ["up", "down"] as const;
export type PfosFeedbackVote = (typeof PFOS_FEEDBACK_VOTES)[number];

export const PFOS_FEEDBACK_SOURCES = ["wizard", "liste", "admin"] as const;
export type PfosFeedbackSource = (typeof PFOS_FEEDBACK_SOURCES)[number];

export const PFOS_FEEDBACK_DURUMLAR = [
  "pending_review",
  "reviewed",
  "dismissed",
] as const;
export type PfosFeedbackDurum = (typeof PFOS_FEEDBACK_DURUMLAR)[number];

export const PFOS_SORUN_TIPLERI = [
  "marka_tercihi",
  "yanlis_marka",
  "yanlis_model",
  "yanlis_olcu",
  "yanlis_goz_sayisi",
  "yanlis_kapasite",
  "eksik_urun",
  "fiyat_kurali",
  "genel",
] as const;
export type PfosSorunTipi = (typeof PFOS_SORUN_TIPLERI)[number];

export type PfosKalemDuzeltme = {
  poz: string;
  referansIsim?: string;
  yanlisSku?: string | null;
  yanlisAd?: string | null;
  dogruSku?: string | null;
  sorunTipi?: PfosSorunTipi | string;
  not?: string | null;
};

export type PfosFeedbackLogInput = {
  vote: PfosFeedbackVote;
  source?: PfosFeedbackSource;
  teklifSayi?: string;
  snapshotId?: string | null;
  konsept?: string;
  konseptLabel?: string;
  referansId?: string | null;
  referansListeKey?: string | null;
  m2?: number | null;
  guvenSkoru?: number | null;
  genelToplamEur?: number | null;
  yorum?: string | null;
  kalemDuzeltmeleri?: PfosKalemDuzeltme[];
  memberLoggedIn?: boolean;
  memberId?: string | null;
};

export type PfosFeedbackAdminRow = {
  id: string;
  vote: string;
  source: string;
  teklif_sayi: string;
  snapshot_id: string | null;
  konsept: string;
  konsept_label: string;
  referans_id: string | null;
  referans_liste_key: string | null;
  m2: number | null;
  guven_skoru: number | null;
  genel_toplam_eur: number | null;
  yorum: string | null;
  kalem_duzeltmeleri: PfosKalemDuzeltme[] | null;
  member_logged_in: boolean;
  durum: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  oneri_sayisi?: number;
};
