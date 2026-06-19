# Sektör taksonomisi — Restaurant & Cafe

> Durum: **Taslak** — UI/API’ye taşınacak.  
> Canlı kopya: `docs/PFOS-SEKTOR-TAKSONOMISI.md` (bu dosya ile senkron tutulmalı)

---

## Üst kategori (onaylı)

**Restaurant & Cafe**

Mevcut kod: `konseptUst: "Restaurant"` (`lib/pfos/wizard/profiles.ts`)

---

## Referans: 28 alt kategori (geniş havuz)

Mado / Sütiş / Şazeli tarzı profesyonel etiketler — **hepsi ayrı PFOS şablonu değil**.

1. Cafe  
2. Coffee Shop  
3. Bakery  
4. Patisserie  
5. Dessert Shop  
6. Ice Cream Shop  
7. Breakfast Place  
8. Family Restaurant  
9. Casual Dining  
10. Fine Dining  
11. Steakhouse  
12. Grill House  
13. Kebab Restaurant  
14. Seafood Restaurant  
15. Turkish Cuisine  
16. World Cuisine  
17. Fast Casual  
18. Food Court Concept  
19. Bistro  
20. Brasserie  
21. Lounge  
22. Rooftop Restaurant  
23. Buffet Restaurant  
24. Hotel Restaurant  
25. Catering Kitchen  
26. Dark Kitchen  
27. Franchise Restaurant  
28. Chain Restaurant  

---

## Önerilen yapı (Türkiye + Equsto premium)

```
Restaurant & Cafe
├── Cafe & Coffee
├── Bakery & Dessert
├── Breakfast Concepts
├── Casual Dining
├── Premium Dining
├── Steakhouse & Grill
├── Turkish Cuisine
├── Fast Casual
├── Hotel & Hospitality
└── Franchise Concepts
```

### Segment → örnek markalar

| Segment | Örnekler |
|---------|----------|
| Cafe & Coffee | Espressolab, Gloria Jean's, The House Café |
| Bakery & Dessert | Mado, Simit Sarayı, Baylan |
| Breakfast Concepts | Sütiş kahvaltı, Van Kahvaltı Evi |
| Casual Dining | Big Chefs, Happy Moon's, Cookshop |
| Premium Dining | Fine dining, brasserie, lounge, rooftop |
| Steakhouse & Grill | Steak, mangal, Nusr-Et tarzı |
| Turkish Cuisine | Sütiş tam hat, kebap, meyhane, köfteci |
| Fast Casual | Burger, döner zincir, food court ünite |
| Hotel & Hospitality | Otel ana mutfak, banket, catering |
| Franchise Concepts | Zincir şube varyantları, dark kitchen |

---

## Mevcut motor slug → segment

| `konsept` | Etiket | Segment |
|-----------|--------|---------|
| `coffee-shop` | Coffee Shop | Cafe & Coffee |
| `all-day-dining-cafe` | All Day Dining Cafe | Cafe & Coffee / Casual Dining |
| `turk-restoran` | Türk Restoranı | Turkish Cuisine |
| `kebap-ortadogu` | Kebap & Ortadoğu | Turkish Cuisine / Steakhouse & Grill |
| `meyhane` | Meyhane | Turkish Cuisine |
| `pizzaci` | Pizzacı | Casual Dining / Fast Casual |

---

## m² bantları (API — `lib/pfos/api-handlers.ts`)

| Konsept | min | max |
|---------|-----|-----|
| `all-day-dining-cafe` | 150 | 400 |
| `coffee-shop` | 60 | 300 |
| `turk-restoran` | 100 | 500 |
| `kebap-ortadogu` | 200 | 300 |
| `pizzaci` | 80 | 300 |
| `meyhane` | 100 | 500 |

Referans profil bantları ayrıca JSON’da: THC 200–400, S13 150–300.

---

## `/yonetim/pfos` eğitim katmanları

1. Taksonomi (üst + segment)  
2. Konsept şablonu (zorunlu / tavsiye / opsiyonel)  
3. Referans proforma (JSON)  
4. Arşiv zone (xlsx)  
5. Shop eşleşme (`urunTipi`, SKU)  

Detay: [03-WIZARD-VE-API.md](./03-WIZARD-VE-API.md)
