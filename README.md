# Equsto

Türkiye merkezli endüstriyel mutfak platformu — **tek kaynak klasör:** [`EQUSTO-WORK/`](EQUSTO-WORK/).

| Modül | Konum |
|--------|--------|
| **Canlı site (Next.js + statik vitrin)** | [`EQUSTO-WORK/E-TICARET/site/`](EQUSTO-WORK/E-TICARET/site/) |
| Besos / Bar Design kaynak | [`EQUSTO-WORK/BESOS/`](EQUSTO-WORK/BESOS/) |
| PFOS dokümantasyon | [`EQUSTO-WORK/PFOS/`](EQUSTO-WORK/PFOS/) |
| Repo script’leri (pack, deploy, katalog) | [`EQUSTO-WORK/repo-scripts/`](EQUSTO-WORK/repo-scripts/) |
| Eski statik vitrin (arşiv) | [`EQUSTO-WORK/E-TICARET/legacy-public/`](EQUSTO-WORK/E-TICARET/legacy-public/) |
| GitHub → Supabase → Vercel | [`EQUSTO-WORK/docs/GITHUB-SUPABASE.md`](EQUSTO-WORK/docs/GITHUB-SUPABASE.md) |

> **Not:** `equsto-v2/` artık `EQUSTO-WORK/E-TICARET/site` sembolik bağlantısıdır (Vercel Root Directory geriye dönük uyumluluk). Yeni projelerde Root Directory doğrudan `EQUSTO-WORK/E-TICARET/site` olmalıdır.

## Hızlı başlangıç

```powershell
cd EQUSTO-WORK/E-TICARET/site
copy .env.example .env.local
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

**Vercel:** Root Directory = `EQUSTO-WORK/E-TICARET/site`

**Canlı deploy:** bkz. `EQUSTO-WORK/E-TICARET/site/docs/CANLI-DEPLOY.md`
