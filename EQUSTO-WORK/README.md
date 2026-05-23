# EQUSTO-WORK

Equsto çalışma alanı — **tek kök**, üç iş kolu.

```
EQUSTO-WORK\
├── PFOS\           Proforma / mutfak
├── E-TICARET\       E-ticaret + Next.js uygulaması (`site\`)
└── BESOS\          Bar design / Vitrum
```

## Uygulama (canlı: Vercel)

| | Yol |
|---|-----|
| **Çalışan Next.js projesi** | `E-TICARET\site\` |
| **Legacy static shop** | `E-TICARET\legacy-public\` (eski `EQUSTO-CURSOR\public` tam kopya) |
| **İlk kurulum** | `cd E-TICARET\site` → `npm install` → `npm run dev` |

Kaynak (henüz silinmedi): `C:\D Disk\EQUSTO-CURSOR\equsto-v2\`

## Vercel (Faz 2)

- Proje: **equsto** → `equsto.com`
- Root Directory (geçiş sonrası): **`E-TICARET/site`**
- Git kökü WORK’e taşınınca Vercel ayarı güncellenir.

## Faz durumu

- **Faz 1 (kopyala):** tamamlandı — `FAZ1-OZET.md`
- **Faz 2 (lokal):** tamamlandı — `FAZ2-OZET.md` (`npm install`, `build`, `pfos:motor:test` OK)
- **Faz 2 (canlı):** Vercel Root güncelle + deploy (panel)
- **Faz 3:** eski yolları sil (onay sonrası)

## Cursor

- Agent kuralları: `E-TICARET\site\.cursor\`
- WORK manifest: her kol `00-INDEX.md`
