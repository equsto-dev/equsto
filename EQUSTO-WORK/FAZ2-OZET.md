# Faz 2 — Lokal doğrulama (2026-05-23)

## Tamamlanan

| Adım | Sonuç |
|------|--------|
| `equsto-v2` → `E-TICARET\site` sync | Güncel |
| `npm install` | OK (594 paket) |
| `npm run db:generate` | OK |
| `npm run build` | OK (Next 16.2.6) |
| `npm run pfos:motor:test` | OK (6 konsept) |
| TS düzeltme | `PfosProWizard.tsx` — `Alert` `loading` prop kaldırıldı |

**Çalışma dizini:** `C:\D Disk\EQUSTO-WORK\E-TICARET\site`

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
npm run dev
```

## Vercel geçişi (sizin panel)

`EQUSTO-WORK` şu an **git dışında** (`C:\D Disk\EQUSTO-WORK`). Canlı deploy hâlâ `EQUSTO-CURSOR` → `equsto-v2`.

### Seçenek A — Hızlı (bugün canlı, eski yol)

1. Değişiklikleri `equsto-v2` ile senkron tutun (robocopy veya Cursor’da her iki klasör).
2. Vercel Root Directory: **`equsto-v2`** (değişmez).
3. `main` push → Redeploy.

### Seçenek B — seçildi ✅

- Junction: `EQUSTO-CURSOR\EQUSTO-WORK` → `C:\D Disk\EQUSTO-WORK`
- Git: `EQUSTO-WORK` repoya eklendi; CI `equsto-site-ci.yml`
- **Sizin panel:** Vercel → Root Directory = **`EQUSTO-WORK/E-TICARET/site`** → Redeploy (cache kapalı)
- Doğrula: `https://equsto.com/yonetim/pfos`, `/besos`

## Doğrulama listesi (canlı)

- [ ] Ana sayfa / mağaza
- [ ] `/yonetim/pfos` — teklif, kur satırı
- [ ] `/besos`
- [ ] `GET /api/kur`

## Faz 3

Canlı OK → eski `equsto-v2` ve dağınık deploy kopyalarını sil.
