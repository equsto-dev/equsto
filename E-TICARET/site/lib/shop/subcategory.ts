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
for (const cat of PISIRME_SUBCATEGORIES) {
  SUBCATEGORY_MAP[cat.slug] = cat;
}

export function getSubcategoryLanding(slug: string): SubcategoryLanding | null {
  return SUBCATEGORY_MAP[slug] ?? null;
}

export function getAllSubcategories(): SubcategoryLanding[] {
  return PISIRME_SUBCATEGORIES;
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