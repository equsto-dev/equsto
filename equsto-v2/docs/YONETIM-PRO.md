# Yönetim paneli — Ant Design Pro

Next.js App Router üzerinde **Ant Design Pro** ara yüzü.

## Adresler

| URL | Açıklama |
|-----|----------|
| `/yonetim/giris` | Bearer token ile giriş |
| `/yonetim/kontrol` | Sistem kontrolü (giriş sonrası) |
| `/yonetim/katalog` | **Katalog & görseller** — görselsiz 1736+ filtre, `images[]` |
| `/yonetim/pfos` | **PFOS** — `/api/proje-akis` + tam admin linki |
| `/yonetim/yayin` | **Yayınlama** — rebuild + `search:index` + deploy |
| `/yonetim/ozet` | Sayısal özet |
| `/yonetim/urunler` | DB/legacy API ürünler |
| `/yonetim/arama` | Meilisearch önizleme |
| `/admin.html` | Tam PFOS (PDF import, sorular, kurallar) — geçiş dönemi |

## Kurulum

```cmd
cd equsto-v2
npm install --legacy-peer-deps
npm run dev
```

Tarayıcı: http://localhost:3000/yonetim/giris  

**Token**

| Ortam | Değer |
|-------|--------|
| Yerel (`npm run dev`) | `.env.local` → `EQUSTO_ADMIN_BEARER` veya boş token / `equsto2025` |
| Canlı (equsto.com) | Vercel → Project → Settings → Environment Variables → **`EQUSTO_ADMIN_BEARER`** (Production) |

`Eq_33100…` gibi kodlar **müşteri/oturum kodu değildir** — API Bearer değil. Kontrol listesinde `GET /api/urunler` **Yetkisiz** ise girişte yanlış token kayıtlıdır; `/yonetim/giris` → doğru Bearer → **Yeniden kontrol et**.

## Paketler

- `antd`
- `@ant-design/pro-components` (ProTable, PageContainer, LoginForm, …)
- `@ant-design/pro-layout` (ProLayout)
- `@ant-design/nextjs-registry`

## Deploy

Vercel Root Directory: `equsto-v2`. `/yonetim` statik rewrite almaz; Next.js route olarak çalışır.
