# Canlıya alma (equsto.com)

Kod `main` branch'te; **Vercel Production** deploy edilince güncellenir.

## Vercel panel (önemli)

1. [vercel.com](https://vercel.com) → proje **equsto**
2. **Settings → General → Root Directory**
   - **Boş bırakın** (repo kökü — `vercel.json` burada), **veya**
   - `E-TICARET/site` (tam Next.js projesi burada)
   - **Kullanmayın:** `EQUSTO-WORK/E-TICARET/site` (eski kopya), **equsto-v2** (yedek)
3. Build, install: repo kökündeki `vercel.json` → `E-TICARET/site/scripts/vercel-*.mjs`
4. Build her zaman **`E-TICARET/site`** kaynağını kullanır (market-reyon, Proso görselleri dahil).

## Deploy sonrası

1. **Deployments** → son commit **Ready**
2. Sorun varsa: **Redeploy** → **Use existing Build Cache: KAPALI**
3. Kontrol:
   - https://equsto.com/data/dept/market-reyon.json → **200**
   - https://equsto.com/eq-market-reyon.js → **200**
   - https://equsto.com/shop/market-reyonlari
4. Sayfada **Ctrl+F5**

## Doğrulama

- `https://equsto.com/shop/market-reyonlari`
- `https://equsto.com/shop/kahve`
- `https://equsto.com/pfos`
