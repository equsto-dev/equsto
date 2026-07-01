import {
  PFOS_SORUN_TIPLERI,
  type PfosSorunTipi,
} from "@/lib/pfos/feedback-types";

export type IyilestirmeParsedEntry = {
  poz: string;
  rawLine: string;
  lineNo: number;
  sorunTipi: PfosSorunTipi;
  marka?: string;
  /** fiyat_kurali için çarpan (ör. G14 ×4) */
  fiyatCarpan?: number;
  isimKalibi?: string;
};

const MARKA_PATTERNS: Array<{ re: RegExp; marka: string }> = [
  { re: /EQUSTO/i, marka: "Equsto" },
  { re: /ATALAY/i, marka: "Atalay" },
  { re: /BREMA/i, marka: "Brema" },
  { re: /PORTABIANCO/i, marka: "Portabianco" },
  { re: /ÖZT[İI]RYAK[İI]/i, marka: "Öztiryakiler" },
  { re: /PORTASHELF/i, marka: "Portashelf" },
  { re: /PASLANMAZ/i, marka: "Paslanmaz" },
];

function extractMarka(text: string): string | undefined {
  for (const { re, marka } of MARKA_PATTERNS) {
    if (re.test(text)) return marka;
  }
  return undefined;
}

function isSorunTipi(v: string): v is PfosSorunTipi {
  return (PFOS_SORUN_TIPLERI as readonly string[]).includes(v);
}

/** Satır başındaki poz kodlarını çıkar (G7, G7A, Y1 VE Y2 …) */
export function parseIyilestirmePozList(line: string): string[] {
  const trimmed = line.trim();
  const dual = trimmed.match(/^(Y\d+)\s+VE\s+(Y\d+)\s+/i);
  if (dual) {
    return [dual[1].toUpperCase(), dual[2].toUpperCase()];
  }
  const single = trimmed.match(/^([A-Z]\d+[A-Z]?)\s+/i);
  if (single) return [single[1].toUpperCase()];
  return [];
}

export function classifyIyilestirmeLine(text: string): {
  sorunTipi: PfosSorunTipi;
  marka?: string;
  fiyatCarpan?: number;
  isimKalibi?: string;
} {
  const u = text.toLocaleUpperCase("tr");

  if (
    /FİYATINI\s+\d+\s+İLE\s+ÇARP/.test(u) ||
    /DUVAR RAFI FİYATINI\s+4\s+İLE\s+ÇARP/.test(u)
  ) {
    const m = u.match(/(\d+)\s+İLE\s+ÇARP/);
    return {
      sorunTipi: "fiyat_kurali",
      fiyatCarpan: m ? Number(m[1]) : 4,
      isimKalibi: "tava",
    };
  }

  if (/\d\s*['']?LÜ\s+MODEL/.test(u) || /4'LÜ MODEL/.test(u)) {
    return { sorunTipi: "yanlis_goz_sayisi", marka: extractMarka(text) };
  }

  if (/MARKA KULLANALIM|HER ZAMAN/.test(u)) {
    return { sorunTipi: "marka_tercihi", marka: extractMarka(text) };
  }

  if (/YANLIŞ ÜRÜN/.test(u)) {
    const marka = extractMarka(text);
    if (marka === "Portabianco") {
      return { sorunTipi: "yanlis_marka", marka };
    }
    return { sorunTipi: "yanlis_model", marka };
  }

  if (/ÇEKMECELİ MODEL/.test(u)) {
    return { sorunTipi: "yanlis_model" };
  }

  if (/FİLTRE KAHVE/.test(u)) {
    return { sorunTipi: "yanlis_model" };
  }

  if (/PORTABIANCO/.test(u)) {
    return { sorunTipi: "marka_tercihi", marka: "Portabianco" };
  }

  if (/NÖTR/.test(u)) {
    return { sorunTipi: "genel" };
  }

  const marka = extractMarka(text);
  if (marka) {
    return { sorunTipi: "marka_tercihi", marka };
  }

  return { sorunTipi: "genel" };
}

/** iyileştirme.md satırlarını yapılandırılmış kayıtlara dönüştür */
export function parseIyilestirmeMarkdown(
  content: string,
): IyilestirmeParsedEntry[] {
  const lines = content.split(/\r?\n/);
  const out: IyilestirmeParsedEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const pozList = parseIyilestirmePozList(rawLine);
    if (pozList.length === 0) continue;

    const cls = classifyIyilestirmeLine(rawLine);
    const sorunTipi = isSorunTipi(cls.sorunTipi) ? cls.sorunTipi : "genel";

    for (const poz of pozList) {
      out.push({
        poz,
        rawLine,
        lineNo: i + 1,
        sorunTipi,
        marka: cls.marka,
        fiyatCarpan: cls.fiyatCarpan,
        isimKalibi: cls.isimKalibi,
      });
    }
  }

  return out;
}
