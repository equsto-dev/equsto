# Faz B — CDN (object storage)

**Önerilen yol:** AWS S3 + CloudFront → [`FAZ-B-AWS.md`](FAZ-B-AWS.md) (~20 GB kapasite)

Bu dosya **Vercel Blob** alternatifi içindir.

---

## Güvenlik (Faz A ile aynı ilke)

- Upload script **diskten silmez**
- Git'ten çıkarma **yalnızca `git rm --cached`** — `faz-b-untrack-cdn.mjs`
- CDN doğrulanmadan untrack **çalıştırmayın**

## Runtime (her iki sağlayıcı)

| Parça | Açıklama |
|-------|----------|
| `lib/asset-cdn.ts` | Sunucu CDN URL |
| `public/eq-site-urls.js` | `equstoCdnAssetHref` |
| `scripts/generate-asset-cdn-config.mjs` | `NEXT_PUBLIC_ASSET_CDN_URL` → tarayıcı |
| `scripts/faz-b-verify-cdn.mjs` | HEAD isteği ile örnek URL test |

CDN kapalıyken davranış **değişmez**.

## Vercel Blob (alternatif, küçük hacim)

```powershell
npm i -D @vercel/blob
npm run assets:blob:dry-run
node scripts/faz-b-upload-cdn.mjs --upload
```

Vercel env: `NEXT_PUBLIC_ASSET_CDN_URL=https://….public.blob.vercel-storage.com`

---

Genel mimari: [`DEPLOY-MIMARI.md`](DEPLOY-MIMARI.md)
