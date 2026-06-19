# PFOS komutları

Tüm komutlar `equsto-v2` kökünden:

```bash
cd "c:\D Disk\EQUSTO-CURSOR\equsto-v2"
```

---

## Referans JSON üretimi

```bash
# Arşiv xlsx → pfos-referans-projeler.json
npm run pfos:referans:extract
# veya
python scripts/extract-pfos-referans-projeler.py --root "C:/D Disk/EQUSTO-CURSOR/arşiv/projeler"

# Zone kuralları build
npm run pfos:referans:build

# THC All Day Dining (Bakü PDF + xlsx)
npm run pfos:referans:all-day-dining

# S13-388 (Türk + All Day)
npm run pfos:referans:s13-388
```

---

## Motor testi

```bash
npm run pfos:motor:test
```

DB bağlantısı gerekir (`.env`).

---

## Geliştirme sunucusu

```bash
npm run dev
```

PFOS UI: `/yonetim/pfos`

---

## Bağımlılık (PDF çıkarım)

```bash
pip install pypdf
```
