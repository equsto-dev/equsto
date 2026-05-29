# Google Merchant Center (GMC) — Equsto feed

Equsto **WooCommerce kullanmaz**. Ürün feed’i Next.js üzerinden sunulur.

## Feed URL

| Ortam | URL |
|--------|-----|
| Canlı | `https://equsto.com/feeds/google-products.xml` |
| İstatistik (JSON) | `https://equsto.com/feeds/google-products.xml?stats=1` |

Yerel statik kopya (opsiyonel):

```bash
npm run feed:google
# → public/feeds/google-products.xml
```

## GMC bağlama checklist

1. **[merchants.google.com](https://merchants.google.com)** → İşletme hesabı oluşturun (ülke: Türkiye).
2. **Alan adı doğrulama** — `equsto.com` (Search Console ile aynı Google hesabı en kolayı).
3. **Merchant Center → Ürünler → Feed’ler → +** → **Feed oluştur**
   - Ülke: Türkiye  
   - Dil: Türkçe  
   - Hedef: Alışveriş sekmesi / Ücretsiz listelemeler  
   - Giriş yöntemi: **URL ile zamanlanmış çekme** (önerilen)
4. **Feed URL:** `https://equsto.com/feeds/google-products.xml`
5. **Çekme sıklığı:** Günlük (veya GMC’nin önerdiği).
6. **Search Console bağlantısı** — GMC ↔ Search Console aynı mülk (`equsto.com`).
7. **Kargo ve iade** — GMC’de mağaza politikaları (B2B için net teslimat süresi + iletişim).
   - **İade politikası URL:** `https://equsto.com/iade-politikasi` (veya `https://equsto.com/iade-politikasi.html`)
   - Deploy sonrası her iki adres de aynı içeriği göstermelidir.
8. **İlk doğrulama** — Feed işlendikten sonra **Teşhis** sekmesinde hataları düzeltin.

## Feed’e dahil olan ürünler

- `fiyat_tl` veya `price` alanından **KDV dahil TRY** hesaplanır.
- Görsel (`images[]`) ve geçerli `/shop/{dept}/{slug}` URL’si zorunlu.
- **Hariç:** “Teklif için iletişim”, yalnızca EUR fiyat, görsel yok, departman eşleşmeyen satırlar.

Tüm katalog (teklif ürünleri dahil) denemek için:  
`?includeQuote=1` (GMC’de çoğu reddedilir; test amaçlı).

## Sık GMC hataları

| Hata | Çözüm |
|------|--------|
| Geçersiz fiyat | `price` metninde TRY; `fiyat_tl` güncel mi kontrol edin |
| Görsel 404 | `/images/catalog/...` veya `/data/images/...` canlıda açılıyor mu |
| Görsel çok küçük | GMC min **500×500** (önerilen **800×800**). Cafemarkt `-K` = 250px — `-B` kullanın: `npm run catalog:atalay:gmc-images -- --model="E AEI - 360"` |
| Yanlış görsel (varyant) | Düz / nervürlü / krom karışması — `scripts/fetch-atalay-gmc-images.mjs` model eşlemesi |
| Eksik açıklama | `specs` / `name` boş ürünleri katalogdan düzeltin |
| Kimlik (GTIN) | Feed `identifier_exists=false` — normaldir, MPN/SKU kullanılır |

## WooCommerce?

**Kurmayın.** GMC, Search Console’daki “Başlayın” sihirbazında WooCommerce’i **kolay entegrasyon** olarak listeler; Equsto zaten özel katalog kullanıyor. Feed URL yeterli.

## İlgili dosyalar

- `lib/google-merchant-feed.ts` — feed mantığı
- `app/feeds/google-products.xml/route.ts` — canlı endpoint
- `scripts/build-google-merchant-feed.mjs` — yerel XML üretimi
