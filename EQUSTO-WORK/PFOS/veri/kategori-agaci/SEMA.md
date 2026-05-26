# PFOS Yeme-İçecek — şema

Ana veri: **`pfos-yeme-icecek-agaci.json`**

---

## 1. Kök yapı

```mermaid
flowchart TB
  subgraph doc["pfos-yeme-icecek-agaci.json"]
    A[alan: yeme-icecek]
    T[agac]
    K[konseptler flat index]
    O[ornekKaynaklari]
    E[eslesmeyenOrnekler]
    Z[ozet]
  end
  T --> AGAC["Üst segment → Konsept → ornekMarkalar"]
  O --> ORN["ornekler/*.json"]
```

---

## 2. Ağaç hiyerarşisi (PFOS)

```mermaid
flowchart TD
  KOK["Yeme-İçecek<br/>tip: kok"]
  US1["Restaurant<br/>tip: ust-segment"]
  US2["Kafe"]
  US3["Fast food"]

  K1["Steakhouse<br/>motorSlug: steakhouse<br/>durum: aktif"]
  K2["Balıkçı<br/>motorSlug: balikci"]
  K3["Coffee Shop<br/>motorSlug: coffee-shop"]
  K4["Fast food QSR<br/>durum: planlanan"]

  KOK --> US1
  KOK --> US2
  KOK --> US3
  US1 --> K1
  US1 --> K2
  US2 --> K3
  US3 --> K4

  K1 -.-> OM1["ornekMarkalar[]"]
  K3 -.-> OM3["Starbucks, Kronotrop, …"]
```

**`tip` değerleri:** `kok` | `ust-segment` | `konsept`

---

## 3. Konsept düğümü (alanlar)

```mermaid
classDiagram
  class KonseptDugum {
    +string id
    +string ad
    +string tip
    +string motorSlug
    +string dukkanSecim
    +int m2Min
    +int m2Max
    +string teklifKaynagi
    +string[] bantlar
    +string durum
    +OrnekMarka[] ornekMarkalar
  }

  class OrnekMarka {
    +string ad
    +string kaynakId
    +string id
  }

  KonseptDugum --> OrnekMarka
```

| durum | Anlam |
|--------|--------|
| `aktif` | Motor + referans listesi bağlı |
| `motor` | Motor şablonu var, referans Excel/JSON bekleniyor |
| `planlanan` | Henüz `motorSlug` yok |

| teklifKaynagi | Anlam |
|----------------|--------|
| `pfos-referans` | `public/data/pfos-referans/` |
| `referans-json` | `veri/proje-veri` → seed |
| `motor-sablon` | Zone / sabit TS şablonu |
| `planlanan` | — |

---

## 4. Örnek markalar (yardımcı katman)

AVM yok — yalnızca isim havuzu:

```mermaid
flowchart LR
  Z[ornekler/zorlu-yeme-icecek.json]
  KY[ornekler/kanyon-yeme-icecek.json]
  PY[pfos-yeme-icecek-agaci-olustur.py]
  AG[pfos-yeme-icecek-agaci.json]

  Z --> PY
  KY --> PY
  PY -->|anahtar kelime tahmini| AG
  PY -->|eslesmeyen| E[eslesmeyenOrnekler]
```

```mermaid
flowchart TB
  subgraph ornek["ornekler/*.json"]
    I[isletmeler id, ad, url]
  end
```

---

## 5. shopTypes / motor köprüsü

```mermaid
flowchart LR
  AG[kategori-agaci<br/>konsept.id]
  ST[proje-akis<br/>shopTypes]
  MS[motorSlug]
  RF[pfos-referans JSON]

  AG <-->|aynı id / slug| ST
  ST --> MS
  MS --> RF
```

---

## 6. Güncel özet (örnek çalıştırma)

| | |
|--|--|
| Konsept | 10 |
| Aktif motor | 4 (steakhouse, balikci, coffee-shop, kebap) |
| Örnek işletme | 98 (zorlu + kanyon) |
| Eşleşmeyen | Manuel sınıflandırma için ayrı liste |

Eşleşmeyenler yeni konsept veya kural genişletmesi için iş kuyruğu — AVM/kat ile ilgisi yok.
