/**
 * SEO / rehber sayfaları — eski site uzun metinleri (llms + PFOS şablonu).
 */
(function () {
  "use strict";

  var ORIGIN = "https://equsto.com";
  var DATA_URL = "/data/geo-landings.json?v=20260527geo";

  var EQUIP = [
    {
      dept: "pisirme",
      slug: "csa-csa-4-lu-gazli-kuzine-ce-belgeli-80x80x85-cm-krcs-kzg-880-ce",
      cat: "Pişirme",
      label: "Gazlı dört gözlü kuzine · sıcak hat omurgası",
    },
    {
      dept: "sogutma",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-tag-270-nmv-cift-kapili-tezgah-tip-buzdolabi-79e4-27nmv-00",
      cat: "Soğutma",
      label: "Çift kapılı tezgah tipi soğuk hat",
    },
    {
      dept: "sogutma",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-gn-1200-lmv-cift-kapili-dik-tip-derin-dondurucu-k-tip-79k4-12lmv-00",
      cat: "Depolama",
      label: "Yüksek hacimli dik tip derin dondurucu",
    },
    {
      dept: "yikama",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-bulasik-makinesi-dokunmatik-ekranli-tahliye-pompali-set-alti-oby500touch",
      cat: "Yıkama",
      label: "Tezgah altı yüksek kapasiteli bulaşık hattı",
    },
    {
      dept: "kahve",
      slug:
        "nuova-simonelli-nuova-simonelli-appia-life-2-gruplu-tam-otomatik-espresso-kahve-makinesi-yuksek-bardak",
      cat: "Kahve",
      label: "Çift gruplu espresso merkezi",
    },
    {
      dept: "hazirlik",
      slug: "bosfor-bosfor-10-kg-hamur-yogurma-makinesi-uhm-10m",
      cat: "Hazırlık",
      label: "Hamur / karışım hazırlığı",
    },
    {
      dept: "icecek",
      slug: "atese-atese-2-demlikli-cay-kazani-titanium-compact-dijital-gazli-elektrikli-tcsge02",
      cat: "İçecek",
      label: "Sıcak içecek ve demlik hattı",
    },
    {
      dept: "pisirme",
      slug:
        "ari-sco-arisco-butun-pleyt-gazli-ocak-alti-acik-dolapli-ce-belgeli-gr921p-range-gas",
      cat: "Servis",
      label: "Açık pleyt + alt dolap kombinasyonu",
    },
  ];

  var PROFILES = {
    steakhouse: {
      budget: "2,5 - 4,5 milyon TL",
      pfosKonu: "Steakhouse",
      body:
        "<p>Steakhouse mutfağında <strong>dry-age dolabı</strong>, yüksek ısı ızgara/kuzine hattı ve et hazırlık modülleri aynı akışta toplanır. Equsto <strong>Gastronomi Tasarımı</strong> davlumbaz statik basıncını ve soğutma hat uzunluğunu erken doğrular; <strong>Satış Mühendisliği</strong> sahada montaj ve devreye almayı planlar.</p>" +
        "<h2>Bütçe ve kapasite</h2>" +
        "<p>2026 katalog bandı tipik olarak <strong>{budget}</strong> aralığındadır (KDV hariç liste, standart montaj). Kişi başı metrekare ve servis süresi ocak adedini belirler; PFOS bu adetleri kural setiyle üretir.</p>",
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
      budget: "600 bin - 1,8 milyon TL",
      pfosKonu: "Cafe",
      body:
        "<p>Cafe kurulumunda <strong>espresso istasyonu</strong>, soğuk süt/stok dolapları ve hazırlık tezgahı aynı gün içinde yoğun kullanılır. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir.</p>" +
        "<h2>Bütçe bandı</h2><p>Tipik katalog bandı: <strong>{budget}</strong>. Paket servis oranı yükseldikçe soğutma derinliği artar.</p>",
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
      budget: "1,5 - 4 milyon TL",
      pfosKonu: "Catering",
      body:
        "<p>Catering mutfağında <strong>yüksek hacim pişirme</strong>, taşıma ekipmanları ve konveyörlü yıkama aynı senaryoda modellenir. Banket çıkışlarında sıcak holding süresi menü mühendisliğini belirler.</p><p>Bütçe bandı: <strong>{budget}</strong>.</p>",
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
      budget: "800 bin - 2,5 milyon TL",
      pfosKonu: "Fast food",
      body:
        "<p>Fast food hattında fritöz/ızgara yoğunluğu, soğutma stok derinliği ve hızlı yıkama kritiktir. Menü karması ekipman adetlerini doğrudan etkiler.</p><p>Band: <strong>{budget}</strong>.</p>",
      faq: [["Paket ağırlığı yüksekse?", "Soğutma ve hazırlık modülleri paket oranına göre artırılır."]],
      related: [{ label: "Bulut mutfak", href: "/bulut-mutfak-kurulumu" }],
    },
    finedining: {
      budget: "1,2 - 3,5 milyon TL",
      pfosKonu: "Fine dining",
      body:
        "<p>Fine dining’de düşük porsiyon sıklığı geniş ocak yayılımı getirir; bitirme ve soğuk holding servis stiline göre ayrılır.</p><p>Band: <strong>{budget}</strong>.</p>",
      faq: [["Steakhouse ile fark?", "Steakhouse dry-age ve yüksek ısı ızgara ağırlıklıdır; fine dining daha dengeli hatlar kullanır."]],
      related: [{ label: "Steakhouse rehberi", href: "/steakhouse-kurulumu" }],
    },
    bulut: {
      budget: "800 bin - 2 milyon TL",
      pfosKonu: "Bulut mutfak",
      body:
        "<p>Bulut mutfakta marka başına parsellenmiş sıcak/soğuk hatlar ve ortak yıkama merkezi planlanır. Elektrik ve havalandırma yükleri çok markalı senaryoda artar.</p><p>Band: <strong>{budget}</strong>.</p>",
      faq: [["Çok marka tek ruhsatta?", "MEP ve yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır."]],
      related: [
        { label: "m² rehberi", href: "/rehber/mutfak-alani-kisi-basi-metrekare-2026" },
        { label: "Fast food", href: "/fast-food-kurulumu" },
      ],
    },
    allday: {
      budget: "2 - 6 milyon TL",
      pfosKonu: "All day dining",
      body:
        "<p>All day dining ve otel mutfağında kahvaltı–öğle–akşam döngüsü aynı ekipmanı farklı yüklerle kullanır; kahve ve sıcak hat paralel yürür.</p><p>Band: <strong>{budget}</strong>.</p>",
      faq: [["Otel mutfağı ile ortak mı?", "Evet — PFOS’ta otel / all day dining konseptleri benzer hatları paylaşır."]],
      related: [{ label: "Catering rehberi", href: "/catering-mutfagi" }],
    },
    projelerHub: {
      budget: null,
      body:
        "<p>Equsto referans sayfaları <strong>demonte vaka</strong> anlatımı sunar: proje yaşam döngüsü, zorunluluklar ve ekipman mantığı şeffaftır. Gerçek müşteri fotoğrafı ve alıntıları yayın sürecinde pekiştirilir.</p>",
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
      budget: "1,5 - 4 milyon TL",
      body:
        "<p>İstanbul sınıfı yoğun ilçelerde cephe kapasitesi ve baca kuyusu netleştirilmeden sipariş risklidir. Bu demode profil yüksek hacim catering için sıcak banket + yıkama omurgasını gösterir.</p>",
      faq: [["Canlı teklif?", "PFOS’ta Catering + İstanbul şehir seçimiyle sihirbazı açın."]],
      related: [{ label: "Tüm projeler", href: "/projeler" }],
    },
    projeIzmir: {
      budget: "800 bin - 2,5 milyon TL",
      body:
        "<p>Modüler bar ve içecek hattı Besos modülleriyle hizalanır; Vitrum Group menşeli bar çözümleri Equsto Bar Design Studio altında sunulur.</p>",
      faq: [["Bar modülleri nerede?", "/besos vitrininde 42 modül listelenir."]],
      related: [
        { label: "Bar Design (Besos)", href: "/besos" },
        { label: "İçecek vitrini", href: "/shop/icecek" },
      ],
    },
    rehberM2: {
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
      budget: "Proje bazlı",
      pfosKonu: "Restoran",
      body:
        "<p>Türkiye’de <strong>endüstriyel mutfak ekipmanı</strong> arayan işletmeler için Equsto; pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanlarında canlı katalog ve satış mühendisliği sunar.</p><p>Öztiryakiler yetkili bayii kanalı ve seçili global markalar aynı sepet ve teklif akışında birleşir.</p>",
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
      budget: "800 bin - 4 milyon TL",
      pfosKonu: "Restoran",
      body:
        "<p><strong>Restoran mutfak teklifi</strong> için menü, kapasite ve servis stili girilir; PFOS sıcak/soğutma/yıkama adetlerini kural setiyle üretir.</p><p>Teklif özeti KDV, lojistik ve montaj kalemlerini içerir; nihai tutar satış mühendisliği onayıyla kesinleşir.</p>",
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
      budget: "2 - 8 milyon TL",
      pfosKonu: "All day dining",
      body:
        "<p><strong>Otel mutfak ekipmanı</strong> tedarikinde kahvaltı–öğle–akşam döngüsü ve banket çıkışları aynı hatları farklı yüklerle kullanır.</p><p>All day dining rehberi ile örtüşen senaryolar PFOS’ta modellenir.</p>",
      faq: [
        ["Otel ve restoran farkı?", "Otelde gün boyu menü döngüsü ve yüksek soğutma derinliği daha belirgindir."],
      ],
      related: [
        { label: "All day dining", href: "/all-day-dining-kurulumu" },
        { label: "Catering", href: "/catering-mutfagi" },
      ],
    },
    seoOzti: {
      budget: "Kalem bazlı",
      pfosKonu: "Restoran",
      body:
        "<p><strong>Öztiryakiler ekipmanı</strong> Equsto kataloğunda pişirme, soğutma, yıkama ve hazırlık departmanlarında listelenir; bayi iskonto ve EUR/TL kurları canlı uygulanır.</p><p>Yetkili bayii ilişkisi resmi fiyat listesi ve garanti hattını kapsar.</p>",
      faq: [
        ["Sadece Öztiryakiler mi?", "Hayır — Atalay ve seçili markalar da katalogdadır; Öztiryakiler ana omurgadır."],
      ],
      related: [
        { label: "Soğutma vitrini", href: "/shop/sogutma" },
        { label: "Marka listesi", href: "/marka.html" },
      ],
    },
    seoSogukOda: {
      budget: "Proje bazlı",
      pfosKonu: "Restoran",
      body:
        "<p><strong>Soğuk oda teklifi</strong> için kapasite, ürün profili ve MEP koşulları birlikte değerlendirilir. Tezgah tipi ve dik tip modüller vitrin tablosunda örneklenir.</p>",
      faq: [
        ["Sadece dolap mı?", "Hayır — soğuk oda projeleri ayrı mühendislik hattıyla yürür; vitrin modülleri tamamlayıcıdır."],
      ],
      related: [
        { label: "Soğutma vitrini", href: "/shop/sogutma" },
        { label: "Dry-age / steakhouse", href: "/steakhouse-kurulumu" },
      ],
    },
    seoHavuzlu: {
      budget: "200 bin - 1,2 milyon TL",
      pfosKonu: "Restoran",
      body:
        "<p><strong>Havuzlu tezgah tipi dolap</strong> seçiminde dış ölçü (mm), GN uyumu ve kapasite (lt) vitrin kartında listelenir.</p>",
      faq: [
        ["Ölçüler nerede?", "Ürün detay ve PLP kartlarında teknik ölçü satırı bulunur."],
      ],
      related: [{ label: "Soğutma vitrini", href: "/shop/sogutma" }],
    },
    seoPisirme: {
      budget: "300 bin - 2 milyon TL",
      pfosKonu: "Restoran",
      body:
        "<p><strong>Endüstriyel pişirme</strong> hattında kuzine, ocak, fritöz, ızgara ve kaynatma modülleri menüye göre adetlendirilir.</p>",
      faq: [["Gazlı / elektrikli?", "Her ikisi de vitrinde; saha gaz ve elektrik kapasitesine göre seçilir."]],
      related: [{ label: "Pişirme vitrini", href: "/shop/pisirme" }],
    },
    seoTeklifPlatform: {
      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p><strong>Proje Fabrikası (PFOS)</strong> Equsto’nun teklif platformudur: konsept, kapasite ve menü girdileriyle ekipman listesi ve fiyat özeti üretir.</p><p>Hedef süre <strong>5 dakika</strong>; 24 saat ifadesi kullanılmaz — çıktı satış mühendisliği onayına tabidir.</p>",
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
      budget: "500 bin - 3 milyon TL",
      pfosKonu: "Bar",
      body:
        "<p><strong>Bar tasarımı</strong> Equsto’da Bar Design Studio (Besos) ile yürür; Vitrum Group menşeli modüler istasyonlar saha ölçüsüne göre seçilir.</p>",
      faq: [["Besos vitrin?", "/besos adresinde 42 modül listelenir."]],
      related: [
        { label: "Besos vitrini", href: "/besos" },
        { label: "İçecek ekipmanları", href: "/shop/icecek" },
      ],
      ctaBesos: true,
    },
    seoEnIndustrial: {
      budget: "Project-based",
      pfosKonu: "Restaurant",
      body:
        "<p>Equsto is a <strong>Turkey-based industrial kitchen platform</strong> for restaurants, hotels, cloud kitchens and catering. Authorized Öztiryakiler distribution; quote summary in about 5 minutes via Project Factory.</p>",
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
      budget: null,
      pfosKonu: "Restaurant",
      body:
        "<p><strong>Project Factory (PFOS)</strong> generates equipment lists and priced quote summaries for commercial kitchen projects. Target turnaround about 5 minutes; final pricing confirmed by sales engineering.</p>",
      faq: [["Is this a reservation app?", "No — B2B kitchen equipment and project quoting."]],
      related: [
        { label: "PFOS", href: "/pfos" },
        { label: "Industrial supplier TR", href: "/en/industrial-kitchen-supplier-turkey" },
      ],
      skipTable: true,
    },
    blogHub: {
      budget: null,
      body:
        "<p>Bu dizin, <strong>blog ve rehber</strong> içeriklerini vitrin menüsünden ayırır. Kullanıcı gezintisinde gizli tutulur; Google ve AI asistanları sitemap ve llms.txt üzerinden erişir.</p>",
      faq: [
        ["Neden menüde yok?", "EQUSTO SEO stratejisi: ekipman odaklı vitrin; rehberler programatik ve footer/sitemap köprülü."],
      ],
      related: [{ label: "Ana katalog", href: "/shop" }],
      skipTable: true,
    },
  };

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

  function pathKey() {
    var p = String(location.pathname || "/").replace(/\/+$/, "") || "/";
    if (p.charAt(0) === "/") p = p.slice(1);
    return p;
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

  function equipmentTableHtml() {
    var rows = EQUIP.map(function (row) {
      var href = navHref("/shop/" + row.dept + "/" + encodeURIComponent(row.slug));
      return (
        "<tr><td>" +
        esc(row.cat) +
        '</td><td><a href="' +
        esc(href) +
        '">' +
        esc(row.label) +
        "</a></td></tr>"
      );
    }).join("");
    return (
      '<h2>Vitrinden örnek ekipman tablosu (8 kalem)</h2>' +
      '<table class="eq-geo-table"><thead><tr><th>Hat</th><th>Örnek SKU</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>"
    );
  }

  function faqHtml(faq) {
    if (!faq || !faq.length) return "";
    return (
      '<section class="eq-geo-faq" aria-label="Sık sorulan sorular"><h2>Sık sorulan sorular</h2>' +
      faq
        .map(function (qa) {
          return (
            '<details class="eq-geo-faq-item"><summary>' +
            esc(qa[0]) +
            "</summary><p>" +
            esc(qa[1]) +
            "</p></details>"
          );
        })
        .join("") +
      "</section>"
    );
  }

  function relatedHtml(list) {
    if (!list || !list.length) return "";
    return (
      '<h2>İlgili rehberler</h2><ul class="eq-geo-links">' +
      list
        .map(function (ln) {
          return '<li><a href="' + esc(navHref(ln.href)) + '">' + esc(ln.label) + "</a></li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function injectSchema(page, key, faq, lang) {
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
    if (faq && faq.length) {
      graph.push({
        "@type": "FAQPage",
        mainEntity: faq.map(function (qa) {
          return {
            "@type": "Question",
            name: qa[0],
            acceptedAnswer: { "@type": "Answer", text: qa[1] },
          };
        }),
      });
    }
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
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(s);
  }

  function render(page, key) {
    var root = document.getElementById("eq-geo-main");
    if (!root || !page) return;

    var prof = PROFILES[page.profile] || {};
    var lang = page.lang || prof.lang || "tr";
    var budget = page.budget || prof.budget;
    var body = (page.body || prof.body || "").replace(/\{budget\}/g, budget || "—");
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

    var linksHtml = "";
    if (page.links && page.links.length) {
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
      '<nav class="eq-geo-bc" aria-label="Konum"><a href="' +
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
      (budget ? '<p class="eq-geo-budget"><strong>2026 planlama bandı (KDV hariç, gösterge):</strong> ' + esc(budget) + "</p>" : "") +
      '<div class="eq-geo-body">' +
      body +
      "</div>" +
      linksHtml +
      (skipTable ? "" : equipmentTableHtml()) +
      relatedHtml(related) +
      faqHtml(faq) +
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
      '<p class="eq-geo-about">Equsto Teknolojisi · Gastronomi Tasarımı · Satış Mühendisliği — Öztiryakiler yetkili bayii; Bar Design Studio (Besos) Vitrum Türkiye.</p>' +
      "</article>";

    injectSchema(
      { title: page.title, description: page.description, skipTable: skipTable },
      key,
      faq,
      lang
    );
    if (lang === "en") document.documentElement.lang = "en";
  }

  function boot() {
    var key = pathKey();
    fetch(DATA_URL, { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("geo");
        return r.json();
      })
      .then(function (data) {
        var page = data[key];
        if (!page) {
          page = {
            profile: "projelerHub",
            title: "Equsto",
            h1: "Sayfa bulunamadı",
            lead: "Aradığınız rehber henüz yayında değil. Ana sayfa veya iletişim üzerinden devam edebilirsiniz.",
          };
        }
        render(page, key);
      })
      .catch(function () {
        render(
          {
            profile: "projelerHub",
            h1: "Equsto",
            lead: "İçerik yüklenemedi.",
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
