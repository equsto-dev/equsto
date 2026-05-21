# GitHub → Supabase → Vercel

Bu repo **monorepo**: yeni site `equsto-v2/` içinde. Vercel **Root Directory** = `equsto-v2`.

---

## 1) GitHub deposu

### A. github.com üzerinden (önerilen)

1. [github.com/new](https://github.com/new) → repo adı örn. `equsto-v2` veya `equsto`
2. **Private** seçin (admin token / env için)
3. README eklemeyin (yerelde zaten var)

### B. Yerelde ilk push (PowerShell)

```powershell
cd "C:\D Disk\EQUSTO-CURSOR"
git init
git add .
git status
git commit -m "Sprint 0: equsto-v2 omurga + legacy public"
git branch -M main
git remote add origin https://github.com/KULLANICI/equsto-v2.git
git push -u origin main
```

`KULLANICI` ve repo URL’sini kendi hesabınızla değiştirin.

---

## 2) Supabase projesi

1. [supabase.com](https://supabase.com) → **New project**
2. İsim: `equsto-v2` (veya `equsto`)
3. Bölge: Dashboard’da görünen bölge (ör. **Tokyo → ap-northeast-1**, host `aws-1-ap-northeast-1.pooler...`)
4. DB şifresini kaydedin

### Connection string’ler

**Project Settings → Database → Connection string**

| Değişken | Supabase UI | Port |
|----------|-------------|------|
| `DATABASE_URL` | **Connection pooling**, Transaction mode | **6543** |
| `DIRECT_URL` | **Session pooler** (5432) — Windows’ta `db.*.supabase.co` P1001 verebilir | **5432** |

`equsto-v2/.env.local` oluşturun (`cp .env.example .env.local`):

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

EQUSTO_ADMIN_BEARER="uzun-rastgele-bir-token"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Şema + seed (ilk kez)

```powershell
cd equsto-v2
npm install
npx prisma migrate deploy
npm run db:seed
```

Alternatif (migrate yerine hızlı prototip): `npm run db:push`

---

## 3) Supabase ↔ GitHub (isteğe bağlı)

Supabase Dashboard → **Integrations → GitHub**:

- Repoyu bağlayın
- Branch: `main`
- Migration klasörü: `equsto-v2/prisma/migrations`

Bu sayede merge sonrası migration otomatik çalışabilir. İlk kurulumda yukarıdaki `migrate deploy` yeterli.

---

## 4) Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. **Import** GitHub reposu
3. **Root Directory:** `equsto-v2` (önemli)
4. Framework: Next.js (otomatik)

### Environment Variables (Production + Preview)

| Key | Kaynak |
|-----|--------|
| `DATABASE_URL` | Supabase pooling (6543) |
| `DIRECT_URL` | Supabase direct (5432) |
| `EQUSTO_ADMIN_BEARER` | Sizin ürettiğiniz token |
| `MEILISEARCH_HOST` | Hetzner (sonra) |
| `MEILISEARCH_MASTER_KEY` | Hetzner (sonra) |
| `NEXT_PUBLIC_SITE_URL` | `https://xxx.vercel.app` veya preview URL |

### Deploy sonrası

Build komutu zaten `prisma generate && next build` (`package.json`).

İlk deploy’dan sonra Supabase’de tablolar yoksa Vercel **Settings → Deploy Hooks** veya lokalden:

```powershell
$env:DATABASE_URL="..."; $env:DIRECT_URL="..."
cd equsto-v2
npx prisma migrate deploy
npm run db:seed
```

### admin-config (Vercel Build)

Build sırasında `admin-config.js` üretmek için Vercel **Build Command** şöyle olabilir:

```bash
node scripts/generate-admin-config.mjs && prisma generate && npm run build
```

(`EQUSTO_ADMIN_BEARER` ve `VERCEL_URL` env’de tanımlı olmalı.)

---

## 5) Kontrol listesi

- [ ] GitHub’da repo + `main` push
- [ ] Supabase Frankfurt + iki URL `.env.local`
- [ ] `prisma migrate deploy` + `db:seed` OK
- [ ] Vercel root = `equsto-v2`
- [ ] Preview URL açılıyor: `/`, `/pfos`, `/admin.html`
- [ ] Admin Bearer ile `GET /api/urunler` 200

---

## Sorun giderme

| Hata | Çözüm |
|------|--------|
| Prisma P1001 | `DATABASE_URL` pooling URL, `?pgbouncer=true` |
| Migrate failed | `DIRECT_URL` ile `migrate deploy`; runtime’da pooling |
| Vercel 404 on /pfos | `next.config.ts` rewrites + `public/pfos.html` commit’te mi |
| admin 401 | `EQUSTO_ADMIN_BEARER` = admin-config’teki token |
