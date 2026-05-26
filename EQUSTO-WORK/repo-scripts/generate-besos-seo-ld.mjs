/**
 * vitrum-bars-catalogue.json → TR/EN JSON-LD + head config (Besos, yalnızca head)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catPath = path.join(root, "public", "data", "vitrum-bars-catalogue.json");
const outTr = path.join(root, "public", "data", "eq-besos-seo-ld.json");
const outEn = path.join(root, "public", "data", "eq-besos-seo-ld-en.json");
const outCfg = path.join(root, "public", "eq-besos-head-seo-config.js");

const cat = JSON.parse(fs.readFileSync(catPath, "utf8"));
const products = cat.products || [];
const ORIGIN_TR = "https://equsto.com/besos";
const ORIGIN_EN = "https://equsto.com/en/besos";
const MODIFIED = "2026-05-15";
const PRICE_VALID_UNTIL = "2027-12-31";

/** Google Product snippet — teklif bazlı modüller (sabit liste fiyatı yok). */
function besosModuleOffer(origin, p) {
  const sku = p.code || `BES-P${p.page}`;
  return {
    "@type": "Offer",
    url: `${origin}#${encodeURIComponent(sku)}`,
    priceCurrency: "EUR",
    availability: "https://schema.org/PreOrder",
    priceValidUntil: PRICE_VALID_UNTIL,
    seller: { "@type": "Organization", name: "Equsto", url: "https://equsto.com" },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "TR",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    },
  };
}

const faqTr = [
  {
    q: "Besos Bar Design Studio nedir?",
    a: "Equsto bünyesindeki Bar Design Studio (Besos), otel, restoran ve etkinlik mekanları için modüler cocktail bar hatları, imza istasyonları ve bar modüllerinin vitrin ve teklif platformudur.",
  },
  {
    q: "Bar hattı teklifi nasıl alınır?",
    a: "Sayfadaki Teklif iste veya Proje Fabrikası bağlantısı ile proje ölçüleri ve konsept bilgisi paylaşılır; Besos ekibi modül listesi ve yerleşim için geri dönüş sağlar.",
  },
  {
    q: "Vitrinde kaç bar modülü listelenir?",
    a: `Katalogda ${products.length} modül ve aksesuar kartı yer alır; imza üçlü (The Manhattan, The Boulverdier, Clover) ana vitrin dışında özel imza bölümünde sunulur.`,
  },
  {
    q: "Besos hangi projeler için uygundur?",
    a: "Otel lobisi barı, fine dining cocktail istasyonu, etkinlik ve catering bar hattı, rooftop ve lounge konseptleri için modüler paslanmaz bar çözümleri sunulur.",
  },
  {
    q: "Türkiye dışına ihracat yapılıyor mu?",
    a: "Equsto Satış Mühendisliği Ortadoğu, Balkanlar ve Türki cumhuriyetler dahil ihracat projelerini destekler; Besos modülleri proje bazlı tekliflenir.",
  },
];

const faqEn = [
  {
    q: "What is Besos Bar Design Studio?",
    a: "Besos is Equsto's Bar Design Studio showcase for modular cocktail bar lines, signature stations and bar modules for hotels, restaurants and event venues — with project-based quoting.",
  },
  {
    q: "How do I request a bar line quote?",
    a: "Use Request quote on this page or the Project Factory flow with dimensions and concept; the Besos team returns a module list and layout guidance.",
  },
  {
    q: "How many bar modules are listed?",
    a: `The catalogue lists ${products.length} modules and accessories; the signature trio (The Manhattan, The Boulverdier, Clover) is presented in a dedicated signature section outside the main grid.`,
  },
  {
    q: "Which projects is Besos suited for?",
    a: "Hotel lobby bars, fine-dining cocktail stations, event and catering bars, rooftop and lounge concepts — modular stainless bar solutions sized to your floor plan.",
  },
  {
    q: "Do you support export outside Turkey?",
    a: "Equsto Sales Engineering supports export projects across the Middle East, Balkans and Turkic regions; Besos modules are quoted per project.",
  },
];

function buildGraph(origin, lang, faq, labels) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${origin}#webpage`,
        url: origin,
        name: labels.webPageName,
        description: labels.webPageDesc,
        isPartOf: { "@id": "https://equsto.com/#website" },
        about: { "@id": "https://equsto.com/#organization" },
        inLanguage: lang,
        dateModified: MODIFIED,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${origin}#breadcrumbs`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: labels.bcHome,
            item: lang.startsWith("en") ? "https://equsto.com/en/" : "https://equsto.com/",
          },
          { "@type": "ListItem", position: 2, name: labels.bcHere, item: origin },
        ],
      },
      {
        "@type": "Service",
        "@id": `${origin}#service`,
        name: labels.serviceName,
        alternateName: ["Bar Design Studio", "Cocktail Bar Station Design"],
        serviceType: labels.serviceType,
        description: labels.serviceDesc,
        provider: { "@type": "Organization", name: "Equsto", url: "https://equsto.com" },
        areaServed: ["TR", "AE", "QA", "SA", "AZ", "KZ", "AL", "RO", "BG"],
        audience: {
          "@type": "BusinessAudience",
          audienceType: "Hotel, restaurant and event bar operators",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${origin}#faq`,
        inLanguage: lang,
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "VideoObject",
        "@id": `${origin}#hero-video`,
        name: labels.videoName,
        description: labels.videoDesc,
        thumbnailUrl: "https://i.ytimg.com/vi/cOVgfu2o4h4/maxresdefault.jpg",
        uploadDate: "2026-01-01T00:00:00+03:00",
        contentUrl: "https://www.youtube.com/watch?v=cOVgfu2o4h4",
        embedUrl: "https://www.youtube-nocookie.com/embed/cOVgfu2o4h4",
        publisher: { "@id": "https://equsto.com/#organization" },
      },
      {
        "@type": "ItemList",
        "@id": `${origin}#catalog`,
        name: labels.catalogName,
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.name || `Module ${p.page}`,
          description: (p.description || "").slice(0, 200),
          item: {
            "@type": "Product",
            name: p.name,
            description: (p.description || "").slice(0, 500) || undefined,
            category: p.category,
            sku: p.code || `BES-P${p.page}`,
            url: `${origin}#${encodeURIComponent(p.code || `BES-P${p.page}`)}`,
            brand: { "@type": "Brand", name: "Besos" },
            offers: besosModuleOffer(origin, p),
          },
        })),
      },
    ],
  };
}

const graphTr = buildGraph(ORIGIN_TR, "tr-TR", faqTr, {
  webPageName: "Besos · Bar Design Studio",
  webPageDesc:
    "Modüler cocktail bar hatları, imza istasyonları ve bar modülleri vitrini. Otel ve restoran bar projeleri için teklif.",
  bcHome: "Anasayfa",
  bcHere: "Bar Design Studio",
  serviceName: "Besos Bar Design Studio — Modüler Bar Hatları",
  serviceType: "Modüler cocktail bar tasarımı ve bar modül tedariki",
  serviceDesc:
    "Paslanmaz modüler bar üniteleri, imza cocktail istasyonları, buz ve servis hatları. Proje ölçüsüne göre vitrin seçimi ve teklif.",
  videoName: "Besos · Bar Design Studio — tanıtım",
  videoDesc: "Bar Design Studio (Besos) — modüler bar hatları vitrin tanıtımı.",
  catalogName: "Besos bar modül kataloğu",
});

const graphEn = buildGraph(ORIGIN_EN, "en-US", faqEn, {
  webPageName: "Besos · Bar Design Studio — Modular Cocktail Bar Lines",
  webPageDesc:
    "Modular cocktail bar lines, signature stations and bar module catalogue. Quotes for hotel and restaurant bar projects in Turkey and export markets.",
  bcHome: "Home",
  bcHere: "Bar Design Studio",
  serviceName: "Besos Bar Design Studio — Modular Bar Lines",
  serviceType: "Modular cocktail bar design and bar module supply",
  serviceDesc:
    "Stainless modular bar units, signature cocktail stations, ice and service lines. Showroom selection and project quoting.",
  videoName: "Besos · Bar Design Studio — overview",
  videoDesc: "Bar Design Studio (Besos) — modular bar line showcase.",
  catalogName: "Besos bar module catalogue",
});

fs.writeFileSync(outTr, JSON.stringify(graphTr), "utf8");
fs.writeFileSync(outEn, JSON.stringify(graphEn), "utf8");

const headEn = {
  title: "Besos · Bar Design Studio — Modular Cocktail Bar Lines",
  description:
    "Besos · Bar Design Studio: modular cocktail bar stations for hotels and restaurants. Stainless bar modules, beverage stations, coffee line. References include Hilton, Marriott, Migros, TAV, Sodexo. Request a bar line quote.",
  keywords:
    "cocktail bar design, modular bar unit, hotel bar project, restaurant bar line, bar design studio, stainless bar module, beverage station, Besos, Bar Design Studio, Cocktail Bar Station Manufacturer Turkey",
  canonical: ORIGIN_EN,
  ogLocale: "en_US",
  ogTitle: "Besos · Bar Design Studio — Modular Cocktail Bar Lines",
  ogDescription:
    "Modular bar units for hotel and restaurant projects. Hilton, Marriott, Migros referenced installations. Besos bar lines.",
  ogUrl: ORIGIN_EN,
  twitterTitle: "Besos · Bar Design Studio",
  twitterDescription: "Modular cocktail bar stations — Turkey and export projects.",
  ld: graphEn,
};

fs.writeFileSync(
  outCfg,
  "/* Besos head SEO EN — npm run seo:besos */\nwindow.__EQ_BESOS_HEAD_SEO_EN=" +
    JSON.stringify(headEn) +
    ";\n",
  "utf8"
);

console.log(
  `[seo:besos] ${products.length} modül — TR ${outTr}, EN ${outEn}, config ${outCfg}`
);
