# Faz A — Güvenlik protokolü

## Ne yaptık?
- Repodan **~22.000 dosyayı Git takibinden çıkardık** (`git rm --cached`)
- **Diskte hiçbir dosya silinmedi** — mirror, equsto-v2, arşivler yerelde duruyor

## Tekrar silmeyi nasıl engelleriz?

| Kural | Açıklama |
|-------|----------|
| **Allowlist** | Sadece `scripts/faz-a-safe-repo-cleanup.mjs` içindeki path'ler |
| **`--cached` zorunlu** | Repodan çıkarma = index; disk korunur |
| **Yasak komutlar** | `rm -rf`, `git clean`, geniş `Remove-Item -Recurse` |
| **Repo sınırı** | `C:\D Disk\EQUSTO-WORK` dışına yazma/silme yok |
| **Cursor kuralı** | `.cursor/rules/git-safe-operations.mdc` |

## Canlı site
Deploy kökü yalnızca **`E-TICARET/site`** — buna toplu silme uygulanmaz.

**Önemli:** `public/*-KILIT.txt` dosyaları Git'te **kalmalı** — `vercel-prebuild` deploy doğrulaması bunları arar. Faz A'da yanlışlıkla untrack edilmişti (2026-05-30 deploy hatası).

## Tekrar çalıştırma
```bash
node scripts/faz-a-safe-repo-cleanup.mjs --dry-run
node scripts/faz-a-safe-repo-cleanup.mjs
```
