export type FaturaNot = {
  tip: "bireysel" | "kurumsal";
  ad: string | null;
  tckn: string | null;
  unvan: string | null;
  vergiDairesi: string | null;
  vkn: string | null;
  adres: string | null;
};

export type ParsedSiparisNot = {
  adresBaslik: string | null;
  teslimat: string | null;
  fatura: FaturaNot | null;
  /** Teslimat / fatura dışındaki serbest metin */
  mesaj: string | null;
  structured: boolean;
};

const EMPTY: ParsedSiparisNot = {
  adresBaslik: null,
  teslimat: null,
  fatura: null,
  mesaj: null,
  structured: false,
};

function cleanDash(value: string): string | null {
  const t = value.trim();
  if (!t || t === "—" || t === "-") return null;
  return t;
}

function parseBireyselHead(head: string): { ad: string | null; tckn: string | null; extra: string | null } {
  const m = head.match(/^(.*?)\s*·\s*TCKN:\s*(\d+)\s*(.*)$/i);
  if (!m) return { ad: cleanDash(head), tckn: null, extra: null };
  return {
    ad: cleanDash(m[1] || ""),
    tckn: m[2] || null,
    extra: cleanDash(m[3] || ""),
  };
}

function parseKurumsalHead(head: string): {
  unvan: string | null;
  vd: string | null;
  vkn: string | null;
  extra: string | null;
} {
  let rest = head.trim();
  let extra: string | null = null;
  let vkn: string | null = null;
  const vn = rest.match(/^(.*)\s*·\s*VN:\s*(\d+)\s*(.*)$/i);
  if (vn) {
    rest = (vn[1] || "").trim();
    vkn = vn[2] || null;
    extra = cleanDash(vn[3] || "");
  }
  let vd: string | null = null;
  const vdM = rest.match(/^(.*)\s*·\s*VD:\s*(.*)$/i);
  if (vdM) {
    rest = (vdM[1] || "").trim();
    vd = cleanDash(vdM[2] || "");
  }
  return { unvan: cleanDash(rest), vd, vkn, extra };
}

/** Satır içine yapışmış Teslimat / Fatura / Adres etiketlerini ayırır. */
function explodeLines(raw: string): string[] {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+(?=Fatura\s*\()/gi, "\n")
    .replace(/[ \t]+(?=Teslimat\s*:)/gi, "\n")
    .replace(/[ \t]+(?=Adres\s*:)/gi, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Checkout'un tek alana yazdığı teslimat + fatura metnini form alanlarına böler.
 * Yapı yoksa tüm metin `mesaj` olarak kalır.
 */
export function parseSiparisNot(raw: string | null | undefined): ParsedSiparisNot {
  const text = String(raw || "").trim();
  if (!text) return { ...EMPTY };

  const lines = explodeLines(text);
  let adresBaslik: string | null = null;
  const teslimatParts: string[] = [];
  const loose: string[] = [];
  let faturaTip: "bireysel" | "kurumsal" | null = null;
  let faturaHead = "";
  const faturaAdres: string[] = [];
  let mode: "loose" | "teslimat" | "fatura" = "loose";

  for (const line of lines) {
    const adresM = line.match(/^Adres\s*:\s*(.*)$/i);
    if (adresM && mode !== "fatura") {
      adresBaslik = cleanDash(adresM[1] || "");
      mode = "loose";
      continue;
    }
    const tesM = line.match(/^Teslimat\s*:\s*(.*)$/i);
    if (tesM) {
      mode = "teslimat";
      const rest = cleanDash(tesM[1] || "");
      if (rest) teslimatParts.push(rest);
      continue;
    }
    const fatM = line.match(/^Fatura\s*\((bireysel|kurumsal)\)\s*:\s*(.*)$/i);
    if (fatM) {
      mode = "fatura";
      faturaTip = String(fatM[1]).toLowerCase() === "kurumsal" ? "kurumsal" : "bireysel";
      faturaHead = (fatM[2] || "").trim();
      continue;
    }
    if (mode === "teslimat") teslimatParts.push(line);
    else if (mode === "fatura") faturaAdres.push(line);
    else loose.push(line);
  }

  let fatura: FaturaNot | null = null;
  if (faturaTip) {
    const adresParts: string[] = [];
    if (faturaTip === "kurumsal") {
      const parsed = parseKurumsalHead(faturaHead);
      if (parsed.extra) adresParts.push(parsed.extra);
      fatura = {
        tip: "kurumsal",
        ad: null,
        tckn: null,
        unvan: parsed.unvan,
        vergiDairesi: parsed.vd,
        vkn: parsed.vkn,
        adres: null,
      };
    } else {
      const parsed = parseBireyselHead(faturaHead);
      if (parsed.extra) adresParts.push(parsed.extra);
      fatura = {
        tip: "bireysel",
        ad: parsed.ad,
        tckn: parsed.tckn,
        unvan: null,
        vergiDairesi: null,
        vkn: null,
        adres: null,
      };
    }
    adresParts.push(...faturaAdres);
    fatura.adres = adresParts.length ? adresParts.join("\n") : null;
  }

  const teslimat = teslimatParts.length ? teslimatParts.join("\n") : null;
  const mesaj = loose.length ? loose.join("\n") : null;
  const structured = Boolean(adresBaslik || teslimat || fatura);

  if (!structured) {
    return { ...EMPTY, mesaj: text };
  }

  return { adresBaslik, teslimat, fatura, mesaj, structured: true };
}
