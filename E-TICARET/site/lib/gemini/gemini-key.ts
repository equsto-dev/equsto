/** Runtime env — standalone build boş string gömmesin diye köşeli parantez */
export function readGeminiApiKey(): string {
  return String(process.env["GEMINI_API_KEY"] || "").trim();
}

export function readGeminiVisionModel(): string {
  return (
    process.env["GEMINI_VISION_MODEL"]?.trim() ||
    process.env["GEMINI_MODEL"]?.trim() ||
    "gemini-2.5-flash"
  );
}

export function isGeminiConfigured(): boolean {
  const k = readGeminiApiKey();
  return k.startsWith("AIza") || k.startsWith("AQ.");
}
