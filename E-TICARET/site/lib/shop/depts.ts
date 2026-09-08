/** Departman PLP — /shop/{slug} (Next.js App Router + legacy eq-dept-plp.js) */
export type ShopDeptSlug =
  | "pisirme"
  | "sogutma"
  | "kahve"
  | "yikama"
  | "hazirlik"
  | "icecek"
  | "tezgah"
  | "dolap"
  | "davlumbaz"
  | "tasima"
  | "araba"
  | "istif"
  | "set-ustu-mutfak"
  | "kuvetler"
  | "market-reyonlari";

export type ShopDeptMeta = {
  title: string;
  lead: string;
  leadKey: string;
  navKey: string;
  metaDescription: string;
  metaDescriptionEn: string;
  /** SEO landing page — extended content */
  seoDescription?: string;
  seoDescriptionEn?: string;
  usageAreas?: string[];
  usageAreasEn?: string[];
  selectionCriteria?: string[];
  selectionCriteriaEn?: string[];
  brands?: string[];
  relatedCategories?: { slug: string; title: string; titleEn: string }[];
  faq?: Array<{ q: string; a: string; qEn?: string; aEn?: string }>;
  relatedDepartments?: { slug: string; title: string; titleEn: string }[];
};

export const SHOP_DEPTS: Record<ShopDeptSlug, ShopDeptMeta> = {
  pisirme: {
    title: "Pişirme Ekipmanları",
    lead: "Ocaklar, ızgaralar, kuzineler, fritözler, döner ve tost ekipmanları",
    leadKey: "dept.pisirme_lead",
    navKey: "nav.pisirme",
    metaDescription:
      "Endüstriyel pişirme ekipmanları: ocak, fırın, fritöz, salamander, döner. Restoran, otel ve catering için Equsto.",
    metaDescriptionEn:
      "Commercial cooking equipment — ranges, ovens, fryers, salamanders and doner. For restaurants, hotels and catering.",
    seoDescription:
      "Equsto'da restoran, otel, catering ve bulut mutfak projeleri için kapsamlı endüstriyel pişirme ekipmanları kataloğu. Öztiryakiler, Rational, Unox, Atalay, Electrolux gibi markalarda kombi fırın, konveksiyonel fırın, pizza fırını, sanayi tipi ocak ve ızgara modelleri. Canlı fiyat, teknik özellik ve PFOS proje teklifi ile 5 dakikada mutfak planlaması.",
    seoDescriptionEn:
      "Comprehensive industrial cooking equipment catalog at Equsto for restaurant, hotel, catering and cloud kitchen projects. Combi ovens, convection ovens, pizza ovens, heavy-duty ranges and chargrills from Öztiryakiler, Rational, Unox, Atalay, Electrolux. Live pricing, specs and PFOS project quotation in 5 minutes.",
    usageAreas: [
      "Restoran mutfakları",
      "Otel mutfakları",
      "Catering firmaları",
      "Bulut mutfaklar",
      "Kahvehaneler ve bistrolar",
      "Hastane ve topluluk yemekhaneleri"
    ],
    usageAreasEn: [
      "Restaurant kitchens",
      "Hotel kitchens",
      "Catering companies",
      "Cloud kitchens",
      "Cafes and bistros",
      "Hospital and institutional kitchens"
    ],
    selectionCriteria: [
      "Kapazite ve ölçüler (GN standartları)",
      "Enerji tipi (gaz/elektrik)",
      "Kombi fırın vs konveksiyonel fırın farkı",
      "Pizza fırını tipi (taş/konveyör/tahta ateşli)",
      "Sanayi tipi ocak/ızgara yüzey alanı",
      "Marka servis ve yedek parça garantisi"
    ],
    selectionCriteriaEn: [
      "Capacity and dimensions (GN standards)",
      "Energy type (gas/electric)",
      "Combi oven vs convection oven differences",
      "Pizza oven type (stone/conveyor/wood-fired)",
      "Heavy-duty range/chargrill surface area",
      "Brand service and spare parts warranty"
    ],
    brands: ["Rational", "Unox", "Öztiryakiler", "Atalay", "Electrolux", "Convotherm", "Convoy", "MKN"],
    relatedCategories: [
      { slug: "kombi-firin", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "konveksiyonel-firin", title: "Konveksiyonel Fırınlar", titleEn: "Convection Ovens" },
      { slug: "pizza-firinlari", title: "Pizza Fırınları", titleEn: "Pizza Ovens" },
      { slug: "sanayi-tipi-ocaklar", title: "Sanayi Tipi Ocaklar", titleEn: "Heavy-Duty Ranges" },
      { slug: "sanayi-tipi-izgaralar", title: "Sanayi Tipi Izgaralar", titleEn: "Heavy-Duty Chargrills" },
      { slug: "fritozler", title: "Fritözler", titleEn: "Fryers" },
      { slug: "kuzineler", title: "Kuzineler", titleEn: "Cooking Suites" },
      { slug: "doner-ocaklari", title: "Döner Ocakları", titleEn: "Doner Kebab Grills" }
    ],
    faq: [
      {
        q: "Kombi fırın ve konveksiyonel fırın farkı nedir?",
        a: "Kombi fırın hem konveksiyon (sıcak hava) hem buhar ile pişirme yapar; konveksiyonel fırın sadece sıcak hava sirkülasyonu kullanır. Kombi fırın daha çok yönlüdür.",
        qEn: "What is the difference between a combi oven and a convection oven?",
        aEn: "A combi oven cooks with both convection (hot air) and steam; a convection oven uses only hot air circulation. Combi ovens are more versatile."
      },
      {
        q: "Pizza fırını seçerken neye dikkat etmeliyim?",
        a: "Üretim kapasitenize göre taşı tabanlı, konveyörlü veya tahta ateşli model seçin. GN standartlarına uygunluk ve ısı dağılımı kritik.",
        qEn: "What should I consider when choosing a pizza oven?",
        aEn: "Choose stone deck, conveyor, or wood-fired based on production volume. GN compliance and heat distribution are critical."
      },
      {
        q: "Sanayi tipi ocak mı, ızgara mı almalıyım?",
        a: "Ağır pişirme (tava, tencere) için ocak; ızgara/kızartma için ızgara. Hibrit modeller her ikisini bir arada sunar.",
        qEn: "Should I get a heavy-duty range or chargrill?",
        aEn: "Range for heavy cooking (pans, pots); chargrill for grilling/searing. Hybrid models offer both."
      }
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" }
    ]
  },
  sogutma: {
    title: "Soğutma Ekipmanları",
    lead: "Buzdolabı, derin dondurucu, şok soğutma, teşhir ve soğuk oda çözümleri",
    leadKey: "dept.sogutma_lead",
    navKey: "nav.sogutma",
    metaDescription: "Endüstriyel soğutma ekipmanları — buzdolabı, derin dondurucu, teşhir dolabı, soğuk oda.",
    metaDescriptionEn: "Commercial refrigeration — fridges, freezers, display cases and cold-room solutions.",
    seoDescription:
      "Equsto'da endüstriyel soğutma çözümlerinin tam yelpazesi: buzdolapları, derin dondurucular, teşhir dolapları, soğuk odalar, şok soğutucular ve ada tipi buz dolapları. Electrolux, İnoksan, Proso, Çağlayan, Hoshizaki, Vitrifrigo, Simag, Brema markalarında GN uyumlu, enerji verimli modeller. Canlı fiyat, teknik detay ve PFOS ile soğuk oda proje teklifi.",
    seoDescriptionEn:
      "Complete industrial refrigeration range at Equsto: reach-in fridges, chest freezers, display cabinets, cold rooms, blast chillers and island freezers. Electrolux, İnoksan, Proso, Çağlayan, Hoshizaki, Vitrifrigo, Simag, Brema with GN compatibility and energy efficiency. Live pricing, specs and PFOS cold room project quotes.",
    usageAreas: [
      "Restoran ve otel mutfakları",
      "Market ve süpermarket reyonları",
      "Kasap ve şarküteri işletmeleri",
      "Pastane ve fırınlar",
      "Hastane ve topluluk yemekhaneleri",
      "Lojistik ve depolama tesisleri"
    ],
    usageAreasEn: [
      "Restaurant and hotel kitchens",
      "Supermarket departments",
      "Butcher and deli shops",
      "Bakeries and pastry shops",
      "Hospital and institutional kitchens",
      "Logistics and storage facilities"
    ],
    selectionCriteria: [
      "Kapazite (litre) ve GN uyumu",
      "Enerji sınıfı ve soğutma gazı (R290/R600a)",
      "Sıcaklık aralığı (buzdolabı vs derin dondurucu)",
      "Kapı tipi (cam/kapalı) ve ısıtıklı cam",
      "Marka servis ağı ve yedek parça",
      "Şok soğutma hızı (kg/saat)"
    ],
    selectionCriteriaEn: [
      "Capacity (liters) and GN compatibility",
      "Energy class and refrigerant (R290/R600a)",
      "Temperature range (fridge vs deep freezer)",
      "Door type (glass/solid) and heated glass",
      "Brand service network and spare parts",
      "Blast chilling speed (kg/hour)"
    ],
    brands: ["Electrolux", "İnoksan", "Proso", "Çağlayan", "Hoshizaki", "Vitrifrigo", "Simag", "Brema", "Coldline", "Fricon"],
    relatedCategories: [
      { slug: "buzdolaplari", title: "Buzdolapları", titleEn: "Reach-In Fridges" },
      { slug: "derin-dondurucular", title: "Derin Dondurucular", titleEn: "Chest Freezers" },
      { slug: "teshir-dolaplari", title: "Teşhir Dolapları", titleEn: "Display Cabinets" },
      { slug: "soguk-oda", title: "Soğuk Oda", titleEn: "Cold Rooms" },
      { slug: "sok-so gutucu", title: "Şok Soğutucular", titleEn: "Blast Chillers" },
      { slug: "buz-makineleri", title: "Buz Makineleri", titleEn: "Ice Machines" }
    ],
    faq: [
      {
        q: "Buzdolabı mı, derin dondurucu mu almalıyım?",
        a: "Günlük kullanım ve +2/+8°C için buzdolabı; uzun vadeli depolama ve -18/-22°C için derin dondurucu. Kombi modeller de mevcut.",
        qEn: "Should I get a fridge or a deep freezer?",
        aEn: "Fridge for daily use at +2/+8°C; deep freezer for long-term storage at -18/-22°C. Combo models also available."
      },
      {
        q: "Soğuk oda mi, buzdolabı mı?",
        a: "Yüksek hacimli depolama ve girilebilir alan için soğuk oda; küçük hacim ve hareketlilik için buzdolabı. Proje bazlı soğuk oda teklifi için PFOS kullanın.",
        qEn: "Cold room or reach-in fridge?",
        aEn: "Cold room for high-volume walk-in storage; fridge for smaller volumes and mobility. Use PFOS for cold room project quotes."
      }
    ],
    relatedDepartments: [
      { slug: "pisirme", title: "Pişirme Ekipmanları", titleEn: "Cooking Equipment" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "icecek", title: "İçecek Ekipmanları", titleEn: "Beverage Equipment" }
    ]
  },
  kahve: {
    title: "Kahve Ekipmanları",
    lead: "Espresso, öğütücü, filtre kahve ve barista ekipmanları",
    leadKey: "dept.kahve_lead",
    navKey: "nav.kahve",
    metaDescription: "Kahve ekipmanları — espresso makinesi, değirmen, filtre kahve, barista aksesuarları.",
    metaDescriptionEn: "Coffee equipment — espresso machines, grinders, filter brewers and barista accessories.",
    seoDescription:
      "Equsto'da profesyonel kahve ekipmanları: espresso makineleri, kahve değirmenleri, filtre kahve makineleri, bar blender ve barista aksesuarları. Nuova Simonelli, WMF, Faema, Santos, Bravilor, Dualit, La Cimbali, Animo markalarında 1-4 grup espresso, otomatik ve manuel modelde. Canlı fiyat, PFOS proje teklifi ve barista eğitimi desteği.",
    seoDescriptionEn:
      "Professional coffee equipment at Equsto: espresso machines, coffee grinders, filter brewers, bar blenders and barista tools. Nuova Simonelli, WMF, Faema, Santos, Bravilor, Dualit, La Cimbali, Animo in 1-4 group automatic and manual models. Live pricing, PFOS project quotes and barista training support.",
    usageAreas: [
      "Kahvehaneler ve özel kahve mağazaları",
      "Restoran ve otel kahve servisleri",
      "Büro ve coworking kahve istasyonları",
      "Catering ve etkinlik kahve servisleri",
      "Bulut mutfak ve fast-food zincirleri"
    ],
    usageAreasEn: [
      "Coffee shops and specialty cafes",
      "Restaurant and hotel coffee service",
      "Office and coworking coffee stations",
      "Catering and event coffee service",
      "Cloud kitchen and fast-food chains"
    ],
    selectionCriteria: [
      "Günlük fincan kapasitesi ve grup sayısı",
      "Otomatik vs manuel (barista kontrolü)",
      "İntergrierten öğütücü vs ayrı değirmen",
      "Su bağlantısı (mains/plumbed vs tank)",
      "Bakım kolaylığı ve yedek parça erişimi"
    ],
    selectionCriteriaEn: [
      "Daily cup capacity and group count",
      "Automatic vs manual (barista control)",
      "Integrated grinder vs separate grinder",
      "Water connection (plumbed vs tank)",
      "Maintenance ease and spare parts access"
    ],
    brands: ["Nuova Simonelli", "WMF", "Faema", "Santos", "Bravilor", "Dualit", "La Cimbali", "Animo", "Rancilio", "Victoria Arduino"],
    relatedCategories: [
      { slug: "espresso-makinesi", title: "Espresso Makineleri", titleEn: "Espresso Machines" },
      { slug: "kahve-degirmeni", title: "Kahve Değirmenleri", titleEn: "Coffee Grinders" },
      { slug: "filtre-kahve", title: "Filtre Kahve Makineleri", titleEn: "Filter Coffee Brewers" },
      { slug: "barista-aksesuarlari", title: "Barista Aksesuarları", titleEn: "Barista Accessories" }
    ],
    faq: [
      {
        q: "Günlük 100 fincan için kaç grup espresso makinesi gerekir?",
        a: "Günlük 100-150 fincan için 2 grup yeterlidir; 200+ için 3-4 grup önerilir. Yoğun saatlerde bekleme süresini hesaplayın.",
        qEn: "How many groups for 100 cups/day?",
        aEn: "2 groups sufficient for 100-150 cups/day; 3-4 groups for 200+. Calculate peak hour wait times."
      },
      {
        q: "Entegre değirmenli mi, ayrı değirmen mi?",
        a: "Entegre tasarruf ve hız sağlar; ayrı değirmen daha esnek ayar ve yedek parça avantajı sunar. Yüksek hacimde ayrı tercih edilir.",
        qEn: "Integrated or separate grinder?",
        aEn: "Integrated saves space and time; separate offers more flexibility and spare parts. High volume prefers separate."
      }
    ],
    relatedDepartments: [
      { slug: "icecek", title: "İçecek Ekipmanları", titleEn: "Beverage Equipment" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" }
    ]
  },
  yikama: {
    title: "Yıkama Ekipmanları",
    lead: "Bulaşık makineleri, setaltı ve konveyörlü yıkama sistemleri",
    leadKey: "dept.yikama_lead",
    navKey: "nav.yikama",
    metaDescription: "Endüstriyel bulaşık yıkama makineleri — setaltı, giyotin, konveyörlü sistemler.",
    metaDescriptionEn: "Commercial dishwashers — undercounter, hood-type and conveyor systems.",
    seoDescription:
      "Equsto'da endüstriyel bulaşık yıkama çözümleri: setaltı, kapaklı (giyotin), konveyörlü ve uçuş tipi bulaşık makineleri. Electrolux, Hobart, Winterhalter, Meiko, Sammic markalarında 30-4000 tabak/saat kapasiteli, green&clean, hygiene&clean teknolojili modeller. Canlı fiyat, su/enerji verimliliği verileri ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Complete commercial dishwashing solutions at Equsto: undercounter, hood-type, conveyor and flight-type dishwashers. Electrolux, Hobart, Winterhalter, Meiko, Sammic with 30-4000 racks/hour, green&clean and hygiene&clean technology. Live pricing, water/energy efficiency data and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel yıkama alanları",
      "Hastane ve topluluk yemekhaneleri",
      "Catering ve merkezi yıkama tesisleri",
      "Kasap ve gıda işleme tesisleri",
      "Pastane ve fırın yıkama alanları"
    ],
    usageAreasEn: [
      "Restaurant and hotel dishwashing areas",
      "Hospital and institutional kitchens",
      "Catering and central washing facilities",
      "Butcher and food processing plants",
      "Bakery and pastry washing areas"
    ],
    selectionCriteria: [
      "Saatlik tabak/kap kapasitesi",
      "Makine tipi (setaltı, kapaklı, konveyörlü, uçuş)",
      "Su tüketimi (litre/loop) ve enerji verimliliği",
      "Kimyasal dozaj sistemi (deterjan/parlatıcı)",
      "Ön yıkama ve çöp ayırma modülleri"
    ],
    selectionCriteriaEn: [
      "Hourly rack/plate capacity",
      "Machine type (undercounter, hood, conveyor, flight)",
      "Water consumption (liters/cycle) and energy efficiency",
      "Chemical dosing system (detergent/rinse aid)",
      "Pre-wash and waste separation modules"
    ],
    brands: ["Electrolux", "Hobart", "Winterhalter", "Meiko", "Sammic", "Fagor", "Comenda"],
    relatedCategories: [
      { slug: "setalti-bulasik", title: "Setaltı Bulaşık Makineleri", titleEn: "Undercounter Dishwashers" },
      { slug: "giyotin-bulasik", title: "Kapaklı (Giyotin) Bulaşık", titleEn: "Hood-Type Dishwashers" },
      { slug: "konveyorlu-bulasik", title: "Konveyörlü Bulaşık Makineleri", titleEn: "Conveyor Dishwashers" },
      { slug: "bulasik-makinesi-giris-cikis", title: "Giriş/Çıkış Tezgahları", titleEn: "Infeed/Outfeed Tables" }
    ],
    faq: [
      {
        q: "Setaltı mı, kapaklı mı bulaşık makinesi?",
        a: "Küçük işletmeler (günlük <200 tabak) için setaltı; orta/büyük (200-1000+) için kapaklı; çok yüksek hacimde konveyörlü.",
        qEn: "Undercounter or hood-type dishwasher?",
        aEn: "Small operations (<200 racks/day) undercounter; medium/large (200-1000+) hood-type; very high volume conveyor."
      },
      {
        q: "Su ve enerji tasarrufu nasıl sağlanır?",
        a: "Heat recovery (ısı geri kazanım), akıllı sensörler ve çoklu yıkama programları ile %30-50 tasarruf mümkün. Green&clean modelleri inceleyin.",
        qEn: "How to save water and energy?",
        aEn: "Heat recovery, smart sensors and multi-program cycles save 30-50%. Check green&clean models."
      }
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" }
    ]
  },
  hazirlik: {
    title: "Hazırlık Ekipmanları",
    lead: "Et ve sebze hazırlık, hamur yoğurma, vakum ve mutfak robotları",
    leadKey: "dept.hazirlik_lead",
    navKey: "nav.hazirlik",
    metaDescription: "Mutfak hazırlık ekipmanları — doğrama, mikser, vakum, kıyma makineleri.",
    metaDescriptionEn: "Food prep equipment — slicers, mixers, vacuum packers and processors.",
    seoDescription:
      "Equsto'da mutfak hazırlık ekipmanlarının tam yelpazesi: et/sebze doğrama makineleri, hamur yoğurma mikserleri, vakum makineleri, kıyma/çevirme makineleri, cutter mikserler, Robot Coupe, Dito Sama, Sirman, Sammic, FAC markalarında. GN uyumlu, CE sertifikalı, canlı fiyat ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Complete food prep equipment range at Equsto: meat/veg slicers, dough mixers, vacuum packers, mincers, cutter mixers. Robot Coupe, Dito Sama, Sirman, Sammic, FAC with GN compliance, CE certified. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel hazırlık mutfakları",
      "Kasap ve şarküteri işletmeleri",
      "Pastane ve fırın hamur hazırlık",
      "Catering merkezi hazırlık mutfakları",
      "Gıda işleme ve ambalaj tesisleri"
    ],
    usageAreasEn: [
      "Restaurant and hotel prep kitchens",
      "Butcher and deli operations",
      "Bakery and pastry dough prep",
      "Catering central prep kitchens",
      "Food processing and packaging facilities"
    ],
    selectionCriteria: [
      "İşlem kapasitesi (kg/saat)",
      "Makine tipi (doğrama, mikser, vakum, kıyma)",
      "Gövde malzemesi (paslanmaz vs alüminyum)",
      "Disk/kesme seçenekleri ve GN uyumu",
      "Güvenlik sensörleri ve CE sertifikası"
    ],
    selectionCriteriaEn: [
      "Processing capacity (kg/hour)",
      "Machine type (slicer, mixer, vacuum, mincer)",
      "Body material (stainless vs aluminum)",
      "Disc/cutting options and GN compliance",
      "Safety sensors and CE certification"
    ],
    brands: ["Robot Coupe", "Dito Sama", "Sirman", "Sammic", "FAC", "Fimar", "Tre Spade", "KitchenAid"],
    relatedCategories: [
      { slug: "et-hazirlik", title: "Et Hazırlık Makineleri", titleEn: "Meat Prep Machines" },
      { slug: "sebze-dograma", title: "Sebze Doğrama Makineleri", titleEn: "Vegetable Slicers" },
      { slug: "hamur-yogurma", title: "Hamur Yoğurma Mikserleri", titleEn: "Dough Mixers" },
      { slug: "vakum-makinesi", title: "Vakum Makineleri", titleEn: "Vacuum Packers" },
      { slug: "cutter-mikser", title: "Cutter Mikserler", titleEn: "Cutter Mixers" }
    ],
    faq: [
      {
        q: "Cutter mikser mi, planet mikser mi?",
        a: "Cutter mikser hızlı doğrama/emulsiyon için; planet mikser yoğun hamur yoğurma için. İkisi de farklı işlemler için tasarlanmıştır.",
        qEn: "Cutter mixer or planetary mixer?",
        aEn: "Cutter for fast chopping/emulsifying; planetary for heavy dough kneading. Designed for different processes."
      }
    ],
    relatedDepartments: [
      { slug: "pisirme", title: "Pişirme Ekipmanları", titleEn: "Cooking Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" }
    ]
  },
  icecek: {
    title: "İçecek Ekipmanları",
    lead: "Çay, meyve suyu, bar blender ve sıcak içecek ekipmanları",
    leadKey: "dept.icecek_lead",
    navKey: "nav.icecek",
    metaDescription: "İçecek ekipmanları — çay makinesi, meyve suyu, dispenser, bar blender.",
    metaDescriptionEn: "Beverage equipment — tea brewers, juice dispensers and bar blenders.",
    seoDescription:
      "Equsto'da içecek ekipmanları: çay makineleri, demlikler, buz makineleri, granita/slush, meyve sıkacakları, soğuk/ısıtmalı dispenserler, limonata/şerbet sistemleri. Animo, Bravilor, Santos, Hamilton Beach, Hoshizaki, Ugur, Atese markalarında. Canlı fiyat, PFOS proje teklifi.",
    seoDescriptionEn:
      "Beverage equipment range at Equsto: tea brewers, urns, ice machines, granita/slush, juicers, hot/cold dispensers, lemonade/syrup systems. Animo, Bravilor, Santos, Hamilton Beach, Hoshizaki, Ugur, Atese. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Kahvehaneler ve restoran barları",
      "Otel kahvaltı ve oda servisi",
      "Catering ve etkinlik içecek servisleri",
      "Fast-food ve self-servis restoranlar",
      "Spor tesisleri ve otel lobi alanları"
    ],
    usageAreasEn: [
      "Cafe and restaurant bars",
      "Hotel breakfast and room service",
      "Catering and event beverage service",
      "Fast-food and self-service restaurants",
      "Sports facilities and hotel lobbies"
    ],
    selectionCriteria: [
      "Kapasite (litre/saat veya fincan/saat)",
      "İçecek tipi (çay, meyve suyu, buz, karışık)",
      "Otomotik vs manuel dosaj",
      "Hijyen standartları (NSF/CE)",
      "Bakım kolaylığı ve temizlenebilirlik"
    ],
    selectionCriteriaEn: [
      "Capacity (liters/hour or cups/hour)",
      "Beverage type (tea, juice, ice, mixed)",
      "Automatic vs manual dispensing",
      "Hygiene standards (NSF/CE)",
      "Maintenance ease and cleanability"
    ],
    brands: ["Animo", "Bravilor", "Santos", "Hamilton Beach", "Hoshizaki", "Ugur", "Atese", "Zummo", "Zumex"],
    relatedCategories: [
      { slug: "cay-makineleri", title: "Çay Makineleri", titleEn: "Tea Brewers" },
      { slug: "buz-makineleri", title: "Buz Makineleri", titleEn: "Ice Machines" },
      { slug: "meyve-sikacaklari", title: "Meyve Sıkacakları", titleEn: "Juice Extractors" },
      { slug: "granita-slush", title: "Granita/Slush Makineleri", titleEn: "Granita/Slush Machines" },
      { slug: "dispenserler", title: "Soğuk/Isıtmalı Dispenserler", titleEn: "Cold/Hot Dispensers" }
    ],
    faq: [
      {
        q: "Granita ve slush makinesi farkı nedir?",
        a: "Granita daha ince kristal yapılı (italyan usulü), slush daha yoğun buzlu. Her ikisi de meyve suyu bazlı soğuk içecek üretir.",
        qEn: "Difference between granita and slush machine?",
        aEn: "Granita has finer crystals (Italian style), slush is denser. Both produce fruit-based frozen drinks."
      }
    ],
    relatedDepartments: [
      { slug: "kahve", title: "Kahve Ekipmanları", titleEn: "Coffee Equipment" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" }
    ]
  },
  tezgah: {
    title: "Tezgahlar",
    lead: "Taban raflı, taban ve ara raflı ile dolaplı paslanmaz çalışma tezgahları ve ara tezgahlar",
    leadKey: "dept.tezgah_lead",
    navKey: "nav.tezgah",
    metaDescription: "Endüstriyel çalışma tezgahları — taban raflı, ara raflı ve dolaplı modeller.",
    metaDescriptionEn: "Commercial work tables — base shelf, mid shelf and cabinet models.",
    seoDescription:
      "Equsto'da endüstriyel mutfak tezgahları: taban raflı, taban+ara raflı, dolaplı, ara tezgahlar ve yıkama tezgahları. Electrolux, İnoksan, Atalay, Atalay Pro, Öztiryakiler markalarında 600-2400mm genişlikte, GN uyumlu, AISI 304 paslanmaz çelik modeller. Canlı fiyat, ölçü şablonu ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Commercial kitchen work tables at Equsto: base shelf, mid+base shelf, cabinet, prep tables and wash tables. Electrolux, İnoksan, Atalay, Atalay Pro, Öztiryakiler in 600-2400mm widths, GN compliant, AISI 304 stainless steel. Live pricing, dimension templates and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel hazırlık mutfakları",
      "Kasap ve şarküteri hazırlık alanları",
      "Pastane ve fırın hamur alanları",
      "Merkezi yıkama ve yıkama öncesi alanlar",
      "Catering merkezi hazırlık alanları"
    ],
    usageAreasEn: [
      "Restaurant and hotel prep kitchens",
      "Butcher and deli prep areas",
      "Bakery and pastry dough areas",
      "Central wash and pre-wash areas",
      "Catering central prep areas"
    ],
    selectionCriteria: [
      "Genişlik/derinlik/yükseklik (mm) ve GN uyumu",
      "Tip (taban raflı, ara raflı, dolaplı, ara tezgah)",
      "Malzeme kalınlığı (AISI 304, 1.2-1.5mm)",
      "Ayak tipi (ayarlı ayak, tekerlekli, sabit)",
      "Arka/yan panel (sırtlı/yok) ve çukurluk"
    ],
    selectionCriteriaEn: [
      "Width/depth/height (mm) and GN compliance",
      "Type (base shelf, mid shelf, cabinet, prep table)",
      "Material thickness (AISI 304, 1.2-1.5mm)",
      "Leg type (adjustable, caster, fixed)",
      "Back/side splash and basin depth"
    ],
    brands: ["Electrolux", "İnoksan", "Atalay", "Atalay Pro", "Öztiryakiler", "Pimak", "Fricon"],
    relatedCategories: [
      { slug: "taban-rafli", title: "Taban Raflı Tezgahlar", titleEn: "Base Shelf Tables" },
      { slug: "taban-ara-rafli", title: "Taban+Ara Raflı", titleEn: "Base+Mid Shelf Tables" },
      { slug: "dolapli-tezgah", title: "Dolaplı Tezgahlar", titleEn: "Cabinet Tables" },
      { slug: "ara-tezgah", title: "Ara Tezgahlar", titleEn: "Prep Tables" },
      { slug: "yikama-tezgah", title: "Yıkama Tezgahları", titleEn: "Wash Tables" }
    ],
    faq: [
      {
        q: "Tezgah genişliği nasıl seçilmeli?",
        a: "GN konteyner sayısına göre: 1 GN = 650mm, 2 GN = 1300mm. İş akışı ve mutfak düzenine göre 600-2400mm arası seçin.",
        qEn: "How to choose table width?",
        aEn: "Based on GN containers: 1 GN = 650mm, 2 GN = 1300mm. Choose 600-2400mm based on workflow and kitchen layout."
      }
    ],
    relatedDepartments: [
      { slug: "pisirme", title: "Pişirme Ekipmanları", titleEn: "Cooking Equipment" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" }
    ]
  },
  dolap: {
    title: "Dolaplar",
    lead: "Paslanmaz depolama dolapları, malzeme dolapları ve sürgülü kapalı üniteler",
    leadKey: "dept.dolap_lead",
    navKey: "nav.dolap",
    metaDescription: "Endüstriyel mutfak dolapları — paslanmaz depolama ve malzeme dolapları.",
    metaDescriptionEn: "Commercial kitchen cabinets — stainless storage and cupboard units.",
    seoDescription:
      "Equsto'da endüstriyel mutfak dolapları: paslanmaz depolama dolapları, malzeme dolapları, çöp dolapları, sürgülü kapalı üniteler ve malzeme dolapları. Electrolux, İnoksan, Atalay, Öztiryakiler markalarında AISI 304 paslanmaz çelik, GN uyumlu, ayarlı raflı modeller. Canlı fiyat ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Commercial kitchen cabinets at Equsto: stainless storage cabinets, ingredient cabinets, waste cabinets, sliding door units. Electrolux, İnoksan, Atalay, Öztiryakiler with AISI 304 stainless, GN compatible, adjustable shelves. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel mutfak depolama",
      "Hastane ve topluluk yemekhane depoları",
      "Kasap ve gıda işleme depoları",
      "Pastane ve fırın malzeme depoları",
      "Catering merkezi soğuk/kurak depolar"
    ],
    usageAreasEn: [
      "Restaurant and hotel kitchen storage",
      "Hospital and institutional kitchen storage",
      "Butcher and food processing storage",
      "Bakery and pastry ingredient storage",
      "Catering central dry/cold storage"
    ],
    selectionCriteria: [
      "Kapı tipi (kapalı, camlı, sürgülü, çift yönlü)",
      "Raf sayısı ve ayarlanabilirlik (GN uyumu)",
      "Malzeme (AISI 304, kalınlık 0.8-1.2mm)",
      "Kapı kilidi ve hing tipi (kendi kapanan)",
      "Ayak/tekerlek tipi ve yük taşıma kapasitesi"
    ],
    selectionCriteriaEn: [
      "Door type (solid, glass, sliding, swing)",
      "Shelf count and adjustability (GN compliance)",
      "Material (AISI 304, thickness 0.8-1.2mm)",
      "Door lock and hinge type (self-closing)",
      "Leg/caster type and load capacity"
    ],
    brands: ["Electrolux", "İnoksan", "Atalay", "Öztiryakiler", "Pimak", "Fricon", "Coldline"],
    relatedCategories: [
      { slug: "malzeme-dolap", title: "Malzeme Dolapları", titleEn: "Ingredient Cabinets" },
      { slug: "depolama-dolap", title: "Depolama Dolapları", titleEn: "Storage Cabinets" },
      { slug: "cop-dolap", title: "Çöp Dolapları", titleEn: "Waste Cabinets" },
      { slug: "surgulu-dolap", title: "Sürgülü Kapalı Dolaplar", titleEn: "Sliding Door Cabinets" }
    ],
    faq: [
      {
        q: "Dolap raf aralığı nasıl olmalı?",
        a: "GN konteyner yüksekliğine göre: standart GN 1/1 = 65mm. Raf aralığı 70-80mm ayarlanabilir olmalı.",
        qEn: "How should cabinet shelf spacing be?",
        aEn: "Based on GN container height: standard GN 1/1 = 65mm. Shelf spacing 70-80mm adjustable."
      }
    ],
    relatedDepartments: [
      { slug: "tezgah", title: "Tezgahlar", titleEn: "Work Tables" },
      { slug: "istif", title: "İstif Rafları", titleEn: "Shelving Systems" }
    ]
  },
  davlumbaz: {
    title: "Davlumbazlar",
    lead: "Duvar tipi, ada tipi ve filtreli endüstriyel davlumbaz sistemleri",
    leadKey: "dept.davlumbaz_lead",
    navKey: "nav.davlumbaz",
    metaDescription: "Endüstriyel davlumbaz sistemleri — duvar tipi, ada tipi, filtreli modeller.",
    metaDescriptionEn: "Commercial hood systems — wall, island and filtered models.",
    seoDescription:
      "Equsto'da endüstriyel davlumbaz sistemleri: duvar tipi, ada tipi, filtreli ve filtresiz modeller. Electrolux, İnoksan, Atalay, Klima, KlimaMark, Halton markalarında CFM hesaplamalı, yağ tutucu, yangın söndürme entegreli, ses analizli modeller. CFD analizli tasarım, canlı fiyat, PFOS proje teklifi.",
    seoDescriptionEn:
      "Commercial kitchen hood systems at Equsto: wall, island, filtered and filterless models. Electrolux, İnoksan, Atalay, Klima, KlimaMark, Halton with CFM calculation, grease trap, fire suppression, acoustic analysis. CFD-designed, live pricing, PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel pişirme alanları",
      "Hastane ve topluluk yemekhane ocak başları",
      "Kasap ve gıda işleme buhar/yağ alanları",
      "Pastane ve fırın fırın başları",
      "Merkezi mutfak ve catering ocak başları"
    ],
    usageAreasEn: [
      "Restaurant and hotel cooking lines",
      "Hospital and institutional cooking stations",
      "Butcher and food processing steam/grease areas",
      "Bakery and pastry oven stations",
      "Central kitchen and catering ranges"
    ],
    selectionCriteria: [
      "Hava debiti (CFM/m³s) ve ocak başı tipi",
      "Tip (duvar, ada, filtreli/filtresiz)",
      "Yağ tutucu tipi (labirent, UV, su bazlı)",
      "Yangın söndürme entegrasyonu (UL300/EN)",
      "Ses seviyesi (dB) ve motor verimliliği"
    ],
    selectionCriteriaEn: [
      "Airflow (CFM/m³s) and range type",
      "Type (wall, island, filtered/unfiltered)",
      "Grease trap type (baffle, UV, water-based)",
      "Fire suppression integration (UL300/EN)",
      "Noise level (dB) and motor efficiency"
    ],
    brands: ["Electrolux", "İnoksan", "Atalay", "Klima", "KlimaMark", "Halton", "Elica", "Falmec"],
    relatedCategories: [
      { slug: "duvar-davlumbaz", title: "Duvar Tipi Davlumbazlar", titleEn: "Wall Hoods" },
      { slug: "ada-davlumbaz", title: "Ada Tipi Davlumbazlar", titleEn: "Island Hoods" },
      { slug: "filtreli-davlumbaz", title: "Filtreli Davlumbazlar", titleEn: "Filtered Hoods" }
    ],
    faq: [
      {
        q: "Davlumbaz CFM nasıl hesaplanır?",
        a: "Ocak başı başına 100-150 CFM/ft kuralı. Düzenli pişirme için 100, ağır yağlı için 150 CFM/ft. Mühendis hesaplaması için PFOS kullanın.",
        qEn: "How to calculate hood CFM?",
        aEn: "100-150 CFM/ft per linear foot of range. 100 for standard, 150 for heavy grease. Use PFOS for engineering calc."
      }
    ],
    relatedDepartments: [
      { slug: "pisirme", title: "Pişirme Ekipmanları", titleEn: "Cooking Equipment" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" }
    ]
  },
  tasima: {
    title: "Taşıma Ekipmanları",
    lead: "Palet, transpalet ve mutfak içi taşıma çözümleri",
    leadKey: "dept.tasima_lead",
    navKey: "nav.tasima",
    metaDescription: "Mutfak taşıma ekipmanları — servis arabası, transpalet, taşıma rafları.",
    metaDescriptionEn: "Kitchen transport — service trolleys, pallet trucks and mobile racks.",
    seoDescription:
      "Equsto'da mutfak içi taşıma çözümleri: servis arabaları, tepsi toplama arabaları, GN taşıma arabaları, palet transpaletler, yemek taşıma arabaları. Electrolux, İnoksan, Atalay, Pimak, Fantom, Portashelf markalarında GN uyumlu, dayanıklı çelik/alüminyum gövdeli modeller. Canlı fiyat ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Kitchen transport solutions at Equsto: service trolleys, tray collection carts, GN transport carts, pallet trucks, meal delivery carts. Electrolux, İnoksan, Atalay, Pimak, Fantom, Portashelf with GN compliance, durable steel/aluminum construction. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel servis/müşteri alanları",
      "Hastane ve topluluk yemekhane servis hatları",
      "Catering ve etkinlik servis arabaları",
      "Merkezi mutfak lojistik alanları",
      "Pastane ve fırın tepsi/hamur taşıma"
    ],
    usageAreasEn: [
      "Restaurant and hotel service areas",
      "Hospital and institutional service lines",
      "Catering and event service carts",
      "Central kitchen logistics areas",
      "Bakery and pastry tray/dough transport"
    ],
    selectionCriteria: [
      "Taşıma kapasitesi (kg/adet)",
      "Arab tipi (servis, tepsi, GN, palet, yemek)",
      "Malzeme (paslanmaz çelik, alüminyum, polimer)",
      "Tekerlek tipi (döner, frenli, antistatik)",
      "GN konteyner uyumu ve raf aralığı"
    ],
    selectionCriteriaEn: [
      "Load capacity (kg/unit)",
      "Cart type (service, tray, GN, pallet, meal)",
      "Material (stainless steel, aluminum, polymer)",
      "Wheel type (swivel, braked, antistatic)",
      "GN container compatibility and shelf spacing"
    ],
    brands: ["Electrolux", "İnoksan", "Atalay", "Pimak", "Fantom", "Portashelf", "PlateMate"],
    relatedCategories: [
      { slug: "servis-arabalari", title: "Servis Arabaları", titleEn: "Service Carts" },
      { slug: "tepsi-tasima", title: "Tepsi Taşıma Arabaları", titleEn: "Tray Transport Carts" },
      { slug: "gn-tasima", title: "GN Taşıma Arabaları", titleEn: "GN Transport Carts" },
      { slug: "transpalet", title: "Transpaletler", titleEn: "Pallet Trucks" }
    ],
    faq: [
      {
        q: "GN taşıma arabası mı, tepsi arabası mı?",
        a: "GN konteynerler için GN taşıma; standart tepsiler için tepsi arabası. Çift GN uyumlu modeller her ikisini de taşır.",
        qEn: "GN transport cart or tray cart?",
        aEn: "GN cart for GN containers; tray cart for standard trays. Dual GN models carry both."
      }
    ],
    relatedDepartments: [
      { slug: "tezgah", title: "Tezgahlar", titleEn: "Work Tables" },
      { slug: "araba", title: "Arabalar", titleEn: "Service Carts" }
    ]
  },
  araba: {
    title: "Arabalar",
    lead: "Servis arabaları, tepsi toplama, GN taşıma ve mobil bar üniteleri",
    leadKey: "dept.araba_lead",
    navKey: "nav.araba",
    metaDescription: "Servis arabaları ve GN taşıma üniteleri.",
    metaDescriptionEn: "Service trolleys and GN transport units.",
    seoDescription:
      "Equsto'da servis ve taşıma arabaları: servis arabaları, tepsi toplama arabaları, GN taşıma arabaları, mobil bar üniteleri. Electrolux, İnoksan, Atalay, Pimak, Fantom markalarında dayanıklı paslanmaz çelik gövdeli, GN uyumlu, frenli tekerlekli modeller. Canlı fiyat ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Service and transport carts at Equsto: service carts, tray collection carts, GN transport carts, mobile bar units. Electrolux, İnoksan, Atalay, Pimak, Fantom with durable stainless steel, GN compliant, braked casters. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel servis alanları",
      "Hastane ve topluluk yemekhane servis hatları",
      "Catering ve etkinlik mobil bar/servis",
      "Otel oda servisi ve minibar taşıma",
      "Banquet ve etkinlik servis arabaları"
    ],
    usageAreasEn: [
      "Restaurant and hotel service areas",
      "Hospital and institutional service lines",
      "Catering and event mobile bar/service",
      "Hotel room service and minibar transport",
      "Banquet and event service carts"
    ],
    selectionCriteria: [
      "Taşıma kapasitesi ve boyut (mm)",
      "Tip (servis, tepsi toplama, GN, mobil bar)",
      "Tekerlek sayısı ve fren tipi (4 tekerlek, 2 frenli)",
      "Malzeme (paslanmaz 304, dayanıklılık)",
      "Raf sayısı ve aralığı (GN uyumu)"
    ],
    selectionCriteriaEn: [
      "Load capacity and dimensions (mm)",
      "Type (service, tray collection, GN, mobile bar)",
      "Wheel count and brake type (4 wheels, 2 braked)",
      "Material (stainless 304, durability)",
      "Shelf count and spacing (GN compliance)"
    ],
    brands: ["Electrolux", "İnoksan", "Atalay", "Pimak", "Fantom", "Portashelf"],
    relatedCategories: [
      { slug: "servis-arabalari", title: "Servis Arabaları", titleEn: "Service Carts" },
      { slug: "tepsi-toplama", title: "Tepsi Toplama Arabaları", titleEn: "Tray Collection Carts" },
      { slug: "mobil-bar", title: "Mobil Bar Üniteleri", titleEn: "Mobile Bar Units" }
    ],
    faq: [
      {
        q: "Mobil bar ünitesi ne işe yarar?",
        a: "Etkinlikler, katmerli servis ve oda servisi için taşınabilir soğuk/sıcak tutma üniteleri. Soğutmalı ve ısıtmalı modeller mevcut.",
        qEn: "What is a mobile bar unit for?",
        aEn: "Portable cold/hot holding for events, tiered service, room service. Refrigerated and heated models available."
      }
    ],
    relatedDepartments: [
      { slug: "tasima", title: "Taşıma Ekipmanları", titleEn: "Transport Equipment" },
      { slug: "icecek", title: "İçecek Ekipmanları", titleEn: "Beverage Equipment" }
    ]
  },
  istif: {
    title: "İstif Rafları",
    lead: "İstif rafları, duvar rafları ve malzeme raf sistemleri",
    leadKey: "dept.istif_lead",
    navKey: "nav.istif",
    metaDescription: "Endüstriyel istif rafları ve depolama raf sistemleri.",
    metaDescriptionEn: "Commercial shelving and storage rack systems.",
    seoDescription:
      "Equsto'da endüstriyel istif ve depolama raf sistemleri: modüler istif rafları, duvar rafları, köşe rafları, hareketli raf sistemleri, soğuk oda rafları. Electrolux, İnoksan, Atalay, Pimak, Metro, Intermetrox markalarında dayanıklı paslanmaz/epoksi kaplı çelik, ayarlı raf aralığı, modüler genişletilebilir sistemler. Canlı fiyat ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Industrial shelving and storage rack systems at Equsto: modular shelving, wall shelves, corner shelves, mobile rack systems, cold room shelving. Electrolux, İnoksan, Atalay, Pimak, Metro, Intermetrox with durable stainless/epoxy steel, adjustable spacing, modular expandable systems. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel soğuk/kurak depolar",
      "Hastane ve topluluk yemekhane depoları",
      "Kasap ve gıda işleme depolama",
      "Merkezi mutfak ve catering depoları",
      "Soğuk oda ve derin dondurucu raflama"
    ],
    usageAreasEn: [
      "Restaurant and hotel dry/cold storage",
      "Hospital and institutional storage",
      "Butcher and food processing storage",
      "Central kitchen and catering storage",
      "Cold room and freezer shelving"
    ],
    selectionCriteria: [
      "Yük taşıma kapasitesi (kg/raf)",
      "Raf malzemesi (paslanmaz 304, epoksi kaplı, crom)",
      "Raf aralığı ayarlanabilirliği (mm)",
      "Modüler genişletilebilirlik ve köşe birleştirme",
      "Ayak/tekerlek tipi (sabit, tekerlekli, seismik)"
    ],
    selectionCriteriaEn: [
      "Load capacity per shelf (kg)",
      "Shelf material (stainless 304, epoxy, chrome)",
      "Shelf spacing adjustability (mm)",
      "Modular expandability and corner joining",
      "Leg/caster type (fixed, mobile, seismic)"
    ],
    brands: ["Electrolux", "İnoksan", "Atalay", "Pimak", "Metro", "Intermetrox", "Quantum", "Cambro"],
    relatedCategories: [
      { slug: "istif-raflari", title: "İstif Rafları", titleEn: "Shelving Units" },
      { slug: "duvar-raflari", title: "Duvar Rafları", titleEn: "Wall Shelves" },
      { slug: "kose-raflari", title: "Köşe Rafları", titleEn: "Corner Shelves" },
      { slug: "hareketli-raf", title: "Hareketli Raf Sistemleri", titleEn: "Mobile Shelving" }
    ],
    faq: [
      {
        q: "Raf başına kaç kg yük taşıyabilir?",
        a: "Standart endüstriyel raflar 150-300 kg/raf taşır. Ağır yük için güçlendirilmiş modeller 500+ kg/raf kadar çıkar. PFOS'ta hesaplayın.",
        qEn: "How much weight per shelf?",
        aEn: "Standard industrial shelves carry 150-300 kg/shelf. Reinforced models go 500+ kg/shelf. Calculate via PFOS."
      }
    ],
    relatedDepartments: [
      { slug: "dolap", title: "Dolaplar", titleEn: "Cabinets" },
      { slug: "tezgah", title: "Tezgahlar", titleEn: "Work Tables" }
    ]
  },
  "set-ustu-mutfak": {
    title: "Set Üstü Mutfak Ekipmanları",
    lead: "Öztiryakiler — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları",
    leadKey: "dept.set_ustu_mutfak_lead",
    navKey: "nav.set_ustu",
    metaDescription: "Set üstü mutfak ekipmanları ve servis gereçleri.",
    metaDescriptionEn: "Countertop kitchen equipment and service ware.",
    seoDescription:
      "Equsto'da set üstü mutfak ekipmanları: gastronorm kaplar, chafing dish setleri, servis tencereleri, çelik tencere/kapak setleri, servis kaşığı/çatal/bıçak setleri, sosluk/tatlı sunum kapları. Öztiryakiler markasında GN 1/1 - 1/9 standartlarda, AISI 304 paslanmaz çelik, yıkama makinesi uyumlu. Canlı fiyat ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Countertop kitchen equipment at Equsto: gastronorm pans, chafing dish sets, serving pots, stainless cookware sets, serving utensil sets, sauce/dessert presentation bowls. Öztiryakiler brand in GN 1/1 - 1/9 standards, AISI 304 stainless steel, dishwasher safe. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel servis/buffet alanları",
      "Catering ve etkinlik sunum alanları",
      "Otel kahvaltı buffet ve oda servisi",
      "Hastane ve topluluk yemekhane servis hatları",
      "Pastane ve fırın vitrin sunumları"
    ],
    usageAreasEn: [
      "Restaurant and hotel service/buffet areas",
      "Catering and event presentation areas",
      "Hotel breakfast buffet and room service",
      "Hospital and institutional service lines",
      "Bakery and pastry display presentation"
    ],
    selectionCriteria: [
      "GN standardı (1/1, 1/2, 1/3, 1/4, 1/6, 1/9)",
      "Malzeme kalitesi (AISI 304, 18/10 paslanmaz)",
      "Yıkama makinesi uyumluluğu",
      "Isı dayanımı ve yığınlanabilirlik",
      "Kenar tipi (yuvarlak, kesik, perçinli)"
    ],
    selectionCriteriaEn: [
      "GN standard (1/1, 1/2, 1/3, 1/4, 1/6, 1/9)",
      "Material quality (AISI 304, 18/10 stainless)",
      "Dishwasher compatibility",
      "Heat resistance and stackability",
      "Edge type (rounded, straight, flanged)"
    ],
    brands: ["Öztiryakiler", "Electrolux", "Atalay", "Bartscher", "Vollrath", "Cambro", "Rational"],
    relatedCategories: [
      { slug: "gastronorm-kaplar", title: "Gastronorm Kaplar", titleEn: "Gastronorm Pans" },
      { slug: "chafing-dish", title: "Chafing Dish Setleri", titleEn: "Chafing Dish Sets" },
      { slug: "servis-tencereleri", title: "Servis Tencereleri", titleEn: "Serving Pots" },
      { slug: "servis-aksesuarlari", title: "Servis Aksesuarları", titleEn: "Serving Accessories" }
    ],
    faq: [
      {
        q: "GN 1/1 ve GN 1/2 farkı nedir?",
        a: "GN 1/1 = 530x325mm (tam boy), GN 1/2 = 325x265mm (yarı boy). GN standartları EN 631 normuna göre. Derinlikler: 20, 40, 65, 100, 150, 200mm.",
        qEn: "What's the difference between GN 1/1 and 1/2?",
        aEn: "GN 1/1 = 530x325mm (full), GN 1/2 = 325x265mm (half). GN standards per EN 631. Depths: 20, 40, 65, 100, 150, 200mm."
      }
    ],
    relatedDepartments: [
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" },
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" }
    ]
  },
  kuvetler: {
    title: "Küvetler",
    lead: "Gastronorm küvetler, GN kapaklar, polipropilen ve polikarbonat küvetler · Öztiryakiler",
    leadKey: "dept.kuvetler_lead",
    navKey: "nav.kuvetler",
    metaDescription: "Gastronorm küvetler, GN kapaklar ve polipropilen küvetler.",
    metaDescriptionEn: "Gastronorm pans, GN lids and polypropylene containers.",
    seoDescription:
      "Equsto'da gastronorm küvetler ve kapaklar: GN 1/1 - 1/9 standartlarında, 20-200mm derinlikte paslanmaz çelik, polipropilen (PP) ve polikarbonat (PC) küvetler. Öztiryakiler markasında EN 631 standardında, yıkama makinesi uyumlu, yığınlanabilir. Canlı fiyat ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Gastronorm pans and lids at Equsto: GN 1/1 - 1/9 standards, 20-200mm depths in stainless steel, polypropylene (PP) and polycarbonate (PC). Öztiryakiler brand per EN 631, dishwasher safe, stackable. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Restoran ve otel hazırlık/servis alanları",
      "Hastane ve topluluk yemekhane satış/dağıtım",
      "Catering ve etkinlik taşınabilir servis",
      "Merkezi mutfak depolama ve taşımacılık",
      "HACCP uyumlu gıda güvenliği süreçleri"
    ],
    usageAreasEn: [
      "Restaurant and hotel prep/service areas",
      "Hospital and institutional serving/distribution",
      "Catering and event portable service",
      "Central kitchen storage and transport",
      "HACCP compliant food safety processes"
    ],
    selectionCriteria: [
      "GN standardı (1/1, 1/2, 1/3, 1/4, 1/6, 1/9)",
      "Malzeme (paslanmaz 304, PP, PC) ve derinlik (20-200mm)",
      "Kapak tipi (eşsiz, delikli, silikon contalı)",
      "Yıkama makinesi uyumluluğu ve yığınlanabilirlik",
      "HACCP renk kodlaması (kırmızı/yeşil/mavi/sarı)"
    ],
    selectionCriteriaEn: [
      "GN standard (1/1, 1/2, 1/3, 1/4, 1/6, 1/9)",
      "Material (stainless 304, PP, PC) and depth (20-200mm)",
      "Lid type (flat, perforated, silicone gasket)",
      "Dishwasher compatibility and stackability",
      "HACCP color coding (red/green/blue/yellow)"
    ],
    brands: ["Öztiryakiler", "Electrolux", "Atalay", "Cambro", "Rational", "Bartscher"],
    relatedCategories: [
      { slug: "gn-kaplar", title: "GN Kapaklar", titleEn: "GN Lids" },
      { slug: "pp-kaplar", title: "Polipropilen Kaplar", titleEn: "PP Containers" },
      { slug: "pc-kaplar", title: "Polikarbonat Kaplar", titleEn: "PC Containers" },
      { slug: "paslanmaz-gn", title: "Paslanmaz GN Kaplar", titleEn: "Stainless GN Pans" }
    ],
    faq: [
      {
        q: "Polipropilen mi, polikarbonat mı?",
        a: "PP: ekonomik, -40°C/+70°C, opak. PC: şeffaf, -40°C/+100°C, darbe dayanıklı. Görünürlük gerekirse PC, maliyet için PP.",
        qEn: "Polypropylene or polycarbonate?",
        aEn: "PP: economical, -40°C/+70°C, opaque. PC: transparent, -40°C/+100°C, impact resistant. PC for visibility, PP for cost."
      }
    ],
    relatedDepartments: [
      { slug: "set-ustu-mutfak", title: "Set Üstü Mutfak Ekipmanları", titleEn: "Countertop Equipment" },
      { slug: "hazirlik", title: "Hazırlık Ekipmanları", titleEn: "Food Prep Equipment" }
    ]
  },
  "market-reyonlari": {
    title: "Market Reyonları",
    lead: "Proso ve Çağlayan market reyonları — sütlük, şarküteri, dikey dondurucu, ada tipi teşhir ve soğuk hava depoları",
    leadKey: "dept.market_reyonlari_lead",
    navKey: "nav.market_reyon",
    metaDescription: "Market reyonları — sütlük, şarküteri, self-servis ve teşhir dolapları.",
    metaDescriptionEn: "Retail departments — dairy, deli, self-service and display cases.",
    seoDescription:
      "Equsto'da market ve perakende reyon soğutma sistemleri: sütlük, şarküteri, dikey dondurucu, ada tipi teşhir, self-servis, soğuk hava depoları. Proso, Çağlayan, Carrier, Epta, Costan, Friulinox markalarında enerji verimli, R290/R600a soğutma gazlı, HACCP uyumlu modeller. Canlı fiyat ve PFOS proje teklifi.",
    seoDescriptionEn:
      "Retail refrigeration systems at Equsto: dairy, deli, vertical freezers, island displays, self-service, cold rooms. Proso, Çağlayan, Carrier, Epta, Costan, Friulinox with energy-efficient, R290/R600a refrigerants, HACCP compliant. Live pricing and PFOS project quotes.",
    usageAreas: [
      "Süpermarket ve hipermarket reyonları",
      "Kasap ve şarküteri mağazaları",
      "Pastane ve fırın vitrin reyonları",
      "Bakkal ve deli mağazaları",
      "Petrol istasyonu ve convenience marketleri"
    ],
    usageAreasEn: [
      "Supermarket and hypermarket departments",
      "Butcher and deli shops",
      "Bakery and pastry display areas",
      "Grocery and deli stores",
      "Gas station and convenience stores"
    ],
    selectionCriteria: [
      "Reyon tipi (sütlük, şarküteri, dondurucu, ada, self)",
      "Soğutma gazı (R290, R600a, CO2 transkritik)",
      "Enerji verimlilik sınıfı (A+++ - D)",
      "HACCP uyumlu tasarım ve malzeme",
      "Uzaktan izleme ve alarm sistemleri"
    ],
    selectionCriteriaEn: [
      "Department type (dairy, deli, freezer, island, self)",
      "Refrigerant (R290, R600a, CO2 transcritical)",
      "Energy efficiency class (A+++ - D)",
      "HACCP compliant design and materials",
      "Remote monitoring and alarm systems"
    ],
    brands: ["Proso", "Çağlayan", "Carrier", "Epta", "Costan", "Friulinox", "Hussmann", "Arneg"],
    relatedCategories: [
      { slug: "sutluk-reyonu", title: "Sütlük Reyonu", titleEn: "Dairy Department" },
      { slug: "sarkuteri-reyonu", title: "Şarküteri Reyonu", titleEn: "Deli Department" },
      { slug: "dikey-dondurucu", title: "Dikey Dondurucu", titleEn: "Vertical Freezer" },
      { slug: "ada-tipi", title: "Ada Tipi Teşhir", titleEn: "Island Display" },
      { slug: "self-servis", title: "Self-Servis Reyonları", titleEn: "Self-Service Cases" },
      { slug: "soguk-hava-deposu", title: "Soğuk Hava Deposu", titleEn: "Cold Room" }
    ],
    faq: [
      {
        q: "R290 ve R600a soğutma gazı farkı nedir?",
        a: "R290 (propan) daha yaygın, R600a (izobütan) daha düşük GWP. Her ikisi de doğal soğutma gazı, F-Gaz yasasına uygun. Yeni yatırımlarda R290 tercih edilir.",
        qEn: "Difference between R290 and R600a refrigerants?",
        aEn: "R290 (propane) more common, R600a (isobutane) lower GWP. Both natural refrigerants, F-Gas compliant. R290 preferred for new investments."
      }
    ],
    relatedDepartments: [
      { slug: "sogutma", title: "Soğutma Ekipmanları", titleEn: "Refrigeration Equipment" },
      { slug: "icecek", title: "İçecek Ekipmanları", titleEn: "Beverage Equipment" }
    ]
  },
};

export const SHOP_DEPT_SLUGS = Object.keys(SHOP_DEPTS) as ShopDeptSlug[];

export function isShopDeptSlug(slug: string): slug is ShopDeptSlug {
  return slug in SHOP_DEPTS;
}
