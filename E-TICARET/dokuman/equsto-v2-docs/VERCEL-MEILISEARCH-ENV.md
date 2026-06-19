# Meilisearch env (eski — Vercel / Cloud)

**Bu doküman artık geçerli değil.** Canlı arama Hetzner’da self-hosted Meilisearch kullanır; Vercel veya Meilisearch Cloud gerekmez.

Güncel kurulum:

- [`MEILISEARCH.md`](MEILISEARCH.md) — yerel + canlı
- [`HETZNER-DEPLOY.md`](HETZNER-DEPLOY.md) — sunucu env (`MEILISEARCH_HOST=http://meilisearch:7700`)

`MEILISEARCH_*` değişkenleri yalnızca `.env.local` (geliştirme) ve Hetzner `.env.production` içinde tanımlanır.
