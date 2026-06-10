/** Anthropic API hata metinlerini kullanıcı dostu mesaja çevir */
export function anthropicErrorMessage(httpStatus: number, bodyText: string): string {
  if (/credit balance is too low/i.test(bodyText)) {
    return (
      "Bu API anahtarına bağlı Anthropic hesabında kullanılabilir kredi yok. " +
      "console.anthropic.com → Settings → API Keys ile .env.local içindeki ANTHROPIC_API_KEY'in " +
      "kredi yüklediğiniz organizasyona ait olduğunu doğrulayın. " +
      "(Tek liste ~5$ değildir; bakiye sıfırsa en küçük istek bile reddedilir.)"
    );
  }
  if (/not_found_error/i.test(bodyText) && /model:/i.test(bodyText)) {
    return "Anthropic modeli bulunamadı — ANTHROPIC_MODEL=claude-sonnet-4-6 deneyin.";
  }
  if (/invalid x-api-key|authentication_error/i.test(bodyText)) {
    return "ANTHROPIC_API_KEY geçersiz — console.anthropic.com'dan yeni anahtar oluşturun.";
  }
  return `Anthropic HTTP ${httpStatus}: ${bodyText.slice(0, 400)}`;
}
