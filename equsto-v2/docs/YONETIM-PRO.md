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
Token (yerel): `equsto2025` — `.env.local` içindeki `EQUSTO_ADMIN_BEARER` ile aynı.

## Paketler

- `antd`
- `@ant-design/pro-components` (ProTable, PageContainer, LoginForm, …)
- `@ant-design/pro-layout` (ProLayout)
- `@ant-design/nextjs-registry`

## Deploy

Vercel Root Directory: `equsto-v2`. `/yonetim` statik rewrite almaz; Next.js route olarak çalışır.
