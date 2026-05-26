# PFOS — Yeme-İçecek kategori ağacı

Konsept / teklif motoru için **işletme tipi ağacı**. AVM veya kat hiyerarşisi yok.

## Ana dosya

| Dosya | İçerik |
|--------|--------|
| **`pfos-yeme-icecek-agaci.json`** | Üst segment → konsept (`motorSlug`, m², bantlar) + `ornekMarkalar` |
| `SEMA.md` | Mermaid şemaları |

## Örnek marka havuzu (yardımcı)

`ornekler/` — dış listelerden çekilmiş **düz işletme adları** (Zorlu/Kanyon kaynaklı). PFOS ağacına otomatik tahminle dağıtılır; eşleşmeyenler `eslesmeyenOrnekler` içinde.

| Dosya | Adet |
|--------|------|
| `ornekler/zorlu-yeme-icecek.json` | 57 |
| `ornekler/kanyon-yeme-icecek.json` | 41 |

## Üretim

```powershell
cd "C:\D Disk\EQUSTO-WORK\PFOS\veri"

# İsteğe bağlı: örnek listeleri yenile
python ornek-isletme-listesi-cek.py zorlu
python ornek-isletme-listesi-cek.py kanyon

# PFOS ağacını oluştur / güncelle
python pfos-yeme-icecek-agaci-olustur.py
```

## Şema (özet)

```
Yeme-İçecek (kok)
├── Restaurant
│   ├── Steakhouse      [motor: steakhouse]
│   ├── Balıkçı         [motor: balikci]
│   ├── Kebap & Ortadoğu
│   └── …
├── Kafe
│   └── Coffee Shop     [motor: coffee-shop]
└── Fast food
    └── Fast food / QSR [planlanan]
```

Canlı siteye bağlı değil — `veri/` taslağı.
