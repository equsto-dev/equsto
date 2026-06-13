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
};

export function decodeHtmlEntities(raw: string | null | undefined): string {
  return String(raw ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&([a-z]+);/gi, (_, name) =>
      Object.prototype.hasOwnProperty.call(NAMED, name) ? NAMED[name] : `&${name};`,
    );
}
