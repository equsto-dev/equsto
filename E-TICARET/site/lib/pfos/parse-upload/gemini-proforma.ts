/**
 * Proforma PDF → Gemini → ParsedItem[]
 * Claude kredisi yokken PFOS liste / import yedeği.
 */

import {
  isGeminiConfigured,
  readGeminiApiKey,
  readGeminiVisionModel,
} from "@/lib/gemini/gemini-key";
import {
  mapProformaParsedRows,
  PROFORMA_PARSE_PROMPT,
  tryParseJsonArray,
} from "./proforma-llm-shared";
import type { ParsedItem } from "./types";

function extractGeminiText(data: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}): string {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim() || ""
  );
}

/** PDF buffer → Gemini → ParsedItem[] */
export async function parseWithGemini(
  pdfBuffer: ArrayBuffer,
  opts?: { notlar?: string },
): Promise<ParsedItem[]> {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY tanımlı değil");
  }
  const apiKey = readGeminiApiKey();
  const model = readGeminiVisionModel();
  const base64 = Buffer.from(pdfBuffer).toString("base64");
  const extra = opts?.notlar?.trim()
    ? `\n\nEk notlar:\n---\n${opts.notlar.trim()}\n---`
    : "";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: "application/pdf",
                data: base64,
              },
            },
            { text: PROFORMA_PARSE_PROMPT + extra },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: Math.min(
          16384,
          Math.max(
            4096,
            Number(process.env.GEMINI_IMPORT_MAX_TOKENS || 8192) || 8192,
          ),
        ),
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(180_000),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}: ${bodyText.slice(0, 280)}`);
  }

  let data: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  try {
    data = JSON.parse(bodyText) as typeof data;
  } catch {
    throw new Error("Gemini yanıtı okunamadı.");
  }

  const raw = extractGeminiText(data);
  const arr = tryParseJsonArray(raw);
  if (!arr) {
    console.error("[parse-upload] Gemini JSON hatası:", raw.slice(0, 500));
    throw new Error("Gemini geçerli JSON dizi döndürmedi.");
  }

  const rows = mapProformaParsedRows(arr);
  if (!rows.length) {
    throw new Error("PDF'den kalem çıkarılamadı. Dosya formatını kontrol edin.");
  }
  return rows;
}

export function isGeminiProformaConfigured(): boolean {
  return isGeminiConfigured();
}
