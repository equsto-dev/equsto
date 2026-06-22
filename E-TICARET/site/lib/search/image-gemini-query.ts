import type { ImageVisionQuery } from "@/lib/search/image-vision-query";
import { IMAGE_VISION_PROMPT } from "@/lib/search/image-vision-prompt";
import { parseVisionModelOutput } from "@/lib/search/parse-vision-output";

/** Görsel → arama ifadesi (Gemini vision, isteğe bağlı yedek). */
export async function extractImageSearchQueryGemini(
  imageBuffer: ArrayBuffer,
  mimeType: string,
): Promise<ImageVisionQuery> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY yok");
  }

  const model = process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.5-flash";
  const base64 = Buffer.from(imageBuffer).toString("base64");
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
            { inline_data: { mime_type: mimeType || "image/jpeg", data: base64 } },
            { text: IMAGE_VISION_PROMPT },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
      },
    }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
  }

  let data: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  try {
    data = JSON.parse(bodyText) as typeof data;
  } catch {
    throw new Error("Gemini yanıtı okunamadı.");
  }

  const raw =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim() || "";

  return parseVisionModelOutput(raw);
}
