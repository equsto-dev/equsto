# PFOS — Cursor agent

**Workspace kökü:** `C:\D Disk\EQUSTO-WORK\PFOS\`

## Kod nerede?

| Ne | Yol |
|----|-----|
| **Düzenlenecek kod (tek kaynak)** | `..\E-TICARET\site\` |
| PFOS motor | `..\E-TICARET\site\lib\pfos\` |
| UI | `..\E-TICARET\site\components\pfos\` |
| Yönetim | `..\E-TICARET\site\app\yonetim\(panel)\pfos\` |
| JSON (canlı) | `..\E-TICARET\site\public\data\pfos-*.json` |
| Bu klasördeki `kod\` | **ayna** — önce site, sonra `scripts\sync-pfos-mirrors.ps1` |

Eski yol `EQUSTO-CURSOR\equsto-v2` kullanma.

## Doküman

- `00-INDEX.md`, `dokuman\repo-PFOS\00-OZET.md`
- Listeler: `listeler\pfos-*.json`
- Kaynak PDF: `kaynaklar\`

## `veri\` — kaynak; canlı veri site’de

`PFOS\veri\` altında **üretilmiş** birleşik/ölçek/JSON ve scriptler; kaynaklar `veri\proje-veri\` (PDF, ekipman listeleri, alt klasörler).

**Canlı (E-TICARET/site):**

| Ne | Yol |
|----|-----|
| m² bantlı referans listeleri | `public/data/pfos-referans/*.json` |
| Manifest | `public/data/pfos-kategoriler.json` |
| Yönetim UI | `/yonetim/pfos` → **Kategoriler** (Excel yükle) |
| API | `POST/GET/DELETE /api/pfos/kategoriler` |
| PFOS motor | `steakhouse`, `balikci`, `coffee-shop` → `loadReferansProfil` |
| Wizard | `pfos.html` + `pfos-template-api.js` → `POST /api/pfos/quote` |

İlk / yeniden doldurma: `npm run pfos:kategoriler:seed` (kaynak: `PFOS/veri/proje-veri/STEAKHOUSE`, `BALIKCI`).

**Hâlâ `veri\` içinde kalsın (otomatik site’ye taşıma yok):** yeni parse denemeleri, birleşik JSON üretimi, PDF çıkarımları — kullanıcı onayı olmadan `public/data`’ya kopyalama yapma.

## Komutlar (site dizininde)

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
npm run dev
npm run pfos:motor:test
npm run pfos:referans:all-day-dining
npm run pfos:referans:s13-388
```

Canlı: Vercel root `EQUSTO-WORK/E-TICARET/site` → equsto.com
