# Prisma — PFOS + tek katalog birleşimi

**Durum:** Onaylandı ve `prisma/schema.prisma` güncellendi (Mayıs 2026).

## Uygulama

```bash
cd equsto-v2
npx prisma migrate deploy    # production
npx prisma generate          # çıktı: prisma/generated/client (EPERM workaround)
```

### Windows EPERM (kalıcı düzenleme)

1. **Üretim yolu:** `prisma/generated/client` + `engineType = "library"`.
2. **Import:** `@/lib/prisma` ( `@prisma/client` doğrudan kullanılmaz ).
3. **`postinstall`:** artık `prisma generate` çalıştırmaz.
4. **`.env`:** `PRISMA_SKIP_POSTINSTALL_GENERATE=true` (`.env.example`’da var).

```powershell
cd equsto-v2
$env:PRISMA_SKIP_POSTINSTALL_GENERATE="true"
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
npm run db:generate
```

Hâlâ EPERM: Cursor/`next dev` kapat → `scripts\prisma-generate.ps1` → gerekirse PC yeniden başlat.

`package.json` → `imports` ve `next.config.ts` webpack alias `@prisma/client` → `prisma/generated/client`.

Migration: `prisma/migrations/20260521160000_pfos_product_catalog_merge/`

**Not:** İkinci migration `20260521183133_npx_prisma_migrate_dev` yanlışlıkla oluştu (migrate dev sırasında isim olarak komut yapıştırılmış). İçerik: yalnızca `Category_parentId_idx` drop — zararsız. DB ile şema uyumlu.

### `prisma generate` EPERM (Windows)

Başka süreç `query_engine-windows.dll.node` dosyasını kilitliyor (Cursor, `next dev`, antivirüs).

1. `next dev` / production `node` süreçlerini durdurun.
2. Yeni **dış** PowerShell (Yönetici isteğe bağlı):
   ```powershell
   cd "C:\D Disk\EQUSTO-CURSOR\equsto-v2"
   Remove-Item -Recurse -Force node_modules\.prisma\client -ErrorAction SilentlyContinue
   npx prisma generate
   ```
3. Hâlâ EPERM ise Cursor’u kapatıp tekrar `npx prisma generate`; veya projeyi `C:\` yerine kısa yola taşıyın (boşluklu `D Disk` yolu bazen Windows’ta rename sorunları çıkarır).

## Özet

| Bileşen | Açıklama |
|---------|----------|
| `PfosKategoriKodu` | structure.md A–H, X |
| `Product.pfosUrunTipi` | `"combi-firin"` eşleştirme anahtarı |
| `Product.pfosAltKod` | `"B.3"` poz no |
| `priceListTl` | Tek satış fiyatı (TRY) — shop + PFOS |
| `fiyatListe` + `bayiIskonto` | Öztiryakiler kaynak |
| `PfosUrunTipiEslesme` | Konsept × urunTipi → Product |
| `PfosTeklifSnapshot` | Teklif anı fiyat kilidi |

## Sonraki adımlar (M2–M5)

1. Öztiryakiler / Atalay import scriptlerinde PFOS alanlarını doldur.
2. `sku` backfill migration içinde yapıldı; yeni ürünlerde `sku` zorunlu tutulabilir.
3. `pfos-rule-engine.js` → API veya `PfosUrunTipiEslesme` okuma (aşamalı).
4. Brand `markaTipi`: Equsto Atölyesi → `OZEL_URETIM`.

## Referans

- `structure.md` (all-day-dining-cafe)
- `schema-product-sketch.prisma` (v0.1 taslak)
