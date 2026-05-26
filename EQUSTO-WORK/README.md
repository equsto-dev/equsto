# EQUSTO-WORK

Equsto çalışma alanı — **tüm site ve modüller burada.**

```
EQUSTO-WORK\
├── E-TICARET\
│   ├── site\              ← Canlı uygulama (Next.js + public vitrin) — Vercel kökü
│   └── legacy-public\     ← Eski kök public/ arşivi
├── BESOS\                 Bar Design / Vitrum kaynak
├── PFOS\                  Proje Fabrikası dokümantasyon
├── repo-scripts\          Eski EQUSTO-CURSOR/scripts (pack, deploy, katalog)
├── docs\                  Repo dokümantasyonu
└── external\              Harici referans scrape’leri
```

## Hızlı başlangıç

```powershell
cd E-TICARET\site
copy .env.example .env.local
npm install
npx prisma migrate deploy
npm run dev
```

## Vercel (equsto.com)

- **Root Directory:** `EQUSTO-WORK/E-TICARET/site`
- Deploy rehberi: `E-TICARET/site/docs/CANLI-DEPLOY.md`

## Eski yollar (kaldırıldı)

| Eski | Yeni |
|------|------|
| `EQUSTO-CURSOR/equsto-v2/` | `EQUSTO-WORK/E-TICARET/site/` |
| `EQUSTO-CURSOR/public/` | `EQUSTO-WORK/E-TICARET/legacy-public/` |
| `EQUSTO-CURSOR/scripts/` | `EQUSTO-WORK/repo-scripts/` |
