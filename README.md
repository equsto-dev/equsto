# Equsto

Türkiye merkezli endüstriyel mutfak platformu — **canlı uygulama** `EQUSTO-WORK/E-TICARET/site/` (Next.js + Supabase). Junction: [`EQUSTO-WORK/`](EQUSTO-WORK/) → `C:\D Disk\EQUSTO-WORK\`.

| Modül | Konum |
|--------|--------|
| Yeni mağaza + API | [`EQUSTO-WORK/E-TICARET/site/`](EQUSTO-WORK/E-TICARET/site/) |
| Legacy (geçiş) | [`equsto-v2/`](equsto-v2/) — Faz 3’e kadar |
| Legacy statik (geçiş) | [`public/`](public/) |
| GitHub → Supabase → Vercel | [`docs/GITHUB-SUPABASE.md`](docs/GITHUB-SUPABASE.md) |
| Sprint 0 detay | [`equsto-v2/README-SPRINT0.md`](equsto-v2/README-SPRINT0.md) |

## Hızlı başlangıç

```powershell
cd EQUSTO-WORK/E-TICARET/site
copy .env.example .env.local
# Supabase URL'leri .env.local'e yapıştır
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Vercel deploy: Root Directory **`EQUSTO-WORK/E-TICARET/site`**, env rehberi → `docs/GITHUB-SUPABASE.md`.
