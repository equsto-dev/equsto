# Yerel Admin Panel Test Ortamı

## 🚀 Hızlı Başlangıç (5 dakika)

### 1. Token'ı .env.local'a ekle

```bash
cd E-TICARET/site

# .env.local dosyası oluştur/düzenle:
echo "EQUSTO_ADMIN_BEARER=test_token_2026" >> .env.local
```

**Veya Vercel'den gerçek token:**
```bash
# Vercel → Project → Settings → Environment Variables
# EQUSTO_ADMIN_BEARER kopyala

echo "EQUSTO_ADMIN_BEARER=eq_adm_7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o" >> .env.local
```

---

### 2. Veritabanı Hazırlığı

```bash
# Supabase bağlantısı kontrol et
npm run db:push

# Örnek veri ekle (isteğe bağlı)
npm run db:seed
```

**Eğer Supabase bağlantısı yoksa:**
```bash
# Mock mode ile devam et (legacy katalog)
# → Admin panel yine çalışacak ama DB yerine public/data/ekipmanlar.json kullanır
```

---

### 3. Dev Server Başlat

```bash
npm run dev

# Expected output:
# > Ready in 2.1s
# ▲ Next.js 15.0.0
# - Local: http://localhost:3000
```

---

### 4. Admin Panel'i Aç

```
Browser → http://localhost:3000/admin-panel-standalone.html
```

**Giriş:**
- Token: `test_token_2026` (ya da gerçek token)
- "Tokeni kaydet" ✓ (localStorage'da tutulur)
- **Giriş Yap** → 💚 Başarılı!

---

## ✅ Kontrol Listesi

### ✓ API Health Check
```javascript
// Browser Console:
fetch('http://localhost:3000/api/urunler', {
  headers: { Authorization: 'Bearer test_token_2026' }
}).then(r => r.json()).then(console.log)

// Response:
// {success: true, data: [...], count: X, source: "db"}
```

### ✓ Kur API
```javascript
fetch('http://localhost:3000/api/market?kind=kur')
  .then(r => r.json()).then(console.log)

// Response:
// {success: true, kur: 34.5678, updated_at: "2026-05-31T..."}
```

### ✓ Kampanya API
```javascript
fetch('http://localhost:3000/api/eticaret-icerik', {
  headers: { Authorization: 'Bearer test_token_2026' }
}).then(r => r.json()).then(console.log)

// Response:
// {success: true, data: {k: [], kp: [], b: [], ...}}
```

---

## 🧪 Test Senaryoları

### Test 1: Ürün Ekleme
```
✓ Admin Panel → Ürünler → + Yeni Ürün
✓ Formu doldur:
  - Ad: "Test Ürün"
  - Marka: "Testler"
  - Kategori: "mutfak"
  - Fiyat: 9999
✓ Kaydet → "Ürün eklendi" mesajı
✓ Tablo'da görünür
```

### Test 2: Fiyat Kontrol
```
✓ Admin Panel → Fiyat & Kur
✓ EUR → TL kuru görünüyor
✓ Güncelleme zamanı gösteriliyor
```

### Test 3: Token Kaydetme
```
✓ Token girilir
✓ "Tokeni kaydet" ✓
✓ Browser'ı kapatıp yeniden aç
✓ localhost:3000/admin-panel-standalone.html
✓ Token otomatik yüklendi
✓ Çıkış yapıldıktan sonra silinir
```

### Test 4: PFOS Referans
```
✓ PFOS Referans → + Referans Yükle
✓ public/data/pfos-referans/yerinde-uretim-20-60.json
   kopyala + yapıştır
✓ "Yükle" → "PFOS referansı yüklendi"
✓ Tablo'da görünür
```

---

## 🐛 Debugging

### Network Inspector (DevTools)
```
1. Browser → F12 → Network
2. Admin Panel'de işlem yap (ör: Ürün Ekle)
3. Network'te POST /api/urunler görünür
4. Response kontrol et: {success: true} mi?
```

### Console Errors
```javascript
// Browser Console → F12 → Console
// 1. TypeError: Cannot read property 'querySelector'
//    → HTML dosyası yüklü mü?

// 2. Failed to fetch → CORS error
//    → next.config.ts rewrites kontrol et

// 3. 401 Unauthorized
//    → Token doğru mu?
//    → .env.local EQUSTO_ADMIN_BEARER tanımlı mı?
```

### API Test (cURL)
```bash
# Token ile test
curl -H "Authorization: Bearer test_token_2026" \
     http://localhost:3000/api/urunler

# Ürün ekle
curl -X POST \
     -H "Authorization: Bearer test_token_2026" \
     -H "Content-Type: application/json" \
     -d '{"ad":"Test","marka_id":"test","kategori":"mutfak","fiyat_tl":1000}' \
     http://localhost:3000/api/urunler
```

---

## 📁 Dosya Yapısı

```
E-TICARET/site/
├── .env.local                          ← Token burada
├── public/
│   ├── admin-panel-standalone.html     ← Admin Panel (THIS FILE)
│   ├── data/
│   │   └── pfos-referans/
│   │       └── yerinde-uretim-20-60.json
│   └── admin-eticaret-api.js
├── app/
│   ├── api/
│   │   ├── urunler/[...path]/route.ts  ← CRUD
│   │   ├── market/route.ts             ← Kur/Fiyat
│   │   ├── cms/route.ts                ← PFOS
│   │   └── eticaret-icerik/            ← (Not found? Will use admin-eticaret-api.js)
│   └── yonetim/
│       └── (panel)/
│           └── urunler/page.tsx        ← Next.js alternatif
└── docs/
    └── ADMIN-PANEL-YERINDE.md          ← This guide
```

---

## 🔧 Sık Düzeltmeler

### Problem: "POST /api/urunler" 404
**Çözüm:**
```typescript
// next.config.ts - rewrites ekle:
{
  source: "/api/urunler/:path*",
  destination: "/api/urunler/:path*"
}
```

### Problem: Token localStorage'da tutulmuyor
**Çözüm:**
```javascript
// DevTools → Application → Storage → Clear All
// Ya da:
localStorage.clear()

// Tekrar giriş yap
```

### Problem: CORS hatası
**Çözüm:**
```
→ Admin panel aynı domain'de çalışıyor
   (localhost:3000/admin-panel-standalone.html)
→ API de aynı domain (localhost:3000/api/...)
→ Sorun olmamalı
```

---

## 🌐 Vercel'de Deploy

```bash
# 1. Prod token ayarlandı mı?
Vercel → Settings → Environment Variables
EQUSTO_ADMIN_BEARER (Production)

# 2. Deploy et
git push

# 3. Admin panel adresi
https://your-vercel-app.vercel.app/admin-panel-standalone.html

# 4. Prod token'ı yapıştır
→ Giriş Yap
```

---

## 📊 Canlı Örnek Veri

### Ürün Ekle
```json
POST /api/urunler
{
  "ad": "4 Açık Alevli Ocak + Kuziney",
  "sku": "INO-FBE20T",
  "marka_id": "oztiryakiler",
  "kategori": "mutfak",
  "fiyat_tl": 12500,
  "stok": 5,
  "el_guc": 15.5,
  "gaz_guc": 20.3,
  "durum": "aktif"
}
```

### Kampanya Oluştur
```json
POST /api/eticaret-icerik
{
  "k": [{
    "ad": "Yaz İndirimi 2026",
    "desc": "%15 tüm ürünlerde",
    "start": "2026-06-01",
    "end": "2026-08-31",
    "active": true
  }],
  "kp": [{
    "kod": "SUMMER2026",
    "yuzde": 15
  }]
}
```

### PFOS Referans Yükle
```json
POST /api/cms?kind=proje-akis
{
  "kategoriId": "yerinde-uretim",
  "bantId": "20-60",
  "kalemler": [...]
}
```

---

## 📖 Bağlantılar

| Kaynak | URL |
|--------|-----|
| Admin Panel | `http://localhost:3000/admin-panel-standalone.html` |
| Next.js Admin | `http://localhost:3000/yonetim` |
| API Docs | `/docs/ADMIN-PANEL-YERINDE.md` (this file) |
| PFOS Referans | `/public/data/pfos-referans/` |
| Proje Config | `/next.config.ts` |

---

## ✨ Sonraki Adımlar

1. **Ürün Yönetim** → Düzenleme ve toplu silme ekle
2. **Fiyat Dashboard** → Grafiklendirme + tarihsel veriler
3. **Kampanya Analytics** → İndirim etkinliği takip
4. **PFOS Builder** → UI ile referans oluştur
5. **Dışa Aktarma** → CSV/Excel report

---

**Tamamlandı! 🎉**  
Admin panel yerinde test hazır.

Soru? Issue açabilir ya da docs güncelleştirilebilir.
