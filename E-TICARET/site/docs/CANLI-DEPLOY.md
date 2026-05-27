# Canlıya alma (equsto.com)

Kod `main` branch’te; site **Vercel Production** deploy edilince güncellenir.

## Hızlı (panel — 1 dakika)

1. [vercel.com](https://vercel.com) → proje **equsto**
2. **Settings → General → Root Directory** = `EQUSTO-WORK/E-TICARET/site` (repo kökündeki `E-TICARET/site` değil)
3. **Deployments** → en üstteki `main` commit
4. **⋯ → Redeploy** → **Use existing Build Cache: KAPALI** → Redeploy
5. **Ready** olunca: `https://equsto.com/data/dept/kahve.json` kontrol
6. Vitrin sayfalarında Ctrl+F5

## Otomatik (GitHub Actions)

Repo → **Settings → Secrets → Actions** → `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

Sonra **Actions → Vercel Production** veya `main`’e push.

## Doğrulama

- `https://equsto.com/shop/kahve` — departman PLP
- `https://equsto.com/pfos` — Proje Fabrikası
- `https://equsto.com/blog` — rehber dizini
