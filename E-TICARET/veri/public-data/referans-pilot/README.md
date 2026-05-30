# Steakhouse pilot (S13-117)

Kaynak: `steak.pdf` + `S13-117-8-steakhouse.pdf`

## Alanlar (doğrulanmış)

| Alan | m² |
|------|-----|
| **Brüt toplam** | **270** |
| Masa oturum (salon) | 128 |
| Ön mutfak | 36 |
| Soğuk oda | 6 |
| Derin dondurucu oda | 5 |
| Et & sebze hazırlık | 10 |
| Pişirme | 10 |
| İçecek & servis | 10 |
| Soğuk hazırlık | 8 |
| Hamur hazırlık | 9 |
| Kuru depo | 8 |
| Bulaşık yıkama | 16 |
| *Mutfak bölümleri toplamı* | *118* |

**Onaylı** (2026-05-23): PFOS toplam alan **270 m²**; salon **128 m²** ayrı; mutfak bölümleri **118 m²**. **Yer ızgaraları (Y)** mutfaktadır → zone `izgara_meze` (salon değil).

## Dosyalar

- `S13-117-steakhouse-pilot.json` — m² + 74 ekipman kalemi
- `steak-pilot-extract.json` — ham çıkarım

```bash
cd equsto-v2
python scripts/build-steakhouse-pilot.py
```
