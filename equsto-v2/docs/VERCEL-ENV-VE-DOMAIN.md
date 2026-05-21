sa# Vercel — Env (1–2) + equsto.com domain (3)

Canlı site: **https://equsto.vercel.app**

Yerel değerler: `equsto-v2/.env.local` (şifreleri repoya koymayın).

---

## 1) Environment Variables (Production + Preview)

Vercel → proje **equsto** → **Settings** → **Environment Variables**

Her satır için **Environments:** Production **ve** Preview işaretli.

| Key | Value (nereden) |
|-----|-----------------|
| `DATABASE_URL` | `.env.local` — Transaction, port **6543** (tırnak **yok**) |
| `DIRECT_URL` | `.env.local` — Session, port **5432** (tırnak **yok**) |
| `EQUSTO_ADMIN_BEARER` | `.env.local` — `eq_adm_...` |
| `LEGACY_DATA_BASE` | `https://equsto.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://equsto.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gmnbhmwcmxukebulqwbn.supabase.co` (Auth hazırlığı) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → **Settings → API** → anon public key |

**Value kutusuna** `DATABASE_URL="postgresql://..."` şeklinde **tırnaklı yapıştırmayın** — sadece `postgresql://...` metni.

Kaydettikten sonra:

**Deployments** → en son deploy → **⋯** → **Redeploy** → Production.

Build script production’da `NEXT_PUBLIC_SITE_URL` yoksa `https://equsto.com` kullanır (`generate-admin-config.mjs`).

### Kontrol

- https://equsto.com/admin.html — panel açılır
- https://equsto.com/admin-config.js → `EQUSTO_API_BASE` = `https://equsto.com/api`
- Admin giriş şifresi: **equsto2025** (`public/data/admin-auth.json`)
- Tarayıcı → Network → `GET /api/urunler` → **200** (Bearer admin-config’ten)

---

## 2) NEXT_PUBLIC_SITE_URL

Aynı ekranda:

```
NEXT_PUBLIC_SITE_URL = https://equsto.com
```

Bu değer build sırasında `admin-config.js` içinde API tabanını üretir (`https://equsto.com/api`).

Domain bağlı değilse geçici olarak `https://equsto.vercel.app` kullanılabilir; canlıda her zaman:

```
https://equsto.com
```

→ tekrar **Redeploy**.

---

## 3) equsto.com → Vercel

### A) Vercel’de domain ekle

1. Proje **equsto** → **Settings** → **Domains**
2. **Add** → `equsto.com` → Continue
3. **Add** → `www.equsto.com` → Continue  
4. Vercel size **DNS kayıtlarını** gösterir (ekranda birebir kopyalayın).

### B) Alan adı paneli (cPanel / Natro / GoDaddy vb.)

Vercel’in gösterdiği kayıtlar genelde şöyledir (dashboard sizinkiyle eşleştirin):

| Tip | Host / Name | Value |
|-----|-------------|--------|
| **A** | `@` (veya boş) | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

Eski **A/CNAME** kayıtları çakışıyorsa kaldırın veya Vercel’e yönlendirin.

**Nameserver** değiştirmek zorunda değilsiniz; sadece A + CNAME yeterli olabilir.

### C) SSL ve yönlendirme

- DNS yayılımı **5 dk – 48 saat** sürebilir.
- Vercel otomatik **HTTPS** verir.
- **Settings → Domains** → `equsto.com` **Primary** yapın; `www` → apex redirect açık kalsın.

### D) Domain canlı olunca

1. `NEXT_PUBLIC_SITE_URL` → `https://equsto.com`
2. **Redeploy**
3. Test: https://equsto.com/ , /pfos , /admin.html

### E) Eski cPanel sitesi

`public_html` içindeki statik **equsto.com** ile Vercel aynı anda aynı domain’de olamaz. DNS Vercel’e geçince trafik **Next.js (equsto-v2)** olur.

PFOS/BESOS dosyaları zaten repoda `equsto-v2/public/` altında; ayrıca cPanel’e upload gerekmez (domain Vercel’e işaret edince).

---

## Özet sıra

1. Env 5 değişken + **Redeploy**
2. `NEXT_PUBLIC_SITE_URL` = `https://equsto.vercel.app`
3. Domains → DNS → bekleyin → Primary `equsto.com` → URL güncelle + **Redeploy**

Sorun: **Domains** ekran görüntüsü veya DNS listesi — hangi kayıt “Invalid” görünüyorsa birlikte düzeltilir.
