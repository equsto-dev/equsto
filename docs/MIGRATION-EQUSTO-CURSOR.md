# EQUSTO-CURSOR kaldirildi — Git artik EQUSTO-WORK''te

## Ne yapildi?

1. `.git` ve `.github` → `C:\D Disk\EQUSTO-WORK` (GitHub `main` ile senkron)
2. `EQUSTO-WORK\EQUSTO-WORK` → kendine junction (Git yollari `EQUSTO-WORK/E-TICARET/...` ile uyumlu)
3. `C:\D Disk\EQUSTO-CURSOR` → bos; guvenle silebilirsiniz

## Gunluk kullanim

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
npm run dev
git -C "C:\D Disk\EQUSTO-WORK" status
```

## Vercel

Root Directory: `EQUSTO-WORK/E-TICARET/site` (panelde kontrol edin).

## Yedek klon

`C:\D Disk\EQUSTO-RECOVER` — dogruladiktan sonra silebilirsiniz.
