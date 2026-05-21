# Equsto

Türkiye merkezli endüstriyel mutfak platformu — **yeni omurga** `equsto-v2/` (Next.js + Supabase).

| Modül | Konum |
|--------|--------|
| Yeni mağaza + API | [`equsto-v2/`](equsto-v2/) |
| Legacy statik (geçiş) | [`public/`](public/) |
| GitHub → Supabase → Vercel | [`docs/GITHUB-SUPABASE.md`](docs/GITHUB-SUPABASE.md) |
| Sprint 0 detay | [`equsto-v2/README-SPRINT0.md`](equsto-v2/README-SPRINT0.md) |

## Hızlı başlangıç

```powershell
cd equsto-v2
copy .env.example .env.local
# Supabase URL'leri .env.local'e yapıştır
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Vercel deploy: proje kökü **`equsto-v2`**, env rehberi → `docs/GITHUB-SUPABASE.md`.
