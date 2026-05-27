# Canlıya alma (equsto.com)

Kod `main` branch’te; Vercel Git entegrasyonu push sonrası deploy eder.

**Panelde Root Directory aramanız gerekmez.** Repo kökündeki `vercel.json` ve `E-TICARET/site/scripts/vercel-build.mjs` site klasörünü otomatik bulur (`equsto-v2`, `E-TICARET/site`, `EQUSTO-WORK/E-TICARET/site` veya monorepo kökü).

## Otomatik (tercih)

1. Değişiklikleri `main`’e push edin.
2. [vercel.com](https://vercel.com) → **equsto** → **Deployments** → son commit **Ready** olana kadar bekleyin.
3. **Ready** olunca: `https://equsto.com/data/dept/market-reyon.json` (veya `kahve.json`) kontrol.
4. Vitrin sayfalarında Ctrl+F5.

## GitHub Actions (isteğe bağlı)

Secret’lar tanımlıysa: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`  
→ **Actions → Vercel Production** veya `main` push.

## Doğrulama

- `https://equsto.com/shop/market-reyonlari`
- `https://equsto.com/shop/kahve`
- `https://equsto.com/pfos`
