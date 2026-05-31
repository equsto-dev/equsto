export type TipSozlukEntry = {
  tip_kodu: string;
  aciklama: string;
  kategori: string;
  alt_kategori?: string | null;
  kaynak: string;
  frekans: number;
};

export type TipSozlukFile = {
  version: number;
  updated: string;
  count: number;
  entries: TipSozlukEntry[];
};
