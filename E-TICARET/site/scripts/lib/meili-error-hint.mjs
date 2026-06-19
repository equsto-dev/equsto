/** Meilisearch bağlantı hatalarında Türkçe yönlendirme. */
export function printMeiliConnectionHint(host, message) {
  const msg = String(message || "");
  if (!msg.includes("no Route matched")) return false;

  console.error(`
[meili] Meilisearch erişilemiyor (host geçersiz veya servis kapalı).
  Host: ${host}

Doğrulama:
  curl.exe "${host}/health"
  Beklenen: {"status":"available"}
  Şu an: 404 + "no Route matched with those values" → proje silinmiş, süresi dolmuş veya URL değişmiş.

Çözüm:
  1. Hetzner: docker compose ps → meilisearch Running olmalı
  2. .env.production → MEILISEARCH_HOST=http://meilisearch:7700
  3. docker compose --env-file .env.production up -d meilisearch app
  4. npm run search:health  →  npm run search:index (sunucuda veya yerelde)
  5. Yerel: docker compose -f docker-compose.meilisearch.yml up -d

İndeks adı: equsto_products (MEILISEARCH_INDEX)
Detay: docs/MEILISEARCH.md
`);
  return true;
}
