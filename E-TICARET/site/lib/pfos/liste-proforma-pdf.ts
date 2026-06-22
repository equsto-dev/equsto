/**
 * SKTÜRK / Equsto tarzı proforma PDF → yapılandırılmış satırlar (Claude'sız).
 * Çok satırlı düzen: poz+tanım, ölçü, marka, adet/fiyat satırı.
 */

// pdf-parse index.js yerel test modu açar — doğrudan lib kullan
import pdf from "pdf-parse/lib/pdf-parse.js";
import type { ListePdfKalem } from "@/lib/pfos/liste-pdf-analiz";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";

const SECTION_STOP_RE =
  /^(toplam|iskonto|genel\s*toplam|banka\s*hesap|şartlar|sktürk\s*endüstriyel)/i;
const OLCU_RE =
  /^(\d{2,}(?:[.,]\d+)?(?:\*\d{2,}(?:[.,]\d+)?){0,3}(?:\/\d{2,})?)$/;

const BOLUM_BY_POZ: Record<string, string> = {
  K: "kuru depo",
  C: "panel tip soğuk oda",
  F: "panel tip derin dondurucu oda",
  A: "sıcak mutfak",
  B: "bulaşık yıkama",
  D: "bulaşık yıkama",
  Y: "yer süzgeci",
};

function bolumAdFromPoz(poz: string, section?: string): string {
  if (section?.trim()) return section.trim();
  return BOLUM_BY_POZ[poz.charAt(0).toUpperCase()] ?? "";
}

function parsePozLine(line: string): { poz: string; rest: string } | null {
  const trimmed = line.trim();
  if (!trimmed || SECTION_STOP_RE.test(trimmed)) return null;

  const spaced = trimmed.match(
    /^([ABCDYFGK]\d{1,2}(?:\.[A-Z0-9]+)?[A]?)\s*(.*)$/i,
  );
  if (spaced) {
    const poz = spaced[1].toUpperCase();
    const rest = spaced[2].trim();
    if (rest || /^[ABCDYFGK]\d{1,2}(?:\.[A-Z0-9]+)?[A]?$/i.test(trimmed)) {
      return { poz, rest };
    }
  }

  const glued = trimmed.match(
    /^([ABCDYFGK])(\d{1,2})(?:\.([A-Z0-9]+))?([A-ZİÇĞÖÜŞ].+)$/i,
  );
  if (!glued) return null;

  let poz = `${glued[1].toUpperCase()}${glued[2]}`;
  if (glued[3]) poz += `.${glued[3]}`;
  return { poz, rest: glued[4].trim() };
}

function parseEurNumber(raw: string): number | null {
  const s = String(raw ?? "")
    .replace(/[^\d.,]/g, "")
    .trim();
  if (!s) return null;
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    const n = parseFloat(s.replace(/\./g, ""));
    return Number.isFinite(n) ? n : null;
  }
  if (s.includes(",")) {
    const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parsePriceLine(line: string): {
  adet: number;
  birim_fiyat_eur: number | null;
  mevcut: boolean;
} {
  const s = line.trim();
  if (/müşteri\s*temini|musteri\s*temini/i.test(s)) {
    const adetM = s.match(/^(\d{1,2})/);
    return {
      adet: adetM ? parseInt(adetM[1], 10) || 1 : 1,
      birim_fiyat_eur: null,
      mevcut: true,
    };
  }

  const parts = s.split("€").map((p) => p.trim());
  if (parts.length < 2) {
    const trailingQty = s.match(/(\d{1,2})\s*$/);
    return {
      adet: trailingQty ? parseInt(trailingQty[1], 10) || 1 : 1,
      birim_fiyat_eur: null,
      mevcut: false,
    };
  }

  const fused = parts[0].replace(/\s/g, "");
  const toplam = parseEurNumber(parts[1]);

  for (let adet = 1; adet <= 99; adet++) {
    const prefix = String(adet);
    if (!fused.startsWith(prefix)) continue;
    const birim = parseEurNumber(fused.slice(prefix.length));
    if (birim == null || birim <= 0) continue;
    if (toplam != null && Math.abs(birim * adet - toplam) < 0.05) {
      return { adet, birim_fiyat_eur: birim, mevcut: false };
    }
    if (adet === 1 && toplam != null && Math.abs(birim - toplam) < 0.05) {
      return { adet: 1, birim_fiyat_eur: birim, mevcut: false };
    }
  }

  const birimFallback = parseEurNumber(parts[1]);
  return {
    adet: 1,
    birim_fiyat_eur: birimFallback,
    mevcut: false,
  };
}

function isOlcuLine(line: string): boolean {
  const s = line.trim();
  return s === "-" || OLCU_RE.test(s);
}

function isPriceLine(line: string): boolean {
  const s = line.trim();
  return /€/.test(s) || /müşteri\s*temini|musteri\s*temini/i.test(s);
}

function isLikelyMarka(line: string): boolean {
  const s = line.trim();
  if (!s || s === "-") return true;
  if (isOlcuLine(s) || isPriceLine(s) || parsePozLine(s)) return false;
  return s.length <= 40 && !/^\d/.test(s);
}

function cleanTanim(raw: string): string {
  return repairPfosDisplayText(raw.replace(/\s+/g, " ").trim());
}

function parseProformaLines(lines: string[]): ListePdfKalem[] {
  const out: ListePdfKalem[] = [];
  const seen = new Set<string>();
  let section = "";
  let started = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (started && SECTION_STOP_RE.test(line)) break;

    const pozHit = parsePozLine(line);
    if (!pozHit) {
      if (
        line.length < 40 &&
        !isOlcuLine(line) &&
        !isPriceLine(line) &&
        !/^[A-Z]{2,}/.test(line)
      ) {
        section = line;
      }
      continue;
    }

    const poz = pozHit.poz;
    if (seen.has(poz)) continue;
    started = true;

    let tanim = pozHit.rest;
    let cursor = i + 1;
    if (!tanim && lines[cursor]) {
      tanim = lines[cursor].trim();
      cursor++;
    }
    if (!tanim) continue;

    const olcuLine = lines[cursor]?.trim() ?? "";
    let olcu: string | undefined;
    let markaLine = "";
    let priceLine = "";

    if (isOlcuLine(olcuLine)) {
      olcu = olcuLine === "-" ? undefined : olcuLine;
      markaLine = lines[cursor + 1]?.trim() ?? "";
      priceLine = lines[cursor + 2]?.trim() ?? "";
      cursor += 3;
    } else if (isLikelyMarka(olcuLine)) {
      markaLine = olcuLine;
      priceLine = lines[cursor + 1]?.trim() ?? "";
      cursor += 2;
    } else if (olcuLine && !parsePozLine(olcuLine)) {
      tanim = `${tanim} ${olcuLine}`.trim();
      markaLine = lines[cursor + 1]?.trim() ?? "";
      priceLine = lines[cursor + 2]?.trim() ?? "";
      cursor += 3;
    } else {
      cursor++;
    }

    const price = parsePriceLine(priceLine);
    const marka =
      markaLine && markaLine !== "-" ? markaLine.trim() : undefined;

    seen.add(poz);
    out.push({
      poz,
      ham_isim: cleanTanim(tanim),
      tip_kodu: "",
      kategori: bolumAdFromPoz(poz, section),
      adet: price.adet,
      olcu,
      marka,
      birim_fiyat_eur: price.birim_fiyat_eur,
      mevcut: price.mevcut,
    });

    i = cursor - 1;
  }

  return out;
}

function parseProformaText(text: string): ListePdfKalem[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const lineParsed = parseProformaLines(lines);
  if (lineParsed.length >= 5) return lineParsed;

  return parseProformaBlobFallback(text);
}

/** Eski tek satır blob ayrıştırıcı — yedek */
function parseProformaBlobFallback(text: string): ListePdfKalem[] {
  const blob = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/(\d+)mevcut/gi, "$1 mevcut")
    .replace(
      /([ABCDYFGK]\d{1,2}(?:\.\d+)?[A-Z]?)(?=[İIŞÇĞÖÜA-Z])/g,
      (m) => `${m} `,
    )
    .trim();

  const matches = [...blob.matchAll(/([ABCDYFGK]\d{1,2}(?:\.\d+)?[A-Z]?)\s+/gi)];
  const out: ListePdfKalem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const poz = m[1].toUpperCase();
    if (seen.has(poz)) continue;
    const start = (m.index ?? 0) + m[0].length;
    const end =
      i + 1 < matches.length
        ? (matches[i + 1].index ?? blob.length)
        : blob.length;
    const body = blob.slice(start, end).trim();
    if (body.length < 2) continue;
    seen.add(poz);
    out.push({
      poz,
      ham_isim: cleanTanim(body),
      tip_kodu: "",
      kategori: bolumAdFromPoz(poz),
      adet: 1,
    });
  }

  return out;
}

/** SKTÜRK/EQUSTO proforma PDF → kalemler (yeterli poz satırı yoksa null) */
export async function parseProformaPdfBuffer(
  buffer: Buffer | ArrayBuffer,
): Promise<ListePdfKalem[] | null> {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const parsed = await pdf(buf);
  const text = String(parsed.text ?? "");
  const kalemler = parseProformaText(text);
  return kalemler.length >= 5 ? kalemler : null;
}
