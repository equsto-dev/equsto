# Supabase bölge — Frankfurt (TR’ye yakın)

Equsto Postgres **Frankfurt (`eu-central-1`)** üzerinde çalışır. Supabase’in Türkiye’ye en yakın bölgesi budur (yaklaşık **~40–60 ms** Hetzner Falkenstein ↔ Frankfurt; Tokyo ~250 ms+).

## Aktif proje

| | |
|---|---|
| **Proje ref** | `lxwwbuvbaejtlqmzoykx` |
| **Bölge** | `aws-1-eu-central-1` (Frankfurt) |
| **Dashboard** | https://supabase.com/dashboard/project/lxwwbuvbaejtlqmzoykx |
| **Canlı (Hetzner)** | `.env.production` → `DATABASE_URL` / `DIRECT_URL` |

## Eski proje (Tokyo)

| | |
|---|---|
| **Proje ref** | `gmnbhmwcmxukebulqwbn` |
| **Bölge** | `ap-northeast-1` (Tokyo) |
| **Durum** | Veri Frankfurt’a kopyalandı; **yeni geliştirme/canlı bu projeyi kullanmamalı** |

2026-06 doğrulama: her iki projede de `products=9467`, `brands=23`, `categories=723`.

Tokyo projesini Dashboard’dan **Pause project** yapabilirsiniz (maliyet / karışıklık önleme). Silmeden önce bir hafta Frankfurt’un tek kaynak olduğundan emin olun.

## Yerel geliştirme

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
copy .env.local.template .env.local
# DATABASE_URL / DIRECT_URL → Dashboard Copy (eu-central-1)
copy .env.local .env
npm run db:verify
```

Host satırında `aws-1-eu-central-1.pooler.supabase.com` görünmeli.

## Supabase bölge taşıma (genel)

Supabase **yerinde bölge değiştirmez**. Yeni bölgede proje açıp dump/restore gerekir:

1. Hedef bölgede yeni proje (bizde: Frankfurt)
2. `supabase db dump` / `pg_dump` → restore
3. `npx prisma migrate deploy`
4. Tüm ortamlarda `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_*` güncelle
5. Eski projeyi duraklat

Resmi rehber: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

## Karşılaştırma scripti

```powershell
npm run db:verify
node --import ./scripts/load-env.mjs scripts/compare-supabase-regions.mjs
```

## Env dosyaları

| Dosya | Bölge |
|-------|--------|
| `.env.production` (Hetzner) | Frankfurt ✓ |
| `.env.local` | Frankfurt’a geçirildi |
| `.env.local.template`, `.env.example` | Frankfurt şablonu |

`NEXT_PUBLIC_SUPABASE_URL` canlıda hâlâ eski Tokyo ref’ine işaret ediyorsa Frankfurt URL’sine güncelleyin (`https://lxwwbuvbaejtlqmzoykx.supabase.co`). Prisma şu an yalnızca Postgres kullanır; Auth açılınca anon key de Frankfurt projesinden alınmalı.
