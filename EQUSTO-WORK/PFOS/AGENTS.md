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

## `veri\` — henüz sisteme dahil değil

`PFOS\veri\` altında **üretilmiş** birleşik/ölçek/JSON ve scriptler; kaynaklar `veri\proje-veri\` (PDF, ekipman listeleri, alt klasörler).

**Yönetim:** `/yonetim/pfos` → **Kategoriler** sekmesi — Steakhouse / Balıkçı, m² bantlı Excel yükleme → `E-TICARET/site/public/data/pfos-referans/`. İlk doldurma: `node E-TICARET/site/scripts/seed-pfos-kategoriler.mjs`.

**Kullanıcı “tamam” demeden yapma:**

- `E-TICARET\site\public\data\`, `lib\pfos\`, wizard (`pfos.html`) veya API’ye kopyalama / import
- `listeler\`, `kaynaklar\` veya motor referanslarına otomatik bağlama
- Deploy veya sync script’lerine `veri\` yolunu ekleme

**Yapılabilir:** parse, Excel üretimi, yerel inceleme — yalnızca `veri\` içinde.

Onay sonrası taşıma: kullanıcı hangi dosyaların canlıya geçeceğini söyler; o zaman site yollarına alınır.

## Komutlar (site dizininde)

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
npm run dev
npm run pfos:motor:test
npm run pfos:referans:all-day-dining
npm run pfos:referans:s13-388
```

Canlı: Vercel root `EQUSTO-WORK/E-TICARET/site` → equsto.com
