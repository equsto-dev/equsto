# Codex handoff — `/yonetim/pfos` (Equsto Yönetim · PFOS)

**Canlı:** https://equsto.com/yonetim/pfos  
**Kaynak kod (tek düzenlenebilir kök):** `C:\D Disk\EQUSTO-WORK\E-TICARET\site\`  
**Dosya paketi:** `PFOS/codex/yonetim-pfos-bundle/` (bu klasördeki ayna)

---

## 1. Panel ne yapar?

Ant Design Pro tabanlı yönetim sayfası. Giriş: `/yonetim/giris` → Bearer `EQUSTO_ADMIN_BEARER` (localStorage: `equsto_pro_admin_token`).

| Sekme | Bileşen | İşlev |
|-------|---------|--------|
| **Teklif oluştur** | `PfosProWizard` | Konsept → adres → m² bölümler → `POST /api/pfos/quote` → Proforma v14 + Excel |
| **Kategoriler** | `PfosKategoriPanel` | Steakhouse / Balıkçı m² bantlı Excel → `public/data/pfos-referans/*.json` |
| **Proje akışı (A)** | `PfosProjeAkisPanel` | Sorular, shopTypes, rules, eqSets, products → `proje-akis.json` |
| **Mutfak projeleri** | `PfosProjeList` | Arşiv referans projeler tablosu (`/api/pfos/projects`) |
| **Özet & legacy** | `PfosOzetPanel` | Sayaçlar + `admin.html` / canlı `/pfos` linkleri |

Müşteri vitrini **ayrı:** `/pfos` (`PfosPublicWizard`, `pfos.html` legacy gövde).

---

## 2. Giriş noktası

```text
app/yonetim/(panel)/pfos/page.tsx   ← 5 sekme Tabs
  ├── PfosProWizard
  ├── PfosKategoriPanel
  ├── PfosProjeAkisPanel
  ├── PfosProjeList
  └── PfosOzetPanel (inline)

app/yonetim/(panel)/layout.tsx      → ProShell
components/pro/pro-shell.tsx        → menü, token guard
lib/pro-admin-client.ts             → tüm panel API çağrıları
```

---

## 3. API haritası

| Endpoint | Auth | Kullanan sekme |
|----------|------|----------------|
| `GET /api/pfos/concepts` | Hayır | Teklif — konsept listesi |
| `POST /api/pfos/quote` | Hayır | Teklif — motor |
| `GET /api/pfos/kategoriler` | Bearer | Kategoriler — manifest |
| `POST /api/pfos/kategoriler` | Bearer | Kategoriler — Excel upload (multipart) |
| `DELETE /api/pfos/kategoriler?kategori=&bant=` | Bearer | Kategoriler — liste sil |
| `GET /api/pfos/projects` | Hayır | Mutfak projeleri |
| `GET /api/proje-akis` | Okuma açık* | Proje akışı, Özet |
| `POST /api/proje-akis` | Bearer | Proje akışı kaydet |
| `GET /api/kur` | Hayır | Teklif — TCMB EUR |

\* Rewrite: `next.config.ts` → `/api/proje-akis` → `/api/cms?kind=proje-akis`  
Disk: `public/data/proje-akis.json` (Vercel’de `writeJsonFile` → `data/proje-akis.json`)

**Motor:** `lib/pfos/api-handlers.ts` → `pfosPostQuote`, `pfosGetConcepts`  
**Şablonlar:** `lib/pfos/core/templates/index.ts` + `lib/pfos/referans/*`  
**Steakhouse/balıkçı Excel listeleri:** `lib/pfos/kategoriler/store.ts` → `public/data/pfos-referans/`

---

## 4. Ortam değişkenleri

| Değişken | Rol |
|----------|-----|
| `EQUSTO_ADMIN_BEARER` | Yönetim POST/DELETE (kategoriler, proje-akis kayıt) |
| Vercel root | `E-TICARET/site` |

Yerel test:

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
npm run dev
# http://localhost:3000/yonetim/giris → token yapıştır
# http://localhost:3000/yonetim/pfos
npm run pfos:motor:test
```

---

## 5. Dosya ağacı (panel + motor — özet)

### UI — yönetim

```text
components/pro/pro-shell.tsx
components/pfos/pro/PfosProWizard.tsx      (~740 satır, ana sihirbaz)
components/pfos/pro/PfosKategoriPanel.tsx
components/pfos/pro/PfosProjeAkisPanel.tsx
components/pfos/pro/PfosProjeList.tsx
components/pfos/pro/PfosTeklifProTable.tsx
components/pfos/TeklifV14Proforma.tsx
components/pfos/steps/{KonseptStep,BolumM2Step,AdresStep}.tsx
```

### API routes

```text
app/api/pfos/route.ts
app/api/pfos/concepts/route.ts
app/api/pfos/quote/route.ts
app/api/pfos/kategoriler/route.ts
app/api/pfos/projects/route.ts
app/api/cms/route.ts                       (proje-akis GET/POST)
app/api/yonetim/bearer/route.ts            (token doğrulama)
```

### Motor (`lib/pfos/` — tam paket bundle’da)

```text
lib/pfos/api-handlers.ts
lib/pfos/schemas/pfos.schema.ts
lib/pfos/core/{index,unified-motor,shop-catalog-match,zone-catalog-loader,templates/}
lib/pfos/referans/**                       (konsept başına referans builder)
lib/pfos/kategoriler/{registry,store,parse-ekipman-xlsx}.ts
lib/pfos/teklif/**                         (v14 map, export, format)
lib/pfos/wizard/{types,profiles,quick-mode,zone-labels,parse-concepts}.ts
lib/pfos/proje-akis/**                     (sorular, konsept tanımları, unwrap)
lib/pfos/projects/{types,load-projects}.ts
```

### Veri (canlı / referans)

```text
public/data/pfos-kategoriler.json          ← manifest (Kategoriler sekmesi)
public/data/pfos-referans/                 ← Excel’den üretilen listeler
public/data/proje-akis.json
public/data/pfos-zone-catalog.json
public/data/pfos-referans-projeler.json
public/data/pfos-konseptler.json
```

### Legacy (panelden link)

```text
public/admin.html                          ← tam PFOS admin (PDF/Excel import, soru editörü)
public/pfos-template-api.js                ← müşteri /pfos template API
public/pfos-teklif-ui.js, pfos-rule-engine.js, …
```

---

## 6. Codex’e verirken

1. Bu dosyayı + `codex/yonetim-pfos-bundle/` klasörünü zip’leyin veya repo kökünden path verin.
2. İlk prompt örneği:

```text
Equsto /yonetim/pfos yönetim paneli. Kök: E-TICARET/site.
Giriş: app/yonetim/(panel)/pfos/page.tsx, motor: lib/pfos/api-handlers.ts.
[Görevinizi yazın — örn. yeni konsept, kategori Excel kolonu, proje akışı sorusu]
```

3. **Dikkat:** `public/data/pfos-referans/*.json` büyük olabilir; bundle’da yalnızca `pfos-kategoriler.json` + örnek bir liste var. Tam referans için `npm run pfos:referans:*` scriptlerine bakın (`package.json`).

---

## 7. İlgili dokümanlar (site içi)

| Dosya | Konu |
|-------|------|
| `site/PFOS/07-PROJE-AKIS-REHBER.md` | Proje akışı + özet sayaçları |
| `site/PFOS/05-KOD-VE-VERI-HARITASI.md` | Motor / JSON haritası |
| `site/docs/PFOS-TEKLIF-SABLONU.md` | Proforma v14 |
| `site/docs/YONETIM-PRO.md` | Tüm yönetim rotaları |
| `site/docs/PFOS-SEKTOR-TAKSONOMISI.md` | Sektör taksonomisi planı |

---

## 8. Son commit bağlamı

Panel steakhouse/balikci için `POST /api/pfos/quote` + kategori Excel yolunu kullanır. Production’da `pfos-zone-catalog.json` için CDN fallback: `lib/legacy-data.ts` + `zone-catalog-loader.ts`.

*Paket oluşturma:* `PFOS/scripts/bundle-yonetim-pfos-for-codex.ps1`
