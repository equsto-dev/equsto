# Equsto GSC — tek e-ticaret değeri planı

**Tarih:** 2026-09-25  
**Girdi:** 11× Coverage Drilldown (404, yönlendirme, noindex, canonical, robots, redirect hatası, 4xx, 5xx, kopya, 403, robots-conflict) + Coverage özet sayaçları.  
**Örneklem:** 5.426 URL · **Amaç:** Hata kodu değil — **satılabilir ürün değerini** kurtarmak / değersiz URL’yi çıkarmak.

Çıktı dosyaları: `scripts/seo/output/gsc_*.tsv`, `gsc_unified_summary.json`.

---

## 1) Tek cümlelik teşhis

İndeks kaybının asıl e-ticaret boyutu üç şey: **(A)** Google’ın ürünü `/en/login?next=/shop/...` üzerinden görmesi, **(B)** eski/yanlış PDP slug’larının 404’te ölmesi (bir kısmı hâlâ katalogda), **(C)** bozuk redirect / canlı 4xx–5xx.  
EN `/en/shop/...` üzerindeki `noindex` + TR canonical **bilinçli politika** — bunu “sızıntı” sanma.

---

## 2) Ne yapacağız / ne yapmayacağız

| Yap | Yapma |
|-----|--------|
| Satılabilir PDP’yi kanonik `/shop/{dept}/{slug}` ile indekse kazandır | Sağlıklı 3xx “yönlendirmeli sayfa”yı düzeltmeye çalışma |
| `login?next=/shop/...` → **308** ürün | EN PDP `noindex` kaldır (TR kanonik politikasını bozar) |
| Katalogda olmayan 404 → **410** + sitemap dışı | Ana sayfaya / `/shop`’a toplu 308 |
| Redirect hatası + satılabilir eşleşme → tek hop 308 | noindex/robots “bilinçli non-product” kovalarını gevşetmek |

---

## 3) Sayılar (örneklem → GSC toplamı tahmini)

| Plan kovası | Örneklem | Tahmini etki* |
|-------------|----------|----------------|
| **P0 — Ürün değeri kurtar** | 2.696 | **~7.1 B** URL |
| **P1 — Katma değersiz kaldır** | 502 | **~4.0 B** (çoğunluk 404) |
| P2 — Canonical hijyen | 1.007 | izle / mikro-fix |
| P3 — Bırak (bilinçli) | 991 | dokunma |
| P9 — İnsan | 230 | tek tek |

\*Drilldown örneklem oranları × GSC sebep toplamları. Eksik drilldown’lar (aşağı) dahil değil.

### Sebep bazında P0 / P1 tahmini

| GSC nedeni | Toplam | P0 kurtar ≈ | P1 kaldır ≈ | Not |
|------------|--------|-------------|-------------|-----|
| Bulunamadı (404) | 8.110 | **3.8 B** | **4.0 B** | En büyük kaldırma + remap havuzu |
| Robots engeli | 963 | **963** | 0 | **%100** `login?next=/shop/...` |
| noindex | 2.367 | **~2.0 B** | 0 | Çoğu login wrap; EN PDP noindex bilinçli |
| Redirect hatası | 408 | **396** | 12 | Satılabilir ürün hedefi kırık |
| Diğer 4xx | 26 | 26 | 0 | Canlı PDP |
| 5xx | 15 | 15 | 0 | Canlı PDP |
| Yönlendirmeli sayfa | 7.115 | 0 | 0 | Bırak (sağlıklıysa) |
| Doğru canonical alt. | 1.165 | 0 | 0 | Bırak |
| 403 | 6 | 0 | 0 | Asset URL — ignore |
| Canonical’sız kopya | 7 | — | — | `rel=canonical` ekle |

### Eksik drilldown (henüz yok — öncelik yüksek)

| Neden | GSC ≈ | Neden önemli |
|-------|-------|----------------|
| Google farklı canonical seçti | **3.415** | Ürün URL birliği / güç kaybı |
| Keşfedildi — dizine yok | **5.295** | Crawl bütçesi / ince sayfa |
| Tarandı — dizine yok | **890** | Kalite sinyali |

Bunlar gelince planın “indeks kazanımı” kısmı tamamlanır; şimdiki plan **keşfedilmiş teknik + login + 404** odaklı.

---

## 4) İş akışları (tek sıra)

### A — Login kapısı → ürün (en hızlı kazanım)

**Durum:** ✓ Kod (`resolveLoginNextShopRedirect` + `proxy.ts`).  
Kapsam: yalnızca `next` = `/shop` | `/en/shop`…; `/login?next=/sepet` ve düz `/login` **değişmedi**.

### B1 — 404 kurtar (alias + tek hop)

**Durum:** ✓ `gsc-extra-pdp-redirects.json` (~722 alias) + `resolveLegacyPdpRedirect` çok-hop birleştirme.  
Örnek: `pimak-12060-31` → Öztiryakiler SKU; `dolap/…__id` → `tezgah/sku` tek 308.

### B2 — 410 değersiz

**Durum:** Altyapı hazır (`gsc-gone-paths.json` + `resolveGscGonePath`); liste boş — canlı 404 doğrulaması rate-limit sonrası doldurulacak. **Çalışan 200’lere 410 yok.**

### C — Redirect hatası

**Durum:** ✓ Tek-hop collapse (çift 308 zincirleri). GSC doğrulama deploy sonrası.

### D — Canlı 4xx/5xx

**Durum:** ✓ FIX_LIVE kuyruğundaki hedefi bilinenler alias’a alındı; eşleşmeyenler B2 turuna.

---

### E — TR PDP noindex sızıntısı (nadir)

EN noindex+canonical TR = **OK**.  
TR `/shop/...` üzerinde noindex varsa → kaldır (`index,follow`). Örneklemde çok az; yine de tarama.

---

### F — Bırakılanlar (iş yok)

- Sağlıklı yönlendirmeli sayfa  
- Doğru canonical alternatif  
- EN `noindex` + TR canonical  
- 403 asset URL’leri  
- Non-product noindex (sepet/arama vb.)

---

## 5) Uygulama takvimi (sıra zorunlu)

```
Hafta sprint 1:  A (login→308) + D (4xx/5xx)
Hafta sprint 2:  C (redirect error) + B1 ilk 500 kurtar
Hafta sprint 3:  B1 devam + B2 ilk 500×410
Hafta sprint 4:  B2 devam + GSC doğrulamalar + ölçüm
Sonra:          Eksik 3 drilldown gelince canonical/crawl planı
```

Her sprint: deploy (Hetzner) → curl smoke log → GSC “Düzeltmeyi doğrula” (ilgili satır).

---

## 6) Dosya / kod haritası

| Parça | Rol |
|-------|-----|
| `proxy.ts` | login `next` 308, legacy site/PDP |
| `lib/shop/legacy-pdp-redirect.ts` | alias çözümü |
| `public/data/legacy-pdp-redirects.json` | `npm run legacy-pdp:build` |
| `scripts/build-sitemap.mjs` | P1 URL’leri düş |
| `scripts/seo/output/gsc_P0_RECOVER_PRODUCT.tsv` | kurtarma kuyruğu |
| `scripts/seo/output/gsc_P1_DROP_NO_VALUE.tsv` | 410 kuyruğu |
| `scripts/seo/output/gsc_unified_summary.json` | metrikler |

---

## 7) Başarı metrikleri (28–45 gün)

1. GSC **404** düşüş (özellikle kurtarılan PDP’ler indekste ↑)  
2. **Robots engeli** login satırı → ≈0 (308 sonrası)  
3. **Redirect hatası** ≈0  
4. Dizine eklenen ürün PDP sayısı ↑ (indexed ~11.9 B içindeki `/shop/` payı)  
5. P1 410 sonrası Google’ın ölü URL’yi tekrar tekrar taramaması  

---

## 8) Karar özeti (ürün değeri testi)

```
URL'de satılabilir ürün var mı?  (katalog + legacy alias)
 ├─ EVET → kanonik PDP'ye 308 / noindex kaldırma (yalnızca TR) / canlı 200
 └─ HAYIR → 410 + sitemap dışı
Login/robots/noindex sadece kapıysa → kapıyı ürünün önünden kaldır (308)
EN noindex + TR canonical → bırak
```

---

*Bu belge önceki `GSC-INDEX-TEMIZLIK-PLANI.md` teknik çerçeveyi e-ticaret değeri odaklı tek plana bağlar. Uygulama PR’ları: `gsc-plan-A-login`, `gsc-plan-B1-404-recover`, `gsc-plan-B2-410`, `gsc-plan-C-redirect`.*
