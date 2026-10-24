/**
 * PDF/Excel ekipman listesi — Claude analiz; kredi yoksa Gemini yedek.
 */

import { adminLoginToken } from "@/lib/admin-auth";
import { anthropicErrorMessage } from "@/lib/claude/anthropic-errors";
import { readAnthropicApiKey } from "@/lib/claude/anthropic-key";
import {
  isGeminiConfigured,
  readGeminiApiKey,
  readGeminiVisionModel,
} from "@/lib/gemini/gemini-key";
import { tryParseJsonArray } from "@/lib/pfos/parse-upload/proforma-llm-shared";

export type ImportAnalizRequest = {
  dosya_base64: string;
  dosya_tip: string;
  system_prompt: string;
  user_prompt: string;
};

export type ImportAnalizRow = {
  ham_isim: string;
  tip_kodu: string;
  kategori: string;
  adet: number;
  poz?: string;
  olcu?: string;
};

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
/** Emekli modeller — Vercel env eski kalsa bile yeni modele düş */
const RETIRED_ANTHROPIC_MODELS = new Set([
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-20240620",
  "claude-3-7-sonnet-20250219",
]);

function resolveAnthropicModel(): string {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || RETIRED_ANTHROPIC_MODELS.has(raw)) return DEFAULT_ANTHROPIC_MODEL;
  return raw;
}

const ANTHROPIC_MODEL = resolveAnthropicModel();
const IMPORT_MAX_TOKENS = Math.min(
  64000,
  Math.max(
    4096,
    Number(process.env.ANTHROPIC_IMPORT_MAX_TOKENS || 8192) || 8192,
  ),
);

function proxyBase(): string | null {
  const explicit =
    process.env.CLAUDE_API_PROXY_URL ||
    process.env.EQUSTO_CLAUDE_API_BASE ||
    "";
  if (explicit.trim()) return explicit.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:3001/api";
  }
  return null;
}

/** Claude, Gemini veya yerel proxy hazır mı */
export function isClaudeImportConfigured(): boolean {
  return Boolean(readAnthropicApiKey() || isGeminiConfigured() || proxyBase());
}

export const CLAUDE_IMPORT_MISSING_USER_MSG =
  "Bu liste otomatik okunamadı. Ürün ve adet sütunları olan bir Excel yükleyin.";

function extractTextFromClaude(resp: {
  content?: Array<{ type?: string; text?: string }>;
}): string {
  const blocks = Array.isArray(resp?.content) ? resp.content : [];
  return blocks
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("\n")
    .trim();
}

function isClaudeUnavailableError(msg: string): boolean {
  return /credit balance|too low|invalid.*api.?key|authentication|401|403|ANTHROPIC_API_KEY tanımlı değil/i.test(
    msg,
  );
}

function mapAnalizRows(raw: unknown): ImportAnalizRow[] {
  if (!Array.isArray(raw)) return [];
  const out: ImportAnalizRow[] = [];
  for (const x of raw) {
    const row = x as Record<string, unknown>;
    const ham_isim = String(row.ham_isim ?? row.name ?? "").trim();
    const tip_kodu = String(row.tip_kodu ?? row.tip ?? "").trim();
    if (!ham_isim) continue;
    const adetRaw = row.adet;
    const adet =
      typeof adetRaw === "number" && adetRaw > 0
        ? Math.round(adetRaw)
        : parseInt(String(adetRaw ?? "1"), 10) || 1;
    out.push({
      ham_isim,
      tip_kodu,
      kategori: String(row.kategori ?? row.cat ?? "diger").trim() || "diger",
      adet,
      poz: row.poz != null ? String(row.poz).trim() : undefined,
      olcu:
        row.olcu != null && String(row.olcu).trim()
          ? String(row.olcu).trim()
          : undefined,
    });
  }
  return out;
}

async function anthropicJsonFromMessages(
  system: string,
  userText: string,
  document?: { media_type: string; data: string },
): Promise<unknown[]> {
  const apiKey = readAnthropicApiKey();
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY tanımlı değil — Vercel Environment Variables'a ekleyin.",
    );
  }

  const userContent = document
    ? [
        {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: document.media_type,
            data: document.data,
          },
        },
        { type: "text" as const, text: userText },
      ]
    : userText;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: IMPORT_MAX_TOKENS,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
    signal: AbortSignal.timeout(20 * 60 * 1000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(anthropicErrorMessage(res.status, text));
  }

  let body: { content?: Array<{ type?: string; text?: string }> };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    throw new Error(`Anthropic yanıtı JSON değil: ${text.slice(0, 300)}`);
  }

  const arr = tryParseJsonArray(extractTextFromClaude(body));
  if (!arr) {
    throw new Error(
      "Claude geçerli JSON dizi döndürmedi — dosya okunabilir mi kontrol edin.",
    );
  }
  return arr;
}

async function geminiJsonFromMessages(
  system: string,
  userText: string,
  document?: { media_type: string; data: string },
): Promise<unknown[]> {
  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY tanımlı değil");
  }
  const apiKey = readGeminiApiKey();
  const model = readGeminiVisionModel();
  const parts: Array<Record<string, unknown>> = [];
  if (document?.data) {
    parts.push({
      inline_data: {
        mime_type: document.media_type || "application/pdf",
        data: document.data,
      },
    });
  }
  parts.push({
    text: `${system}\n\n${userText}\n\nYanıt yalnızca JSON dizi olsun.`,
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: Math.min(16384, IMPORT_MAX_TOKENS),
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(180_000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 280)}`);
  }

  let data: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error(`Gemini yanıtı JSON değil: ${text.slice(0, 300)}`);
  }

  const raw =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim() || "";
  const arr = tryParseJsonArray(raw);
  if (!arr) {
    throw new Error(
      "Gemini geçerli JSON dizi döndürmedi — dosya okunabilir mi kontrol edin.",
    );
  }
  return arr;
}

async function fetchDocumentJsonArray(
  req: ImportAnalizRequest,
): Promise<unknown[]> {
  if (readAnthropicApiKey()) {
    try {
      return await anthropicJsonFromMessages(req.system_prompt, req.user_prompt, {
        media_type: req.dosya_tip,
        data: req.dosya_base64,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isGeminiConfigured() && isClaudeUnavailableError(msg)) {
        console.warn("[import-analiz] Claude başarısız → Gemini:", msg.slice(0, 160));
        return geminiJsonFromMessages(req.system_prompt, req.user_prompt, {
          media_type: req.dosya_tip,
          data: req.dosya_base64,
        });
      }
      throw e;
    }
  }

  if (isGeminiConfigured()) {
    return geminiJsonFromMessages(req.system_prompt, req.user_prompt, {
      media_type: req.dosya_tip,
      data: req.dosya_base64,
    });
  }

  const base = proxyBase();
  if (!base) {
    console.error(
      "[import-analiz] Claude/Gemini yok: ANTHROPIC_API_KEY ve GEMINI_API_KEY tanımlı değil",
    );
    throw new Error(CLAUDE_IMPORT_MISSING_USER_MSG);
  }

  const token = adminLoginToken();
  let res: Response;
  try {
    res = await fetch(`${base}/import/analiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(20 * 60 * 1000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Import proxy ulaşılamadı (${base}): ${msg}. Yerelde: npm run api`,
    );
  }

  const text = await res.text();
  let parsed: {
    success?: boolean;
    data?: unknown;
    error?: string;
    raw?: string;
  };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new Error(`Proxy yanıtı okunamadı: ${text.slice(0, 300)}`);
  }

  if (!res.ok || parsed.success === false) {
    throw new Error(
      parsed.error ||
        (parsed.raw ? `Claude: ${parsed.raw.slice(0, 200)}` : null) ||
        `HTTP ${res.status}`,
    );
  }

  if (!Array.isArray(parsed.data)) {
    throw new Error("Dosyadan ekipman kalemi çıkarılamadı.");
  }
  return parsed.data;
}

/** PDF/Excel base64 → ham JSON dizi (özel şema eşlemesi için) */
export async function runImportDocumentJsonArray(
  req: ImportAnalizRequest,
): Promise<unknown[]> {
  return fetchDocumentJsonArray(req);
}

/** Düz metin → ekipman satırları (Excel yedek — document API'den ucuz) */
export async function runImportTextAnaliz(req: {
  system_prompt: string;
  user_prompt: string;
}): Promise<ImportAnalizRow[]> {
  const runMap = async (arr: unknown[]) => {
    const rows = mapAnalizRows(arr);
    if (!rows.length) {
      throw new Error("Dosyadan ekipman kalemi çıkarılamadı.");
    }
    return rows;
  };

  if (readAnthropicApiKey()) {
    try {
      return await runMap(
        await anthropicJsonFromMessages(req.system_prompt, req.user_prompt),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isGeminiConfigured() && isClaudeUnavailableError(msg)) {
        console.warn("[import-analiz] Claude text → Gemini:", msg.slice(0, 160));
        return runMap(
          await geminiJsonFromMessages(req.system_prompt, req.user_prompt),
        );
      }
      throw e;
    }
  }

  if (isGeminiConfigured()) {
    return runMap(
      await geminiJsonFromMessages(req.system_prompt, req.user_prompt),
    );
  }

  const base = proxyBase();
  if (base) {
    return runImportDocumentAnaliz({
      dosya_base64: Buffer.from(req.user_prompt, "utf8").toString("base64"),
      dosya_tip: "text/plain",
      system_prompt: req.system_prompt,
      user_prompt: req.user_prompt,
    });
  }

  console.error(
    "[import-analiz] Claude/Gemini yok (text): API key tanımlı değil ve proxy yok",
  );
  throw new Error(CLAUDE_IMPORT_MISSING_USER_MSG);
}

/** PDF/Excel base64 → ekipman satırları */
export async function runImportDocumentAnaliz(
  req: ImportAnalizRequest,
): Promise<ImportAnalizRow[]> {
  const arr = await fetchDocumentJsonArray(req);
  const rows = mapAnalizRows(arr);
  if (!rows.length) {
    throw new Error("Dosyadan ekipman kalemi çıkarılamadı.");
  }
  return rows;
}
