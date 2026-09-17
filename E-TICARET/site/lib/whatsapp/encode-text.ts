/**
 * wa.me / web.whatsapp `text` parametresi.
 * Boşluk %20 değil `+` — e-posta ve WhatsApp metninde okunaklı kalsın.
 * Satır sonu ve Türkçe harfler encodeURIComponent ile kalır (tıklanınca doğru açılır).
 */
export function encodeWaMeQueryText(text: string): string {
  return encodeURIComponent(String(text || "")).replace(/%20/g, "+");
}
