import type { ImageVisionQuery } from "@/lib/search/image-vision-query";

function extractJsonObject(text: string): string | null {
  const m = text.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}

function extractQuotedField(text: string, field: string): string {
  const re = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

/** Model çıktısındaki q — markdown/JSON artığı olmamalı. */
export function sanitizeVisionQueryText(q: string): string {
  let s = String(q || "")
    .replace(/```+/g, " ")
    .replace(/\bjson\b/gi, " ")
    .replace(/[{}\[\]"':]/g, " ")
    .replace(/\bq\s*:/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (s.length < 3) {
    throw new Error("Görselden arama ifadesi çıkarılamadı.");
  }
  if (!/[a-zA-ZğüşıöçĞÜŞİÖÇ0-9]{3,}/.test(s)) {
    throw new Error("Görselden arama ifadesi çıkarılamadı.");
  }
  if (/^[\W\d_]+$/.test(s)) {
    throw new Error("Görselden arama ifadesi çıkarılamadı.");
  }
  return s.slice(0, 120);
}

function fromParsedObject(parsed: Record<string, unknown>): ImageVisionQuery {
  const q = sanitizeVisionQueryText(String(parsed.q ?? parsed.query ?? ""));
  return {
    q,
    brand: String(parsed.brand ?? "").trim(),
    model: String(parsed.model ?? "").trim(),
  };
}

/** Claude / Gemini vision metin yanıtı → yapılandırılmış arama ifadesi. */
export function parseVisionModelOutput(raw: string): ImageVisionQuery {
  const text = String(raw || "").trim();
  if (!text) throw new Error("Görselden arama ifadesi çıkarılamadı.");

  const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const blob = extractJsonObject(text) || extractJsonObject(stripped) || stripped;

  const attempts = [blob, stripped, text].filter((v, i, a) => v && a.indexOf(v) === i);
  for (const candidate of attempts) {
    try {
      return fromParsedObject(JSON.parse(candidate) as Record<string, unknown>);
    } catch {
      /* sonraki aday */
    }
  }

  const qFromRegex = extractQuotedField(text, "q") || extractQuotedField(text, "query");
  if (qFromRegex) {
    return fromParsedObject({
      q: qFromRegex,
      brand: extractQuotedField(text, "brand"),
      model: extractQuotedField(text, "model"),
    });
  }

  throw new Error("Görselden arama ifadesi çıkarılamadı.");
}

export function isDisplayableSearchQuery(q: string): boolean {
  const s = String(q || "").trim();
  if (!s || s.length < 3) return false;
  if (/```|json|\{|\}|^\s*q\s*:/i.test(s)) return false;
  return /[a-zA-ZğüşıöçĞÜŞİÖÇ]{3,}/.test(s);
}
