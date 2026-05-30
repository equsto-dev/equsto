# Equsto canlı mimari (Vercel + AWS S3 + Supabase)

Onaylanan dağılım — **2026-05-30**

```
equsto.com (Vercel)
├── Next.js + API routes
├── ekipmanlar.json, geo, i18n, küçük JSON  → Git + deploy
├── Meilisearch Cloud                         → arama index
└── Görseller + PDF (~2 GB şimdi, ~20 GB hedef)
    → AWS S3 (equsto-assets) → CloudFront → NEXT_PUBLIC_ASSET_CDN_URL

Supabase (gmnbhmwcmxukebulqwbn)
└── Postgres only (Prisma) — admin ürün, müşteri lead, PFOS eşleme, TCMB cron
    Auth / Storage kullanılmıyor
```

## Rol ayrımı

| Katman | Teknoloji | Ne tutulur |
|--------|-----------|------------|
| Uygulama | Vercel | `app/`, `lib/`, legacy JS, API |
| Statik medya | **AWS S3 + CloudFront** | `public/images/`, büyük PDF klasörleri |
| Veritabanı | **Supabase Postgres** | `Product`, `Musteri`, PFOS tabloları |
| Arama | Meilisearch Cloud | Ürün index (ekipmanlar kaynaklı) |
| Mağaza vitrin (şimdilik) | `public/data/ekipmanlar.json` | Git — ileride DB'ye kademeli geçiş |

## Uygulama fazları

### Faz A — Tamamlandı
Repodan mirror/arşiv güvenli çıkarma (`git rm --cached`). Bkz. `docs/FAZ-A-GUVENLIK.md`.

### Faz B — AWS CDN (sıradaki)
1. S3 bucket + CloudFront → `docs/FAZ-B-AWS.md`
2. `npm run assets:s3:dry-run` → `npm run assets:s3:sync`
3. Vercel: `NEXT_PUBLIC_ASSET_CDN_URL=https://….cloudfront.net`
4. `npm run assets:cdn:verify`
5. CDN OK → `faz-b-untrack-cdn.mjs` (Git'ten görseller, diskte kalır)

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
| `MEILISEARCH_*` | Vercel | Arama |
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
