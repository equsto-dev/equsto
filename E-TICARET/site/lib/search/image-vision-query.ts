import Anthropic from "@anthropic-ai/sdk";
import { anthropicErrorMessage } from "@/lib/claude/anthropic-errors";
import { IMAGE_VISION_PROMPT } from "@/lib/search/image-vision-prompt";
import { parseVisionModelOutput } from "@/lib/search/parse-vision-output";

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

function visionMediaType(mime: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const m = mime.toLowerCase();
  if (m === "image/png") return "image/png";
  if (m === "image/gif") return "image/gif";
  if (m === "image/webp") return "image/webp";
  return "image/jpeg";
}

/** Görsel → Türkçe katalog arama ifadesi (Claude → Gemini yedek). */
export async function extractImageSearchQuery(
  imageBuffer: ArrayBuffer,
  mimeType: string,
): Promise<ImageVisionQuery> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (apiKey) {
    try {
      const anthropic = new Anthropic({ apiKey });
      const base64 = Buffer.from(imageBuffer).toString("base64");
      const media_type = visionMediaType(mimeType);
      const response = await anthropic.messages.create({
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
      const raw =
        response.content.find((b) => b.type === "text")?.type === "text"
          ? (response.content.find((b) => b.type === "text") as { text: string })
              .text
          : "{}";
      return parseVisionModelOutput(raw);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const msg = anthropicErrorMessage(
        err.status ?? 502,
        String(err.message ?? e),
      );
      if (/credit|too low|invalid|401|403|authentication/i.test(msg)) {
        console.warn("[image-vision] Claude → Gemini:", msg.slice(0, 120));
        const { extractImageSearchQueryGemini } = await import(
          "@/lib/search/image-gemini-query"
        );
        return extractImageSearchQueryGemini(imageBuffer, mimeType);
      }
      throw new Error(msg);
    }
  }

  const { extractImageSearchQueryGemini } = await import(
    "@/lib/search/image-gemini-query"
  );
  try {
    return await extractImageSearchQueryGemini(imageBuffer, mimeType);
  } catch {
    throw new Error("Görsel arama şu an yapılandırılmamış.");
  }
}
