/** Meilisearch bağlantı hatalarında Türkçe yönlendirme (Cloud instance silinmiş / host eski). */
export function printMeiliConnectionHint(host, message) {
  const msg = String(message || "");
  if (!msg.includes("no Route matched")) return false;

  console.error(`
[meili] Meilisearch Cloud instance erişilemiyor (host artık geçerli değil).
  Host: ${host}

Doğrulama:
  curl.exe "${host}/health"
  Beklenen: {"status":"available"}
  Şu an: 404 + "no Route matched with those values" → proje silinmiş, süresi dolmuş veya URL değişmiş.

Çözüm:
  1. https://www.meilisearch.com/cloud → proje durumu Running olana kadar bekleyin
  2. Settings → Host URL + Admin API Key kopyalayın
  3. equsto-v2/.env.local → MEILISEARCH_HOST + MEILISEARCH_MASTER_KEY güncelleyin
  4. Vercel → Settings → Environment Variables → aynı iki değişkeni güncelleyin
  5. npm run search:health  →  npm run search:index
  6. Vercel → Deployments → Redeploy (Production)

İndeks adı: equsto_products (MEILISEARCH_INDEX)
Detay: docs/MEILISEARCH.md
`);
  return true;
}
