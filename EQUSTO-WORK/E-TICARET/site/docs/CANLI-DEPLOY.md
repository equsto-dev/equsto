# Canlıya alma (equsto.com)

Kod `main` branch’te; site **Vercel Production** deploy edilince güncellenir.

## Vercel panel (önemli)

1. [vercel.com](https://vercel.com) → proje **equsto**
2. **Root Directory** — ikisinden biri:
   - **`./`** (repo kökü, önerilen) — `vercel.json` burada
   - **`E-TICARET/site`** — bu durumda **Include files outside the root directory → Açık** (tam `app/` `EQUSTO-WORK/E-TICARET/site` içinde)
   - **Kullanmayın:** `EQUSTO-WORK/E-TICARET/site` tek başına (eski `public/`), **equsto-v2**
3. Build script `vercel-site-sync.mjs`: `public/` = `E-TICARET/site`, `app/` = tam kopya (EQUSTO-WORK)
4. **Deployments** → son commit **Ready** (2026-05-27: Root Directory panelde `E-TICARET/site` onaylandi)
5. Hata varsa: **Redeploy** → **Use existing Build Cache: KAPALI**

## Yerel geliştirme klasörü

Tek kaynak (Cursor workspace):

`C:\D Disk\EQUSTO-WORK\E-TICARET\site`

## Deploy sonrası kontrol

- https://equsto.com/shop/kuvetler
- https://equsto.com/shop/market-reyonlari
- https://equsto.com/shop/kahve
- Sayfada **Ctrl+F5**
