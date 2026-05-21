# Supabase kurulumu — Equsto v2 (Prisma)

Proje ref: **gmnbhmwcmxukebulqwbn**  
Dashboard: https://supabase.com/dashboard/project/gmnbhmwcmxukebulqwbn

---

## Bu ekranda NE YAPMAYIN

**Connect → Framework → Next.js** (görseldeki seçim):

- `npm install @supabase/supabase-js @supabase/ssr` → **kurmayın**
- `utils/supabase/server.ts`, middleware → **eklemeyin**
- Sadece `NEXT_PUBLIC_SUPABASE_URL` + publishable key → **Sprint 0 için yeterli değil**

Equsto veritabanı **Prisma** ile bağlanır; admin API Postgres kullanır.

---

## Bu ekrandan DOĞRU yol (3 dakika)

### 1) Üstte sekme değiştirin

Aynı **Connect to your project** penceresinde:

1. **Framework** yerine **ORM** sekmesine tıklayın  
2. **Prisma** seçin  

(ORM yoksa: sol menü → **Project Settings** → **Database** → **Connection string**)

### 2) İki URL kopyalayın

| `.env.local` değişkeni | Supabase’de seçin | Port |
|------------------------|-------------------|------|
| `DATABASE_URL` | **Connection pooling** → **URI** → Mode: **Transaction** | 6543 |
| `DIRECT_URL` | **Session pooler** → **URI** (port **5432**, pooler host) | 5432 |

**Windows:** `db....supabase.co:5432` (Direct) çoğu ağda **erişilemez** (IPv6 / P1001). `DIRECT_URL` için Dashboard’daki **Session pooler** URI’sini kullanın; `db.*` host’unu migrate için yazmayın.

- `[YOUR-PASSWORD]` → proje oluştururken kaydettiğiniz **database password**  
- Şifreyi unuttuysanız: **Database** → **Reset database password**

### 3) `.env.local` + `.env` dosyası

Prisma CLI **`.env.local` okumaz** — `.env` gerekir (veya kopyalayın).

PowerShell:

```powershell
cd "C:\D Disk\EQUSTO-CURSOR\equsto-v2"
copy .env.local.template .env.local
notepad .env.local
```

- Supabase **Copy** ile URI’yi `DIRECT_URL=` ve `DATABASE_URL=` satırlarına yapıştırın (en alta tek satır URI bırakmayın).
- Şifrede `.` `@` `#` varsa **Copy URI** kullanın veya noktayı `%2E` yapın.

Sonra:

```powershell
copy .env.local .env
```

### 4) Tabloları oluşturun

```powershell
cd "C:\D Disk\EQUSTO-CURSOR\equsto-v2"
npm install
npx prisma migrate deploy
npm run db:seed
```

Başarılı çıktı: `All migrations have been successfully applied` + seed log.

### 5) Kontrol

Supabase → **Table Editor** → `Brand`, `Category`, `Product` görünmeli.

```powershell
npm run admin:config
npm run dev
```

- http://localhost:3000  
- http://localhost:3000/admin.html  

---

## İsteğe bağlı (Framework ekranındaki değerler)

İleride Supabase Auth kullanırsanız `.env.local`’e eklenebilir; **şimdi zorunlu değil**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gmnbhmwcmxukebulqwbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # Settings → API → anon public
```

Publishable key (`sb_publishable_...`) yeni API anahtarıdır; Prisma migrate için gerekmez.

---

## Sık hatalar

| Hata | Anlam | Çözüm |
|------|--------|--------|
| `P1001` … `db.*.supabase.co:5432` | Direct host’a TCP yok (IPv6) | `DIRECT_URL` = **Session pooler** (pooler host, port 5432, kullanıcı `postgres.PROJE_REF`) |
| `FATAL: Tenant or user not found` | Pooler bölgesi veya kullanıcı/şifre Dashboard ile uyuşmuyor | **Database → Reset database password** → Transaction + Session URI’yi **Copy** ile yapıştırın; `aws-0-…` bölgesini elle tahmin etmeyin |
| `P1000` Authentication failed | Yanlış şifre | Şifreyi sıfırlayıp URI’yi yeniden kopyalayın; şifrede `.` varsa Supabase **Copy** kullanın (`%2E`) |
| Prisma `.env` bulamıyor | CLI `.env.local` okumaz | `copy .env.local .env` |
| `EQUSTO_ADMIN_BEARER` | Admin 401 | `.env.local` token + `npm run admin:config` |

Bağlantı testi:

```powershell
cd equsto-v2
copy .env.local .env
npm run db:verify
npx prisma migrate deploy
npm run db:seed
```

---

## Sonraki Sprint 0 adımları (Supabase sonrası)

1. Admin → `GET /api/urunler` test  
2. 10 Atalay ürünü `PUBLISHED`  
3. GitHub push + Vercel (root: `equsto-v2`)  
4. Meilisearch (Hetzner) — sonra
