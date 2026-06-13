import { foldTr } from "@/lib/search-query";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { extractFeatureSearchTerms } from "./match-features";

const OLCU_RE =
  /\d{2,}(?:[.,]\d+)?(?:\*\d{2,}(?:[.,]\d+)?){1,2}(?:\/\d{2,})?/g;

const BOLUM_KALINTI = [
  "skturk",
  "skturk mutfak",
  "sicak mutfak",
  "soguk mutfak",
  "bulaşık yıkama",
  "bulasik yikama",
  "kuru depo",
  "panel tip soguk oda",
  "panel tip derin dondurucu",
  "servis bar",
  "pastane",
];

const PROFORMA_JUNK_RE =
  /\s*(?:skt[uü]rk|skturk)(?:\s+mutfak)?(?:\s+\d+(?:\s+\d+){0,3})?\s*\+?\s*$/i;

const TRAILING_PRICE_TAIL_RE =
  /\s+[-–—]?\s*(?:\d+\s+){1,3}\d{3,4}(?:\s+\d{3,4})?\s*\+?\s*$/;

const TRAILING_BRAND_QTY_RE =
  /\s+[-–—]\s*(?:electrolux|fimak|oztiryakiler|ozti|atalay|inoksan|pimak|equsto)\b.*$/i;

/** Proforma kısaltmaları (RFLI → RAFLI vb.) */
export function expandProformaAbbreviations(raw: string): string {
  return String(raw ?? "")
    .replace(/\bRFLI\b/gi, "RAFLI")
    .replace(/\bKAY\.?\s*/gi, "KAYDIRMA ")
    .replace(/\bMOB\.?\s*/gi, "MOBİLYA ")
    .replace(/\bPOWER\s+GRILL\b/gi, "POWERGRILL")
    .replace(/\bSKTÜRK\b/gi, "")
    .replace(/\bSKTURK\b/gi, "");
}

function stripProformaInlineJunk(s: string): string {
  let out = String(s ?? "")
    .replace(/\[object\s+object\]/gi, " ")
    .replace(OLCU_RE, " ")
    .replace(
      /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:€|eur|tl|₺)\b/gi,
      " ",
    )
    .replace(/\b\d+\s+mevcut\b/gi, " ")
    .replace(/\b[a-z][\w.-]{2,}\s+\d{1,3}(?:[.,]\d{3})+\s*(?:€|eur)?/gi, " ");

  const folded = foldTr(out);
  for (const b of BOLUM_KALINTI) {
    const re = new RegExp(`\\b${b.replace(/\s+/g, "\\s+")}\\b`, "gi");
    out = out.replace(re, " ");
    if (folded.includes(b)) {
      out = out.replace(new RegExp(b.replace(/\s+/g, "\\s+"), "gi"), " ");
    }
  }

  out = out
    .replace(PROFORMA_JUNK_RE, "")
    .replace(TRAILING_PRICE_TAIL_RE, "")
    .replace(TRAILING_BRAND_QTY_RE, "")
    .replace(/\s+[-–—]\s*\d+\s*m\.?\s*temini\s*\+?\s*$/i, "")
    .replace(/^\s*[-–—]\s*\d+\s*$/g, "")
    .replace(/\s*[-–—]\s*\d+\s*$/g, "")
    .replace(/\s*\+\s*$/g, "")
    .replace(/\s+[-–—]\s*[-–—]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return out;
}

/** Proforma PDF satırından arama için temiz tanım */
export function cleanProformaTanim(raw: string): string {
  const s = stripProformaInlineJunk(expandProformaAbbreviations(String(raw ?? "").trim()));
  return s ? s.toUpperCase() : "";
}

/** Teklif / tablo görünümü — orijinal büyük-küçük harf korunur */
export function formatPfosDisplayTanim(raw: string | null | undefined): string {
  const cleaned = stripProformaInlineJunk(
    expandProformaAbbreviations(String(raw ?? "").trim()),
  );
  return repairPfosDisplayText(cleaned);
}

/** notlar / aciklama alanı proforma artığı mı? */
export function isProformaJunkText(raw: string | null | undefined): boolean {
  const s = String(raw ?? "").trim();
  if (!s) return true;
  if (/\[object\s+object\]/i.test(s)) return true;
  if (/^skt[uü]rk\b/i.test(s)) return true;
  if (/^[-–—\s\d+]+$/.test(s)) return true;
  if (/^\d+(?:\s+\d+){1,3}\s*\+?\s*$/.test(s)) return true;
  if (/^[-–—]\s*\d+\s*(?:\[object\s+object\])?/i.test(s)) return true;
  const meaningful = formatPfosDisplayTanim(s);
  return meaningful.length < 4;
}

export function buildMeiliSearchQuery(item: {
  tanim: string;
  olcu?: string | null;
  marka_orijinal?: string | null;
  bolum?: string | null;
}): string {
  const core = cleanProformaTanim(item.tanim);
  const features = extractFeatureSearchTerms(item.tanim);
  const parts = [...features, core];
  const olcu = String(item.olcu ?? "").trim();
  if (olcu) parts.push(olcu.split("/")[0]);
  const marka = String(item.marka_orijinal ?? "").trim();
  if (marka && !/^(skt[uü]rk|skturk|-)$/i.test(marka)) {
    parts.push(marka);
  }
  return parts.filter(Boolean).join(" ").trim();
}
