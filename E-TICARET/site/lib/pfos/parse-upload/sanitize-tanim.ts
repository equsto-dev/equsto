import { foldTr } from "@/lib/search-query";
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

/** Proforma kısaltmaları (RFLI → RAFLI vb.) */
export function expandProformaAbbreviations(raw: string): string {
  return String(raw ?? "")
    .replace(/\bRFLI\b/gi, "RAFLI")
    .replace(/\bKAY\.?\s*/gi, "KAYDIRMA ")
    .replace(/\bMOB\.?\s*/gi, "MOBİLYA ")
    .replace(/\bSKTÜRK\b/gi, "sktürk");
}

/** Proforma PDF satırından arama / teklif için temiz tanım */
export function cleanProformaTanim(raw: string): string {
  let s = expandProformaAbbreviations(String(raw ?? "").trim());
  if (!s) return "";

  s = s.replace(OLCU_RE, " ");
  s = s.replace(
    /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:€|eur|tl|₺)\b/gi,
    " ",
  );
  s = s.replace(/\b\d+\s+mevcut\b/gi, " ");
  s = s.replace(/\b[a-z][\w.-]{2,}\s+\d{1,3}(?:[.,]\d{3})+\s*(?:€|eur)?/gi, " ");

  const folded = foldTr(s);
  for (const b of BOLUM_KALINTI) {
    const re = new RegExp(`\\b${b.replace(/\s+/g, "\\s+")}\\b`, "gi");
    s = s.replace(re, " ");
  }

  return s.replace(/\s+/g, " ").trim().toUpperCase();
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
  if (marka && !/^(skt[uü]rk|-)$/i.test(marka)) {
    parts.push(marka);
  }
  return parts.filter(Boolean).join(" ").trim();
}
