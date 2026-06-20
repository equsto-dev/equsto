# Kurulum 3 — GitHub + Vercel

Supabase + lokal `npm run dev` tamamlandıysa sıradaki adımlar.

---

## 1) GitHub (ilk push)

1. https://github.com/new → repo (ör. `equsto`), **Private**
2. README / .gitignore **eklemeyin** (yerelde var)

CMD — **her satır ayrı Enter**:

```cmd
cd /d "C:\D Disk\EQUSTO-CURSOR"
git add .github .gitignore README.md docs equsto-v2
git add equsto-v2/docs equsto-v2/lib equsto-v2/app/api
git status
git commit -m "Sprint 0: equsto-v2 Next.js omurga, Supabase Prisma, admin API"
git branch -M main
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

`KULLANICI/REPO` kendi hesabınız. `.env`, `.env.local`, `admin-config.js` commit edilmez.

---

## 2) Vercel projesi

1. https://vercel.com/new → GitHub reposunu **Import**
2. **Root Directory:** `equsto-v2` (zorunlu)
3. Framework: Next.js (otomatik)
4. **Environment Variables** (Production + Preview):

| Key | Değer |
|-----|--------|
| `DATABASE_URL` | Supabase **Transaction** pooler (6543), `aws-1-eu-central-1` (Frankfurt) |
| `DIRECT_URL` | Supabase **Session** pooler (5432), aynı host |
| `EQUSTO_ADMIN_BEARER` | `.env.local` ile aynı token |
| `NEXT_PUBLIC_SITE_URL` | İlk deploy: `https://PROJE.vercel.app` |
| `LEGACY_DATA_BASE` | `https://equsto.com` (isteğe bağlı) |

`MEILISEARCH_*` — yerel Docker veya Hetzner; bkz. [`MEILISEARCH.md`](MEILISEARCH.md)

5. **Deploy**

Build komutu (`vercel.json`): `generate-admin-config` + `prisma generate` + `next build`.

---

## 3) Deploy sonrası kontrol

- `https://PROJE.vercel.app/`
- `https://PROJE.vercel.app/pfos`
- `https://PROJE.vercel.app/admin.html`
- `GET https://PROJE.vercel.app/api/urunler` (Bearer: `EQUSTO_ADMIN_BEARER`)

Supabase **Table Editor**’da tablolar görünüyorsa ek migrate gerekmez (lokalde `migrate deploy` yaptınız).

---

**Env + domain adım adım:** [`VERCEL-ENV-VE-DOMAIN.md`](VERCEL-ENV-VE-DOMAIN.md)

## 4) Canlı equsto.com (PFOS/BESOS)

Statik paket: `deploy-live-pfos-besos/` → cPanel `public_html`  
Rehber: [`docs/DEPLOY-PFOS-BESOS.md`](../../docs/DEPLOY-PFOS-BESOS.md)

Yeni site Vercel’de; eski domain yönlendirmesi ayrı adım (DNS).

---

## 5) Sprint 0 kalan (sonra)

- [ ] Meilisearch Docker + `npm run search:index` ([`MEILISEARCH.md`](MEILISEARCH.md))
- [ ] 10 Atalay ürünü `PUBLISHED` (admin veya seed genişletme)
- [ ] Domain `equsto.com` → Vercel
