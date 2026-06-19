/**
 * SKTÜRK / Equsto tarzı proforma PDF → yapılandırılmış satırlar (Claude'sız).
 * Poz + tanım + ölçü + adet birebir korunur; fiyat eşlemesi PFOS referans motorunda.
 */

// pdf-parse index.js yerel test modu açar — doğrudan lib kullan
import pdf from "pdf-parse/lib/pdf-parse.js";
import type { ListePdfKalem } from "@/lib/pfos/liste-pdf-analiz";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";

/** Gerçek ekipman ölçüsü (3*2 çekmece değil) */
const OLCU_RE =
  /(\d{2,}(?:[.,]\d+)?(?:\*\d{2,}(?:[.,]\d+)?){1,2}(?:\/\d{2,})?)/;

const BOLUM_BY_POZ: Record<string, string> = {
  K: "kuru depo",
  C: "panel tip soğuk oda",
  F: "panel tip derin dondurucu oda",
  A: "sıcak mutfak",
  D: "bulaşık yıkama",
};

function bolumAdFromPoz(poz: string): string {
  return BOLUM_BY_POZ[poz.charAt(0).toUpperCase()] ?? "";
}

function parseAdetAndBody(body: string): { ad: string; adet: number } {
  let s = body.trim();
  s = s.replace(/\s+[\d.,]+\s*(?:€|₺|TL)\s*[\d.,]*\s*(?:€|₺|TL)?\s*$/i, "");
  s = s.replace(/\s+[\d.,]+\s*€\s*[\d.,]+\s*€\s*$/i, "");

  const dashMevcut = s.match(/^(.+?)\s+-\s+-\s+(\d+)\s+mevcut\s*$/i);
  if (dashMevcut) {
    return { ad: dashMevcut[1].trim(), adet: parseInt(dashMevcut[2], 10) || 1 };
  }

  const brandMevcut = s.match(/^(.+?)\s+-\s+(\S+)\s+(\d+)\s+mevcut\s*$/i);
  if (brandMevcut) {
    return {
      ad: `${brandMevcut[1].trim()} - ${brandMevcut[2]}`,
      adet: parseInt(brandMevcut[3], 10) || 1,
    };
  }

  const plainMevcut = s.match(/^(.+?)\s+(\d+)\s+mevcut\s*$/i);
  if (plainMevcut) {
    return { ad: plainMevcut[1].trim(), adet: parseInt(plainMevcut[2], 10) || 1 };
  }

  const brandQty = s.match(/^(.+?)\s+([a-z][\w.-]{2,})\s+(\d+)\s*$/i);
  if (brandQty && !/katli|demonte|portashelf|karyer/i.test(brandQty[2])) {
    return {
      ad: brandQty[1].trim(),
      adet: parseInt(brandQty[3], 10) || 1,
    };
  }

  const qtyBrand = s.match(/^(.+?)\s+(\d+)\s+([a-z][\w.-]{2,})\s*$/i);
  if (qtyBrand) {
    return {
      ad: qtyBrand[1].trim(),
      adet: parseInt(qtyBrand[2], 10) || 1,
    };
  }

  const trailingQty = s.match(/^(.+?)\s+(\d+)\s*$/);
  if (trailingQty) {
    return {
      ad: trailingQty[1].trim(),
      adet: parseInt(trailingQty[2], 10) || 1,
    };
  }

  return { ad: s, adet: 1 };
}

function splitAdOlcu(rawAd: string): { ad: string; olcu?: string } {
  const s = rawAd.trim();
  const olcuMatch = s.match(OLCU_RE);
  if (!olcuMatch || olcuMatch.index == null) return { ad: s };

  const olcu = olcuMatch[0].replace(/,/g, ".");
  const ad = `${s.slice(0, olcuMatch.index).trim()} ${s.slice(olcuMatch.index! + olcuMatch[0].length).trim()}`
    .replace(/\s+-\s+-\s*$/i, "")
    .replace(/\s+-\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return { ad: ad || s, olcu };
}

function normalizeProformaBlob(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/(\d+)mevcut/gi, "$1 mevcut")
    // pdf-parse: "K1İSTİF", "C1PANEL" — poz ile tanım bitişik (boşluk yok)
    .replace(
      /([ACDFK]\d{1,2}(?:A|B)?)(?=[İIŞÇĞÖÜA-Z])/g,
      (m) => `${m} `,
    )
    .trim();
}

/** D7 + BULAŞIK gibi yanlış D7B poz birleşmesini düzelt */
function repairPozSuffix(poz: string, body: string): { poz: string; body: string } {
  if (/^[CDFK]\d{1,2}B$/i.test(poz) && /^[A-ZİÇĞÖÜŞa-z]/.test(body)) {
    return { poz: poz.slice(0, -1), body: `${poz.slice(-1)}${body}` };
  }
  return { poz, body };
}

function splitProformaBlocks(blob: string): Array<{ poz: string; body: string }> {
  const matches = [...blob.matchAll(/([ACDFK]\d{1,2}(?:A|B)?)\s+/gi)];
  const blocks: Array<{ poz: string; body: string }> = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const poz = m[1].toUpperCase();
    const start = (m.index ?? 0) + m[0].length;
    const end =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? blob.length)
        : blob.length;
    const body = blob.slice(start, end).trim();
    if (body.length > 2) blocks.push({ poz, body });
  }
  return blocks;
}

function parseProformaText(text: string): ListePdfKalem[] {
  const out: ListePdfKalem[] = [];
  const seen = new Set<string>();
  const blob = normalizeProformaBlob(text);

  for (let { poz, body } of splitProformaBlocks(blob)) {
    if (seen.has(poz)) continue;
    ({ poz, body } = repairPozSuffix(poz, body));

    const { ad: rawAd, adet } = parseAdetAndBody(body);
    const { ad, olcu } = splitAdOlcu(rawAd);
    if (!ad || ad.length < 2) continue;

    seen.add(poz);
    out.push({
      poz,
      ham_isim: repairPfosDisplayText(ad),
      tip_kodu: "",
      kategori: bolumAdFromPoz(poz),
      adet,
      olcu,
    });
  }

  return out;
}

/** SKTÜRK/EQUSTO proforma PDF → kalemler (yeterli poz satırı yoksa null) */
export async function parseProformaPdfBuffer(
  buffer: Buffer | ArrayBuffer,
): Promise<ListePdfKalem[] | null> {
  const buf = Buffer.isBuffer(buffer)
    ? buffer
    : Buffer.from(buffer);
  const parsed = await pdf(buf);
  const text = String(parsed.text ?? "");
  const kalemler = parseProformaText(text);
  return kalemler.length >= 5 ? kalemler : null;
}
