import Anthropic from "@anthropic-ai/sdk";
import { anthropicErrorMessage } from "@/lib/claude/anthropic-errors";
import { IMAGE_VISION_PROMPT } from "@/lib/search/image-vision-prompt";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const RETIRED = new Set([
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-20240620",
  "claude-3-7-sonnet-20250219",
  "claude-sonnet-4-20250514",
]);

const VISION_PROMPT = IMAGE_VISION_PROMPT;

export type ImageVisionQuery = {
  q: string;
  brand: string;
  model: string;
};

function resolveModel(): string {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || RETIRED.has(raw)) return DEFAULT_MODEL;
  return raw;
}

function cleanJson(raw: string): string {
  return raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

function visionMediaType(mime: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const m = mime.toLowerCase();
  if (m === "image/png") return "image/png";
  if (m === "image/gif") return "image/gif";
  if (m === "image/webp") return "image/webp";
  return "image/jpeg";
}

/** Görsel → Türkçe katalog arama ifadesi (Claude vision). */
export async function extractImageSearchQuery(
  imageBuffer: ArrayBuffer,
  mimeType: string,
): Promise<ImageVisionQuery> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Görsel arama şu an yapılandırılmamış.");
  }

  const anthropic = new Anthropic({ apiKey });
  const base64 = Buffer.from(imageBuffer).toString("base64");
  const media_type = visionMediaType(mimeType);

  let response;
  try {
    response = await anthropic.messages.create({
      model: resolveModel(),
      max_tokens: 256,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type,
                data: base64,
              },
            },
            { type: "text", text: VISION_PROMPT },
          ],
        },
      ],
    });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    throw new Error(anthropicErrorMessage(err.status ?? 502, String(err.message ?? e)));
  }

  const raw =
    response.content.find((b) => b.type === "text")?.type === "text"
      ? (response.content.find((b) => b.type === "text") as { text: string }).text
      : "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanJson(raw)) as Record<string, unknown>;
  } catch {
    const q = String(raw || "")
      .replace(/[{}"\n]/g, " ")
      .trim()
      .slice(0, 120);
    if (!q) throw new Error("Görselden arama ifadesi çıkarılamadı.");
    return { q, brand: "", model: "" };
  }

  const q = String(parsed.q ?? parsed.query ?? "").trim();
  if (!q) throw new Error("Görselden arama ifadesi çıkarılamadı.");

  return {
    q,
    brand: String(parsed.brand ?? "").trim(),
    model: String(parsed.model ?? "").trim(),
  };
}
