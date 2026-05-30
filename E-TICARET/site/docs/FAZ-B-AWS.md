# Faz B — AWS S3 + CloudFront (önerilen, ~20 GB)

Statik medya **Vercel/Git dışında**; site runtime'da `NEXT_PUBLIC_ASSET_CDN_URL` ile aynı path'leri okur.

```
https://dxxxx.cloudfront.net/images/catalog/ozti/web/foo.jpg
https://dxxxx.cloudfront.net/data/caglayan-market/.../Nergis.pdf
```

Kod hazır: `lib/asset-cdn.ts`, `public/eq-site-urls.js`, `eq-asset-cdn-config.js`.

---

## 1) AWS S3 bucket

1. [AWS Console](https://console.aws.amazon.com/s3/) → **Create bucket**
2. **Bucket name:** `equsto-assets` (veya benzersiz ad)
3. **Region:** `eu-central-1` (Frankfurt — TR'ye yakın)
4. Block Public Access: **açık kalsın** (CloudFront OAC ile servis — bucket public değil)
5. Create

### IAM kullanıcı (upload için)

1. IAM → User → `equsto-s3-upload` → programmatic access
2. Policy (bucket adınıza göre):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:DeleteObject"],
    "Resource": [
      "arn:aws:s3:::equsto-assets",
      "arn:aws:s3:::equsto-assets/*"
    ]
  }]
}
```

3. Access key → yerelde `aws configure --profile equsto`

---

## 2) CloudFront distribution

1. CloudFront → **Create distribution**
2. **Origin domain:** `equsto-assets.s3.eu-central-1.amazonaws.com`
3. **Origin access:** Origin access control (OAC) — S3 bucket policy otomatik güncellenir
4. **Default cache behavior:** GET, HEAD; compress açık
5. (Opsiyonel) **Alternate domain:** `cdn.equsto.com` + ACM sertifikası (us-east-1)
6. Create → **Distribution domain name** kopyala: `d1234abcd.cloudfront.net`

---

## 3) Yerel env

`.env.local` içine:

```env
AWS_S3_BUCKET=equsto-assets
AWS_REGION=eu-central-1
AWS_PROFILE=equsto
AWS_CLOUDFRONT_URL=https://d1234abcd.cloudfront.net
NEXT_PUBLIC_ASSET_CDN_URL=https://d1234abcd.cloudfront.net
```

Prisma için ayrı satırlar — bkz. `docs/SUPABASE-KURULUM.md`.

---

## 4) Yükleme (diskten silmez)

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"

# AWS CLI: https://aws.amazon.com/cli/
aws --version

npm run assets:s3:dry-run
npm run assets:s3:sync
```

Sync edilen prefix'ler:

- `images/` (~1,5 GB)
- `data/caglayan-market/`
- `data/prosogutma-market/`
- `data/vitrum-drawings/`
- `data/advanced-cuisine-clear-ice/images/`

Manifest: `docs/s3-upload-manifest.json`

**20 GB hedef:** Aynı bucket; yeni medya ekledikçe tekrar `assets:s3:sync` (incremental).

---

## 5) Vercel env + deploy

Vercel → **equsto** → Settings → Environment Variables:

```
NEXT_PUBLIC_ASSET_CDN_URL = https://d1234abcd.cloudfront.net
```

Production + Preview → **Redeploy**.

Yerel test:

```powershell
npm run assets:cdn:verify
npm run dev
```

---

## 6) Canlı kontrol listesi

- [ ] `/shop/pisirme` — ürün görselleri CloudFront host'undan
- [ ] PDP — büyük görsel + galeri
- [ ] Sepet / arama kartları
- [ ] Çağlayan PDF linkleri
- [ ] `npm run assets:cdn:verify` → tüm örnekler OK

---

## 7) Git'ten çıkar (CDN doğrulandıktan sonra)

```powershell
node scripts/faz-b-untrack-cdn.mjs --dry-run
node scripts/faz-b-untrack-cdn.mjs
```

`.gitignore`'a ekleyin:

```
/public/images/
/public/data/caglayan-market/
/public/data/prosogutma-market/
/public/data/vitrum-drawings/
/public/data/advanced-cuisine-clear-ice/images/
```

Commit + push → repo küçülür; canlı CDN'den servis eder.

---

## Alternatif: Vercel Blob

Küçük projeler için: `docs/FAZ-B-CDN.md` (Blob script). **20 GB için AWS önerilir.**

---

## Maliyet (kabaca)

| Kalem | ~20 GB |
|-------|--------|
| S3 depolama | ~$0,50/ay |
| CloudFront egress | trafiğe göre (ilk 1 TB/ay düşük tier) |
| Supabase Postgres | medyadan bağımsız, Pro plan DB disk |

---

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| 403 CloudFront | OAC + bucket policy; distribution deploy bekleyin |
| Görseller hâlâ equsto.com/images | `NEXT_PUBLIC_ASSET_CDN_URL` + redeploy; hard refresh |
| `aws: command not found` | AWS CLI kur + `aws configure` |
| Türkçe dosya adı 404 | Path encode — kod `encodeURIComponent` kullanır |
