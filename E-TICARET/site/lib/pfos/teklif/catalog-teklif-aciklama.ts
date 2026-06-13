/** Müşteriye/teklife gidecek açıklama — fiyat satırları hariç */

import { decodeHtmlEntities } from "@/lib/text/decode-html-entities";

const INTERNAL_LINE =
  /^(liste fiyatı|bayi\b|equsto\b|hesap\s*:|kur\s*:|kaynak\s*:|kategori:|model:|ürün kodu|barkod:|katalog sayfası)/i;

function isInternalLine(ln: string): boolean {
  const t = decodeHtmlEntities(ln).trim();
  if (!t) return true;
  if (INTERNAL_LINE.test(t)) return true;
  if (/iskonto/i.test(t) && /liste|eur|bayi|kalan|%/i.test(t)) return true;
  if (/^equsto\b/i.test(t) && /(satış|fiyat|eur|tl|kar)/i.test(t)) return true;
  return false;
}

function isHeadingLine(ln: string): boolean {
  const t = decodeHtmlEntities(ln)
    .replace(/^[•\-–—*·]+\s*/, "")
    .trim()
    .toLocaleLowerCase("tr-TR");
  return (
    t === "genel özellikler" ||
    t === "teknik özellikler" ||
    /^genel\s+özellikler\b/.test(t) ||
    /^teknik\s+özellikler\b/.test(t)
  );
}

function isDescriptionBlob(ln: string): boolean {
  const t = decodeHtmlEntities(ln);
  if (t.length < 140) return false;
  return (
    /\s\*\s/.test(t) ||
    /genel\s*özellikler/i.test(t) ||
    (t.split(/\s*\*\s+/).length > 4 && t.length > 200)
  );
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ln of lines) {
    const t = decodeHtmlEntities(ln).trim();
    if (!t || isHeadingLine(t) || isDescriptionBlob(t) || isInternalLine(t)) continue;
    const key = t.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function formatBullets(lines: string[], prefix: "*" | "•" = "*"): string {
  return dedupeLines(lines)
    .map((l) => {
      const t = l.replace(/^[•\-–—*·]+\s*/, "").trim();
      return t.startsWith(prefix) ? t : `${prefix} ${t}`;
    })
    .join("\n")
    .trim();
}

function cleanLines(lines: string[]): string[] {
  return dedupeLines(lines.map((l) => String(l || "").trim()).filter(Boolean));
}

export type CatalogAciklamaInput = {
  description?: string | null;
  ozti_web_description?: string | null;
  inoksan_shop_description?: string | null;
  pimak_web_description?: string | null;
  teknik_ozellikler?: string[] | null;
  specs?: string | null;
  aciklama?: string | null;
};

function splitShopDescriptionBullets(shop: string): string[] {
  const raw = decodeHtmlEntities(shop).trim();
  if (!raw) return [];

  let general = raw.split(/TEKNİK\s*ÖZELLİKLER/i)[0].trim();
  general = general
    .replace(/^[•\-–—*·]+\s*/g, "")
    .replace(/^genel\s*özellikler\s*/i, "")
    .trim();

  let parts: string[];
  if (/\n\s*[•·\-–—*]/.test(general)) {
    parts = general.split(/\n\s*[•·\-–—*]\s*/);
  } else if (/\s\*\s/.test(general)) {
    parts = general.split(/\s*\*\s+/);
  } else {
    parts = general.split(/\r?\n/);
  }
  return parts
    .map((l) => l.replace(/^[•\-–—*·]+\s*/, "").trim())
    .filter((l) => l.length > 2);
}

/** Katalog satırından PFOS teklif `aciklama` metni */
export function buildCatalogTeklifAciklama(
  row: CatalogAciklamaInput | null | undefined,
): string {
  if (!row) return "";

  const shop = decodeHtmlEntities(
    String(
      row.ozti_web_description ||
        row.inoksan_shop_description ||
        row.pimak_web_description ||
        row.description ||
        "",
    ),
  ).trim();

  if (shop.length >= 40) {
    const bullets = splitShopDescriptionBullets(shop);
    if (bullets.length > 0) {
      return formatBullets(bullets, "*");
    }
  }

  const teknikRaw = Array.isArray(row.teknik_ozellikler) ? row.teknik_ozellikler : [];
  const teknik = cleanLines(teknikRaw);
  if (teknik.length) {
    const adLead = decodeHtmlEntities(String(row.aciklama || "")).trim();
    const bullets = [...teknik];
    if (
      adLead &&
      !isInternalLine(adLead) &&
      bullets.length < 5 &&
      !bullets.some((b) =>
        b.toLocaleLowerCase("tr-TR").includes(adLead.toLocaleLowerCase("tr-TR").slice(0, 24)),
      )
    ) {
      bullets.unshift(adLead);
    }
    return formatBullets(bullets, "•");
  }

  const fromSpecs = decodeHtmlEntities(String(row.specs || ""))
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !isInternalLine(l))
    .filter((l) => !/^teknik özellikler/i.test(l));
  if (fromSpecs.length) {
    return formatBullets(fromSpecs.slice(0, 12), "•");
  }

  const lead = decodeHtmlEntities(String(row.aciklama || ""))
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^kategori:/i.test(l));
  return formatBullets(lead.slice(0, 6), "•");
}

/** PDF / Excel — HTML entity decode, tekrarları at, satır yapısını koru */
export function normalizeTeklifAciklamaText(raw: string | null | undefined): string {
  const decoded = decodeHtmlEntities(String(raw ?? "")).trim();
  if (!decoded) return "";

  const lines = decoded.split(/\r?\n/);
  if (lines.length === 1 && /\s\*\s/.test(decoded)) {
    return formatBullets(decoded.split(/\s*\*\s+/), "*");
  }

  const bulletLines = lines.flatMap((line) => {
    const t = line.trim();
    if (!t) return [];
    if (/\s\*\s/.test(t) && !t.startsWith("*") && !t.startsWith("•")) {
      return t.split(/\s*\*\s+/);
    }
    return [t];
  });

  const prefix: "*" | "•" = decoded.includes("•") ? "•" : "*";
  return formatBullets(bulletLines, prefix);
}
