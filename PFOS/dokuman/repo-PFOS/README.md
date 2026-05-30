# PFOS — çalışma klasörü

Equsto **Proforma / PFOS** motoru, referans proformalar, sektör taksonomisi ve `/yonetim/pfos` eğitimi için **tek derleme noktası**.

> Kod ve JSON çıktıları repoda kalır; bu klasör **kararları, listeleri, kaynak dosya yollarını ve yol haritasını** toplar.

## Aynı çalışma alanı — diğer konumlar

| Konum | Amaç |
|-------|------|
| **`equsto-v2/PFOS/`** (burası) | Ana derleme — tüm `.md` dosyalar |
| **`equsto-v2/docs/PFOS/`** | Teknik planlar (`PFOS-DB-*`, `PFOS-TEKLIF-*`) |
| **`EQUSTO-CURSOR/PFOS/`** | Monorepo kök indeksi |
| **`Masaüstü/PFOS/`** | PDF / proforma kaynakları (OneDrive) |
| **`.cursor/PFOS/`** | Cursor IDE agent bağlamı + `rules/pfos.mdc` |
| **Cursor workspace** | `%USERPROFILE%\.cursor\projects\…-equsto-v2\PFOS\` |

---

## İçindekiler

| Dosya | Konu |
|-------|------|
| [00-OZET.md](./00-OZET.md) | Tüm konuşmaların kronolojik özeti |
| [01-SEKTOR-TAKSONOMI.md](./01-SEKTOR-TAKSONOMI.md) | Restaurant & Cafe, 28’lik liste, 10 segment, API |
| [02-REFERANS-PROJELER.md](./02-REFERANS-PROJELER.md) | THC, S13-388, Espressolab, arşiv xlsx |
| [03-WIZARD-VE-API.md](./03-WIZARD-VE-API.md) | Detay sorusu, endpoint hedefleri |
| [04-UYGULANAN-TEKNIK.md](./04-UYGULANAN-TEKNIK.md) | Ölçü, kur, UI, referans kodu (yapıldı) |
| [05-KOD-VE-VERI-HARITASI.md](./05-KOD-VE-VERI-HARITASI.md) | Dosya yolları, script’ler |
| [06-ACIK-KARARLAR.md](./06-ACIK-KARARLAR.md) | Bekleyen kararlar checklist |
| [07-KOMUTLAR.md](./07-KOMUTLAR.md) | npm / python komutları |
| [kaynaklar/DOSYA-YOLLARI.md](./kaynaklar/DOSYA-YOLLARI.md) | Masaüstü PDF, arşiv xlsx tam yollar |

---

## Repodaki diğer PFOS dokümanları

| Konum | İçerik |
|-------|--------|
| `docs/PFOS-REFERANS-PROJELER.md` | xlsx zone çıkarımı |
| `docs/PFOS-TEKLIF-SABLONU.md` | Teklif / Excel layout |
| `docs/PFOS-DB-ENTEGRASYON-PLANI.md` | Prisma / katalog |
| `docs/PFOS-SEKTOR-TAKSONOMISI.md` | Taksonomi (bu klasörle senkron; tercih: **PFOS/**) |

---

## Hızlı durum (2026-05-23)

| Alan | Durum |
|------|--------|
| Motor konseptleri | 6 slug (`coffee-shop`, `all-day-dining-cafe`, `turk-restoran`, …) |
| Referans profiller | THC Bakü/Kayseri, S13-388, Espressolab şubeler |
| Taksonomi (10 segment) | Dokümante — **koda taşınmadı** |
| Detay seviyesi sorusu | Dokümante — **UI’da yok** |
| API genişletmesi | Dokümante — kısmen `POST /api/pfos/quote` |

---

## Sonraki adımlar (öneri)

1. `pfos-sektor-taksonomisi.json` + wizard iki adımlı seçim  
2. `DetaySeviyesiStep` + `PFOSRequest.detaySeviyesi`  
3. `/yonetim/pfos` referans seçici (THC vs S13 vs Espressolab)  
4. Teşhir vitrinleri: segment bazlı zorunlu/tavsiye kararı  
