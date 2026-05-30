# AWS başlangıç — Equsto için adım adım

**Önce okuyun:** Equsto’da AWS’den ihtiyacınız olan şey **görsel/PDF depolama** (S3 + CloudFront).  
**Amazon Aurora PostgreSQL kullanmayın** — veritabanı zaten **Supabase Postgres** (`gmnbhmwcmxukebulqwbn`).

```
Equsto mimarisi
├── Veritabanı (ürün, müşteri, PFOS)  → Supabase Postgres  ← Aurora DEĞİL
├── Görseller + PDF (~20 GB)          → AWS S3 + CloudFront ← bunu kuracağız
└── Site + API                        → Vercel
```

Vercel veya AWS ekranında **Aurora PostgreSQL** görürseniz — **atlayın**. Karıştırılan iki ayrı AWS ürünü:

| AWS ürünü | Ne işe yarar | Equsto’da |
|-----------|--------------|-----------|
| **S3** | Dosya kutusu (jpg, pdf) | ✅ Evet |
| **CloudFront** | Hızlı CDN (dosyaları dünyaya dağıtır) | ✅ Evet |
| **Aurora PostgreSQL** | Veritabanı sunucusu | ❌ Hayır (Supabase var) |
| **RDS PostgreSQL** | Veritabanı sunucusu | ❌ Hayır |

---

## Bölüm 0 — AWS hesabı

1. https://aws.amazon.com → **Create an AWS Account**
2. E-posta, şifre, ödeme kartı (free tier var; S3 ~20 GB düşük maliyet)
3. Giriş → üst sağ **Account ID** görünür — not almanız gerekmez, hesap açık olsun yeter

**Bölge (Region):** Konsol sağ üst — **`Europe (Frankfurt) eu-central-1`** seçin.  
Tüm adımlarda aynı bölge kalsın.

---

## Bölüm 1 — S3 bucket (dosya kutusu)

S3 = internetteki bir klasör; görselleriniz buraya kopyalanır.

### 1.1 Bucket oluştur

1. AWS Console arama → **S3** → **Create bucket**
2. **Bucket name:** `equsto-assets` (dünya genelinde benzersiz olmalı; doluysa `equsto-assets-tr-2026` deneyin)
3. **AWS Region:** `Europe (Frankfurt) eu-central-1`
4. **Block all public access:** ✅ **Açık kalsın** (dosyaları CloudFront verecek, bucket doğrudan public olmayacak)
5. Diğer ayarlar varsayılan → **Create bucket**

### 1.2 Klasör yapısı (otomatik oluşur)

Bilgisayarınızdan sync edince S3’te şöyle görünür:

```
equsto-assets/
├── images/              ← public/images/
├── data/
│   ├── caglayan-market/
│   ├── prosogutma-market/
│   └── ...
```

Elle klasör oluşturmanız gerekmez — upload script oluşturur.

---

## Bölüm 2 — IAM kullanıcı (bilgisayardan upload izni)

Bilgisayarınızdaki `aws` komutunun S3’e yazabilmesi için “upload kullanıcısı” gerekir.

### 2.1 Kullanıcı

1. Console arama → **IAM** → **Users** → **Create user**
2. **User name:** `equsto-s3-upload`
3. **Provide user access to the AWS Management Console** → **Hayır** (sadece programatik)
4. **Next**

### 2.2 İzin

1. **Attach policies directly** → **Create policy** (yeni sekme)
2. **JSON** sekmesi → yapıştır (bucket adınızı yazın):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::equsto-assets",
        "arn:aws:s3:::equsto-assets/*"
      ]
    }
  ]
}
```

3. **Next** → Policy name: `equsto-s3-upload-policy` → **Create policy**
4. Kullanıcı oluşturma ekranına dön → policy’yi seç → **Create user**

### 2.3 Access key

1. Kullanıcı `equsto-s3-upload` → **Security credentials**
2. **Create access key** → **Command Line Interface (CLI)** → onay
3. **Access key ID** ve **Secret access key** — **bir kez** gösterilir; güvenli yere kaydedin

---

## Bölüm 3 — AWS CLI (bilgisayara kurulum)

Windows PowerShell **Yönetici olarak**:

```powershell
winget install Amazon.AWSCLI
```

Kurulumdan sonra **yeni** PowerShell penceresi:

```powershell
aws --version
aws configure --profile equsto
```

Sorular:

| Soru | Cevap |
|------|--------|
| AWS Access Key ID | Bölüm 2.3’ten |
| AWS Secret Access Key | Bölüm 2.3’ten |
| Default region | `eu-central-1` |
| Default output format | `json` |

Test:

```powershell
aws s3 ls --profile equsto
```

Liste boş veya bucket görünürse OK.

---

## Bölüm 4 — Dosyaları S3’e yükleme

Proje klasöründe `.env.local` (veya `.env`) — **şifreleri repoya koymayın**:

```env
AWS_S3_BUCKET=equsto-assets
AWS_REGION=eu-central-1
AWS_PROFILE=equsto
```

PowerShell:

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"

# Önce simülasyon (hiçbir şey yüklemez)
npm run assets:s3:dry-run

# Gerçek yükleme (~2 GB, 20 GB’a kadar büyüyebilir — uzun sürebilir)
npm run assets:s3:sync
```

Bittikten sonra AWS Console → S3 → `equsto-assets` → **images/** dolu olmalı.

Manifest: `docs/s3-upload-manifest.json`

---

## Bölüm 5 — CloudFront (CDN — site hızlı erişsin)

CloudFront, S3’teki dosyaları `https://dxxxx.cloudfront.net/...` ile servis eder.

### 5.1 Distribution oluştur

1. Console arama → **CloudFront** → **Create distribution**
2. **Origin domain:** S3’ten `equsto-assets.s3.eu-central-1.amazonaws.com` seçin
3. **Origin access:** **Origin access control settings (recommended)** → **Create new OAC** → Create
4. S3 bucket access için çıkan **Copy policy** uyarısında **Go to S3** → bucket policy’yi yapıştır → Save
5. **Viewer protocol policy:** Redirect HTTP to HTTPS
6. **Allowed HTTP methods:** GET, HEAD
7. **Compress objects automatically:** Yes
8. **Price class:** Use all edge locations (veya maliyet için Europe only)
9. **Create distribution**

Dağıtım **5–15 dakika** “Deploying” kalabilir.

### 5.2 CDN URL’yi alın

CloudFront → Distributions → **Domain name**  
Örnek: `d111111abcdef8.cloudfront.net`

Tarayıcı test (sync sonrası bir dosya yolu):

```
https://d111111abcdef8.cloudfront.net/images/catalog/home/...
```

(Gerçek alt yolu S3’teki bir dosyadan kopyalayın.)

---

## Bölüm 6 — Vercel’e bağlama

1. https://vercel.com → proje **equsto** → **Settings** → **Environment Variables**
2. Yeni değişken:

```
NEXT_PUBLIC_ASSET_CDN_URL = https://d111111abcdef8.cloudfront.net
```

(Sonunda `/` **yok**.)

3. Production + Preview işaretli → Save
4. **Deployments** → son deploy → **Redeploy**

Yerel test (`.env.local`’e aynı URL):

```powershell
npm run assets:cdn:verify
npm run dev
```

Canlı: https://equsto.com/shop/pisirme → F12 → Network → görseller `cloudfront.net` host’undan gelmeli.

---

## Bölüm 7 — (Opsiyonel) Özel domain `cdn.equsto.com`

İleride:

1. **ACM** (sertifika) — bölge **US East (N. Virginia)** — `cdn.equsto.com`
2. CloudFront → Alternate domain name + sertifika
3. DNS (domain sağlayıcı) → CNAME `cdn` → CloudFront domain
4. Vercel env: `NEXT_PUBLIC_ASSET_CDN_URL=https://cdn.equsto.com`

İlk kurulumda CloudFront varsayılan domain yeterli.

---

## Bölüm 8 — Git’ten görselleri çıkarmak (CDN çalışınca)

Canlı test OK olduktan sonra:

```powershell
node scripts/faz-b-untrack-cdn.mjs --dry-run
node scripts/faz-b-untrack-cdn.mjs
```

Diskte dosyalar **kalır**; sadece Git takibi biter.

---

## Supabase (veritabanı) — AWS ile karıştırmayın

Veritabanı **Supabase Dashboard** üzerinden:

1. https://supabase.com/dashboard/project/gmnbhmwcmxukebulqwbn
2. **Database** → **Reset database password**
3. Connection string → Transaction (6543) + Session (5432) → `.env.local`
4. `copy .env.local .env`
5. `npx prisma migrate deploy`

Detay: `docs/SUPABASE-KURULUM.md`

---

## Sık sorular

**Aurora PostgreSQL Vercel’de görünüyor — tıklayayım mı?**  
Hayır. Supabase kullanıyorsunuz; Aurora ikinci veritabanı olur, gereksiz karmaşa.

**20 GB S3’e sığar mı?**  
Evet. S3 pratikte TB’a kadar büyür; maliyet depolama + indirme trafiğine bağlı.

**Upload ne kadar sürer?**  
~2 GB ev internetinde 30 dk – birkaç saat; `--dry-run` önce deneyin.

**Yanlış bir şey sildim mi endişesi**  
Upload script diskten **silmez**. Sadece S3’e kopyalar.

---

## Kontrol listesi

- [ ] AWS hesabı, bölge `eu-central-1`
- [ ] S3 bucket `equsto-assets`
- [ ] IAM user + access key
- [ ] `aws configure --profile equsto`
- [ ] `npm run assets:s3:sync`
- [ ] CloudFront distribution
- [ ] Vercel `NEXT_PUBLIC_ASSET_CDN_URL`
- [ ] Canlı görsel test
- [ ] (Ayrı) Supabase şifre + `prisma migrate deploy`

Genel plan: `docs/DEPLOY-MIMARI.md`
