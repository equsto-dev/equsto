# 🏢 EQUSTO Admin Panel — Yerinde Yönetim Rehberi

**Tarih:** 31 Mayıs 2026  
**Hedef:** Localhost'ta çalışan, gerçek API ile bağlantılı admin arayüzü  
**Durum:** ✅ Hazır — `/public/admin-panel-standalone.html`

---

## 🚀 Hızlı Başlangıç

### 1) Localhost'ta çalıştırın
```bash
cd E-TICARET/site
npm run dev
```

**Admin panel adresi:**
```
http://localhost:3000/admin-panel-standalone.html
```

### 2) Bearer Token almak
Vercel project settings'den:
```
Vercel → Project → Settings → Environment Variables → Production
→ EQUSTO_ADMIN_BEARER (Göz ikonuna tıklayıp kopyala)
```

**Örnek:**
```
eq_adm_7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o
```

### 3) Admin Panel'e giriş yap
- Token'i yapıştır
- "Tokeni kaydet" ✓ (isteğe bağlı)
- **Giriş Yap** butonuna tıkla

---

## 📋 Modüller & Özellikler

### 📦 Ürünler Sekmesi
**İşlevler:**
- ✅ Ürün listesi (tablo format)
- ✅ Ürün ekleme (yeni)
- ✅ Ürün düzenleme (yakında)
- ✅ Ürün silme

**API İlişkisi:**
```
GET  /api/urunler          → Ürün listesi
POST /api/urunler          → Ürün ekleme
PUT  /api/urunler/{id}     → Ürün güncelleme
DELETE /api/urunler/{id}   → Ürün silme
```

**Giriş Alanları:**
- Ürün Adı (zorunlu)
- SKU / Model Kodu (isteğe bağlı)
- Marka (zorunlu)
- Kategori (zorunlu)
- Fiyat TL, Stok, El. Gücü, Gaz Gücü
- Açıklama
- Durum (Aktif/Pasif)

**Örnek ürün:**
```json
{
  "ad": "4 Açık Alevli Ocak",
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

---

### 💰 Fiyat & Kur Sekmesi
**İşlevler:**
- ✅ Kur bilgisi (EUR → TL, TCMB)
- ✅ Fiyat listesi görüntüleme
- 🔄 Fiyat ekleme/düzenleme (yakında)

**API İlişkisi:**
```
GET  /api/market?kind=kur          → Kur (EUR/TL)
GET  /api/market?kind=fiyatlar     → Fiyat listesi
POST /api/market?kind=fiyatlar     → Fiyat güncelleme
```

**Fiyat örneği:**
```json
{
  "fiyatlar": {
    "inox-tezgah-100": 8500,
    "bulaşık-makine": 45000,
    "ocak-4-alevli": 12500
  }
}
```

---

### 🎯 Kampanya Sekmesi
**İşlevler:**
- ✅ Kampanya oluşturma
- ✅ Kupon kodu ekleme
- 🔄 Kampanya listesi (yakında)

**Kampanya Alanları:**
- Kampanya Adı
- Açıklama
- Başlangıç/Bitiş Tarihi
- Aktif/Pasif

**Kupon Alanları:**
- Kupon Kodu (ör: SUMMER2026)
- İndirim Tutarı (TL) VEYA İndirim Yüzdesi (%)
- Aktif/Pasif

**Veri yapısı:**
```json
{
  "kampanya": {
    "ad": "Yaz İndirimi 2026",
    "desc": "Tüm ürünlerde %15 indirim",
    "start": "2026-06-01",
    "end": "2026-08-31",
    "active": true
  },
  "kupon": {
    "kod": "SUMMER2026",
    "tutar": 0,
    "yuzde": 15,
    "aktif": true
  }
}
```

**API hedefi:**
```
POST /api/eticaret-icerik   → Kampanya/kupon kaydet
GET  /api/eticaret-icerik   → Kampanya/kupon yükle
```

---

### 🏗️ PFOS Referans Sekmesi
**İşlevler:**
- ✅ PFOS referans yükleme (JSON)
- ✅ Referans listesi görüntüleme
- 🔄 Referans düzenleme (yakında)

**JSON Format (yerinde-uretim-20-60.json):**
```json
{
  "kategoriId": "yerinde-uretim",
  "bantId": "20-60",
  "label": "Yerinde üretim 20–60 kişi (Liva Fabrika)",
  "referansM2": 40,
  "kalemSayisi": 18,
  "kalemler": [
    {
      "bolum": "mutfak",
      "poz": "M1",
      "ad": "KUVER UNİTESİ",
      "olcu": "70*70*135",
      "adet": 1
    }
  ]
}
```

**API hedefi:**
```
POST /api/cms?kind=proje-akis   → Referans kaydet
GET  /api/cms?kind=proje-akis   → Referans listesi
```

---

### ⚙️ Kontrol Sekmesi
**İşlevler:**
- ✅ API sağlık kontrolü
- ✅ Token doğrulama
- ✅ Katalog durumu

**Kontrol Noktaları:**
- `/api/urunler` → GET (Ürün listesi)
- `/api/market?kind=kur` → GET (Kur)
- `/api/eticaret-icerik` → POST (Kampanya)
- `/api/cms?kind=proje-akis` → GET (PFOS)

---

## 🔐 Güvenlik & Token Yönetimi

### Token'in Nerede?
```
.env.local (yerel)
├── EQUSTO_ADMIN_BEARER=eq_adm_...

Vercel (production)
├── Settings → Environment → Production
└── EQUSTO_ADMIN_BEARER=eq_adm_...
```

### Token Kontrolü
```javascript
// Admin panel bu işi otomatik yapıyor:
Authorization: Bearer ${adminToken}

// API:
if (!authToken || authToken !== process.env.EQUSTO_ADMIN_BEARER) {
  return 401 Unauthorized
}
```

### localStorage Güvenliği
- ✅ Token localStorage'da tutulabilir (dev ortamı)
- ❌ Production'da: Her oturum sonunda temizle
- ⚠️ HTTPS kullan (Vercel otomatik)

---

## 🐛 Sorun Giderme

### Hata: "Token boş"
```
→ Vercel'den token kopyalandı mı?
→ Clipboard'dan doğru yapıştırıldı mı?
→ Fazladan boşluk var mı? (.trim() ekli)
```

### Hata: "HTTP 401"
```
→ Token Vercel EQUSTO_ADMIN_BEARER ile eşleşiyor mu?
→ .env.local'da doğru token var mı?
→ npm run dev yeniden başlatıldı mı?
```

### Hata: "Ürünler yüklenemedi"
```
→ Supabase bağlantısı aktif mi?
→ DATABASE_URL .env.local'da tanımlı mı?
→ npm run db:migrate:deploy çalıştırıldı mı?
```

### CORS Hatası
```
→ API localhost:3000 üzerinden çalışıyor mı?
→ next.config.ts rewrites doğru yapılandırılmış mı?
```

---

## 📊 Veri Akışı

```
┌─────────────────────────────────────────────┐
│      Admin Panel (HTML + JS)                │
│   admin-panel-standalone.html               │
└────────────┬────────────────────────────────┘
             │
             │ apiCall(method, endpoint, data)
             │ Headers: Authorization: Bearer ${token}
             │
             ▼
┌─────────────────────────────────────────────┐
│    Next.js API Routes                       │
│  app/api/urunler/                           │
│  app/api/market/                            │
│  app/api/cms/                               │
│  app/api/eticaret-icerik/                   │
└────────────┬────────────────────────────────┘
             │
             │ assertAdminBearer(req)
             │ db.product.create/update/delete
             │
             ▼
┌─────────────────────────────────────────────┐
│    Supabase / PostgreSQL                    │
│  Products, Brands, Categories               │
│  CMS Data, PFOS References                  │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Geliştirme Checklist

### Fase 1: Ürün Yönetimi (✅ Tamamlandı)
- [x] Ürün listesi
- [x] Ürün ekleme modal
- [ ] Ürün düzenleme
- [ ] Ürün silme (confirm)
- [ ] Toplu silme
- [ ] CSV export

### Fase 2: Fiyat & Kur (🔄 Devam ediyor)
- [x] Kur görüntüleme
- [ ] Fiyat CRUD
- [ ] Fiyat toplu güncelleme
- [ ] Geçmiş kur verileri
- [ ] Alert: Kur değişimi

### Fase 3: Kampanya (🔄 Devam ediyor)
- [x] Kampanya oluşturma
- [x] Kupon ekleme
- [ ] Kampanya listesi + filtreleme
- [ ] Kupon yönetimi
- [ ] İndirim hesaplama

### Fase 4: PFOS (🔄 Planlanmış)
- [ ] Referans yükleme
- [ ] Referans listesi
- [ ] Referans düzenleme
- [ ] Kalem CRUD
- [ ] JSON validator

### Fase 5: İleri Özellikler
- [ ] Rol tabanlı erişim
- [ ] Aktivite günlüğü
- [ ] Toplu ürün import (CSV/Excel)
- [ ] Canlı arama
- [ ] Dashboard KPI

---

## 📖 Kullanım Örnekleri

### Yeni Ürün Ekleme
```bash
1. Ürünler sekmesine git
2. "+ Yeni Ürün" tıkla
3. Formu doldur:
   - Ad: "4 Açık Alevli Ocak"
   - Marka: "Öztiryakiler"
   - Kategori: "mutfak"
   - Fiyat: 12500
   - Stok: 5
4. "Kaydet" tıkla
```

### Kampanya Oluşturma
```bash
1. Kampanya sekmesine git
2. "+ Kampanya Oluştur" tıkla
3. Doldur: "Yaz İndirimi 2026"
4. Tarih: 01.06.2026 — 31.08.2026
5. Aktif ✓
6. "Oluştur" tıkla
```

### PFOS Referans Yükleme
```bash
1. PFOS Referans sekmesine git
2. "+ Referans Yükle" tıkla
3. JSON'ı kopyala/yapıştır (yerinde-uretim-20-60.json)
4. "Yükle" tıkla
5. Tablo'da görünür
```

---

## 🔗 İlişkili Dosyalar

| Dosya | Rol | Bağlantı |
|-------|-----|----------|
| `admin-panel-standalone.html` | Frontend | This file |
| `app/api/urunler/.../route.ts` | Backend | CRUD logic |
| `lib/pro-admin-client.ts` | Helper | Older React wrapper |
| `app/yonetim/(panel)/urunler/page.tsx` | Next.js admin | UI component |
| `public/admin-eticaret-api.js` | Legacy | Kampanya API |

---

## 📞 İletişim & Destek

- **Sorunlar:** GitHub Issues
- **Özellik İsteği:** Discussions
- **Belgeler:** `/docs/`

**Sürüm:** 1.0.0-beta  
**Son Güncelleme:** 31 Mayıs 2026
