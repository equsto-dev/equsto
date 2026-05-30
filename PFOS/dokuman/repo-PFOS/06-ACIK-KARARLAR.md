# Açık kararlar — checklist

İşaretleme: `[ ]` bekliyor · `[x]` karar verildi

---

## Taksonomi ve UI

- [ ] Segment (10’lu) mi, 28 alt kategori mi UI’da gösterilecek?
- [ ] `Hotel Restaurant` ayrı üst kategori mi, `Hotel & Hospitality` segment mi?
- [ ] Bakery / Patisserie / Dessert Shop tek segment altında mı?
- [ ] Taksonomi ilk sürüm: repo JSON mu, DB mi?

---

## Teşhir vitrinleri

- [ ] Segment/konsept bazında zorunlu mu?
- [ ] S13-388: şu an **8 kalem `tavsiye`** — onay?
- [ ] All Day / THC profillerinde teşhir kalemleri nasıl?

---

## Wizard ve API

- [ ] Detay sorusu: 2 seçenek (hızlı/detaylı) mi, 3 (standart ortada) mi?
- [ ] `POST /api/pfos/quote/preview` ayrı endpoint mi, query flag mi?
- [ ] `detaySeviyesi` + `referansId` schema’ya ne zaman eklenir?

---

## Franchise ve referans

- [ ] Franchise: ayrı şablon mu, referans profil varyantı mı (Espressolab gibi)?
- [ ] `/yonetim/pfos`’ta referans seçici (THC / S13 / şube) UI?
- [ ] Varsayılan referans: m²’ye göre otomatik mi, kullanıcı seçimi mi?

---

## Katalog / eşleşme

- [ ] MEVCUT satırlar (S13) shop’ta yok — zone mu, pseudo SKU mu?
- [ ] Depo tipi buzdolabı shop eşleşmesi (THC Bakü eksik kalem)
- [ ] `tas-firin`, `tandir` için `urunTipi` / shop tanımları

---

## Dokümantasyon

- [x] PFOS çalışma klasörü açıldı (`/PFOS`)
- [ ] `docs/PFOS-*.md` → `/PFOS` tek kaynak mı, symlink mi?
