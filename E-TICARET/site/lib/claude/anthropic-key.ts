/**
 * Next.js standalone build `process.env.ANTHROPIC_API_KEY` ifadesini
 * derleme anında boş string'e gömebiliyor. Köşeli parantez runtime okur.
 */
export function readAnthropicApiKey(): string {
  return String(process.env["ANTHROPIC_API_KEY"] || "").trim();
}
