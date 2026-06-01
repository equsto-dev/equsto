import type { PfosKategoriKodu } from "@/lib/pfos/core/engine-types";

/** Doğrulanmış / referans proforma satırı */
export type ReferansKalem = {
  referansPoz: string;
  isim: string;
  urunTipi: string;
  kategoriKodu: PfosKategoriKodu;
  adet: number;
  /** Varsayılan: zorunlu. Teşhir vitrinleri gibi karar bekleyen kalemler: tavsiye. */
  tip?: "zorunlu" | "tavsiye" | "opsiyonel";
  notlar?: string;
  altKategori?: string;
  /** Excel listesindeki bölüm sırası (ilk görünüm) */
  referansBolumSira?: number;
  referansBolumKey?: string;
  elektrikGucuKwHint?: number;
  gazGucuKwHint?: number;
};

export type ReferansProfil = {
  id: string;
  label: string;
  kaynak?: string;
  not?: string;
  referansM2?: number;
  kalemler: ReferansKalem[];
};
