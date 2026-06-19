# Equsto v2 — Sprint 0

Yeni `equsto.com` omurgası. **Korunan:** `admin.html`, PFOS, BESOS/Bar Design (statik `public/`).

## Hızlı başlangıç

**GitHub + Supabase:** kök [`docs/GITHUB-SUPABASE.md`](../docs/GITHUB-SUPABASE.md)  
**Sıradaki (GitHub + Vercel):** [`docs/KURULUM-3-GITHUB-VERCEL.md`](docs/KURULUM-3-GITHUB-VERCEL.md)

```bash
cd equsto-v2
cp .env.example .env.local
# Supabase DATABASE_URL + DIRECT_URL doldur

npm install
npm run sync:legacy    # admin + PFOS + BESOS dosyaları
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

- Mağaza: http://localhost:3000
- PFOS: http://localhost:3000/pfos
- BESOS: http://localhost:3000/besos
- Admin: http://localhost:3000/admin.html

## Admin API (env gelene kadar çalışır)

```powershell
cd equsto-v2
npm run admin:config    # public/admin-config.js → /api tabanı
npm run dev
# http://localhost:3000/admin.html  (yerel Bearer: equsto2025)
```

`GET /api/urunler` → `{ success: true, data: [...] }` — kaynak: `public/data/ekipmanlar.json` (legacy katalog).

`EQUSTO_ADMIN_BEARER` production'da zorunlu; `admin-config.js` git'e girmez.

| Endpoint | Açıklama |
|----------|----------|
| `GET/POST /api/urunler` | Ürün listesi / oluşturma |
| `GET /api/fiyatlar` | Legacy `fiyatlar.json` veya DB |
| `GET /api/vitrin-homepage` | Legacy vitrin JSON |
| `GET /api/search?q=` | Meilisearch |
| `GET/POST /api/proje-akis` | Stub (Sprint 2) |

## Sizin tarafınızda (briefing)

1. **Supabase** — Frankfurt, pooling + direct URL
2. **Meilisearch** — yerel Docker veya Hetzner (`docs/MEILISEARCH.md`)
3. **Hetzner** — `docker compose` + env (`MEILISEARCH_*` sunucuda)

## Kilitler

- Sprint 0’da renk/marka kimliği yok (nötr border).
- `admin.html` UI yeniden yazılmaz.
- Ürün akışı: DRAFT → insan onayı → PUBLISHED.
