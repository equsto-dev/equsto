/**
 * SEO landing page content for subcategory pages.
 * Provides structured content for subcategory landing pages.
 */

export interface LandingContent {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  usageAreas: string[];
  usageAreasEn: string[];
  selectionCriteria: string[];
  selectionCriteriaEn: string[];
  brands: string[];
  relatedCategories: { slug: string; title: string; titleEn: string }[];
  faq: Array<{ q: string; a: string; qEn?: string; aEn?: string }>;
  relatedDepartments: { slug: string; title: string; titleEn: string }[];
}

export const LANDING_CONTENT: Record<string, LandingContent> = {
  "kombi-firinlar": {
    title: "Kombi Fırınlar",
    titleEn: "Combi Ovens",
    description:
      "Equsto'da restoran, otel, catering ve bulut mutfak projeleri için kombi fırınlar. Rational, Unox, Öztiryakiler, Electrolux, Atalay markalarında 10 GN 1/1, 20 GN 2/1 kapasiteli, elektrikli ve gazlı modeller. Canlı fiyat, teknik özellik ve PFOS proje teklifi.",
    descriptionEn:
      "Combi ovens at Equsto for restaurant, hotel, catering and cloud kitchen projects. Rational, Unox, Öztiryakiler, Electrolux, Atalay brands with 10 GN 1/1, 20 GN 2/1 capacity, electric and gas models. Live pricing, specs and PFOS project quotation.",
    usageAreas: [
      "Restoran mutfakları",
      "Otel mutfakları",
      "Catering firmaları",
      "Bulut mutfaklar",
      "Kahvehaneler ve bistrolar",
      "Hastane ve topluluk yemekhaneleri",
    ],
    usageAreasEn: [
      "Restaurant kitchens",
      "Hotel kitchens",
      "Catering companies",
      "Cloud kitchens",
      "Cafes and bistros",
      "Hospital and institutional kitchens",
    ],
    selectionCriteria: [
      "Kapazite ve ölçüler (GN standartları)",
      "Enerji tipi (gaz/elektrik)",
      "Kombi fırın vs konveksiyonel fırın farkı",
      "Pizza fırını tipi (taş/konveyör/tahta ateşli)",
      "Sanayi tipi ocak/ızgara yüzey alanı",
      "Marka servis ve yedek parça garantisi",
    ],
    selectionCriteriaEn: [
      "Capacity and dimensions (GN standards)",
      "Energy type (gas/electric)",
      "Combi oven vs convection oven differences",
      "Pizza oven type (stone/conveyor/wood-fired)",
      "Heavy-duty range/chargrill surface area",
      "Brand service and spare parts warranty",
    ],
    brands: ["Rational", "Unox", "Öztiryakiler", "Atalay", "Electrolux", "Convotherm", "Convoy", "MKN"],
    relatedCategories: [
      { slug: "konveksiyonel-firinlar", title: "Konveksiyonel Fırınlar", titleEn: "Convection Ovens" },
      { slug: "pizza-firinlari", title: "Pizza Fırınları", titleEn: "Pizza Ovens" },
      { slug: "sanayi-tipi-ocaklar", title: "Sanayi Tipi Ocaklar", titleEn: "Heavy-Duty Ranges" },
      { slug: "sanayi-tipi-izgaralar", title: "Sanayi Tipi Izgaralar", titleEn: "Heavy-Duty Chargrills" },
    ],
    faq: [
      {
        q: "Kombi fırın ve konveksiyonel fırın farkı nedir?",
        a: "Kombi fırın hem konveksiyon (sıcak hava) hem buhar ile pişirme yapar; konveksiyonel fırın sadece sıcak hava sirkülasyonu kullanır. Kombi fırın daha çok yönlüdür.",
        qEn: "What is the difference between a combi oven and a convection oven?",
        aEn: "A combi oven cooks with both convection (hot air) and steam; a convection oven uses only hot air circulation. Combi ovens are more versatile.",
      },
      {
        q: "Hangi kombi fırın kapasitesi işime yarar?",
        a: "Günlük porsiyon sayınıza ve GN konteyner ihtiyacınıza göre: 6-1/1 küçük işletmeler, 10-1/1 orta ölçek, 20-2/1 büyük işletmeler için. PFOS'ta hesaplayın.",
        qEn: "Which combi oven capacity do I need?",
        aEn: "Based on daily portions and GN container needs: 6-1/1 for small, 10-1/1 for medium, 20-2/1 for large operations. Calculate via PFOS.",
      },
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" },
    ],
  },
  "konveksiyonel-firinlar": {
    title: "Konveksiyonel Fırınlar",
    titleEn: "Convection Ovens",
    description:
      "Equsto'da konveksiyonel fırınlar: hava sirkülasyonu ile eşit pişirme sağlayan fırınlar. Pimak, Şenox markalarında gazlı ve elektrikli modeller. Crosswise konveksiyon fırınları dahil. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Convection ovens at Equsto: even cooking via hot air circulation. Pimak, Şenox brands with gas and electric models. Including Crosswise convection ovens. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Pastane ve fırın hamur işleri",
      "Restoran ana yemek pişirme",
      "Catering toplu pişirme",
      "Hastane ve topluluk yemekhaneleri",
    ],
    usageAreasEn: [
      "Pastry and bakery dough work",
      "Restaurant main cooking",
      "Catering batch cooking",
      "Hospital and institutional kitchens",
    ],
    selectionCriteria: [
      "Hava sirkülasyonu tekniği",
      "Sıcaklık hassasiyeti ve dağıtım eşitliği",
      "Enerji verimliliği sınıfı",
      "Kapak tipi ve ısı kaybı",
      "Temizleme kolaylığı",
    ],
    selectionCriteriaEn: [
      "Air circulation technology",
      "Temperature precision and distribution uniformity",
      "Energy efficiency class",
      "Door type and heat loss",
      "Cleanability",
    ],
    brands: ["Pimak", "Şenox", "Electrolux", "Unox", "Rational", "Fricon"],
    relatedCategories: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "pizza-firinlari", title: "Pizza Fırınları", titleEn: "Pizza Ovens" },
    ],
    faq: [
      {
        q: "Konveksiyonel fırın ne işe yarar?",
        a: "Sıcak hava sirkülasyonu ile her noktaya eşit ısı dağıtarak daha hızlı ve homojen pişirme sağlar. Pastane, restoran ve catering için idealdir.",
        qEn: "What does a convection oven do?",
        aEn: "Distributes heat evenly via hot air circulation for faster, more uniform cooking. Ideal for pastry, restaurant and catering.",
      },
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" },
    ],
  },
  "pizza-firinlari": {
    title: "Pizza Fırınları",
    titleEn: "Pizza Ovens",
    description:
      "Equsto'da pizza fırınları: taşı tabanlı, konveyörlü, tahta ateşli ve elektrikli pizza fırınları. Pimak, Vosco markalarında GN uyumlu modeller. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Pizza ovens at Equsto: stone deck, conveyor, wood-fired and electric pizza ovens. Pimak, Vosco brands with GN compliance. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Pizzeria ve restoran pizza fırınları",
      "Catering ve etkinlik pizza servisleri",
      "Fast-food ve take-away pizza",
      "Otel ve resort pizza servisleri",
    ],
    usageAreasEn: [
      "Pizzeria and restaurant pizza ovens",
      "Catering and event pizza service",
      "Fast-food and take-away pizza",
      "Hotel and resort pizza service",
    ],
    selectionCriteria: [
      "Pizza fırını tipi (taş tabanlı, konveyörlü, tahta ateşli)",
      "Üretim kapasitesi (pizza/saat)",
      "Isı dağılımı homojenliği",
      "GN tepsi uyumluluğu",
      "Enerji tipi (gaz/elektrik/tahta)",
    ],
    selectionCriteriaEn: [
      "Pizza oven type (stone deck, conveyor, wood-fired)",
      "Production capacity (pizzas/hour)",
      "Heat distribution uniformity",
      "GN tray compatibility",
      "Energy type (gas/electric/wood)",
    ],
    brands: ["Pimak", "Vosco", "OEM", "MKN", "Marana", "Moretti Forni"],
    relatedCategories: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "konveksiyonel-firinlar", title: "Konveksiyonel Fırınlar", titleEn: "Convection Ovens" },
    ],
    faq: [
      {
        q: "Pizza fırını seçerken neye dikkat etmeliyim?",
        a: "Üretim kapasitenize göre: taş tabanlı (artizan), konveyörlü (yüksek hacim), tahta ateşli (lezzet). GN standartlarına uygunluk ve ısı dağılımı kritik.",
        qEn: "What should I consider when choosing a pizza oven?",
        aEn: "Choose stone deck (artisan), conveyor (high volume), or wood-fired (flavor) based on production volume. GN compliance and heat distribution are critical.",
      },
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "icecek", title: "İçecek Ekipmanları", titleEn: "Beverage Equipment" },
    ],
  },
  "sanayi-tipi-ocaklar": {
    title: "Sanayi Tipi Ocaklar",
    titleEn: "Heavy-Duty Ranges",
    description:
      "Equsto'da sanayi tipi ocaklar: gazlı ve elektrikli endüstriyel ocak modelleri. Atalay, Atalay Pro, Öztiryakiler markalarında 4-6 gözlü, lavataslı/dokum yüzeyli modeller. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Heavy-duty ranges at Equsto: gas and electric industrial range models. Atalay, Atalay Pro, Öztiryakiler brands with 4-6 burner, lava stone/cast iron surfaces. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel ana mutfaklar",
      "Catering merkezi mutfaklar",
      "Hastane ve topluluk yemekhaneleri",
      "Kasap ve gıda işleme tesisleri",
    ],
    usageAreasEn: [
      "Restaurant and hotel main kitchens",
      "Catering central kitchens",
      "Hospital and institutional kitchens",
      "Butcher and food processing facilities",
    ],
    selectionCriteria: [
      "Göz sayısı ve tipi (gaz/elektrik/indüksiyon)",
      "Yüzey tipi (lav taslı, dokum, vitroseream)",
      "Isı gücü (kW/BTU)",
      "GN konteyner uyumu",
      "Temizlik kolaylığı",
    ],
    selectionCriteriaEn: [
      "Burner count and type (gas/electric/induction)",
      "Surface type (lava stone, cast iron, vitroceramic)",
      "Heat power (kW/BTU)",
      "GN container compatibility",
      "Cleanability",
    ],
    brands: ["Atalay", "Atalay Pro", "Öztiryakiler", "Electrolux", "Atalay Pro", "Rational", "Convotherm"],
    relatedCategories: [
      { slug: "sanayi-tipi-izgaralar", title: "Sanayi Tipi Izgaralar", titleEn: "Heavy-Duty Chargrills" },
      { slug: "kuzineler", title: "Kuzineler", titleEn: "Cooking Suites" },
    ],
    faq: [
      {
        q: "Sanayi tipi ocak mı, ızgara mı almalıyım?",
        a: "Ağır pişirme (tava, tencere) için ocak; ızgara/kızartma için ızgara. Hibrit modeller her ikisini bir arada sunar.",
        qEn: "Should I get a heavy-duty range or chargrill?",
        aEn: "Range for heavy cooking (pans, pots); chargrill for grilling/searing. Hybrid models offer both.",
      },
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" },
    ],
  },
  "sanayi-tipi-izgaralar": {
    title: "Sanayi Tipi Izgaralar",
    titleEn: "Heavy-Duty Chargrills",
    description:
      "Equsto'da sanayi tipi ızgaralar: lav taşlı, dokum, çelik yüzeyli, gazlı ve elektrikli ızgara modelleri. Atalay, Atalay Pro, Öztiryakiler, Electrolux markalarında. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Heavy-duty chargrills at Equsto: lava stone, cast iron, steel surface, gas and electric chargrill models. Atalay, Atalay Pro, Öztiryakiler, Electrolux brands. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel ızgara alanları",
      "Kebap ve mangal restoranları",
      "Catering ve açık hava etkinlikleri",
      "Sokak lezzeti konseptli işletmeler",
    ],
    usageAreasEn: [
      "Restaurant and hotel grill areas",
      "Kebab and mangal restaurants",
      "Catering and outdoor event grilling",
      "Street food concept operations",
    ],
    selectionCriteria: [
      "Yüzey tipi (lav taşı, dokum, çelik, pleyt)",
      "Isı dağılımı homojenliği",
      "Yağ drenaj sistemi",
      "Isı ayarı hassasiyeti",
      "Temizlik ve yağ tutucu kolaylığı",
    ],
    selectionCriteriaEn: [
      "Surface type (lava stone, cast iron, steel, plate)",
      "Heat distribution uniformity",
      "Grease drainage system",
      "Temperature control precision",
      "Cleanability and grease tray access",
    ],
    brands: ["Atalay", "Atalay Pro", "Öztiryakiler", "Electrolux", "Atalay Pro", "Rational", "Convotherm", "Empero"],
    relatedCategories: [
      { slug: "sanayi-tipi-ocaklar", title: "Sanayi Tipi Ocaklar", titleEn: "Heavy-Duty Ranges" },
      { slug: "gazli-izgaralar", title: "Gazlı Izgaralar", titleEn: "Gas Chargrills" },
      { slug: "elektrikli-izgaralar", title: "Elektrikli Izgaralar", titleEn: "Electric Chargrills" },
    ],
    faq: [
      {
        q: "Lav taşlı mı, dokum ızgara mı?",
        a: "Lav taşlı ızgara ısıyı daha iyi tutar ve eşit dağıtır; dokum ızgara daha dayanıklıdır ve yüksek ısıda performanslıdır. Menü ve kullanım yoğunluğuna göre seçin.",
        qEn: "Lava stone or cast iron chargrill?",
        aEn: "Lava stone retains and distributes heat better; cast iron is more durable and performs at higher heat. Choose based on menu and usage intensity.",
      },
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" },
    ],
  },
  "elektrikli-kombi-firinlar": {
    title: "Elektrikli Kombi Fırınlar",
    titleEn: "Electric Combi Ovens",
    description:
      "Equsto'da elektrikli kombi fırınlar: Rational iCombi Pro, Öztiryakiler, Electrolux markalarında elektrikli kombi fırın modelleri. 10 GN 1/1, 20 GN 2/1 kapasitelerde. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Electric combi ovens at Equsto: Rational iCombi Pro, Öztiryakiler, Electrolux electric combi oven models. 10 GN 1/1, 20 GN 2/1 capacities. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Gaz altyapısı olmayan mutfaklar",
      "Enerji verimliliği öncelikli işletmeler",
      "Hastane ve topluluk yemekhaneleri",
      "Bulut mutfak ve merkezi mutfaklar",
    ],
    usageAreasEn: [
      "Kitchens without gas infrastructure",
      "Energy efficiency priority operations",
      "Hospital and institutional kitchens",
      "Cloud kitchen and central kitchens",
    ],
    selectionCriteria: [
      "Elektrik bağlantısı gücü (kW/amper)",
      "Faz sayısı (monofaz/trifaz)",
      "Su bağlantısı ve basıncı",
      "Isı ışınımı ve ısı yalıtımı",
      "Programlanabilir menü hafızası",
    ],
    selectionCriteriaEn: [
      "Electrical connection power (kW/amps)",
      "Phase count (single/three phase)",
      "Water connection and pressure",
      "Heat radiation and insulation",
      "Programmable menu memory",
    ],
    brands: ["Rational", "Unox", "Öztiryakiler", "Electrolux", "Convotherm", "Convoy"],
    relatedCategories: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "konveksiyonel-firinlar", title: "Konveksiyonel Fırınlar", titleEn: "Convection Ovens" },
      { slug: "gazli-kombi-firinlar", title: "Gazlı Kombi Fırınlar", titleEn: "Gas Combi Ovens" },
    ],
    faq: [
      {
        q: "Elektrikli kombi fırın mı, gazlı mı?",
        a: "Gaz altyapısı yoksa veya enerji verimliliği/önce temizlik tercih ediliyorsa elektrikli; yüksek hacimde gaz maliyeti düşükse gazlı tercih edilir. PFOS'ta hesaplayın.",
        qEn: "Electric or gas combi oven?",
        aEn: "Electric if no gas infrastructure or energy efficiency/cleaning priority; gas if high volume and gas cost lower. Calculate via PFOS.",
      },
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" },
    ],
  },
  "10-gn-1-1-kombi-firinlar": {
    title: "10 GN 1/1 Kombi Fırınlar",
    titleEn: "10 GN 1/1 Combi Ovens",
    description:
      "Equsto'da 10 GN 1/1 kapasiteli kombi fırınlar: Rational iCombi Pro, Öztiryakiler, Electrolux markalarında. Orta ölçekli işletmeler için ideal kapasite. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "10 GN 1/1 capacity combi ovens at Equsto: Rational iCombi Pro, Öztiryakiler, Electrolux brands. Ideal capacity for medium-scale operations. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Orta ölçekli restoranlar",
      "Otel mutfakları",
      "Catering firmaları",
      "Bulut mutfaklar",
    ],
    usageAreasEn: [
      "Medium-scale restaurants",
      "Hotel kitchens",
      "Catering companies",
      "Cloud kitchens",
    ],
    selectionCriteria: [
      "Günlük porsiyon kapasitesi (150-300 porsiyon/gün)",
      "GN 1/1 konteyner uyumu",
      "Programlanabilir menü sayısı",
      "Otomatik temizleme (SelfCooking/ iCooking)",
    ],
    selectionCriteriaEn: [
      "Daily portion capacity (150-300 portions/day)",
      "GN 1/1 container compatibility",
      "Programmable menu count",
      "Automatic cleaning (SelfCooking/ iCooking)",
    ],
    brands: ["Rational", "Öztiryakiler", "Electrolux", "Unox", "Convotherm"],
    relatedCategories: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "20-gn-2-1-kombi-firinlar", title: "20 GN 2/1 Kombi Fırınlar", titleEn: "20 GN 2/1 Combi Ovens" },
    ],
    faq: [
      {
        q: "10 GN 1/1 fırın günde kaç porsiyon pişirir?",
        a: "Günlük 150-300 porsiyon arası üretim için idealdir. Menü çeşitliliğine ve PFOS hesaplamasına göre değişir.",
        qEn: "How many portions per day for 10 GN 1/1?",
        aEn: "Ideal for 150-300 portions daily. Varies by menu and PFOS calculation.",
      },
    ],
    relatedDepartments: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
    ],
  },
  "20-gn-2-1-kombi-firinlar": {
    title: "20 GN 2/1 Kombi Fırınlar",
    titleEn: "20 GN 2/1 Combi Ovens",
    description:
      "Equsto'da 20 GN 2/1 kapasiteli kombi fırınlar: Rational iCombi Pro, Öztiryakiler markalarında. Büyük ölçekli işletmeler ve merkezi mutfaklar için. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "20 GN 2/1 capacity combi ovens at Equsto: Rational iCombi Pro, Öztiryakiler brands. Ideal for large-scale operations and central kitchens. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Büyük ölçekli catering firmaları",
      "Hastane ve topluluk yemekhaneleri",
      "Merkezi mutfaklar",
      "Üretim hatları ve fabrika mutfakları",
    ],
    usageAreasEn: [
      "Large-scale catering companies",
      "Hospital and institutional kitchens",
      "Central kitchens",
      "Production lines and factory kitchens",
    ],
    selectionCriteria: [
      "Günlük porsiyon kapasitesi (500+ porsiyon/gün)",
      "20 GN 2/1 konteyner uyumu (2x 1/1 yan yana)",
      "Çift fan / çift motor sistemi",
      "Yüksek hacimde otomatik temizleme",
    ],
    selectionCriteriaEn: [
      "Daily portion capacity (500+ portions/day)",
      "20 GN 2/1 container compatibility (2x 1/1 side by side)",
      "Dual fan / dual motor system",
      "High-volume automatic cleaning",
    ],
    brands: ["Rational", "Öztiryakiler", "Unox", "Convotherm", "MKN"],
    relatedCategories: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "10-gn-1-1-kombi-firinlar", title: "10 GN 1/1 Kombi Fırınlar", titleEn: "10 GN 1/1 Combi Ovens" },
    ],
    faq: [
      {
        q: "20 GN 2/1 fırın hangi işletmeler için uygundur?",
        a: "Günde 500+ porsiyon, merkezi mutfaklar, hastane ve büyük catering işletmeleri için idealdir.",
        qEn: "What operations suit 20 GN 2/1?",
        aEn: "Ideal for 500+ portions daily, central kitchens, hospitals and large catering.",
      },
    ],
    relatedDepartments: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
    ],
  },
};