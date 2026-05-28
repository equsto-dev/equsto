/**
 * SEO / rehber sayfaları — eski site uzun metinleri (llms + PFOS şablonu).
 */
(function () {
  "use strict";

  var ORIGIN = "https://equsto.com";
  var DATA_URL = "/api/geo";
  var DATA_FALLBACK = "/data/geo-landings.json?v=20260602en650";
  var DATA_EN_FALLBACK = "/data/geo-landings-en.json?v=20260602en650";

  var UI = {
    tr: {
      tableH2: "Vitrinden örnek ekipman tablosu (8 kalem)",
      tableThLine: "Hat",
      tableThSku: "Örnek SKU",
      faqH2: "Sık sorulan sorular",
      faqAria: "Sık sorulan sorular",
      relatedH2: "İlgili rehberler",
      blogAria: "Rehber dizini",
      bcAria: "Konum",
      about:
        "Equsto Teknolojisi · Gastronomi Tasarımı · Satış Mühendisliği — Öztiryakiler yetkili bayii; Bar Design Studio (Besos) Vitrum Türkiye.",
      notFoundH1: "Sayfa bulunamadı",
      notFoundLead:
        "Aradığınız rehber henüz yayında değil. Ana sayfa veya iletişim üzerinden devam edebilirsiniz.",
      loadErr: "İçerik yüklenemedi.",
    },
    en: {
      tableH2: "Sample equipment from the catalogue (8 items)",
      tableThLine: "Line",
      tableThSku: "Sample SKU",
      faqH2: "Frequently asked questions",
      faqAria: "Frequently asked questions",
      relatedH2: "Related guides",
      blogAria: "Guide index",
      bcAria: "Breadcrumb",
      about:
        "Equsto Technology · Gastronomy Design · Sales Engineering — Authorised Öztiryakiler dealer; Bar Design Studio (Besos), Vitrum Turkey.",
      notFoundH1: "Page not found",
      notFoundLead:
        "This guide is not published yet. Continue from the home page or contact us.",
      loadErr: "Content could not be loaded.",
    },
  };

  function uiStrings(lang) {
    return UI[lang === "en" ? "en" : "tr"];
  }

  function pickLandings(data) {
    var out = {};
    if (!data || typeof data !== "object") return out;
    for (var k in data) {
      if (k === "version" || k === "source") continue;
      out[k] = data[k];
    }
    return out;
  }

  function mergeLandings(tr, en) {
    return Object.assign({}, pickLandings(tr), pickLandings(en));
  }
  var HEADER_PARTIAL = "/partials/eq-d-header.html?v=20260602indent";

  function ensureVitrinChrome() {
    if (document.querySelector("header.hdr")) return Promise.resolve();
    return fetch(HEADER_PARTIAL, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("hdr");
        return res.text();
      })
      .then(function (html) {
        var wrap = document.createElement("div");
        wrap.id = "eq-d-header";
        wrap.className = "eq-d-header";
        wrap.innerHTML = html;
        var pg = document.querySelector(".pg");
        if (pg && pg.parentNode) pg.parentNode.insertBefore(wrap, pg);
        else document.body.insertBefore(wrap, document.body.firstChild);
        try {
          if (typeof window.EQUSTO_LOGO_REFRESH === "function") window.EQUSTO_LOGO_REFRESH();
        } catch (_) {}
      })
      .catch(function () {});
  }

  function loadScriptOnce(src, defer) {
    var base = src.split("?")[0];
    if (document.querySelector('script[src^="' + base + '"]')) return;
    var s = document.createElement("script");
    s.src = src;
    if (defer) s.defer = true;
    document.body.appendChild(s);
  }

  function ensureGeoScripts() {
    loadScriptOnce("/eq-footer.js?v=20260531sss5");
    loadScriptOnce("/contact.js?v=20260522wa", true);
  }

  var EQUIP = [
    {
      dept: "pisirme",
      slug: "csa-csa-4-lu-gazli-kuzine-ce-belgeli-80x80x85-cm-krcs-kzg-880-ce",
      cat: "Pişirme",
      catEn: "Cooking",
      label: "Gazlı dört gözlü kuzine · sıcak hat omurgası",
      labelEn: "Four-burner gas range · hot-line backbone",
    },
    {
      dept: "sogutma",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-tag-270-nmv-cift-kapili-tezgah-tip-buzdolabi-79e4-27nmv-00",
      cat: "Soğutma",
      catEn: "Refrigeration",
      label: "Çift kapılı tezgah tipi soğuk hat",
      labelEn: "Double-door counter refrigerator · cold line",
    },
    {
      dept: "sogutma",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-gn-1200-lmv-cift-kapili-dik-tip-derin-dondurucu-k-tip-79k4-12lmv-00",
      cat: "Depolama",
      catEn: "Storage",
      label: "Yüksek hacimli dik tip derin dondurucu",
      labelEn: "High-capacity upright deep freezer",
    },
    {
      dept: "yikama",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-bulasik-makinesi-dokunmatik-ekranli-tahliye-pompali-set-alti-oby500touch",
      cat: "Yıkama",
      catEn: "Warewashing",
      label: "Tezgah altı yüksek kapasiteli bulaşık hattı",
      labelEn: "Under-counter high-capacity warewashing line",
    },
    {
      dept: "kahve",
      slug:
        "nuova-simonelli-nuova-simonelli-appia-life-2-gruplu-tam-otomatik-espresso-kahve-makinesi-yuksek-bardak",
      cat: "Kahve",
      catEn: "Coffee",
      label: "Çift gruplu espresso merkezi",
      labelEn: "Two-group espresso centre",
    },
    {
      dept: "hazirlik",
      slug: "bosfor-bosfor-10-kg-hamur-yogurma-makinesi-uhm-10m",
      cat: "Hazırlık",
      catEn: "Prep",
      label: "Hamur / karışım hazırlığı",
      labelEn: "Dough and mixer prep",
    },
    {
      dept: "icecek",
      slug: "atese-atese-2-demlikli-cay-kazani-titanium-compact-dijital-gazli-elektrikli-tcsge02",
      cat: "İçecek",
      catEn: "Beverage",
      label: "Sıcak içecek ve demlik hattı",
      labelEn: "Hot beverage and tea brewer line",
    },
    {
      dept: "pisirme",
      slug:
        "ari-sco-arisco-butun-pleyt-gazli-ocak-alti-acik-dolapli-ce-belgeli-gr921p-range-gas",
      cat: "Servis",
      catEn: "Service",
      label: "Açık pleyt + alt dolap kombinasyonu",
      labelEn: "Open burner range with under storage",
    },
  ];

  var PROFILES = {
    steakhouse: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Steakhouse",
      body: "<p>Steakhouse mutfağında dry-age dolabı, yüksek ısı ızgara ve kuzine hattı ile et hazırlık modülleri aynı akışta toplanır. Davlumbaz statik basıncı ve soğutma hat uzunluğu proje başında doğrulanır; servis hızı ocak yayılımını belirler.</p><p>Pişirme ve muhafaza zonları birbirinden ayrılır; yıkama hızı pik öğün yükünü taşır. Kıyma ve dilimleme modülleri kısa mesafe kuralına uygun yerleştirilir.</p><p>Aşağıdaki tablo vitrin SKU örneklerine gider. Liste Proje Fabrikası’nda kapasite ve menüye göre genişletilir; montaj ve devreye alma satış mühendisliği planıyla sahada tamamlanır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        [
          "Steakhouse mutfağında hangi ekipmanlar zorunlu sayılır?",
          "Dry-age/soğutma, yüksek ısı pişirme, et hazırlık (kıyma/dilimleme), yıkama ve davlumbaz hattı çekirdek pakettir.",
        ],
        [
          "Tablodaki bağlantılar gerçek ürün sayfası mı?",
          "Evet — her satır /shop/{departman}/{slug} vitrin ürün şablonuna gider.",
        ],
        [
          "Teklif nasıl alınır?",
          "Proje Fabrikası’nda konsepti Steakhouse seçin veya iletişim hattından ölçü ve menü bilgisini paylaşın.",
        ],
      ],
      related: [
        { label: "Fine dining rehberi", href: "/fine-dining-kurulumu" },
        { label: "Rehber: mutfak m²", href: "/rehber/mutfak-alani-kisi-basi-metrekare-2026" },
        { label: "Referans projeler", href: "/projeler" },
      ],
    },
    cafe: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Cafe",
      body: "<p>Cafe kurulumunda espresso istasyonu, soğuk süt ve stok dolapları ile hazırlık tezgahı aynı gün içinde yoğun kullanılır. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir; paket servis oranı soğutma derinliğini artırır.</p><p>Vitrin soğutucu, yıkama hattı ve pastane modülleri menü profiline göre eklenir. Günlük bardak adedi ve eşzamanlı grup sayısı makine seçimini belirler.</p><p>Saha ölçüsü PFOS’ta netleşir; aşağıdaki tablo örnek SKU’lara bağlanır. Teklif özeti Proje Fabrikası’ndan alınır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Cafe için minimum mutfak m²?", "30–80 m² arası yaygındır; oturma + paket oranına göre PFOS ile netleştirin."],
        ["Kahve makinesi seçimi?", "Günlük bardak adedi ve eşzamanlı grup sayısı belirleyicidir."],
      ],
      related: [
        { label: "Bulut mutfak rehberi", href: "/bulut-mutfak-kurulumu" },
        { label: "Kahve vitrini", href: "/shop/kahve" },
      ],
    },
    catering: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Catering",
      body:
        "<p>Catering mutfağında yüksek hacim pişirme, taşıma ekipmanları ve konveyörlü yıkama aynı senaryoda modellenir. Banket çıkışlarında sıcak holding süresi menü mühendisliğini belirler; soğuk zincir derinliği ürün portföyüne göre ayrılır.</p><p>Pik kişi sayısı ve öğün aralığı ocak, soğutma ve yıkama adetlerini doğrudan etkiler. Taşıma ve termobox kapasitesi sevkiyat planıyla birlikte okunmalıdır.</p><p>Aşağıdaki tablo vitrin örneklerini gösterir. Tam liste Proje Fabrikası’nda kişi ve öğün profiliyle üretilir; saha keşfi montaj takviminin ilk adımıdır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["500 kişilik catering mümkün mü?", "Evet — kapasite PFOS’ta kişi sayısı ve öğün döngüsüyle modellenir."],
        ["Demonte örnek vaka?", "İstanbul yüksek hacim catering demode sayfasına bakın."],
      ],
      related: [
        { label: "İstanbul catering demode", href: "/projeler/istanbul-yuksek-hacim-catering-demode" },
        { label: "Pişirme vitrini", href: "/shop/pisirme" },
      ],
    },
    fastfood: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Fast food",
      body:
        "<p>Fast food hattında fritöz ve ızgara yoğunluğu, soğutma stok derinliği ile hızlı yıkama kritiktir. Menü karması ekipman adetlerini doğrudan etkiler; paket ağırlığı yükseldikçe hazırlık ve muhafaza modülleri artar.</p><p>Servis süresi kısa olduğundan hat dizilimi paralel çalışır; sıcak holding ve soğuk stok aynı koridorda net ayrılır. Tezgah yüksekliği ve ergonomi ekip verimini etkiler.</p><p>Örnek SKU tablosu vitrine bağlanır. Kapasite girdileri PFOS’ta netleştirilir; liste iletişim veya Proje Fabrikası ile tamamlanır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Paket ağırlığı yüksekse?", "Soğutma ve hazırlık modülleri paket oranına göre artırılır."]],
      related: [{ label: "Bulut mutfak", href: "/bulut-mutfak-kurulumu" }],
    },
    finedining: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Fine dining",
      body:
        "<p>Fine dining mutfağında düşük porsiyon sıklığı geniş ocak yayılımı getirir. Bitirme, sos ve soğuk holding hatları servis stiline göre ayrılır; davlumbaz ve tezgah yüksekliği ekip ergonomisine göre planlanır.</p><p>Steakhouse’a kıyasla dry-age ağırlığı düşük, dengeli pişirme ve hassas muhafaza öne çıkar. Porsiyonlama ve sıcak tutma süreleri menü mühendisliğiyle uyumludur.</p><p>Vitrin tablosu örnek modülleri listeler. Tam dizilim Proje Fabrikası’nda menü ve kapasiteyle modellenir; yerleşim Gastronomi Tasarımı ile derinleşir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Steakhouse ile fark?", "Steakhouse dry-age ve yüksek ısı ızgara ağırlıklıdır; fine dining daha dengeli hatlar kullanır."]],
      related: [{ label: "Steakhouse rehberi", href: "/steakhouse-kurulumu" }],
    },
    bulut: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Bulut mutfak",
      body:
        "<p>Bulut mutfakta marka başına parsellenmiş sıcak ve soğuk hatlar ile ortak yıkama merkezi planlanır. Çok markalı senaryoda elektrik, havalandırma ve yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır.</p><p>Parsel bazlı üretim akışı çapraz bulaşmayı azaltır; ortak depo ve sevkiyat alanı markalar arasında net sınırlandırılır. Paket oranı yüksek markalarda hazırlık modülleri ayrı tutulur.</p><p>Örnek ekipman tablosu vitrin SKU’larına gider. PFOS çok markalı çıkışı modellemek için kullanılır; saha ölçüsü planın ilk girdisidir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Çok marka tek ruhsatta?", "MEP ve yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır."]],
      related: [
        { label: "m² rehberi", href: "/rehber/mutfak-alani-kisi-basi-metrekare-2026" },
        { label: "Fast food", href: "/fast-food-kurulumu" },
      ],
    },
    allday: {
      skipBudget: true,

      budget: null,
      pfosKonu: "All day dining",
      body:
        "<p>All day dining ve otel mutfağında kahvaltı, öğle ve akşam döngüsü aynı ekipmanı farklı yüklerle kullanır. Kahve istasyonu, sıcak hat ve soğuk stok gün boyu paralel yürür; banket çıkışlarında kapasite kısa sürede yükselir.</p><p>Öğün profili soğutma derinliğini ve yıkama hızını belirler. Oda servisi ve açık büfe aynı mutfakta farklı ekipman yoğunluğu oluşturabilir.</p><p>Aşağıdaki tablo örnek modülleri gösterir. Kişi sayısı ve otel segmenti Proje Fabrikası’nda girilerek liste tamamlanır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Otel mutfağı ile ortak mı?", "Evet — PFOS’ta otel / all day dining konseptleri benzer hatları paylaşır."]],
      related: [{ label: "Catering rehberi", href: "/catering-mutfagi" }],
    },
    marketKasap: {
      skipBudget: true,

      budget: null,

      pfosKonu: "Market reyonu",
      body:
        
        
        
        
        "<p>Market kurulumunda müşteri yolculuğu reyondan başlar.  Dondurulmuş ada, soğutmalı gondol ve kasap bankosu aynı koridorda akıcı dizilir; paketli gıda ile taze et aynı hatta görünür, hazırlık ve depo arkada ayrılır.  Kasap ve şarküteri hattında kıyma, dilimleme ve vitrin sergisi farklı zonlardadır.  +2/+4 °C teşhir ile −18 °C depo karışmaz; et tahtası, hijyen seti ve hızlı yıkama tazelik güvenliğini taşır.</p><p>Reyon genişliği ve günlük çıkış soğutucu adedini belirler.  Liste Proje Fabrikası'nda netleşir; montaj satış mühendisliği planıyla tamamlanır.  Market reyon vitrinindeki SKU örnekleri katalogla bağlantılıdır.</p>",
      faq: [
        [
          "Market reyonu ile kasap hattı aynı projede mi?",
          "Evet — akış sırası ve soğutma zonları tek planda modellenir; vitrin SKU’ları market reyon kataloğundadır.",
        ],
        [
          "Teklif nasıl alınır?",
          "Proje Fabrikası’nda kapasite ve m² girin veya market reyon vitrininden ürün seçip iletişime geçin.",
        ],
      ],
      related: [
        { label: "Market reyonları vitrini", href: "/shop/market-reyonlari" },
        { label: "Soğutma departmanı", href: "/shop/sogutma" },
        { label: "Rehber dizini", href: "/blog" },
      ],
    },
    projelerHub: {
      skipBudget: true,

      budget: null,
      body:
        "<p>Equsto referans sayfaları demonte vaka anlatımı sunar: proje yaşam döngüsü, zorunluluklar ve ekipman mantığı şeffaf biçimde okunur. Gerçek müşteri fotoğrafı ve alıntılar yayın sürecinde pekiştirilir; sayfalar satılabilir paket değildir.</p><p>Her vaka vitrin SKU’larına köprü kurar; teklif Proje Fabrikası veya iletişim hattıyla netleşir. Demonte anlatım saha koşullarını örnekler, kesin liste projeye özel üretilir.</p><p>Aşağıdaki bağlantılardan İstanbul catering ve İzmir modüler bar örneklerine geçebilirsiniz. PFOS aynı mantığı canlı listeye dönüştürür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Projeler satılabilir paket mi?", "Hayır — örnek dizilimler vitrin SKU’larına köprüdür; teklif PFOS veya iletişimle netleşir."],
      ],
      related: [
        { label: "Steakhouse rehberi", href: "/steakhouse-kurulumu" },
        { label: "Proje Fabrikası", href: "/pfos" },
      ],
      skipTable: true,
    },
    projeIstanbul: {
      skipBudget: true,

      budget: null,
      body:
        "<p>İstanbul yüksek hacim catering demode diziliminde sıcak banket, yüksek kapasiteli pişirme ve konveyörlü yıkama aynı senaryoda modellenir. Toplu yemek ve banket çıkışlarında pik dakika yıkama hızını belirler.</p><p>Cephe kapasitesi ve baca kuyusu netleştirilmeden sipariş risklidir; saha ölçüsü önce alınır. Taşıma ve termobox ihtiyacı sevkiyat planıyla birlikte değerlendirilir.</p><p>PFOS’ta Catering konsepti ve şehir seçimiyle aynı mantık canlı listeye dönüşür. Aşağıdaki tablo örnek SKU’ları gösterir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Canlı teklif?", "PFOS’ta Catering + İstanbul şehir seçimiyle sihirbazı açın."]],
      related: [{ label: "Tüm projeler", href: "/projeler" }],
    },
    projeIzmir: {
      skipBudget: true,

      budget: null,
      body:
        "<p>İzmir modüler bar ve içecek demode diziliminde Besos modülleri ile içecek ekipmanları aynı saha projesinde hizalanır. Vitrum Group menşeli bar çözümleri Bar Design Studio altında listelenir; servis akışı modül seçimini belirler.</p><p>Soğutmalı içecek hattı, kahve ve hazırlık modülleri bar ölçüsüne göre parsellenir. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır.</p><p>Besos vitrininde kırk iki modül örneği bulunur. Tam liste Proje Fabrikası veya iletişimle netleşir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Bar modülleri nerede?", "/besos vitrininde 42 modül listelenir."]],
      related: [
        { label: "Bar Design (Besos)", href: "/besos" },
        { label: "İçecek vitrini", href: "/shop/icecek" },
      ],
    },
    rehberM2: {
      skipBudget: true,

      budget: null,
      body:
        "<p><strong>Kişi başı mutfak metrekare</strong> planlamasında servis stili (oturma, paket, banket) belirleyicidir. Yoğun paket oranı soğutma derinliğini artırır; oturma ağırlıklı işletmede sıcak tutma süreleri öne çıkar.</p>" +
        "<p>PFOS çıktıları üç senaryolu (temel, dengeli, rantabl) paket seçimini finans onayına bağlar. Bu yazı footer ve sitemap üzerinden erişilir; üst menüde ayrı sekme yoktur.</p>",
      faq: [
        ["2026 güncel mi?", "Evet — editoryal rehber 2026 kapasite varsayımlarıyla yayınlanır."],
        ["Hesaplama aracı var mı?", "Proje Fabrikası alan ve kişi sayısı soruları aynı mantığı otomatikler."],
      ],
      related: [
        { label: "Bulut mutfak", href: "/bulut-mutfak-kurulumu" },
        { label: "Proje Fabrikası", href: "/pfos" },
      ],
      skipTable: true,
    },
    seoTurkiye: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Türkiye’de endüstriyel mutfak ekipmanı arayan işletmeler için Equsto; pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanlarında canlı katalog ve satış mühendisliği sunar. Restoran, otel, kafe ve bulut mutfak aynı akışta modellenir.</p><p>Öztiryakiler yetkili bayii kanalı ve seçili global markalar aynı sepet ve teklif akışında birleşir. Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır.</p><p>Aşağıdaki tablo örnek SKU’lara gider. Tam liste Proje Fabrikası’nda üretilir; ihracat pazarları için iletişim hattı açıktır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Sadece İstanbul mu?", "Hayır — Türkiye geneli ve seçili ihracat pazarları (AE, QA, SA, AZ, KZ, UZ, AL, RO, BG) hedeflenir."],
        ["Tek ürün siparişi var mı?", "Evet — tek SKU’dan anahtar teslim proje listesine aynı katalog kullanılır."],
      ],
      related: [
        { label: "Öztiryakiler tedarik", href: "/oztiryakiler-ekipmani-tedarik" },
        { label: "Pişirme vitrini", href: "/shop/pisirme" },
      ],
    },
    seoRestoranTeklif: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Restoran mutfak teklifi için menü, kapasite ve servis stili girilir; PFOS sıcak, soğutma ve yıkama adetlerini kural setiyle üretir. Teklif özeti KDV ve lojistik kalemlerini içerir; nihai tutar satış mühendisliği onayıyla kesinleşir.</p><p>İlk aşamada kapasite ve konsept yeterlidir; yerleşim Gastronomi Tasarımı ile derinleşir. CAD plan sonraki adımda eklenebilir.</p><p>Hedef süre yaklaşık beş dakikadır. Çıktı ön teklif dosyası olarak kullanılır; onay sonrası sipariş süreci başlar. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Ne kadar sürede?", "Hedef 5 dakika — PFOS çıktısı ön teklif dosyasıdır."],
        ["CAD plan gerekli mi?", "İlk aşamada kapasite ve konsept yeterlidir; yerleşim Gastronomi Tasarımı ile derinleşir."],
      ],
      related: [
        { label: "Steakhouse rehberi", href: "/steakhouse-kurulumu" },
        { label: "Teklif platformu", href: "/mutfak-teklif-platformu" },
      ],
    },
    seoOtel: {
      skipBudget: true,

      budget: null,
      pfosKonu: "All day dining",
      body:
        "<p>Otel mutfak ekipman tedarikinde kahvaltı, öğle ve akşam döngüsü ile banket çıkışları aynı hatları farklı yüklerle kullanır. Gün boyu servis soğutma derinliğini ve yıkama kapasitesini artırır.</p><p>Oda servisi, açık büfe ve balo menüleri aynı mutfakta farklı ekipman yoğunluğu oluşturur. Kahve ve sıcak içecek hatları kahvaltı pikinde kritik rol oynar.</p><p>All day dining rehberi ile örtüşen senaryolar PFOS’ta modellenir. Aşağıdaki tablo vitrin örneklerine bağlanır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Otel ve restoran farkı?", "Otelde gün boyu menü döngüsü ve yüksek soğutma derinliği daha belirgindir."],
      ],
      related: [
        { label: "All day dining", href: "/all-day-dining-kurulumu" },
        { label: "Catering", href: "/catering-mutfagi" },
      ],
    },
    seoOzti: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Öztiryakiler ekipmanı Equsto kataloğunda pişirme, soğutma, yıkama ve hazırlık departmanlarında listelenir. Yetkili bayii ilişkisi resmi fiyat listesi ve garanti hattını kapsar; canlı kur EUR ve TL’ye uygulanır.</p><p>Atalay ve seçili markalar aynı katalogda yer alır; Öztiryakiler ana omurgadır. Teknik ölçüler mm cinsinden ürün kartlarında okunur.</p><p>Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır. PFOS ile liste genişletilir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Sadece Öztiryakiler mi?", "Hayır — Atalay ve seçili markalar da katalogdadır; Öztiryakiler ana omurgadır."],
      ],
      related: [
        { label: "Soğutma vitrini", href: "/shop/sogutma" },
        { label: "Marka listesi", href: "/marka.html" },
      ],
    },
    seoSogukOda: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Soğuk oda teklifi için kapasite, ürün profili ve MEP koşulları birlikte değerlendirilir. Tezgah tipi ve dik tip modüller vitrin tablosunda örneklenir; soğuk oda projeleri ayrı mühendislik hattıyla yürür.</p><p>Menü ve hacim soğutma adedini belirler; şok dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır. Ön doğrulama satış mühendisliği ile yapılır.</p><p>Tam proje listesi Proje Fabrikası’nda veya iletişimle netleşir. Aşağıdaki tablo vitrin modüllerine örnektir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Sadece dolap mı?", "Hayır — soğuk oda projeleri ayrı mühendislik hattıyla yürür; vitrin modülleri tamamlayıcıdır."],
      ],
      related: [
        { label: "Soğutma vitrini", href: "/shop/sogutma" },
        { label: "Dry-age / steakhouse", href: "/steakhouse-kurulumu" },
      ],
    },
    seoHavuzlu: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Havuzlu tezgah tipi dolap seçiminde dış ölçü, GN uyumu ve kapasite vitrin kartında listelenir. Hazırlık ve servis hattına göre adet ve derinlik değişir; mm cinsinden teknik ölçü satırı ürün detayında bulunur.</p><p>Tezgah altı ve tezgah üstü modeller aynı hatta birlikte planlanır. Enerji ve soğutma tipi saha tesisatına göre seçilir.</p><p>Soğutma departmanı vitrininden benzer modüller karşılaştırılabilir. PFOS veya ürün sayfası üzerinden teklif satırına eklenebilir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Ölçüler nerede?", "Ürün detay ve PLP kartlarında teknik ölçü satırı bulunur."],
      ],
      related: [{ label: "Soğutma vitrini", href: "/shop/sogutma" }],
    },
    seoPisirme: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Endüstriyel pişirme hattında kuzine, ocak, fritöz, ızgara ve kaynatma modülleri menüye göre adetlendirilir. Gazlı ve elektrikli seçenekler vitrinde; saha gaz ve elektrik kapasitesine göre seçilir.</p><p>Pik çıkış ve eşzamanlı üretim ocak yayılımını belirler. Davlumbaz kapasitesi pişirme adediyle birlikte hesaplanır.</p><p>Aşağıdaki tablo örnek SKU’lara gider. Tam liste Proje Fabrikası’nda konsept ve kapasiteyle üretilir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Gazlı / elektrikli?", "Her ikisi de vitrinde; saha gaz ve elektrik kapasitesine göre seçilir."]],
      related: [{ label: "Pişirme vitrini", href: "/shop/pisirme" }],
    },
    seoTeklifPlatform: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Proje Fabrikası, Equsto’nun teklif platformudur: konsept, kapasite ve menü girdileriyle ekipman listesi ve fiyat özeti üretir. Hedef süre yaklaşık beş dakikadır; çıktı satış mühendisliği onayıyla kesinleşir.</p><p>B2B endüstriyel mutfak tedarik akışıdır; rezervasyon veya masa yönetimi değildir. Kural motoru menü ve kapasiteye göre modül adetlerini üretir.</p><p>Teklif PDF’inde SKU ve ürün kodu satırları yapılandırılmış biçimde yer alır. Onay sonrası sipariş ve montaj planı başlar. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["OpenTable mı?", "Hayır — B2B endüstriyel mutfak ekipmanı ve proje tedarik platformudur."],
        ["Seri numarası okunur mu?", "Teklif PDF’inde SKU ve ürün kodu satırları yapay zeka için düz metin olarak yapılandırılır."],
      ],
      related: [
        { label: "PFOS", href: "/pfos" },
        { label: "Hakkımızda", href: "/hakkimizda.html" },
      ],
      skipTable: true,
    },
    seoBar: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Bar",
      body:
        "<p>Bar tasarımı Equsto’da Bar Design Studio ile yürür; Vitrum Group menşeli modüler istasyonlar saha ölçüsü ve servis akışına göre seçilir. İçecek, kahve ve soğutma modülleri aynı bar hattında hizalanır.</p><p>Modül yüksekliği ve tezgah derinliği servis personeli ergonomisine göre ayarlanır. Buz makinesi ve depolama kapasitesi günlük bardak adedine bağlıdır.</p><p>Besos vitrininde kırk iki modül örneği listelenir. Tam dizilim Proje Fabrikası veya Besos sayfası üzerinden planlanır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Besos vitrin?", "/besos adresinde 42 modül listelenir."]],
      related: [
        { label: "Besos vitrini", href: "/besos" },
        { label: "İçecek ekipmanları", href: "/shop/icecek" },
      ],
      ctaBesos: true,
    },
    seoEnIndustrial: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restaurant",
      body:
        "<p>Equsto is a Turkey-based industrial kitchen platform for restaurants, hotels, cloud kitchens and catering. Authorized Öztiryakiler distribution covers cooking, refrigeration, warewashing, prep, coffee and beverage lines in one catalog flow.</p><p>Export markets include selected countries in the Gulf, Central Asia and Eastern Europe. Single-SKU orders and full project lists use the same catalog and quote workflow.</p><p>Quote summaries are generated via Project Factory in about five minutes. Final pricing and logistics are confirmed by sales engineering before purchase orders are issued. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Export markets?", "TR plus AE, QA, SA, AZ, KZ, UZ, AL, RO, BG."],
        ["B2C?", "No — commercial kitchen equipment and project supply only."],
      ],
      related: [
        { label: "Commercial kitchen quotation", href: "/en/commercial-kitchen-quotation" },
        { label: "TR catalog hub", href: "/shop" },
      ],
    },
    seoEnQuotation: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restaurant",
      body:
        "<p>Project Factory generates equipment lists and quote summaries for commercial kitchen projects. Capacity, concept and menu inputs drive module counts; VAT and logistics lines are included in the output file.</p><p>Target turnaround is about five minutes. Layout and MEP can be refined later with gastronomy design and sales engineering on site.</p><p>This is B2B kitchen equipment supply, not table reservation software. Final sign-off is performed by the sales engineering team before purchase orders are issued. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [["Is this a reservation app?", "No — B2B kitchen equipment and project quoting."]],
      related: [
        { label: "PFOS", href: "/pfos" },
        { label: "Industrial supplier TR", href: "/en/industrial-kitchen-supplier-turkey" },
      ],
      skipTable: true,
    },
    blogHub: {
      skipBudget: true,

      budget: null,
      body:
        "<p>Bu dizin blog ve GEO rehber içeriklerini vitrin menüsünden ayırır. Ekipman arayan kullanıcı doğrudan katalogda kalır; konsept ve teklif soruları bu sayfalarda yanıtlanır. Her rehberde sık sorulan sorular ve uygun sayfalarda vitrin SKU tablosu bulunur.</p><p>Konsept kurulum, arama hedefli sayfalar, editoryal rehberler ve referans projeler bölümlere ayrılmıştır. Bağlantılar footer, sitemap ve llms.txt ile dizinlenir. PFOS teklif özeti için ana giriş noktasıdır.</p><p>Steakhouse, bulut mutfak, market reyonu ve kafe açılış rehberleri ilgili profillere bağlanır. Beş yüz kişilik catering ve metrekare planlama yazıları kapasite sorularını derinleştirir. Restoran checklist akışı PFOS sırasını yansıtır.</p><p>SEO sayfaları Türkiye endüstriyel mutfak, otel, pişirme, soğuk oda ve teklif platformu aramalarını karşılar. İngilizce endüstriyel ve teklif sayfaları ihracat okuyucusuna yöneliktir. Öztiryakiler bayii sayfası resmi kanalı açıklar.</p><p>Referans projeler demonte vaka formatındadır; İstanbul catering ve İzmir modüler bar örnekleri dizinden erişilir. Fotoğraf ve alıntılar yayın sürecinde güncellenir. Kesin ekipman listesi PFOS ile üretilir.</p><p>Vitrin SKU tabloları örnek modülleri gösterir; tam liste projeye özeldir. 2026 fiyatları KDV hariç özetlenir. Proje iskontoları teklif sırasında uygulanır.</p><p>Satış mühendisliği onayı nihai fiyatı belirler. Montaj ve devreye alma proje planında yürür. B2B platform rezervasyon yazılımı değildir.</p><p>Gastronomi Tasarımı yerleşim sorularını derinleştirir. CAD planı sonraki aşamada eklenebilir. Saha ölçüsü PFOS girdilerinin temelidir.</p><p>Hizmet bölgeleri Türkiye ve seçili ihracat pazarlarını kapsar. İletişim hattı özel içerik ve proje taleplerini karşılar. Canlı katalog fiyat ve stok doğrular.</p><p>Rehber dizini ekipman arayan ile konsept araştıran kullanıcıyı ayırır. PFOS’a geçiş teklif üretimi için teşvik edilir. Footer menüsü tüm rehberlere bağlanır.</p><p>Dark kitchen ve bulut mutfak rehberleri çok markalı senaryoyu açıklar. Otel ve tüm gün yemek servisi içerikleri öğün döngüsünü vurgular. Fast food ve fine dining karşılaştırmalı okunabilir.</p><p>Teklif PDF yapılandırılmış SKU satırları içerir. Hedef ön teklif süresi yaklaşık beş dakikadır. Onay sonrası sipariş süreci başlar.</p><p>GEO rehber dizini Equsto içerik mimarisinin merkezi indeksidir.</p><p>PFOS taslak listesi satış mühendisliği onayı ve saha keşfi sonrası kesinleşir; montaj, devreye alma ve garanti kaydı aynı proje numarası altında yürütülür. Equsto B2B endüstriyel mutfak tedarik platformu 2026 güncel fiyatlarıyla teklif üretir.</p>",
      faq: [
        ["Neden üst menüde yok?", "Vitrin ekipman odaklıdır; rehberler footer, sitemap ve llms.txt ile dizinlenir."],
        ["Steakhouse veya bulut mutfak için hangi sayfa?", "Konsept rehberleri bölümündeki ilgili bağlantıya gidin; PFOS ile 5 dakikada teklif özeti alın."],
      ],
      related: [
        { label: "Proje Fabrikası", href: "/pfos" },
        { label: "Ana katalog", href: "/shop" },
      ],
      skipTable: true,
    },
    blogHubEn: {
      skipBudget: true,

      budget: null,
      body:
        "<p>This index separates guides and GEO content from the equipment shop menu. Shoppers stay in the catalogue; concept and quote questions are answered here. Pages include FAQs and sample SKU tables where relevant. Concept setups, SEO landings, editorials and reference projects are grouped below; footer, sitemap and llms.txt link every guide. Use Project Factory for quote summaries in about five minutes. Use Project Factory for the full list; sales engineering confirms pricing and installation. Request a quote summary in Project Factory in about five minutes. Sample SKU tables and FAQs appear on each linked guide page.</p>",
      faq: [
        ["Why is it not in the top menu?", "The shop menu is equipment-focused; guides are listed via the footer, sitemap and llms.txt."],
        ["Which page for steakhouse or cloud kitchen?", "Open the matching concept guide below; get a quote summary in PFOS in about five minutes."],
      ],
      related: [
        { label: "Project Factory", href: "/pfos" },
        { label: "Equipment catalogue", href: "/shop" },
      ],
      skipTable: true,
    },
        rehberCatering500: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Catering",
      body:
        "<p>Beş yüz kişilik catering ve banket çıkışlarında sıcak banket kapasitesi, soğuk zincir derinliği ve yıkama hızı belirleyicidir. Kişi sayısı ve öğün aralığı PFOS’ta modellenir; pik öğün ile sürekli banket ayrı senaryolardır.</p><p>Taşıma ekipmanları ve hazırlık modülleri menüye göre eklenir. Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır.</p><p>Catering mutfağı rehberi ve İstanbul demode sayfası ile birlikte okunmalıdır. Tam liste Proje Fabrikası’nda üretilir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["500 kişi tek seferde mi?", "Pik öğün ve sürekli banket senaryoları ayrı modellenir; PFOS’ta kişi + öğün profili girilir."],
        ["Taşıma ekipmanları dahil mi?", "Liste genişletilebilir; teklif satış mühendisliği ile netleşir."],
      ],
      related: [
        { label: "Catering mutfağı rehberi", href: "/catering-mutfagi" },
        { label: "İstanbul catering demode", href: "/projeler/istanbul-yuksek-hacim-catering-demode" },
      ],
    },
    rehberDarkKitchen: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Bulut mutfak",
      body:
        "<p>Dark kitchen ve bulut mutfak kurulumunda marka başına parsellenmiş sıcak-soğuk hatlar ve ortak yıkama merkezi planlanır. Elektrik ve havalandırma yükü çok markalı senaryoda artar; yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır.</p><p>Yüksek paket oranı soğutma ve hazırlık modülleri artırır. Markalar arası depo ve sevkiyat alanı net sınırlandırılmalıdır.</p><p>Bulut mutfak kurulum rehberi ile örtüşen adımlar PFOS’ta modellenir. Saha ölçüsü planın ilk girdisidir. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Tek ruhsat çok marka?", "MEP ve yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır."],
        ["Paket ağırlığı?", "Yüksek paket oranı soğutma ve hazırlık modüllerini artırır."],
      ],
      related: [{ label: "Bulut mutfak kurulumu", href: "/bulut-mutfak-kurulumu" }],
    },
    rehberRestoranChecklist: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Restoran mutfak kurulumu checklist akışı: menü, kapasite, alan, sıcak-soğuk-yıkama adetleri ve teklif. PFOS bu sırayı otomatikler; checklist saha toplantılarında manuel kontrol içindir.</p><p>İşletme tipi, oturma ve paket oranı, günlük öğün, mevcut tesisat, davlumbaz ve marka tercihi sırayla netleştirilir. Her adım sonraki modül adedini etkiler.</p><p>CAD plan ilk aşamada şart değildir; yerleşim Gastronomi Tasarımı ile derinleşir. Restoran teklif rehberi ile birlikte okunmalıdır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["CAD plan şart mı?", "İlk aşamada kapasite yeterli; yerleşim Gastronomi Tasarımı ile derinleşir."],
      ],
      related: [
        { label: "Restoran teklif rehberi", href: "/restoran-mutfak-teklif" },
        { label: "m² rehberi", href: "/rehber/mutfak-alani-kisi-basi-metrekare-2026" },
      ],
      skipTable: true,
    },
    rehberKafeAcilis: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Cafe",
      body:
        "<p>Kafe açılış ekipman listesinde espresso merkezi, soğutmalı stok, hazırlık tezgahı, vitrin soğutucu ve yıkama hattı omurgayı oluşturur. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir.</p><p>Pastane ağırlıklı kafelerde fırın ve hazırlık modülleri eklenir. Paket oranı soğutma derinliğini artırır; oturma kapasitesi bardak adedini belirler.</p><p>Cafe kurulum rehberi ve kahve vitrini ile birlikte okunmalıdır. Liste Proje Fabrikası’nda tamamlanır. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür. Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.</p>",
      faq: [
        ["Sadece kahve mi?", "Pastane ağırlıklı kafelerde fırın ve hazırlık modülleri eklenir."],
      ],
      related: [
        { label: "Cafe kurulum rehberi", href: "/cafe-kurulumu" },
        { label: "Kahve vitrini", href: "/shop/kahve" },
      ],
    },
  };

  function blogSectionsHtml(sections, lang) {
    if (!sections || !sections.length) return "";
    var u = uiStrings(lang);
    return (
      '<nav class="eq-geo-blog-index" aria-label="' + esc(u.blogAria) + '">' +
      sections
        .map(function (sec) {
          var items = (sec.links || [])
            .map(function (ln) {
              return "<li><a href=\"" + esc(navHref(ln.href)) + "\">" + esc(ln.label) + "</a></li>";
            })
            .join("");
          return (
            '<section class="eq-geo-blog-sec"><h2>' +
            esc(sec.title) +
            "</h2><ul class=\"eq-geo-links\">" +
            items +
            "</ul></section>"
          );
        })
        .join("") +
      "</nav>"
    );
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function navHref(path) {
    var p = String(path || "/");
    try {
      if (typeof window.equstoResolveNavHref === "function") return window.equstoResolveNavHref(p);
    } catch (_) {}
    return p;
  }

  var TR_GEO_TO_EN_KEY = {
    blog: "en/blog",
    projeler: "en/projects",
    "steakhouse-kurulumu": "en/steakhouse-kitchen-setup",
    "bulut-mutfak-kurulumu": "en/cloud-kitchen-setup",
    "cafe-kurulumu": "en/cafe-setup",
    "catering-mutfagi": "en/catering-kitchen",
    "fine-dining-kurulumu": "en/fine-dining-kitchen-setup",
    "all-day-dining-kurulumu": "en/all-day-dining-kitchen-setup",
    "fast-food-kurulumu": "en/fast-food-kitchen-setup",
    "market-kasap-sarkuteri-kurulumu": "en/market-butcher-deli-setup",
    "endustriyel-mutfak-ekipmani-turkiye": "en/industrial-kitchen-equipment-turkey",
    "restoran-mutfak-teklif": "en/restaurant-kitchen-quote",
    "otel-mutfak-ekipman-tedarik": "en/hotel-kitchen-equipment",
    "oztiryakiler-ekipmani-tedarik": "en/oztiryakiler-equipment-supply",
    "soguk-oda-teklif": "en/cold-room-quote",
    "havuzlu-dolap-tedarik": "en/deli-counter-refrigeration",
    "endustriyel-pisirme-ekipmanlari": "en/industrial-cooking-equipment",
    "mutfak-teklif-platformu": "en/kitchen-quote-platform",
    "bar-tasarimi-turkiye": "en/bar-design-turkey",
  };

  function pathKey() {
    var p = String(location.pathname || "/").replace(/\/+$/, "") || "/";
    if (p.charAt(0) === "/") p = p.slice(1);
    return p;
  }

  function resolveGeoDataKey(rawKey) {
    if (!rawKey) return rawKey;
    if (rawKey.indexOf("en/") === 0) return rawKey;
    if (TR_GEO_TO_EN_KEY[rawKey]) return TR_GEO_TO_EN_KEY[rawKey];
    if (rawKey.indexOf("rehber/") === 0) return "en/guides/" + rawKey.slice(7);
    if (rawKey.indexOf("projeler/") === 0) return "en/projects/" + rawKey.slice(9);
    try {
      if (window.eqLang === "en" && TR_GEO_TO_EN_KEY[rawKey]) return TR_GEO_TO_EN_KEY[rawKey];
    } catch (_) {}
    return rawKey;
  }

  function redirectGeoToEnIfNeeded(rawKey) {
    if (rawKey.indexOf("en/") === 0) return false;
    var destKey = resolveGeoDataKey(rawKey);
    if (destKey === rawKey) return false;
    try {
      if (localStorage.getItem("eq-lang") !== "en") return false;
    } catch (_) {
      return false;
    }
    var destPath = "/" + destKey;
    var cur = (location.pathname || "/").replace(/\/+$/, "") || "/";
    if (cur === destPath) return false;
    location.replace(destPath + location.search + location.hash);
    return true;
  }

  function canonicalUrl(key) {
    return ORIGIN + "/" + key.replace(/\/+$/, "");
  }

  function setMeta(name, content) {
    var el = document.querySelector('meta[name="' + name + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function equipmentTableHtml(lang) {
    var u = uiStrings(lang);
    var en = lang === "en";
    var rows = EQUIP.map(function (row) {
      var href = navHref("/shop/" + row.dept + "/" + encodeURIComponent(row.slug));
      return (
        "<tr><td>" +
        esc(en ? row.catEn || row.cat : row.cat) +
        '</td><td><a href="' +
        esc(href) +
        '">' +
        esc(en ? row.labelEn || row.label : row.label) +
        "</a></td></tr>"
      );
    }).join("");
    return (
      "<h2>" +
      esc(u.tableH2) +
      "</h2>" +
      '<table class="eq-geo-table"><thead><tr><th>' +
      esc(u.tableThLine) +
      "</th><th>" +
      esc(u.tableThSku) +
      '</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>"
    );
  }

  function faqHtml() {
    return "";
  }

  function relatedHtml(list, lang) {
    if (!list || !list.length) return "";
    var u = uiStrings(lang);
    return (
      "<h2>" + esc(u.relatedH2) + '</h2><ul class="eq-geo-links">' +
      list
        .map(function (ln) {
          return '<li><a href="' + esc(navHref(ln.href)) + '">' + esc(ln.label) + "</a></li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function injectSchema(page, key, faq, lang, sections) {
    var url = canonicalUrl(key);
    var inLang = lang === "en" ? "en-US" : "tr-TR";
    var graph = [
      {
        "@type": "WebPage",
        url: url,
        name: page.title,
        description: page.description,
        inLanguage: inLang,
        isPartOf: { "@type": "WebSite", name: "Equsto", url: ORIGIN + "/" },
      },
    ];
    if (!page.skipTable) {
      graph.push({
        "@type": "ItemList",
        itemListElement: EQUIP.map(function (row, i) {
          return {
            "@type": "ListItem",
            position: i + 1,
            url: ORIGIN + "/shop/" + row.dept + "/" + row.slug,
            name: row.cat + ": " + row.label,
          };
        }),
      });
    }
    if (sections && sections.length) {
      var pos = 0;
      var listItems = [];
      sections.forEach(function (sec) {
        (sec.links || []).forEach(function (ln) {
          pos += 1;
          var href = String(ln.href || "");
          if (href.indexOf("http") !== 0) href = ORIGIN + (href.charAt(0) === "/" ? href : "/" + href);
          listItems.push({
            "@type": "ListItem",
            position: pos,
            url: href,
            name: ln.label,
          });
        });
      });
      if (listItems.length) {
        graph.push({ "@type": "ItemList", name: "Equsto rehber dizini", itemListElement: listItems });
      }
    }
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(s);
  }

  function resolveProfile(page, lang) {
    var name = page.profile || "";
    if (name === "blogHub" && lang === "en") {
      return PROFILES.blogHubEn || PROFILES.blogHub || {};
    }
    return PROFILES[name] || {};
  }

  function render(page, key) {
    var root = document.getElementById("eq-geo-main");
    if (!root || !page) return;

    var lang = page.lang || (key.indexOf("en/") === 0 ? "en" : "tr");
    var prof = resolveProfile(page, lang);
    var budget =
      page.skipBudget || prof.skipBudget ? null : page.budget !== undefined ? page.budget : prof.budget;
    var body = page.body || "";
    if (!body && prof.body) {
      var profLen = prof.body.replace(/<[^>]+>/g, "").length;
      if (lang === "en" && profLen > 700) body = "";
      else body = prof.body;
    }
    body = body.replace(/\{budget\}/g, budget || "—");
    var faq = page.faq || prof.faq || [];
    var related = page.related || prof.related || [];
    var skipTable = page.skipTable || prof.skipTable;

    document.title = page.title || document.title;
    if (page.description) setMeta("description", page.description);
    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.rel = "canonical";
      document.head.appendChild(canon);
    }
    canon.href = canonicalUrl(key);

    var u = uiStrings(lang);

    var linksHtml = "";
    if (page.sections && page.sections.length) {
      linksHtml = blogSectionsHtml(page.sections, lang);
    } else if (page.links && page.links.length) {
      linksHtml =
        '<ul class="eq-geo-links eq-geo-links--hub">' +
        page.links
          .map(function (ln) {
            return '<li><a href="' + esc(navHref(ln.href)) + '">' + esc(ln.label) + "</a></li>";
          })
          .join("") +
        "</ul>";
    }

    var pfosHref = "/pfos";
    if (prof.pfosKonu) pfosHref += "?konu=" + encodeURIComponent(prof.pfosKonu);

    var homeLabel = lang === "en" ? "Home" : "Anasayfa";
    var pfosLabel = lang === "en" ? "Project Factory" : "Proje Fabrikası";
    var contactLabel = lang === "en" ? "Contact" : "İletişim ve teklif";
    var besosLabel = lang === "en" ? "Bar Design Studio" : "Bar Design Studio";

    root.innerHTML =
      '<nav class="eq-geo-bc" aria-label="' +
      esc(u.bcAria) +
      '"><a href="' +
      esc(navHref("/")) +
      '">' +
      esc(homeLabel) +
      "</a> › <span>" +
      esc(page.h1 || "") +
      "</span></nav>" +
      '<article class="eq-geo-article">' +
      "<h1>" +
      esc(page.h1 || "") +
      "</h1>" +
      '<p class="eq-geo-lead">' +
      esc(page.lead || "") +
      "</p>" +
      (false ? "" : "") +
      '<div class="eq-geo-body">' +
      body +
      "</div>" +
      linksHtml +
      (skipTable ? "" : equipmentTableHtml(lang)) +
      relatedHtml(related, lang) +
      faqHtml() +
      '<div class="eq-geo-actions">' +
      '<a class="eq-geo-btn eq-geo-btn--primary" href="' +
      esc(navHref(pfosHref)) +
      '">' +
      esc(pfosLabel) +
      "</a>" +
      (page.ctaBesos || prof.ctaBesos
        ? '<a class="eq-geo-btn" href="' + esc(navHref("/besos")) + '">' + esc(besosLabel) + "</a>"
        : "") +
      '<a class="eq-geo-btn" href="' +
      esc(navHref("/contact")) +
      '">' +
      esc(contactLabel) +
      "</a>" +
      "</div>" +
      '<p class="eq-geo-about">' + esc(u.about) + "</p>" +
      "</article>";

    injectSchema(
      { title: page.title, description: page.description, skipTable: skipTable },
      key,
      faq,
      lang,
      page.sections
    );
    if (lang === "en") document.documentElement.lang = "en";
  }

  function loadGeoLandings() {
    return fetch(DATA_URL, { credentials: "same-origin" }).then(function (r) {
      if (r.ok) return r.json();
      return Promise.all([
        fetch(DATA_FALLBACK, { credentials: "same-origin" }),
        fetch(DATA_EN_FALLBACK, { credentials: "same-origin" }),
      ]).then(function (res) {
        if (!res[0].ok) throw new Error("geo");
        return res[0].json().then(function (tr) {
          if (!res[1].ok) return mergeLandings(tr, {});
          return res[1].json().then(function (en) {
            return mergeLandings(tr, en);
          });
        });
      });
    });
  }

  function boot() {
    var rawKey = pathKey();
    if (redirectGeoToEnIfNeeded(rawKey)) return;
    var key = resolveGeoDataKey(rawKey);
    var isEn = key.indexOf("en/") === 0;
    var miss = uiStrings(isEn ? "en" : "tr");
    ensureVitrinChrome()
      .then(function () {
        ensureGeoScripts();
        return loadGeoLandings();
      })
      .then(function (data) {
        var page = data[key] || data[rawKey];
        if (!page) {
          page = {
            lang: isEn ? "en" : "tr",
            profile: "projelerHub",
            title: "Equsto",
            h1: miss.notFoundH1,
            lead: miss.notFoundLead,
          };
        }
        render(page, key);
      })
      .catch(function () {
        render(
          {
            lang: isEn ? "en" : "tr",
            profile: "projelerHub",
            h1: "Equsto",
            lead: miss.loadErr,
            title: "Equsto",
          },
          key
        );
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
