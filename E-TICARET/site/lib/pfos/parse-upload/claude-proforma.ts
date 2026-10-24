/**
 * Proforma PDF → Anthropic SDK → normalize ParsedItem[].
 */

import Anthropic from "@anthropic-ai/sdk";
import { anthropicErrorMessage } from "@/lib/claude/anthropic-errors";
import { readAnthropicApiKey } from "@/lib/claude/anthropic-key";
import {
  mapProformaParsedRows,
  PROFORMA_PARSE_PROMPT,
  tryParseJsonArray,
} from "./proforma-llm-shared";
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

/** PDF buffer → Claude → ParsedItem[] */
export async function parseWithClaude(
  pdfBuffer: ArrayBuffer,
  opts?: { notlar?: string },
): Promise<ParsedItem[]> {
  const apiKey = readAnthropicApiKey();
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
              text: PROFORMA_PARSE_PROMPT + extra,
            },
          ],
        },
      ],
    });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    const body = String(err.message ?? e);
    throw new Error(anthropicErrorMessage(err.status ?? 502, body));
  }

  const raw =
    response.content.find((b) => b.type === "text")?.type === "text"
      ? (response.content.find((b) => b.type === "text") as { text: string }).text
      : "[]";

  const arr = tryParseJsonArray(raw);
  if (!arr) {
    console.error("[parse-upload] Claude JSON parse hatası:", raw.slice(0, 500));
    throw new Error("Claude geçerli JSON dizi döndürmedi.");
  }

  const rows = mapProformaParsedRows(arr);
  if (!rows.length) {
    throw new Error("PDF'den kalem çıkarılamadı. Dosya formatını kontrol edin.");
  }
  return rows;
}

/** @deprecated parseWithClaude kullanın */
export const extractProformaKalemlerFromPdf = parseWithClaude;
