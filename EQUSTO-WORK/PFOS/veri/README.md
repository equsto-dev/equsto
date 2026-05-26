# PFOS `veri/` — taslak arşiv

Henüz canlı sisteme bağlı değil.

## Klasör yapısı

```
veri/
  proje-veri/              ← Kaynak: PDF, ekipman listeleri (Excel), alt klasörler
  *-PLAN-birlesik.xlsx     ← Üretilmiş: plan ↔ liste eşleştirme
  *-PLAN-alan-listesi.xlsx ← Üretilmiş (varsa, kökte)
  PFOS-OLCEK-MATRISI.*
  PFOS-VERI-ESLESTIRME.xlsx
  *.json, *.py, *.md
  kategori-agaci/        ← PFOS yeme-içecek ağacı + ornek marka havuzu
```

| Konum | Ne |
|--------|-----|
| `proje-veri/` | Sizin PDF + `*-ekipman-listesi.xlsx` + BALIKCI/STEAKHOUSE/… |
| `veri/` (kök) | Script çıktıları: birleşik, ölçek matrisi, JSON |

## Scriptler

| Script | Kaynak | Çıktı |
|--------|--------|--------|
| `pdf-ekipman-batch.py` | `proje-veri/*.pdf` | `proje-veri/*-ekipman-listesi.xlsx` (PDF’den yeniden üretim) |
| `veri-plan-eslestir-ve-olcek.py` | `proje-veri` plan + liste | `veri/*-PLAN-birlesik.xlsx`, `PFOS-OLCEK-*` |

BALIKÇI / STEAKHOUSE: aynı plan PDF, **m² bantına göre** ayrı liste → matriste ayrı satır (80-150, 150-250). Listeler silinmez; `proje-veri` altında kalır.
