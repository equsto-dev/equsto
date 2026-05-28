# PFOS referans proformalar (2017 projeler)

Gerçek Equsto proforma Excel dosyalarından mutfak **bölüm** (zone) çıkarımı ve PFOS kurallarına aktarım.

## Dosyalar

| Çıktı | Açıklama |
|-------|----------|
| `public/data/pfos-referans-projeler.json` | Proje bazlı zone listesi + `typical_tip_kodu` |
| `public/data/pfos-zone-proje-kurallari.json` | Konsept → `pfos_zones` kuralları (PFOS adım 06) |
| `public/data/pfos-zone-catalog.json` | Zone başına ürün şablonları (teklif satırları) |

## Kaynak xlsx (yerel)

```
C:/D Disk/EQUSTO-CURSOR/arşiv/projeler/
<EQUSTO16052026>/EQUSTO-CURSOR/projeler/
  2017-050 DOUBLETREE HILTON TOPKAPI/2017-050.xlsx
  2017-044 THC BAKÜ +/2017-044-6.1.xlsx
  2017-120 SÜTİŞ MERSİN/2017-120.xlsx
  2017-204 VADİİSTANBUL/2017-204-4.xlsx
```

## Komutlar

```bash
cd equsto-v2
python scripts/extract-pfos-referans-projeler.py --root "D:/EQUSTO16052026/EQUSTO-CURSOR/projeler"
npm run pfos:referans:build
```

`status: ok` satırları xlsx’ten gelir; `manual_curated` geçici kürasyon (xlsx yokken). Çıkarım sonrası `manual_curated` projeleri gözden geçirip zone isimlerini düzeltin.

## Konsept profilleri (özet)

| Proje | Konsept | Dükkan (PFOS) | Not |
|-------|---------|---------------|-----|
| 2017-050 DoubleTree | Hotel | 5 Yıldız Otel | Otel ana mutfak |
| 2017-044 THC Bakü | Restaurant | All Dining Cafe (…Happymoons) | **All Day Cafe** — otel değil |
| 2017-120 Sütiş Mersin | Restaurant | **Türk Restoran** | Pastane konsepti değil |
| 2017-204 Vadistanbul | Restaurant | Food Court / Çoklu outlet | AVM merkezi mutfak |

## PFOS entegrasyonu

- `pfos.html` yükler: `pfos-zone-proje-kurallari.json`
- `pfosSuggestZones()` → Hotel / Restaurant / Pastane için referans profil zone listesi
- `PFOS_STATION_TO_ZONE` → `station_label_map` ile genişletilir (Sıcak Mutfak, Banket, Üretim…)
