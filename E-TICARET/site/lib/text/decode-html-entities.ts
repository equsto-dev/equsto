/** HTML entity → Unicode (katalog / Inoksan shop açıklamaları) */

const NAMED: Record<string, string> = {
  nbsp: " ",
  middot: "·",
  deg: "°",
  sup2: "²",
  ouml: "ö",
  Ouml: "Ö",
  uuml: "ü",
  Uuml: "Ü",
  ccedil: "ç",
  Ccedil: "Ç",
  scedil: "ş",
  Scedil: "Ş",
  gbreve: "ğ",
  Gbreve: "Ğ",
  imath: "ı",
  Iuml: "İ",
  apos: "'",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201D",
  ldquo: "\u201C",
  ndash: "\u2013",
  mdash: "\u2014",
  times: "×",
  hellip: "…",
};

const CATALOG_TEXT_KEYS = [
  "name",
  "specs",
  "aciklama",
  "description",
  "descriptionEn",
  "olcu_etiket",
  "inoksan_shop_description",
  "ozti_web_description",
] as const;

function fromEntityCode(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return "";
  try {
    return String.fromCodePoint(n);
  } catch {
    return "";
  }
}

export function decodeHtmlEntities(raw: string | null | undefined): string {
  const decoded = String(raw ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => fromEntityCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => fromEntityCode(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (_, name) =>
      Object.prototype.hasOwnProperty.call(NAMED, name) ? NAMED[name] : `&${name};`,
    );
  try {
    return decoded.normalize("NFC");
  } catch {
    return decoded;
  }
}

/** WooCommerce/WordPress entity'lerini katalog satırının görünen metinlerinde çözer. */
export function decodeCatalogRowText<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const key of CATALOG_TEXT_KEYS) {
    if (typeof out[key] === "string") {
      out[key] = decodeHtmlEntities(out[key] as string);
    }
  }
  if (Array.isArray(out.keywords)) {
    out.keywords = (out.keywords as unknown[]).map((k) =>
      typeof k === "string" ? decodeHtmlEntities(k) : k,
    );
  }
  if (Array.isArray(out.teknik_ozellikler)) {
    out.teknik_ozellikler = (out.teknik_ozellikler as unknown[]).map((k) =>
      typeof k === "string" ? decodeHtmlEntities(k) : k,
    );
  }
  return out as T;
}
