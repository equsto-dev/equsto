export type PfosProjeKaynak = "arsiv" | "referans" | "vitrin" | "pilot";

export type PfosProjeProfil = {
  konsept: string;
  dukkan: string;
  pfosZones: string[];
  sourceProjects?: string[];
};

export type PfosProjeRow = {
  id: string;
  baslik: string;
  folder: string;
  yil: string;
  konsept: string;
  dukkan: string;
  zones: string[];
  zoneCount: number;
  fileCount: number;
  lineCount: number;
  status: string;
  referans: boolean;
  /** En iyi eşleşen PFOS profil (konsept · dükkan) */
  profilOneri: string | null;
  profilSkor: number;
  kaynak: PfosProjeKaynak;
  detailAvailable?: boolean;
  dwgUrl?: string | null;
};

export type PfosProjelerResponse = {
  projects: PfosProjeRow[];
  profiles: PfosProjeProfil[];
  stats: {
    total: number;
    referans: number;
    yillar: string[];
    konseptler: string[];
    dukkanlar: string[];
    zones: string[];
  };
};
