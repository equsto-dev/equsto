# Equsto canlı mimari (Hetzner + AWS S3 + Supabase)

Onaylanan dağılım — **2026-05-30** (arama: Hetzner Docker, 2026-06 güncellemesi)

```
equsto.com (Hetzner — Docker)
├── Next.js + API routes + Caddy (HTTPS)
├── Meilisearch (Docker, ücretsiz)            → arama index
├── ekipmanlar.json, geo, i18n, küçük JSON  → Git + deploy
└── Görseller + PDF (~2 GB şimdi, ~20 GB hedef)
    → AWS S3 (equsto-assets) → CloudFront → NEXT_PUBLIC_ASSET_CDN_URL

Supabase (gmnbhmwcmxukebulqwbn)
└── Postgres only (Prisma) — admin ürün, müşteri lead, PFOS eşleme, TCMB cron
    Auth / Storage kullanılmıyor
```

## Rol ayrımı

| Katman | Teknoloji | Ne tutulur |
|--------|-----------|------------|
| Uygulama | Hetzner Docker | `app/`, `lib/`, legacy JS, API |
| Arama | Meilisearch (self-hosted) | Ürün index (`equsto_products`) |
| Statik medya | **AWS S3 + CloudFront** | `public/images/`, büyük PDF klasörleri |
| Veritabanı | **Supabase Postgres** | `Product`, `Musteri`, PFOS tabloları |
| Mağaza vitrin (şimdilik) | `public/data/ekipmanlar.json` | Git — ileride DB'ye kademeli geçiş |

## Uygulama fazları

### Faz A — Tamamlandı
Repodan mirror/arşiv güvenli çıkarma (`git rm --cached`). Bkz. `docs/FAZ-A-GUVENLIK.md`.

### Faz B — AWS CDN (tamamlandı / sürdürülür)
1. S3 bucket + CloudFront → `docs/FAZ-B-AWS.md`
2. `npm run assets:s3:dry-run` → `npm run assets:s3:sync` (AWS profile `equsto`)
3. Hetzner `.env.production`: `NEXT_PUBLIC_ASSET_CDN_URL=https://….cloudfront.net`
4. `npm run assets:cdn:verify`

### Faz C — Supabase Postgres
1. Dashboard → şifre sıfırla → URI kopyala
2. `.env.local` + `copy .env.local .env`
3. `npx prisma migrate deploy` + `npm run db:verify`
4. Aynı URI'ler Vercel env → Redeploy
5. Bkz. `docs/SUPABASE-KURULUM.md`

### Faz D — (ileride)
- Katalog satırlarını `ekipmanlar.json` → Supabase `Product` migrasyonu
- Git history shrink (`git filter-repo`) — ayrı, dikkatli adım

## Ortam değişkenleri özeti

| Değişken | Nerede | Açıklama |
|----------|--------|----------|
| `DATABASE_URL` / `DIRECT_URL` | Vercel + `.env.local` | Supabase pooler |
| `NEXT_PUBLIC_ASSET_CDN_URL` | Vercel + `.env.local` | CloudFront kök URL |
| `AWS_S3_BUCKET` | Yalnızca yerel upload | `equsto-assets` |
| `AWS_REGION` | Yerel upload | `eu-central-1` önerilir |
| `MEILISEARCH_*` | Hetzner `.env.production` | Arama (self-hosted Docker) |
| `EQUSTO_ADMIN_BEARER` | Vercel | Admin API |

## Güvenlik

- Upload / untrack scriptleri **diskten silmez**.
- CDN doğrulanmadan Git untrack yapmayın.
- Supabase şifresini repoya commit etmeyin.

## İlgili dokümanlar

- `docs/FAZ-B-AWS.md` — S3 + CloudFront kurulum
- `docs/SUPABASE-KURULUM.md` — Prisma migrate
- `docs/VERCEL-ENV-VE-DOMAIN.md` — Vercel env listesi
- `docs/ASSET-CLASSIFICATION-STEP2.md` — hangi dosya nereye
