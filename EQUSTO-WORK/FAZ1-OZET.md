# Faz 1 tamamlandı (2026-05-23)

## Kopyalananlar

| Hedef | Kaynak | Not |
|-------|--------|-----|
| `E-TICARET\site\` | `EQUSTO-CURSOR\equsto-v2\` | 3122 dosya (~321 MB); `node_modules`, `.next`, `.git` hariç |
| `E-TICARET\legacy-public\` | `EQUSTO-CURSOR\public\` | 11983 dosya (~2,6 GB) tam kopya |
| `E-TICARET\veri\public-data\` | `equsto-v2\public\data\` | v2 katalog verisi |
| `E-TICARET\dokuman\` | `equsto-v2\docs\` | deploy, Vercel, Meilisearch… |
| `PFOS\` | doküman, listeler, kaynaklar, kod aynası | 16× `pfos-*.json`, arşiv projeler, masaüstü PDF |
| `BESOS\` | kod aynası, vitrum görseller, bar-design | |
| `E-TICARET\site\.cursor\` | `equsto-work`, `pfos`, `e-ticaret`, `besos` kuralları |
| `PFOS\`, `E-TICARET\`, `BESOS\` | `00-INDEX.md` rehber dosyaları |

## Silinmedi (bilerek)

- `C:\D Disk\EQUSTO-CURSOR\equsto-v2\`
- `C:\D Disk\EQUSTO-CURSOR\public\`
- `.deploy-stage*` vb.

## Faz 2 — sizin adımlar

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
npm install
npm run dev
```

Ardından git’te WORK yapısına geçiş veya `site` içeriğini push → Vercel.

**Vercel:** Project Settings → Root Directory → `E-TICARET/site` (repo yapısına göre).

## Faz 3 — sonra

Eski `equsto-v2` / dağınık deploy kopyaları — yalnızca canlı doğrulama sonrası.
