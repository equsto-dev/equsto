/** Anthropic API hata metinlerini kullanıcı dostu mesaja çevir */
export function isAnthropicQuotaError(bodyText: string): boolean {
  return /usage limits|rate_limit|too many requests|credit balance is too low/i.test(
    bodyText,
  );
}

export function anthropicErrorMessage(httpStatus: number, bodyText: string): string {
  if (isAnthropicQuotaError(bodyText)) {
    const until = bodyText.match(/regain access on (\d{4}-\d{2}-\d{2})/i);
    if (until) {
      return `Claude kotası dolu (yenileme: ${until[1]}). Yerel PDF okuma veya Excel deneyin.`;
    }
    return "Claude kotası geçici olarak dolu. Yerel PDF okuma veya Excel deneyin.";
  }
  if (/not_found_error/i.test(bodyText) && /model:/i.test(bodyText)) {
    return "Anthropic modeli bulunamadı — ANTHROPIC_MODEL=claude-sonnet-4-6 deneyin.";
  }
  if (/invalid x-api-key|authentication_error/i.test(bodyText)) {
    return "ANTHROPIC_API_KEY geçersiz — console.anthropic.com'dan yeni anahtar oluşturun.";
  }
  return `Görsel analiz servisi yanıt vermedi (HTTP ${httpStatus}).`;
}
