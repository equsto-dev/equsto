# Ana sayfa — Ant Design Pro (sonraki faz)

**Önce:** `/yonetim/kontrol` tüm satırlar yeşil olmalı.

## Hedef

Statik `public/index.html` yerine veya yanında Next.js + Pro bileşenleri:

- `PageContainer`, `ProCard`, `StatisticCard`
- Vitrin grid (ürün kartları)
- Marka / kategori şeritleri

## Önerilen route

`app/(storefront-v2)/page.tsx` veya mevcut `app/(storefront)` genişletmesi — mağaza kromu ProLayout **değil** (müşteri yüzü); yalnızca içerik kartları Pro.

## Veri

- `public/data/ekipmanlar.json` / API
- Mevcut `eq-home-*` mantığı adım adım taşınır

## Kontrol sonrası başlanır

Kontrol sayfası OK → bu dosyadaki işe geçilir.
