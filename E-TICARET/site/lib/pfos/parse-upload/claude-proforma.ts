/**
 * Proforma PDF → Anthropic SDK → normalize ParsedItem[].
 */

import Anthropic from "@anthropic-ai/sdk";
import { anthropicErrorMessage } from "@/lib/claude/anthropic-errors";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { cleanProformaTanim } from "./sanitize-tanim";
import type { ParsedItem } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const RETIRED = new Set([
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-20240620",
  "claude-3-7-sonnet-20250219",
  "claude-sonnet-4-20250514",
]);

function resolveModel(): string {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || RETIRED.has(raw)) return DEFAULT_MODEL;
  return raw;
}

const PARSE_PROMPT = `Bu bir mutfak ekipmanı teklif/proforma listesi PDF'i.
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

function cleanClaudeJson(raw: string): string {
  return raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

function mapParsedRows(raw: unknown): ParsedItem[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedItem[] = [];
  for (const x of raw) {
    const row = x as Record<string, unknown>;
    const tanim = cleanProformaTanim(
      repairPfosDisplayText(
        String(row.tanim ?? row.ham_isim ?? "").trim(),
      ),
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
    const marka_orijinal =
      marka && marka !== "-" ? marka : "";
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

/** PDF buffer → Claude → ParsedItem[] */
export async function parseWithClaude(
  pdfBuffer: ArrayBuffer,
  opts?: { notlar?: string },
): Promise<ParsedItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY tanımlı değil — Vercel Environment Variables'a ekleyin.",
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const base64 = Buffer.from(pdfBuffer).toString("base64");
  const extra = opts?.notlar?.trim()
    ? `\n\nEk notlar:\n---\n${opts.notlar.trim()}\n---`
    : "";

  let response;
  try {
    response = await anthropic.messages.create({
    model: resolveModel(),
    max_tokens: Math.min(
      16384,
      Math.max(4096, Number(process.env.ANTHROPIC_IMPORT_MAX_TOKENS || 8192) || 8192),
    ),
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: PARSE_PROMPT + extra,
          },
        ],
      },
    ],
  });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    const body = String(err.message ?? e);
    throw new Error(
      anthropicErrorMessage(err.status ?? 502, body),
    );
  }

  const raw =
    response.content.find((b) => b.type === "text")?.type === "text"
      ? (response.content.find((b) => b.type === "text") as { text: string }).text
      : "[]";

  const cleaned = cleanClaudeJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[parse-upload] Claude JSON parse hatası:", cleaned.slice(0, 500));
    throw new Error("Claude geçerli JSON dizi döndürmedi.");
  }

  const rows = mapParsedRows(parsed);
  if (!rows.length) {
    throw new Error("PDF'den kalem çıkarılamadı. Dosya formatını kontrol edin.");
  }
  return rows;
}

/** @deprecated parseWithClaude kullanın */
export const extractProformaKalemlerFromPdf = parseWithClaude;
