import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { cleanProformaTanim } from "./sanitize-tanim";
import type { ParsedItem } from "./types";

export const PROFORMA_PARSE_PROMPT = `Bu bir mutfak ekipmanı teklif/proforma listesi PDF'i.
Tüm ürün kalemlerini JSON dizisi olarak çıkar.

KURALLAR:
- Sadece ürün satırlarını al. Bölüm başlıkları (kuru depo, sıcak mutfak vb.) ürün değil — bolum alanına yaz.
- "mevcut" yazıyorsa o kalem müşteride zaten var, mevcut: true yap.
- Ölçü yoksa boş string bırak.
- Marka yoksa veya "-" Equsto kendi önerdiği markayla fiyalandırsın.
- Adet sayısal olsun.
- tanim = yalnızca ekipman adı (BÜYÜK HARF). Fiyat (€/TL), "sktürk", bölüm adı, marka kodu tanim içine YAZMA.
- marka_orijinal = satırdaki marka (atalay, öztiryakiler, portashelf, equsto vb.).

JSON formatı (başka hiçbir şey yazma, sadece JSON döndür):
[
  {
    "poz": "A1",
    "tanim": "MAKE-UP DOLABI, 3*2 ÇEKMECELİ, YÜKSEK BORULU",
    "olcu": "140*70*85/142",
    "adet": 1,
    "marka_orijinal": "sktürk",
    "bolum": "sıcak mutfak",
    "mevcut": false
  }
]`;

export function cleanLlmJson(raw: string): string {
  return raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

export function tryParseJsonArray(text: string): unknown[] | null {
  if (!text) return null;
  const cleaned = cleanLlmJson(text);
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    const j = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
    return Array.isArray(j) ? j : null;
  } catch {
    return null;
  }
}

export function mapProformaParsedRows(raw: unknown): ParsedItem[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedItem[] = [];
  for (const x of raw) {
    const row = x as Record<string, unknown>;
    const tanim = cleanProformaTanim(
      repairPfosDisplayText(String(row.tanim ?? row.ham_isim ?? "").trim()),
    );
    const poz = String(row.poz ?? "").trim();
    if (!tanim || !poz) continue;
    const adetRaw = row.adet;
    const adet =
      typeof adetRaw === "number" && adetRaw > 0
        ? Math.round(adetRaw)
        : parseInt(String(adetRaw ?? "1"), 10) || 1;
    const markaRaw = row.marka_orijinal ?? row.marka ?? "";
    const marka = String(markaRaw).trim();
    const marka_orijinal = marka && marka !== "-" ? marka : "";
    out.push({
      poz,
      tanim,
      olcu: String(row.olcu ?? "").trim(),
      adet,
      marka_orijinal,
      bolum: String(row.bolum ?? "").trim(),
      mevcut: row.mevcut === true,
    });
  }
  return out;
}
