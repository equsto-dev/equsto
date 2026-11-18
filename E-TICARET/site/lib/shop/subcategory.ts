/**
 * Subcategory landing page definitions for P0 SEO keywords.
 * Real catalog-driven predicates.
 */
import { ProductSemantics, extractProductSemantics } from "./product-semantic";

export interface SubcategoryLanding {
  slug: string;
  dept: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  usageAreas?: string[];
  usageAreasEn?: string[];
  selectionCriteria?: string[];
  selectionCriteriaEn?: string[];
  predicate?: (row: Record<string, unknown>, semantics?: ProductSemantics) => boolean;
  relatedCategories?: { slug: string; title: string; titleEn: string }[];
  faq?: Array<{ q: string; a: string; qEn?: string; aEn?: string }>;
  relatedDepartments?: { slug: string; title: string; titleEn: string }[];
}

function foldTr(s: unknown): string {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0131/g, "i");
}

/** Bar / back-bar şişe soğutucu (tezgah altı + dik tip) — sogutma PLP predicate. */
export function isBarSiseSogutucuProduct(row: Record<string, unknown>): boolean {
  const cat = String(row.category || "");
  if (cat === "bar-tipi-sise-sogutucu" || cat === "proso-sise-sogutucu") return true;
  const hay = foldTr(
    [
      row.name,
      row.sku,
      row.urun_alt_kategori,
      row.specs,
      Array.isArray(row.kategori_yolu) ? row.kategori_yolu.join(" ") : "",
      row.search_hints,
    ].join(" "),
  );
  // Pizza teşhir / granite prep (Portabianco ST-*) şişe soğutucu değil
  if (
    /granite pizza|teshir buzdolabi|salata|saladette|\bst[- ]?\d{2,}/.test(hay) &&
    !/sise sogut|bar alti|bar arkasi|bbc|vbbc|bar buzdolab/.test(hay)
  ) {
    return false;
  }
  return /sise sogut|bar alti|bar arkasi|bar sogutucu|bar buzdolab|bottle cooler|back ?bar|\bbbc[-.]|\bvbbc|\bbbcs|\bvgb|\bgbc[-.]|\bdbb[-.]/.test(
    hay,
  );
}

export const SOGUTMA_SUBCATEGORIES: SubcategoryLanding[] = [
  {
    slug: "bar-arkasi-sise-sogutucu",
    dept: "sogutma",
    title: "Bar Arkası Şişe Soğutucu",
    titleEn: "Back Bar Bottle Coolers",
    description:
      "Equsto'da bar altı ve bar arkası şişe soğutucular: Senox, Vosco, Gtech, Şenocak, By Kitchen, Frenox ve Öztiryakiler markalarında 1–3 kapılı, çarpma ve sürgülü modeller. Canlı fiyat, teknik özellik ve PFOS proje teklifi.",
    descriptionEn:
      "Under-bar and back-bar bottle coolers at Equsto: Senox, Vosco, Gtech, Şenocak, By Kitchen, Frenox and Öztiryakiler — 1–3 door, hinged and sliding models. Live pricing, specs and PFOS project quotes.",
    usageAreas: [
      "Bar ve lounge bankoları",
      "Kafe ve bistro servis alanları",
      "Restoran içecek istasyonları",
      "Otel ve restoran barları",
      "Gece kulübü ve eğlence mekânları",
    ],
    usageAreasEn: [
      "Bar and lounge counters",
      "Cafe and bistro service areas",
      "Restaurant beverage stations",
      "Hotel and restaurant bars",
      "Clubs and entertainment venues",
    ],
    selectionCriteria: [
      "Kapı sayısı (1 / 2 / 3) ve çarpma vs sürgülü",
      "Genişlik ve tezgah altı yükseklik (yaklaşık 85 cm)",
      "Hacim (lt) ve şişe kapasitesi",
      "Ortam sıcaklığı dayanımı (+43 °C modeller)",
      "Marka servis ve yedek parça",
    ],
    selectionCriteriaEn: [
      "Door count (1 / 2 / 3) and hinged vs sliding",
      "Width and under-counter height (~85 cm)",
      "Volume (L) and bottle capacity",
      "Ambient temperature rating (+43 °C models)",
      "Brand service and spare parts",
    ],
    predicate: (row) => isBarSiseSogutucuProduct(row),
    relatedDepartments: [
      { slug: "sogutma", title: "Soğutma", titleEn: "Refrigeration" },
      { slug: "icecek", title: "İçecek", titleEn: "Beverage" },
      { slug: "market-reyon", title: "Market Reyon", titleEn: "Retail Display" },
    ],
    faq: [
      {
        q: "Bar altı şişe soğutucu ile dik tip şişe soğutucu farkı nedir?",
        a: "Bar altı / bar arkası modeller tezgah altına sığacak yükseklikte (~85 cm) tasarlanır; dik tip modeller vitrin gibi dikey teşhir için kullanılır. Dar bankolarda bar tipi, lobi/market teşhirinde dik tip tercih edilir.",
        qEn: "What is the difference between under-bar and upright bottle coolers?",
        aEn: "Under-bar / back-bar units fit under counters (~85 cm height); upright models are vertical display cabinets. Prefer under-bar for tight bars; upright for lobby/retail display.",
      },
      {
        q: "1, 2 veya 3 kapılı model nasıl seçilir?",
        a: "Tek kapılı dar köşe ve düşük stok için; iki kapılı standart bar bankoları için; üç kapılı yoğun servis ve yüksek şişe stoğu için uygundur. Banko genişliğinize göre ölçüyü doğrulayın.",
        qEn: "How do I choose 1, 2 or 3 doors?",
        aEn: "One door for narrow corners and low stock; two doors for standard bar counters; three doors for high-volume service. Match width to your counter.",
      },
      {
        q: "Çarpma kapı mı, sürgülü kapı mı?",
        a: "Çarpma kapı daha iyi sızdırmazlık ve soğuk tutma sağlar; sürgülü kapı dar geçişlerde kapı salınımı istemeyen barlarda yer kazandırır.",
        qEn: "Hinged or sliding doors?",
        aEn: "Hinged doors seal better and hold cold longer; sliding doors save swing space in narrow service aisles.",
      },
    ],
  },
];

export const PISIRME_SUBCATEGORIES: SubcategoryLanding[] = [
  {
    slug: "kombi-firinlar",
    dept: "pisirme",
    title: "Kombi Fırınlar",
    titleEn: "Combi Ovens",
    description:
      "Equsto'da restoran, otel, catering ve bulut mutfak projeleri için kombi fırınlar. Rational, Unox, Öztiryakiler, Electrolux, Atalay markalarında 10 GN 1/1, 20 GN 2/1 kapasiteli, elektrikli ve gazlı modeller. Canlı fiyat, teknik özellik ve PFOS proje teklifi.",
    descriptionEn:
      "Combi ovens at Equsto for restaurant, hotel, catering and cloud kitchen projects. Rational, Unox, Öztiryakiler, Electrolux, Atalay brands with 10 GN 1/1, 20 GN 2/1 capacity, electric and gas models. Live pricing, specs and PFOS project quotation.",
    predicate: (row) => row.category === "kombi-firin",
    relatedCategories: [
      { slug: "konveksiyonel-firinlar", title: "Konveksiyonel Fırınlar", titleEn: "Convection Ovens" },
      { slug: "pizza-firinlari", title: "Pizza Fırınları", titleEn: "Pizza Ovens" },
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
  },
  {
    slug: "konveksiyonel-firinlar",
    dept: "pisirme",
    title: "Konveksiyonel Fırınlar",
    titleEn: "Convection Ovens",
    description:
      "Equsto'da konveksiyonel fırınlar: hava sirkülasyonu ile eşit pişirme sağlayan fırınlar. Pimak, Şenox markalarında gazlı ve elektrikli modeller. Crosswise konveksiyon fırınları dahil. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Convection ovens at Equsto: even cooking via hot air circulation. Pimak, Şenox brands with gas and electric models. Including Crosswise convection ovens. Live pricing and PFOS project quotes.",
    predicate: (row: Record<string, unknown>) =>
      row.category === "konveksiyonel-firinlar" ||
      row.category === "crosswise-konveksiyon-firinlar" ||
      (typeof row.category === "string" && row.category.startsWith("crosswise-konveksiyon-firinlar")),
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
  },
  {
    slug: "pizza-firinlari",
    dept: "pisirme",
    title: "Pizza Fırınları",
    titleEn: "Pizza Ovens",
    description:
      "Equsto'da pizza fırınları: taşı tabanlı, konveyörlü, tahta ateşli ve elektrikli pizza fırınları. Pimak, Vosco markalarında GN uyumlu modeller. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Pizza ovens at Equsto: stone deck, conveyor, wood-fired and electric pizza ovens. Pimak, Vosco brands with GN compliance. Live pricing and PFOS project quotes.",
    predicate: (row) =>
      row.category === "pizza-firinlari" ||
      row.category === "konvoyerlu-pizza-firinlari" ||
      row.category === "konvoyerlu-pide-ve-lahmacun-firinlari-ve-kuzu-firinlari",
    relatedCategories: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "konveksiyonel-firinlar", title: "Konveksiyonel Fırınlar", titleEn: "Convection Ovens" },
    ],
    faq: [
      {
        q: "Pizza fırını seçerken neye dikkat etmeliyim?",
        a: "Üretim kapasitenize göre: taş tabanlı (artizan), konveyörlü (yüksek hacim), tahta ateşlı (lezzet). GN standartlarına uygunluk ve ısı dağılımı kritik.",
        qEn: "What should I consider when choosing a pizza oven?",
        aEn: "Choose stone deck (artisan), conveyor (high volume), or wood-fired (flavor) based on production volume. GN compliance and heat distribution are critical.",
      },
    ],
  },
  {
    slug: "sanayi-tipi-ocaklar",
    dept: "pisirme",
    title: "Sanayi Tipi Ocaklar",
    titleEn: "Heavy-Duty Ranges",
    description:
      "Equsto'da sanayi tipi ocaklar: gazlı ve elektrikli endüstriyel ocak modelleri. Atalay, Atalay Pro, Öztiryakiler markalarında 4-6 gözlü, lavataslı/dokum yüzeyli modeller. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Heavy-duty ranges at Equsto: gas and electric industrial range models. Atalay, Atalay Pro, Öztiryakiler brands with 4-6 burner, lava stone/cast iron surfaces. Live pricing and PFOS project quotes.",
    predicate: (row) => row.category === "sanayi-ocaklari",
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
  },
  {
    slug: "sanayi-tipi-izgaralar",
    dept: "pisirme",
    title: "Sanayi Tipi Izgaralar",
    titleEn: "Heavy-Duty Chargrills",
    description:
      "Equsto'da sanayi tipi ızgaralar: lav taşlı, dokum, çelik yüzeyli, gazlı ve elektrikli ızgara modelleri. Atalay, Atalay Pro, Öztiryakiler, Electrolux markalarında. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Heavy-duty chargrills at Equsto: lava stone, cast iron, steel surface, gas and electric chargrill models. Atalay, Atalay Pro, Öztiryakiler, Electrolux brands. Live pricing and PFOS project quotes.",
    predicate: (row) => row.category === "sanayi-tipi-izgaralar",
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
  },
  {
    slug: "elektrikli-kombi-firinlar",
    dept: "pisirme",
    title: "Elektrikli Kombi Fırınlar",
    titleEn: "Electric Combi Ovens",
    description:
      "Equsto'da elektrikli kombi fırınlar: Rational iCombi Pro, Öztiryakiler, Electrolux markalarında elektrikli kombi fırın modelleri. 10 GN 1/1, 20 GN 2/1 kapasitelerde. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "Electric combi ovens at Equsto: Rational iCombi Pro, Öztiryakiler, Electrolux electric combi oven models. 10 GN 1/1, 20 GN 2/1 capacities. Live pricing and PFOS project quotes.",
    predicate: (row) => {
      if (row.category !== "kombi-firin") return false;
      const semantics = extractProductSemantics(row);
      return semantics.energyType === "elektrikli";
    },
    relatedCategories: [
      { slug: "kombi-firinlar", title: "Kombi Fırınlar", titleEn: "Combi Ovens" },
      { slug: "konveksiyonel-firinlar", title: "Konveksiyonel Fırınlar", titleEn: "Convection Ovens" },
    ],
    faq: [
      {
        q: "Elektrikli kombi fırın mı, gazlı mı?",
        a: "Gaz altyapısı yoksa veya enerji verimliliği/önce temizlik tercih ediliyorsa elektrikli; yüksek hacimde gaz maliyeti düşükse gazlı tercih edilir. PFOS'ta hesaplayın.",
        qEn: "Electric or gas combi oven?",
        aEn: "Electric if no gas infrastructure or energy efficiency/cleaning priority; gas if high volume and gas cost lower. Calculate via PFOS.",
      },
    ],
  },
  {
    slug: "10-gn-1-1-kombi-firinlar",
    dept: "pisirme",
    title: "10 GN 1/1 Kombi Fırınlar",
    titleEn: "10 GN 1/1 Combi Ovens",
    description:
      "Equsto'da 10 GN 1/1 kapasiteli kombi fırınlar: Rational iCombi Pro, Öztiryakiler, Electrolux markalarında. Orta ölçekli işletmeler için ideal kapasite. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "10 GN 1/1 capacity combi ovens at Equsto: Rational iCombi Pro, Öztiryakiler, Electrolux brands. Ideal capacity for medium-scale operations. Live pricing and PFOS project quotes.",
    predicate: (row) => {
      if (row.category !== "kombi-firin") return false;
      const semantics = extractProductSemantics(row);
      return semantics.capacity === "10 GN 1/1";
    },
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
  },
  {
    slug: "20-gn-2-1-kombi-firinlar",
    dept: "pisirme",
    title: "20 GN 2/1 Kombi Fırınlar",
    titleEn: "20 GN 2/1 Combi Ovens",
    description:
      "Equsto'da 20 GN 2/1 kapasiteli kombi fırınlar: Rational iCombi Pro, Öztiryakiler markalarında. Büyük ölçekli işletmeler ve merkezi mutfaklar için. Canlı fiyat ve PFOS proje teklifi.",
    descriptionEn:
      "20 GN 2/1 capacity combi ovens at Equsto: Rational iCombi Pro, Öztiryakiler brands. Ideal for large-scale operations and central kitchens. Live pricing and PFOS project quotes.",
    predicate: (row) => {
      if (row.category !== "kombi-firin") return false;
      const semantics = extractProductSemantics(row);
      return semantics.capacity === "20 GN 2/1";
    },
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
  },
];

// Mapping: slug -> landing definition
export const SUBCATEGORY_MAP: Record<string, SubcategoryLanding> = {};
for (const cat of [...PISIRME_SUBCATEGORIES, ...SOGUTMA_SUBCATEGORIES]) {
  SUBCATEGORY_MAP[cat.slug] = cat;
}

export function getSubcategoryLanding(slug: string): SubcategoryLanding | null {
  return SUBCATEGORY_MAP[slug] ?? null;
}

export function getAllSubcategories(): SubcategoryLanding[] {
  return [...PISIRME_SUBCATEGORIES, ...SOGUTMA_SUBCATEGORIES];
}

export function filterProductsBySubcategory(
  rows: Record<string, unknown>[],
  slug: string
): Record<string, unknown>[] {
  const landing = getSubcategoryLanding(slug);
  if (!landing || !landing.predicate) return [];
  const predicate = landing.predicate;
  return rows.filter((row) => predicate(row));
}

export function countProductsBySubcategory(
  rows: Record<string, unknown>[],
  slug: string
): number {
  return filterProductsBySubcategory(rows, slug).length;
}