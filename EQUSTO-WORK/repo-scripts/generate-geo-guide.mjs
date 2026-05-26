/**
 * GEO kurulum rehberi HTML — steakhouse şablonundan türetilir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(root, "public", "steakhouse-kurulumu.html");
const ORIGIN = "https://equsto.com";

const GUIDES = [
  {
    slug: "bulut-mutfak-kurulumu",
    enSlug: "cloud-kitchen-setup",
    eqSk: "EQ-SK-2026-002-BULUT-MUTFAK",
    preset: "bulut-mutfak",
    title: "Bulut Mutfak Kurulumu",
    h1Strong: "2026 Maliyet, Ekipman ve Alan Rehberi",
    heroAria: "Bulut mutfak kurulumu hero",
    keywords:
      "bulut mutfak kurulumu, cloud kitchen kurulumu, paket mutfak ekipmanı, ghost kitchen maliyeti, Mizanplus ekipman listesi, delivery mutfak projesi",
    description:
      "Bulut mutfak (cloud kitchen) kurulumu için eksiksiz ekipman listesi: pişirme hattı, soğutma, paketleme, yıkama. 2026 maliyet aralığı. Equsto Proje Fabrikası ile anında teklif.",
    lead:
      "<strong>Bulut mutfak</strong>, salonu olmayan paket servis odaklı üretim mutfağıdır. 2026'da kompakt cloud kitchen anahtar teslim ekipman maliyeti <strong>800 bin - 2 milyon TL</strong>, ideal alan <strong>25-80 m²</strong> aralığındadır.",
    serviceDesc:
      "Cloud kitchen ve paket servis mutfakları için kompakt ekipman paketi, alan planı ve teklif.",
    ctaLabel: "Bulut mutfak projem için anında teklif",
    faqTitle: "Bulut mutfak kurulumu hakkında",
    stats: [
      ["800K - 2M", "TL · Anahtar teslim ekipman", "Kapasite ve yıkama hattına göre değişir."],
      ["25 - 80", "m² · Üretim alanı", "Pişirme, soğutma, paketleme, yıkama bölgeleri."],
      ["4 - 8", "hafta · Kurulum süresi", "Tedarik 3-5 hafta, montaj 1-2 hafta."],
      ["6 - 10", "kişi · Mutfak ekibi", "İki vardiya pişirme ve paketleme."],
    ],
    essentials: [
      ["01", "Konveksiyonlu Fırın / Ocak Hattı", "Yüksek sipariş dalgalarına dayanıklı sıcak hat."],
      ["02", "Tezgah Tipi Soğutma", "Hazırlık ve marine için GN soğutma."],
      ["03", "Derin Dondurucu", "Stoklu cloud kitchen modelleri için."],
      ["04", "Setaltı Bulaşık Makinesi", "Kompakt alanda hijyen."],
      ["05", "Paketleme ve Sevk Tezgahı", "Sipariş birleştirme ve kurye hand-off."],
      ["06", "Davlumbaz ve Havalandırma", "Yağlı pişirme için filtreli davlumbaz."],
    ],
    products: [
      ["pisirme.html?tip=konveksiyonlu-firin", "Pişirme", "Konveksiyonlu Fırın", "Yüksek hacim pişirme."],
      ["sogutma.html?tip=tezgah_tipi_buzdolabi", "Soğutma", "Tezgah Tipi Buzdolabı", "Hazırlık deposu."],
      ["yikama.html?tip=setalti_bulasik", "Yıkama", "Setaltı Bulaşık", "Kompakt hijyen."],
      ["sogutma.html?tip=derin_dondurucu", "Soğutma", "Derin Dondurucu", "Stoklu üretim."],
    ],
    faq: [
      ["Bulut mutfak kurulumu 2026 maliyeti ne kadar?", "Kompakt 30-50 m² için 800 bin - 2 milyon TL; çok markalı yapıda 2-3,5 milyon TL. PFOS ile anında liste alın."],
      ["Bulut mutfak kaç metrekare olmalı?", "Tek marka 25-35 m²; multi-brand 50-80 m². Akış: kabul → hazırlık → pişirme → paketleme → sevk."],
      ["Mizanplus tarzı cloud kitchen için hangi ekipmanlar?", "Pişirme, soğutma, paketleme, bulaşık ve davlumbaz omurgası; menüye göre fritöz veya ızgara eklenir."],
      ["İzin süreci farklı mı?", "Gıda işletme kaydı ve belediye ruhsatı aynı; sanayi sitesi uyumu ve itfaiye şartları kritiktir."],
    ],
  },
  {
    slug: "cafe-kurulumu",
    enSlug: "cafe-setup",
    eqSk: "EQ-SK-2026-003-CAFE",
    preset: "kafe",
    title: "Kafe Kurulumu",
    h1Strong: "2026 Maliyet, Ekipman ve Kahve Hattı Rehberi",
    heroAria: "Kafe kurulumu hero",
    keywords:
      "kafe kurulumu, cafe mutfak projesi, espresso makinesi, kahve ekipmanları, brunch mutfak maliyeti, küçük kafe açmak",
    description:
      "Kafe açmak için espresso, değirmen, soğutma ve hazırlık hattı ekipman listesi. 2026 maliyet rehberi. Equsto Proje Fabrikası.",
    lead:
      "<strong>Kafe</strong>, espresso ve filtre kahve hattı + sınırlı sıcak hazırlık ile tanımlanır. 2026'da 40-80 kişilik kafe mutfağı <strong>600 bin - 1,8 milyon TL</strong>, alan <strong>20-45 m²</strong> aralığındadır.",
    serviceDesc: "Kafe ve kahve ağırlıklı işletmeler için espresso hattı ve hazırlık ekipman paketi.",
    ctaLabel: "Kafe projem için anında teklif",
    faqTitle: "Kafe açmadan önce",
    stats: [
      ["600K - 1,8M", "TL · Anahtar teslim", "Espresso sınıfına göre değişir."],
      ["20 - 45", "m² · Mutfak alanı", "Kahve, soğutma, hazırlık, yıkama."],
      ["3 - 6", "hafta · Kurulum", "Espresso tedariki 2-4 hafta."],
      ["4 - 8", "kişi · Ekip", "Barista ve hazırlık vardiyalı."],
    ],
    essentials: [
      ["01", "Espresso Kahve Makinesi", "Günlük shot hacmine göre grup sayısı."],
      ["02", "Kahve Değirmeni", "Taze öğütme kalitesi."],
      ["03", "Tezgah Altı Soğutma", "Süt ve garnitür deposu."],
      ["04", "Filtre Kahve / Demleme", "Brunch menüsü için batch brew."],
      ["05", "Kompakt Fırın veya Tost", "Sıcak sandviç ve kruvasan."],
      ["06", "Bardak Yıkama", "Bar hijyeni."],
    ],
    products: [
      ["kahve.html?tip=espresso_makinesi", "Kahve", "Espresso Makinesi", "Kafe kalbi."],
      ["kahve.html?tip=kahve_degirmeni", "Kahve", "Kahve Değirmeni", "Taze öğütme."],
      ["sogutma.html?tip=tezgah_tipi_buzdolabi", "Soğutma", "Tezgah Tipi Soğutma", "Süt deposu."],
      ["kahve.html?tip=filtre_kahve", "Kahve", "Filtre Kahve", "Batch brew."],
    ],
    faq: [
      ["Kafe kurulumu maliyeti 2026?", "40-80 kişilik kafe için 600 bin - 1,8 milyon TL. Espresso marka sınıfı belirleyicidir."],
      ["Minimum kafe ekipman listesi?", "Espresso, değirmen, soğutma, su filtresi, bardak yıkama."],
      ["Kafe mutfağı kaç m²?", "İçecek ağırlıklı 20-25 m²; brunch ile 35-45 m²."],
      ["Teklif nasıl alınır?", "PFOS'ta Kafe-Kafeterya konsepti seçin."],
    ],
  },
  {
    slug: "catering-mutfagi",
    enSlug: "catering-kitchen-setup",
    eqSk: "EQ-SK-2026-004-CATERING",
    preset: "catering",
    title: "Catering Mutfağı Kurulumu",
    h1Strong: "2026 Maliyet, Ekipman ve Kapasite Rehberi",
    heroAria: "Catering mutfağı kurulumu hero",
    keywords:
      "catering mutfağı kurulumu, 500 kişilik catering ekipmanı, toplu yemek mutfağı, banquette üretim mutfağı",
    description:
      "Catering ve toplu yemek mutfağı kurulumu: pişirme, soğutma, taşıma ve yıkama. 500 kişilik referans. Equsto Proje Fabrikası.",
    lead:
      "<strong>Catering mutfağı</strong> yüksek hacimli üretim ve sevk lojistiği için tasarlanır. 2026'da 300-500 kişilik günlük üretim için <strong>1,5 - 4 milyon TL</strong>, alan <strong>40-120 m²</strong> aralığındadır.",
    serviceDesc: "Toplu yemek ve banquette üretim mutfakları için yüksek hacim projelendirme.",
    ctaLabel: "Catering projem için anında teklif",
    faqTitle: "Catering mutfağı hakkında",
    stats: [
      ["1,5 - 4M", "TL · Anahtar teslim", "Porsiyon ve soğuk zincire göre."],
      ["40 - 120", "m² · Üretim alanı", "Pişirme, soğutma, hazırlık, yıkama."],
      ["6 - 12", "hafta · Kurulum", "Tünel yıkama varsa süre uzar."],
      ["10 - 25", "kişi · Üretim ekibi", "Vardiya sayısına göre."],
    ],
    essentials: [
      ["01", "Kuzine ve Toplu Pişirme", "Günlük ana yemek hacmi."],
      ["02", "Blast Chiller", "HACCP soğuk zincir."],
      ["03", "Yüksek Kapasiteli Soğutma", "Günlük üretim stoku."],
      ["04", "Hazırlık ve Dilimleme", "Sebze doğrama, vakum."],
      ["05", "Konveyörlü Bulaşık", "500+ öğün/gün için."],
      ["06", "Banket Arabaları", "Sıcak-soğuk holding ve sevk."],
    ],
    products: [
      ["pisirme.html?tip=kuzineler", "Pişirme", "Kuzineler", "Toplu pişirme."],
      ["sogutma.html?tip=blast_chiller", "Soğutma", "Blast Chiller", "Soğuk zincir."],
      ["yikama.html?tip=konveyorlu_bulasik", "Yıkama", "Konveyörlü Bulaşık", "Yüksek hacim."],
      ["hazirlik.html?tip=sebze_dograma", "Hazırlık", "Sebze Doğrama", "Ön hazırlık."],
    ],
    faq: [
      ["500 kişilik catering mutfağı maliyeti?", "2026 için 1,5 - 4 milyon TL ekipman aralığı."],
      ["Catering ile restoran farkı?", "Şoklama, yüksek hacim pişirme ve banket arabaları ön planda."],
      ["Hangi bulaşık makinesi?", "500+ tabak/günde konveyörlü veya tünel tip."],
      ["Teklif nasıl alınır?", "PFOS'ta Catering konsepti ve günlük porsiyon girin."],
    ],
  },
  {
    slug: "fine-dining-kurulumu",
    enSlug: "fine-dining-setup",
    eqSk: "EQ-SK-2026-005-FINE-DINING",
    preset: "fine-dining",
    title: "Fine Dining Restoran Kurulumu",
    h1Strong: "2026 Maliyet, Ekipman ve Mutfak Hattı Rehberi",
    heroAria: "Fine dining restoran kurulumu hero",
    keywords:
      "fine dining kurulumu, fine dining mutfak projesi, premium restoran ekipmanı, gastronomi mutfağı maliyeti, sous vide restoran, steakhouse fine dining farkı",
    description:
      "Fine dining restoran kurulumu: kombi fırın, sous-vide, blast chiller, premium soğutma ve hazırlık hattı. 2026 maliyet ve alan rehberi. Equsto Proje Fabrikası.",
    lead:
      "<strong>Fine dining</strong>, yüksek marjlı, düşük kapasiteli ve teknik pişirme odaklı restoran segmentidir. 2026'da 60-120 kişilik salon için mutfak ekipmanı <strong>3 - 6 milyon TL</strong>, alan <strong>40-80 m²</strong> aralığındadır.",
    serviceDesc: "Fine dining ve premium restoranlar için teknik pişirme hattı ve soğuk zincir projelendirme.",
    ctaLabel: "Fine dining projem için anında teklif",
    faqTitle: "Fine dining kurulumu hakkında",
    stats: [
      ["3 - 6M", "TL · Anahtar teslim", "Marka sınıfı ve soğuk zincire göre."],
      ["40 - 80", "m² · Mutfak alanı", "Sıcak hat, soğutma, pastane köşesi, yıkama."],
      ["8 - 16", "hafta · Kurulum", "İthal ekipman varsa süre uzar."],
      ["8 - 14", "kişi · Mutfak ekibi", "Servis ve mutfak vardiyalı."],
    ],
    essentials: [
      ["01", "Kombi / Konveksiyonlu Fırın", "Düşük hacim, yüksek hassasiyetli pişirme."],
      ["02", "Sous-Vide ve Düşük Sıcak Pişirme", "Protein standardizasyonu."],
      ["03", "Blast Chiller", "HACCP ve ön hazırlık."],
      ["04", "Premium Soğutma Hattı", "Günlük taze ürün ve marinating."],
      ["05", "Hazırlık ve Pastane Köşesi", "Sos, garnitür, tatlı hazırlığı."],
      ["06", "Setüstü veya Konveyörlü Bulaşık", "Porsiyon hacmine göre."],
    ],
    products: [
      ["pisirme.html?tip=konveksiyonlu-firin", "Pişirme", "Konveksiyonlu Fırın", "Hassas pişirme."],
      ["sogutma.html?tip=blast_chiller", "Soğutma", "Blast Chiller", "Soğuk zincir."],
      ["hazirlik.html?tip=sebze_dograma", "Hazırlık", "Hazırlık Tezgahı", "Ön hazırlık."],
      ["yikama.html?tip=konveyorlu_bulasik", "Yıkama", "Bulaşık Hattı", "Hijyen standardı."],
    ],
    faq: [
      ["Fine dining mutfak maliyeti 2026?", "60-120 kişilik salon için 3-6 milyon TL ekipman aralığı."],
      ["Fine dining ile steakhouse farkı?", "Fine dining'de sous-vide ve çoklu teknik pişirme; steakhouse'da ızgara ve dry-age omurgası ön planda."],
      ["Kaç m² mutfak yeterli?", "40-55 m² orta ölçek; tasting menu ve geniş pastane ile 70-80 m²."],
      ["Teklif nasıl alınır?", "PFOS'ta Restaurant → Fine Dining seçin."],
    ],
  },
  {
    slug: "all-day-dining-kurulumu",
    enSlug: "all-day-dining-setup",
    eqSk: "EQ-SK-2026-006-ALL-DAY-DINING",
    preset: "all-day-dining",
    title: "All Day Dining Cafe Kurulumu",
    h1Strong: "2026 Maliyet, Ekipman ve Gün Boyu Servis Rehberi",
    heroAria: "All day dining kurulumu hero",
    keywords:
      "all day dining kurulumu, gün boyu cafe restoran, TheHouse Cafe tarzı mutfak, brunch mutfak ekipmanı, hybrid cafe restaurant projesi",
    description:
      "All day dining (gün boyu cafe-restoran) kurulumu: kahve hattı + sıcak mutfak + brunch. 2026 maliyet rehberi. Equsto Proje Fabrikası.",
    lead:
      "<strong>All day dining</strong>, sabah kahvesinden akşam yemeğine tek mekânda hizmet veren hibrit cafe-restoran modelidir. 2026'da 80-150 kişilik kapasite için <strong>1,2 - 3 milyon TL</strong> ekipman, <strong>35-70 m²</strong> mutfak alanı tipiktir.",
    serviceDesc: "Gün boyu cafe-restoran ve hibrit işletmeler için kahve + sıcak mutfak paketi.",
    ctaLabel: "All day dining projem için anında teklif",
    faqTitle: "All day dining hakkında",
    stats: [
      ["1,2 - 3M", "TL · Anahtar teslim", "Kahve sınıfı ve sıcak hat genişliğine göre."],
      ["35 - 70", "m² · Mutfak alanı", "Kahve, sıcak hat, soğutma, yıkama."],
      ["4 - 10", "hafta · Kurulum", "Espresso + fırın hattı tedariki."],
      ["6 - 12", "kişi · Ekip", "Brunch ve akşam vardiyası."],
    ],
    essentials: [
      ["01", "Espresso ve Filtre Kahve Hattı", "Gün boyu içecek trafiği."],
      ["02", "Kombi Fırın / Sıcak Hat", "Brunch ve akşam menüsü."],
      ["03", "Tezgah Tipi Soğutma", "Süt, garnitür, hazırlık."],
      ["04", "Kızartma veya Izgara Modülü", "Popüler ana yemekler."],
      ["05", "Hazırlık ve Soğuk Mutfak", "Salata, bowl, tatlı hazırlığı."],
      ["06", "Bulaşık ve Bar Yıkama", "Yüksek tabak dönüşümü."],
    ],
    products: [
      ["kahve.html?tip=espresso_makinesi", "Kahve", "Espresso Makinesi", "Gün boyu kahve."],
      ["pisirme.html?tip=konveksiyonlu-firin", "Pişirme", "Konveksiyonlu Fırın", "Brunch ve sıcak hat."],
      ["sogutma.html?tip=tezgah_tipi_buzdolabi", "Soğutma", "Tezgah Tipi Soğutma", "Hazırlık deposu."],
      ["yikama.html?tip=setalti_bulasik", "Yıkama", "Bulaşık Hattı", "Yüksek hacim hijyen."],
    ],
    faq: [
      ["All day dining ile klasik kafe farkı?", "Sıcak mutfak ve brunch-akşam menüsü daha geniş; ekipman listesi cafe'den %40-60 daha büyüktür."],
      ["Maliyet 2026?", "80-150 kişilik için 1,2-3 milyon TL aralığı."],
      ["Kaç m² mutfak?", "Kahve ağırlıklı 35-45 m²; tam gün yemek ile 55-70 m²."],
      ["Teklif nasıl alınır?", "PFOS'ta Restaurant → All Dining Cafe seçin."],
    ],
  },
  {
    slug: "fast-food-kurulumu",
    enSlug: "fast-food-setup",
    eqSk: "EQ-SK-2026-007-FAST-FOOD",
    preset: "fast-food",
    title: "Fast Food Kurulumu",
    h1Strong: "2026 Maliyet, Ekipman ve Hızlı Servis Rehberi",
    heroAria: "Fast food kurulumu hero",
    keywords:
      "fast food kurulumu, hızlı servis restoran ekipmanı, burger mutfak projesi, fritöz hattı maliyeti, quick service restaurant kurulumu",
    description:
      "Fast food ve hızlı servis restoran kurulumu: fritöz, ızgara, holding ve yüksek hacim bulaşık. 2026 maliyet rehberi. Equsto Proje Fabrikası.",
    lead:
      "<strong>Fast food</strong>, yüksek tabak dönüşümü ve standart menü ile çalışan hızlı servis modelidir. 2026'da 60-120 kişilik QSR mutfağı <strong>800 bin - 2,5 milyon TL</strong>, alan <strong>25-55 m²</strong> aralığındadır.",
    serviceDesc: "Burger, döner, pizza ve quick service konseptleri için yüksek hacim mutfak paketi.",
    ctaLabel: "Fast food projem için anında teklif",
    faqTitle: "Fast food kurulumu hakkında",
    stats: [
      ["800K - 2,5M", "TL · Anahtar teslim", "Menü ve franchise şartına göre."],
      ["25 - 55", "m² · Mutfak alanı", "Pişirme, soğutma, paketleme, yıkama."],
      ["3 - 8", "hafta · Kurulum", "Fritöz ve davlumbaz hızlı tedarik."],
      ["5 - 10", "kişi · Mutfak ekibi", "Pik saat vardiyası."],
    ],
    essentials: [
      ["01", "Fritöz Hattı", "Patates ve kızartma ürünleri."],
      ["02", "Izgara veya Plancha", "Burger ve et ürünleri."],
      ["03", "Tezgah Altı ve Hazırlık Soğutma", "Hızlı marinating ve garnitür."],
      ["04", "Holding ve Isıtma Üniteleri", "Pik saat servis sürekliliği."],
      ["05", "Yüksek Hızlı Bulaşık", "Kısa tabak dönüşümü."],
      ["06", "Yağlı Pişirme Davlumbazı", "Fritöz emiş debisi kritik."],
    ],
    products: [
      ["pisirme.html?tip=fritoz", "Pişirme", "Fritöz", "Kızartma hattı."],
      ["pisirme.html?tip=lavtasli_izgara", "Pişirme", "Izgara", "Burger ve et."],
      ["sogutma.html?tip=tezgah_tipi_buzdolabi", "Soğutma", "Tezgah Tipi Soğutma", "Hazırlık."],
      ["yikama.html?tip=konveyorlu_bulasik", "Yıkama", "Konveyörlü Bulaşık", "Yüksek hacim."],
    ],
    faq: [
      ["Fast food mutfak maliyeti 2026?", "60-120 kişilik QSR için 800 bin - 2,5 milyon TL."],
      ["Franchise projelerinde fark?", "Marka kitine göre ekipman listesi sabitlenir; PFOS ile ön bütçe çıkarılır."],
      ["Davlumbaz neden kritik?", "Fritöz hattında yağlı pişirme emiş debisi ve filtre zorunludur."],
      ["Teklif nasıl alınır?", "PFOS'ta Restaurant → Fastfood seçin."],
    ],
  },
];

const guideEnJson = path.join(root, "public", "data", "eq-guide-en.json");
const EN_GUIDE_COPY = JSON.parse(fs.readFileSync(guideEnJson, "utf8"));

/** TR şablonu dışında sadece EN üretilen steakhouse meta stub */
const STEAKHOUSE_GUIDE_STUB = {
  slug: "steakhouse-kurulumu",
  enSlug: "steakhouse-setup",
  preset: "steakhouse",
  eqSk: "EQ-SK-2026-001-STEAKHOUSE",
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPage(g, lang = "tr") {
  const en = lang === "en";
  const trUrl = `${ORIGIN}/${g.slug}`;
  const enUrl = `${ORIGIN}/en/${g.enSlug}`;
  const pageUrl = en ? enUrl : trUrl;

  let html = fs.readFileSync(templatePath, "utf8");

  const homeCrumb = en ? "Home" : "Anasayfa";
  const guidesCrumb = en ? "Setup guides" : "Kurulum Rehberleri";
  const svcPrefix = en ? "Industrial kitchen — " : "Endüstriyel mutfak — ";

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeCrumb, item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: guidesCrumb, item: `${ORIGIN}/pfos` },
          { "@type": "ListItem", position: 3, name: g.title, item: pageUrl },
        ],
      },
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: `${g.title} — Equsto`,
        serviceType: `${svcPrefix}${g.title}`,
        description: g.serviceDesc,
        provider: { "@type": "Organization", name: "Equsto", url: ORIGIN },
        areaServed: ["TR", "AE", "QA", "SA", "AZ", "KZ"],
        inLanguage: en ? "en-US" : "tr-TR",
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: g.faq.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  const prodCta = en ? "View &rsaquo;" : "İncele &rsaquo;";

  const essentialsHtml = g.essentials
    .map(
      ([n, t, p]) =>
        `<div class="sh-ess-card"><div class="sh-ess-num">${n}</div><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`
    )
    .join("\n      ");

  const statsHtml = g.stats
    .map(
      ([num, lbl, note], i) =>
        `<div class="sh-stat"><div class="sh-stat-num${i === 0 ? " gold" : ""}">${esc(num)}</div><div class="sh-stat-lbl">${esc(lbl)}</div><div class="sh-stat-note">${esc(note)}</div></div>`
    )
    .join("\n      ");

  const prodHtml = g.products
    .map(
      ([href, cat, name, desc]) =>
        `<a href="${href}" class="sh-prod-card"><div class="sh-prod-tip">${esc(cat)}</div><h3>${esc(name)}</h3><p>${esc(desc)}</p><span class="sh-prod-cta">${prodCta}</span></a>`
    )
    .join("\n      ");

  const faqHtml = g.faq
    .map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="sh-faq-answer">${esc(a)}</div></details>`)
    .join("\n      ");

  const titleSuffix = en
    ? "Kitchen equipment checklist & indicative budget · Equsto"
    : "Mutfak Ekipman Listesi ve Maliyet · Equsto";

  const essentialsKicker = en ? "Essentials" : "Olmazsa olmazlar";
  const statsHeading = en ? "Cost, space & lead time" : "Maliyet, alan ve kurulum süresi";
  const statsAria = en ? 'aria-label="Cost, space and timeline"' : 'aria-label="Maliyet, alan ve süre"';
  const productsLead = en
    ? "Browse curated department tiles — add to basket or jump into PFOS for a full quotation."
    : "Aşağıdaki kategorilerden ürün seçeneklerini Equsto kataloğunda detaylı incele, sepete ekle veya doğrudan Proje Fabrikası'na götür.";
  const essentialsLead = en
    ? "Equsto reference backbone — customised to your covers and menu."
    : "Equsto referans listesi — kapasite ve menüye göre özelleştirilir.";
  const statsLeadEn = en
    ? "Equsto reference KPIs — capacity and menu dependent."
    : "Equsto referans rakamları — kapasite ve menüye göre özelleştirilir.";
  const pfosFinalHtml = '<a href="pfos.html?preset=' + g.preset + '" class="sh-cta-primary">' + (en ? 'Open Project Factory →' : "Proje Fabrikası'na git →") + "</a>";
  const finalP = en
    ? "Share concept, throughput and cuisine mix with PFOS — Equsto Technology outputs the equipment BOM and indicative pricing in seconds."
    : "Konseptini, kapasiteni ve menünü Proje Fabrikası'na anlat — Equsto Teknolojisi sana özel ekipman listesini ve teklifi anında çıkarsın.";

  const reps = [];
  reps.push([/^<html lang="tr">/m, `<html lang="${en ? "en" : "tr"}">`]);
  reps.push([
    /<title>[\s\S]*?<\/title>/,
    `<title>${esc(g.title)} — ${titleSuffix}</title>`,
  ]);
  reps.push([
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${esc(g.description)}">`,
  ]);
  reps.push([
    /<meta name="keywords" content="[^"]*">/,
    `<meta name="keywords" content="${esc(g.keywords)}">`,
  ]);
  reps.push([/https:\/\/equsto\.com\/steakhouse-kurulumu/g, trUrl]);
  reps.push([/\/en\/steakhouse-setup/g, `/en/${g.enSlug}`]);
  reps.push([/EQ-SK-2026-001-STEAKHOUSE/g, g.eqSk]);
  reps.push([
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`,
  ]);
  reps.push([/aria-label="Steakhouse kurulumu hero"/, `aria-label="${esc(g.heroAria)}"`]);
  reps.push([
    /<h1>[\s\S]*?<\/h1>/,
    `<h1>${esc(g.title)} — <strong>${esc(g.h1Strong)}</strong></h1>`,
  ]);
  reps.push([/<p class="sh-hero-lead">[\s\S]*?<\/p>/, `<p class="sh-hero-lead">${g.lead}</p>`]);
  reps.push([/<span>Steakhouse Kurulumu<\/span>/, `<span>${esc(g.title)}</span>`]);
  reps.push([
    /Steakhouse'un 8 temel ekipmanı/,
    en ? `${g.title} essentials` : `${g.title} için temel ekipmanlar`,
  ]);
  reps.push([
    /Steakhouse projeni Equsto ile kur\./,
    en ? `Build ${g.title} with Equsto.` : `${g.title} projeni Equsto ile kur.`,
  ]);
  reps.push([/Steakhouse projem için anında teklif/g, g.ctaLabel]);
  reps.push([/pfos\.html\?preset=steakhouse/g, `pfos.html?preset=${g.preset}`]);
  reps.push([/Steakhouse açmadan önce bilmek istediklerin/, g.faqTitle]);
  reps.push([
    /Konseptini, kapasiteni ve menünü Proje Fabrikası'na anlat — Equsto Teknolojisi sana özel ekipman listesini ve teklifi anında çıkarsın\./,
    finalP,
  ]);
  reps.push([/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${pageUrl}">`]);
  reps.push([
    /<link rel="alternate" hreflang="tr" href="[^"]*"\/?>/,
    `<link rel="alternate" hreflang="tr" href="${trUrl}">`,
  ]);
  reps.push([
    /<link rel="alternate" hreflang="en" href="[^"]*"\/?>/,
    `<link rel="alternate" hreflang="en" href="${enUrl}">`,
  ]);
  reps.push([
    /<link rel="alternate" hreflang="x-default" href="[^"]*"\/?>/,
    `<link rel="alternate" hreflang="x-default" href="${trUrl}">`,
  ]);
  if (en) {
    reps.push([
      /property="og:locale" content="[^"]*"/,
      'property="og:locale" content="en_US"',
    ]);
    reps.push([
      /property="og:locale:alternate" content="[^"]*"/,
      'property="og:locale:alternate" content="tr_TR"',
    ]);
  }
  reps.push([
    /property="og:url" content="[^"]*"/,
    `property="og:url" content="${pageUrl}"`,
  ]);
  reps.push([
    /property="og:title" content="[^"]*"/,
    `property="og:title" content="${esc(g.title)} — Equsto"`,
  ]);
  reps.push([
    /property="og:description" content="[^"]*"/,
    `property="og:description" content="${esc(g.description)}"`,
  ]);
  reps.push([
    /name="twitter:title" content="[^"]*"/,
    `name="twitter:title" content="${esc(g.title)} · Equsto"`,
  ]);
  reps.push([
    /name="twitter:description" content="[^"]*"/,
    `name="twitter:description" content="${esc(g.description)}"`,
  ]);
  reps.push([
    /Her steakhouse, konseptinden bağımsız olarak şu sekiz kalem[\s\S]*?omurga listesidir\./,
    essentialsLead,
  ]);
  reps.push([
    /60-100 kişilik orta ölçekli bir steakhouse için Equsto referans rakamları\. Bulut mutfak veya 200\+ kişilik premium konsept için anında özelleştirilmiş teklif alabilirsiniz\./,
    statsLeadEn,
  ]);
  if (en) {
    reps.push([
      /<nav class="breadcrumb"[\s\S]*?<\/nav>/,
      `<nav class="breadcrumb" aria-label="Location"><a href="../index.html">Home</a> › <a href="../pfos.html">Setup guides</a> › <span>${esc(g.title)}</span></nav>`,
    ]);
  }
  reps.push([
    /<div class="sh-section-kicker">Olmazsa olmazlar<\/div>/,
    `<div class="sh-section-kicker">${essentialsKicker}</div>`,
  ]);
  reps.push([
    /<section class="sh-section alt" aria-label="Maliyet, alan ve süre">/,
    `<section class="sh-section alt" ${statsAria}>`,
  ]);
  reps.push([
    /<div class="sh-section-kicker">2026 rakamları<\/div>/,
    `<div class="sh-section-kicker">${en ? "2026 benchmarks" : "2026 rakamları"}</div>`,
  ]);
  reps.push([
    /<h2>Maliyet, alan ve kurulum süresi<\/h2>/,
    `<h2>${statsHeading}</h2>`,
  ]);
  reps.push([
    /<div class="sh-section-kicker">Equsto kataloğundan<\/div>/,
    `<div class="sh-section-kicker">${en ? "Equsto catalogue picks" : "Equsto kataloğundan"}</div>`,
  ]);
  reps.push([
    /<h2>Bu kurulum için önerilen ekipmanlar<\/h2>/,
    `<h2>${en ? "Recommended equipment tiles" : "Bu kurulum için önerilen ekipmanlar"}</h2>`,
  ]);
  reps.push([
    /<p class="sh-section-lead">Aşağıdaki kategorilerden[\s\S]*?Proje Fabrikası'na götür.<\/p>/,
    `<p class="sh-section-lead">${productsLead}</p>`,
  ]);
  reps.push([
    /<div class="sh-section-kicker">SSS<\/div>/,
    `<div class="sh-section-kicker">${en ? "FAQ" : "SSS"}</div>`,
  ]);
  reps.push([
    /<section class="sh-section alt" aria-label="Sıkça sorulan sorular">/,
    `<section class="sh-section alt" aria-label="${en ? "Frequently asked questions" : "Sıkça sorulan sorular"}">`,
  ]);
  reps.push([
    /<section class="sh-section" aria-label="Önerilen ürünler">/,
    `<section class="sh-section" aria-label="${en ? "Featured equipment" : "Önerilen ürünler"}">`,
  ]);
  reps.push([
    /<div class="sh-faq">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<section class="sh-final"/,
    `<div class="sh-faq">\n      ${faqHtml}\n    </div>\n  </div>\n</section>\n\n<section class="sh-final"`,
  ]);
  reps.push([
    /<div class="sh-essentials">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
    `<div class="sh-essentials">\n      ${essentialsHtml}\n    </div>\n  </div>\n</section>`,
  ]);
  reps.push([
    /<div class="sh-stats">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<section class="sh-section" aria-label="Önerilen ürünler">/,
    `<div class="sh-stats">\n      ${statsHtml}\n    </div>\n  </div>\n</section>\n\n<section class="sh-section" aria-label="Önerilen ürünler">`,
  ]);
  reps.push([
    /<div class="sh-products">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<section class="sh-section alt" aria-label="Sıkça sorulan sorular">/,
    `<div class="sh-products">\n      ${prodHtml}\n    </div>\n  </div>\n</section>\n\n<section class="sh-section alt" aria-label="Sıkça sorulan sorular">`,
  ]);

  for (const [re, rep] of reps) {
    html = html.replace(re, rep);
  }

  const finalAria = en ? "Call to action" : "Final çağrısı";
  html = html.replace(
    /<section class="sh-final" aria-label="[^"]*">[\s\S]*?<\/section>/,
    `<section class="sh-final" aria-label="${finalAria}">\n  <h2>${esc(en ? `Build ${g.title} with Equsto.` : `${g.title} projeni Equsto ile kur.`)}</h2>\n  <p>${esc(finalP)}</p>\n  ${pfosFinalHtml}\n</section>`
  );

  return html;
}

const enDir = path.join(root, "public", "en");
fs.mkdirSync(enDir, { recursive: true });

for (const g of GUIDES) {
  const out = path.join(root, "public", `${g.slug}.html`);
  fs.writeFileSync(out, buildPage(g, "tr"), "utf8");
  console.log(`[seo:guides] ${out}`);
  const enOv = EN_GUIDE_COPY[g.slug];
  if (enOv) {
    const merged = { ...g, ...enOv };
    const outEn = path.join(enDir, `${g.enSlug}.html`);
    fs.writeFileSync(outEn, buildPage(merged, "en"), "utf8");
    console.log(`[seo:guides:en] ${outEn}`);
  }
}

const steakEnMerged = { ...STEAKHOUSE_GUIDE_STUB, ...EN_GUIDE_COPY["steakhouse-kurulumu"] };
const outSteakEn = path.join(enDir, "steakhouse-setup.html");
fs.writeFileSync(outSteakEn, buildPage(steakEnMerged, "en"), "utf8");
console.log(`[seo:guides:en] ${outSteakEn}`);
