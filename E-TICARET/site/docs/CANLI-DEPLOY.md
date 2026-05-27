# Canlıya alma (equsto.com)

Kod `main` branch’te; site **Vercel Production** deploy edilince güncellenir.

## Vercel panel (önemli)

1. [vercel.com](https://vercel.com) → proje **equsto**
2. **Settings → General → Root Directory** = **`E-TICARET/site`**
   - **Kullanmayın:** `EQUSTO-WORK/E-TICARET/site` (iç içe eski kopya), **equsto-v2**
3. **Include files outside the root directory** → **Kapalı** (Root `E-TICARET/site` iken)
4. **Deployments** → son commit **Ready**
5. Hata varsa: **Redeploy** → **Use existing Build Cache: KAPALI**

## Yerel geliştirme klasörü

Tek kaynak (Cursor workspace):

`C:\D Disk\EQUSTO-WORK\E-TICARET\site`

## Deploy sonrası kontrol

- https://equsto.com/shop/kuvetler
- https://equsto.com/shop/market-reyonlari
- https://equsto.com/shop/kahve
- Sayfada **Ctrl+F5**
