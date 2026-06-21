/**
 * PFOS programmatic landing: /pfos/{meslek}/{sehir}/{konsept}/{m2} (and /en/...).
 * Uzun içerik şablonu, vitrin ürün tablosu + JSON-LD (ItemList, LocalBusiness, FAQPage, Service).
 * Wizard DOM'una dokunulmaz — yalnızca .pg üstüne SEO üst bloğu eklenir.
 */
(function () {
  var ORIGIN = "https://equsto.com";

  var pathname = String(location.pathname || "/");
  var isEn = false;
  if (pathname === "/en" || pathname.indexOf("/en/") === 0) {
    isEn = true;
    pathname = pathname.replace(/^\/en/, "") || "/";
  }
  var path = pathname.replace(/\/+$/, "");

  var m = path.match(/^\/pfos\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/i);
  if (!m) return;

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slugLabel(s) {
    return decodeURIComponent(String(s || ""))
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) {
        return isEn ? c.toUpperCase() : c.toLocaleUpperCase("tr-TR");
      });
  }

  function pathHash(seg) {
    var h = 5381;
    for (var i = 0; i < seg.length; i++) {
      h = ((h << 5) + h) ^ seg.charCodeAt(i);
      h = h >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8).toUpperCase();
  }

  function prefixShop() {
    return isEn ? "/en" : "";
  }

  var meslekSlug = m[1];
  var sehirSlug = m[2];
  var konseptSlug = m[3];
  var m2token = m[4];

  var meslek = slugLabel(meslekSlug);
  var sehir = slugLabel(sehirSlug);
  var konsept = slugLabel(konseptSlug);
  var m2raw = m2token.replace(/m2$/i, "").replace(/[^0-9]/g, "");
  var m2 = m2raw ? m2raw + " m²" : slugLabel(m2token);

  var canonical = ORIGIN + (isEn ? "/en" : "") + path;

  var meslekKey = meslekSlug.toLowerCase();
  var budgetByMeslek = {
    restoran: "1,2 - 3,5 milyon TL",
    kafe: "600 bin - 1,8 milyon TL",
    cafe: "600 bin - 1,8 milyon TL",
    catering: "1,5 - 4 milyon TL",
    otel: "2 - 6 milyon TL",
    hotel: "2 - 6 milyon TL",
    steakhouse: "2,5 - 4,5 milyon TL",
    bar: "800 bin - 2,5 milyon TL",
    "bulut-mutfak": "800 bin - 2 milyon TL",
    "cloud-kitchen": "800 bin - 2 milyon TL",
  };
  var budget = budgetByMeslek[meslekKey] || "800 bin - 4 milyon TL";

  var title = isEn
    ? sehir + " " + meslek + " kitchen scope " + m2 + " — " + konsept + " | Equsto Project Factory"
    : sehir + " " + meslek + " Mutfak Projesi " + m2 + " — " + konsept + " | Equsto Proje Fabrikası";
  var description = isEn
    ? "Industrial kitchen scope in " +
      sehir +
      ": " +
      m2 +
      " for " +
      konsept +
      " " +
      meslek +
      ". Typical equipment table with live catalog links, budget band, and wizard pre-fill."
    : sehir +
      "'de " +
      m2 +
      " büyüklüğünde " +
      konsept +
      " " +
      meslek +
      " için endüstriyel mutfak projesi. Örnek ekipman tablosunda vitrin ürünleri, bütçe bandı ve planlama notları.";
  var h1 = isEn
    ? sehir + " " + meslek + " scope — " + m2 + " · " + konsept
    : sehir + " " + meslek + " Mutfak Projesi — " + m2 + " " + konsept;

  /** Vitrinden doğrulanmış örnek SKU’lar — productSlugEq ile uyumlu. */
  var EQUIP_ROWS = [
    {
      dept: "pisirme",
      slug: "csa-csa-4-lu-gazli-kuzine-ce-belgeli-80x80x85-cm-krcs-kzg-880-ce",
      catTr: "Pişirme",
      catEn: "Cooking line",
      labelTr: "Gazlı dört gözlü kuzine · örnek donanım referansı",
      labelEn: "Four-burner gas range line · sample SKU",
    },
    {
      dept: "sogutma",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-tag-270-nmv-cift-kapili-tezgah-tip-buzdolabi-79e4-27nmv-00",
      catTr: "Soğutma",
      catEn: "Refrigeration",
      labelTr: "Çift kapılı tezgah tipi soğuk hat",
      labelEn: "Double-door prep-table refrigerator",
    },
    {
      dept: "yikama",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-bulasik-makinesi-dokunmatik-ekranli-tahliye-pompali-set-alti-oby500touch",
      catTr: "Yıkama",
      catEn: "Warewashing",
      labelTr: "Tezgah altı yüksek kapasiteli bulaşık hattı",
      labelEn: "Under-counter high-cycle dishwasher",
    },
    {
      dept: "kahve",
      slug:
        "nuova-simonelli-nuova-simonelli-appia-life-2-gruplu-tam-otomatik-espresso-kahve-makinesi-yuksek-bardak",
      catTr: "Kahve / bar hazırlık",
      catEn: "Coffee station",
      labelTr: "Çift gruplu espresso merkezi (örnek SKU)",
      labelEn: "Two-group espresso centerpiece (sample SKU)",
    },
    {
      dept: "hazirlik",
      slug: "bosfor-bosfor-10-kg-hamur-yogurma-makinesi-uhm-10m",
      catTr: "Hazırlık",
      catEn: "Prep",
      labelTr: "Hamur / karışım hazırlığı (orta kapasite)",
      labelEn: "Dough and mix prep station",
    },
    {
      dept: "icecek",
      slug: "atese-atese-2-demlikli-cay-kazani-titanium-compact-dijital-gazli-elektrikli-tcsge02",
      catTr: "İçecek destek",
      catEn: "Beverage support",
      labelTr: "Demlik bazlı sıcak içecek yönetimi",
      labelEn: "Hot beverage dispense backbone",
    },
    {
      dept: "sogutma",
      slug:
        "oztiryakiler-endustriyel-mutfak-oztiryakiler-gn-1200-lmv-cift-kapili-dik-tip-derin-dondurucu-k-tip-79k4-12lmv-00",
      catTr: "Depolama",
      catEn: "Frozen storage",
      labelTr: "Yüksek hacimli dik tip derin dondurucu",
      labelEn: "Upright high-volume freezer cabinet",
    },
    {
      dept: "pisirme",
      slug:
        "ari-sco-arisco-butun-pleyt-gazli-ocak-alti-acik-dolapli-ce-belgeli-gr921p-range-gas",
      catTr: "Servis hattı",
      catEn: "Finishing / pass",
      labelTr: "Açık pleyt + alt dolap kombinasyonu (örnek)",
      labelEn: "Open-burner finishing module (sample)",
    },
  ];

  var cityHint = "";
  var lowerCity = String(sehirSlug || "").toLowerCase();

  if (/istanbul/i.test(lowerCity)) {
    cityHint = isEn
      ? "In dense districts, façade loads and shaft allocation should be clarified before equipment orders; Equsto ties delivery slots to readiness at site."
      : "Yoğun ilçelerde cephe kapasitesi ve baca/davlumbaz kuyusu netleştirilmeden ekipman siparişi risklidir; Equsto teslim tarihlerini sahada hazırlık durumuna bağlar.";
  } else if (/ankara/i.test(lowerCity)) {
    cityHint = isEn
      ? "For Ankara-class cold/hot climates, remote condensing lines and glycol ratios should be validated alongside local fire safety standards."
      : "Ankara sınıfı karasal iklimlerde uzak kondanser hatları ve glikol oranları, yerel itfaiye yangın yönetmelikleriyle birlikte erken doğrulanmalıdır.";
  } else if (/izmir/i.test(lowerCity)) {
    cityHint = isEn
      ? "Coastal humidity and outdoor patio ventilation zones must be balanced with grease filter class and exhaust direction rules in Izmir."
      : "Kıyı nem yükü ve açık alan/teras davlumbaz konumlandırması, İzmir'deki koku filtresi ve egzoz atım yönü kurallarıyla dengelenmelidir.";
  } else if (/bursa/i.test(lowerCity)) {
    cityHint = isEn
      ? "Industrial zone (OSB) electrical grid limits and gas pressure regulators require early coordination for heavy cooking suites in Bursa."
      : "Bursa'daki OSB ve sanayi bölgesi elektrik altyapı limitleri ile gaz basınç düşürücüleri, yoğun pişirme hatları için erken koordine edilmelidir.";
  } else if (/antalya/i.test(lowerCity)) {
    cityHint = isEn
      ? "Under Antalya's high summer temperatures (+43°C), remote refrigeration condenser sizing and high-ambient duty cooling units are mandatory."
      : "Antalya'nın yüksek yaz sıcaklıkları (+43°C) altında, uzak soğutma kondanser boyutlandırması ve tropikal sınıf (+43°C) soğutma grupları zorundur.";
  } else if (/adana/i.test(lowerCity)) {
    cityHint = isEn
      ? "Charcoal cooking concepts (kebap/hearths) require electrostatic precipitators and high-capacity ice machines for Adana's climate."
      : "Kebap ve ocakbaşı konseptleri için elektrostatik filtreleme sistemi ve Adana sıcağına dayanıklı yüksek kapasiteli buz makineleri planlanmalıdır.";
  } else if (/konya/i.test(lowerCity)) {
    cityHint = isEn
      ? "Hard water profiles require commercial water softeners; bakery line dough processing units must scale with regional pastry throughput."
      : "Konya'nın kireçli su profili için endüstriyel su yumuşatıcı; unlu mamul pişirme hatları ise bölgesel hamur işleme kapasitelerine göre ölçeklenmelidir.";
  } else if (/sanliurfa|şanlıurfa/i.test(lowerCity)) {
    cityHint = isEn
      ? "Extreme summer dry heat and heavy charcoal grill exhausts require high-efficiency canopy filtration and specific dust/grease traps in Urfa."
      : "Urfa'nın aşırı yaz sıcakları ve yoğun kömürlü ızgara dumanı, yüksek verimli davlumbaz filtrasyonu ve özel yağ/toz tutucular gerektirir.";
  } else if (/gaziantep/i.test(lowerCity)) {
    cityHint = isEn
      ? "High-output baking gas lines and high-temperature pastry ovens require dynamic gas safety validation and soot scrubbing in Gaziantep."
      : "Gaziantep'teki yüksek kapasiteli baklava/hamur pişirme gaz hatları ve yüksek ısı fırınları, dinamik gas emniyet onayları ve baca sulu filtreyle kurulmalıdır.";
  } else if (/kocaeli/i.test(lowerCity)) {
    cityHint = isEn
      ? "Industrial zoning permits and seismic automatic gas shut-off valves require strict certification reviews before installation in Kocaeli."
      : "Kocaeli bölgesindeki sanayi ruhsat izinleri ve deprem sensörlü otomatik gaz kesme vanaları, kurulum öncesi sıkı sertifika denetimi gerektirir.";
  } else if (/mersin/i.test(lowerCity)) {
    cityHint = isEn
      ? "High marine humidity calls for AISI 304 grade stainless steel structure and coastal-rated evaporator protective coatings in Mersin."
      : "Mersin'deki yüksek deniz nemi yükü nedeniyle tüm tezgahlarda AISI 304 kalite paslanmaz çelik ve korozyon korumalı evaporatörler tercih edilmelidir.";
  } else if (/diyarbakir|diyarbakır/i.test(lowerCity)) {
    cityHint = isEn
      ? "Heavy charcoal hearth chimney heights, soot scrubbers, and high-capacity flour processing units are key compliance checkpoints in Diyarbakir."
      : "Diyarbakır'da yoğun ocakbaşı baca yükseklikleri, sulu baca filtresi (soot scrubber) ve yüksek kapasiteli unlu mamul hazırlık hatları kritik denetim noktalarıdır.";
  } else if (/hatay/i.test(lowerCity)) {
    cityHint = isEn
      ? "Gastro-tourism heavy baking ovens, gas security checks, and municipal grease separators are strictly inspected in Hatay."
      : "Hatay'ın gastronomi odaklı taş fırınları, yüksek gaz emniyet kontrolleri ve belediye atık su yağ ayırıcı (grease trap) standartları sıkı denetlenir.";
  } else if (/manisa/i.test(lowerCity)) {
    cityHint = isEn
      ? "Agricultural produce processing requires dedicated washing sinks, raw intake zoning, and large cold room configurations in Manisa."
      : "Manisa'da tarımsal hammadde işleme için özel sebze yıkama evyeleri, mal kabul hijyen bariyerleri ve geniş soğuk oda tasarımları önceliklidir.";
  } else if (/kayseri/i.test(lowerCity)) {
    cityHint = isEn
      ? "Bakery and meat drying concepts require precise temperature/humidity cold storage and high-load power line coordination in Kayseri."
      : "Kayseri'de unlu mamul ve et kurutma işlemleri için hassas sıcaklık/nem kontrollü depolar ile yüksek kurulu güç bağlantısı koordine edilmelidir.";
  } else if (/samsun/i.test(lowerCity)) {
    cityHint = isEn
      ? "Black Sea humidity requires continuous passive kitchen air-exchange cycles and coastal-grade grease interceptors in Samsun."
      : "Karadeniz nemi nedeniyle Samsun'daki projelerde sürekli pasif hava çevrim sistemleri ve kıyıya uygun paslanmaz yağ ayırıcılar planlanmalıdır.";
  } else if (/balikesir|balıkesir/i.test(lowerCity)) {
    cityHint = isEn
      ? "High wind load on rooftop refrigeration condensers and dairy storage cold room backups should be designed early in Balikesir."
      : "Balıkesir'deki rüzgar yükü nedeniyle çatı kondanser sabitlemeleri ve mandıra/süt ürünleri deposu için yedekli soğutma grupları kurulmalıdır.";
  } else if (/kahramanmaras|kahramanmaraş/i.test(lowerCity)) {
    cityHint = isEn
      ? "Sub-zero ice cream storage freezers (-25°C) and seismic utility shut-offs require specialized refrigeration engineering in Maras."
      : "Maraş'ta eksi yirmi beş derece (-25°C) dondurma saklama dolapları ve sismik hat emniyet ekipmanları özel soğutma mühendisliği gerektirir.";
  } else if (/van/i.test(lowerCity)) {
    cityHint = isEn
      ? "High altitude drops atmospheric pressure; gas burners require high-altitude nozzles and severe winter anti-freeze glycol lines in Van."
      : "Van'ın yüksek rakımı gazlı brülörlerde %15 hava-yakıt düzeltme memesi gerektirir; kış aylarında ise dış kondanser hatları yüksek glikollü olmalıdır.";
  } else if (/aydin|aydın/i.test(lowerCity)) {
    cityHint = isEn
      ? "Heavy olive oil usage requires oversized wastewater grease traps, and coastal hot weather demands tropical-rated condensers in Aydin."
      : "Aydın'daki yoğun zeytinyağı kullanımı için geniş hacimli yağ sıyırıcılar, Kuşadası/Didim kıyı hattında ise tropikal kondanserler kurulmalıdır.";
  } else {
    cityHint = isEn
      ? "Regional municipality checklists vary; zoning, wastewater grease separation and canopy filtration class should be validated with drawings before capex freeze."
      : "Belediye ve itfaiye kontrol listeleri ile parsel zonajı için ruhsat çizimleri netleştirilir; yağ sıyırıcı ve filtre sınıfları CAPEX kesiminden önce yazılır.";
  }

  function relatedGuides() {
    if (isEn) {
      var g = [
        '<a href="/en/cloud-kitchen-setup">Cloud kitchen setup guide</a>',
        '<a href="/en/cafe-setup">Café opening guide</a>',
        '<a href="/en/catering-kitchen-setup">Catering kitchen guide</a>',
      ];
      if (/steak/.test(meslekKey)) g.push('<a href="/steakhouse-kurulumu">Steak-forward kitchen (TR)</a>');
      if (/restoran|restaurant/.test(meslekKey))
        g.push('<a href="/en/fine-dining-setup">Fine dining setup notes</a>');
      return g;
    }
    var trg = [];
    trg.push('<a href="/rehber/dark-kitchen-bulut-mutfak-2026">Bulut mutfak rehberi</a>');
    trg.push('<a href="/cafe-kurulumu">Kafe kurulum rehberi</a>');
    trg.push('<a href="/catering-mutfagi">Catering mutfağı rehberi</a>');
    if (/steak|steakhouse/.test(meslekKey)) trg.push('<a href="/steakhouse-kurulumu">Steakhouse kurulum</a>');
    if (/restoran|otel|hotel|catering/.test(meslekKey))
      trg.push('<a href="/fine-dining-kurulumu">Fine dining rehberi</a>');
    if (/bulut|cloud/.test(meslekKey))
      trg.push('<a href="/rehber/mutfak-alani-kisi-basi-metrekare-2026">m² başına düşen yoğunluk</a>');
    return trg;
  }

  function caseLinks() {
    if (isEn) {
      return (
        '<ul class="eq-pfos-seo-land__ul">' +
        '<li><a href="' +
        prefixShop() +
        '/projeler/istanbul-yuksek-hacim-catering-demode">' +
        esc("İstanbul pilot — bulk-line capacity (demo case)") +
        "</a></li>" +
        '<li><a href="' +
        prefixShop() +
        '/projeler/izmir-moduler-bar-icecek-demode">' +
        esc("İzmir pilot — modular beverage line (demo case)") +
        "</a></li>" +
        "</ul>"
      );
    }
    return (
      '<ul class="eq-pfos-seo-land__ul">' +
      '<li><a href="/projeler/istanbul-yuksek-hacim-catering-demode">İstanbul yüksek hacim catering demode dizilimi</a></li>' +
      '<li><a href="/projeler/izmir-moduler-bar-icecek-demode">İzmir modüler bar ve içecek hattı demode</a></li>' +
      "</ul>"
    );
  }

  var tableRowsHtml = EQUIP_ROWS.map(function (row) {
    var href = prefixShop() + "/shop/" + row.dept + "/" + encodeURIComponent(row.slug);
    var cat = isEn ? row.catEn : row.catTr;
    var lbl = isEn ? row.labelEn : row.labelTr;
    return (
      "<tr><td>" +
      esc(cat) +
      '</td><td><a href="' +
      esc(href) +
      '">' +
      esc(lbl) +
      "</a></td></tr>"
    );
  }).join("");

  var bodyTop = "";
  var faqPairs = [];

  if (isEn) {
    bodyTop =
      "<p class=\"eq-pfos-seo-lead\"><strong>" +
      esc(sehir) +
      "</strong> — " +
      esc(meslek) +
      " scope sized at <strong>" +
      esc(m2) +
      "</strong> for <strong>" +
      esc(konsept) +
      "</strong> anchors on four flows: intake and prep zoning, thermal cooking center, refrigerated holding, and sanitary wash-down. Typical capex clusters land in <strong>" +
      esc(budget) +
      "</strong> assuming catalog equipment with standard installation and commissioning. Equsto Gastronomi Tasarımı and Satış Mühendisliği teams converge these flows into PFOS-ready line items so quantities move with wizard answers rather than guesses.</p>" +
      "<p>Each row in the catalogue table below resolves to live product URLs on Equsto (/shop/&hellip;) so auditors and AI crawlers can traverse from intent to SKU. Density of cooking modules scales with throughput; refrigerated GN lines track holding minutes of your menu; ware washing matches peak cover turns. Pilot references are marked as demo placeholders until anonymised customer consent is archived.</p>" +
      "<h2>Budget elasticity and metre coverage</h2>" +
      "<p>Translating capex bands to per-metre multiples is sensitive to façade length, extractor static pressure targets, and refrigeration remote layout. Rough planning math for this archetype divides the band by workable kitchen metres (excluding corridors) — then overlays HVAC allowance and captive power upgrades. PFOS emits line-by-line SKU counts so deltas between economy and premium trims can be debated with finance before PO.</p>" +
      "<p><strong>Per-cover operating envelope:</strong> service style changes plate minutes; takeaway-led models amortise refrigeration over fewer seats but higher dispatch peaks. Overlay your shift model in the wizard to align combi/stack decisions with staffing.</p>" +
      "<h2>Local delivery notes (" +
      esc(sehir) +
      ")</h2>" +
      "<p>" +
      esc(cityHint) +
      " Cross-dock milestones and hoist limits are captured inside Project Factory dossiers alongside Equsto Teknolojisi payloads.</p>" +
      "<h2>Demonstration profiles (experience signals)</h2>" +
      caseLinks() +
      "<h2>Suggested backbone equipment (catalogue-backed)</h2>";

    faqPairs = [
      [
        "Which budget band applies to " + sehir + " for " + meslek + " at " + m2 + "?",
        "The 2026 planning band published on this page (" +
          budget +
          ") is indicative for catalog equipment and standard install. Final pricing requires PFOS answers and Satış Mühendisliği sign-off.",
      ],
      [
        "Do the table links point to real sellable SKUs?",
        "Yes — each row targets a resolved /shop/{department}/{slug} path that loads in the Equsto product template with brand, gallery, and offer metadata.",
      ],
      [
        "How does Project Factory pre-fill this profile?",
        "Use the CTA below; query parameters carry meslek, city slug, concept slug, and m² token so the wizard opens on the same scenario without retyping.",
      ],
      [
        "What if our concept is still in design?",
        "PFOS supports staged answers. Lock menu clusters first, then iterate hood and refrigeration once architect MEP sheets arrive — line items stay versioned.",
      ],
      [
        "Can Equsto support export logistics from Turkey?",
        "Yes — procurement documentation and Incoterms-aware packing lists are part of export programmes for AE, QA, SA, AZ, KZ and selected EU/Balkan lanes.",
      ],
      [
        "Where can I read deeper GEO guides?",
        "Start with the linked setup guides and the editorial /rehber/ article on cover-per-metre planning; each page carries FAQ structured data aligned with programmatic landings.",
      ],
    ];
  } else {
    bodyTop =
      "<p class=\"eq-pfos-seo-lead\"><strong>" +
      esc(sehir) +
      "</strong>'de <strong>" +
      esc(m2) +
      "</strong> ve <strong>" +
      esc(konsept) +
      "</strong> profilinde düşünülen bir <strong>" +
      esc(meslek) +
      "</strong> tesisi için mutfak; kabul/hazırlık zonası, sıcak pişirme omurgası, soğuk zincir hattı ve hijyenli yıkama çevriminden oluşan dört paralel çizgiyi aynı anda taşır. Katalog liste fiyatlarıyla tipik olarak <strong>" +
      esc(budget) +
      "</strong> bandına oturan bu bileşim, elektrik bağlantıları ve standart montaj varsayımlarıyla hesaplanır. Equsto Proje Fabrikası (PFOS) bu omurgayı satır satır ürün referanslarına döker; böylece kapasiteye göre adetler tahmin değil kural seti çıktısı olur.</p>" +
      "<p>Aşağıdaki HTML tablosundaki bağlantılar doğrudan vitrin ürün sayfalarına gider (/shop/&hellip;). Böylece arama sistemleri ile yapay zekâ motorları SKU düzeyine kadar süzülebilir. Pişirme ve soğutma yoğunluğu menünüzün porsiyon ve servis sıcaklığına bağlı olarak kayar; bardaklık ile çatal-bıçak döngüsünde yıkama hızı özellikle pik dakikalarda kritik çıkar.</p>" +
      "<h2>Bütçe yayılımı ve m² işgali</h2>" +
      "<p>Anahtar teslim ekipman bandını işler mutfak m²'sine böldüğünüzde ortaya çıkan rakam cephe uzunluğu, davlumbaz statik basınçları ve uzak soğutma hat uzunluğu ile hızlı değişir. Bu yüzden strateji belgelerinde mutlaka üç senaryolu (temel,dengeli,rantabl) paket seçimi yazılır. PFOS çıktıları sayım dosyası üretir ve finansın satın alma onayına bağlanır.</p>" +
      "<p><strong>Kişi başı ve servis süresi:</strong> paket veya teslim kanalı güçlü işletmelerde soğuk stok daha derin tutulur; oturma ağırlıklı işletmede sıcak hattaki tutma süreleri belirleyicidir.</p>" +
      "<h2>" +
      esc(sehir) +
      " sahada dikkat</h2>" +
      "<p>" +
      esc(cityHint) +
      "</p>" +
      "<h2>Kanıt olarak okunabilecek örnek profiller</h2>" +
      "<p>Paylaşılan vaka sayfaları demonte anlatım içindir; gerçek müşteri alıntısı ve fotoğraf izinleri yayın sürecinde pekiştirilir. Yine de E-E-A-T sinyali için proje yaşam döngüsü, zorunluluklar ve ekipman seçim mantığı şeffaftır.</p>" +
      caseLinks() +
      "<h2>Vitrinden örnek ekipman tablosu</h2>";

    faqPairs = [
      [
        sehir + " için " + m2 + " " + konsept + " " + meslek + " hangi banda oturuyor?",
        "Sayfada belirtilen " +
          budget +
          " aralığı 2026 liste fiyat ve standart sahaya göre gösterilir. Nihai teklif için PFOS sihirbazını tamamlayıp Satış Mühendisliği teyidi gerekir.",
      ],
      [
        "Tablo bağlantıları gerçek ürün sayfası mı açılıyor?",
        "Her satır doğrudan /shop/{departman}/{slug} adresine bağlanır; ürün adı, görseller ve teklif alma akışları product.html ile aynı tasarımda yüklenir.",
      ],
      [
        "Sihirbaz bu URL'den dolu gelebilir mi?",
        '"Bu projeyi başlat" düğmesi meslek/şehir/konsept/m² parametrelerini sorguya ekler.',
      ],
      [
        "Menüm net değilse planı nasıl ilerletirim?",
        menuHintTr() + " " + pfosIterateSentence(),
      ],
      [
        "İhracat ve lojistik kapsanıyor mu?",
        "Orta Doğu ve Balkan çıkışlı nakliye ve evrak süreçleri Equsto ihracat programlarında işlenir.",
      ],
      [
        "Daha fazla GEO rehberi nerede?",
        "Bu sayfanın altındaki rehber linkleri ve mutfak m² yazısı (rehber) structured data ile desteklenir.",
      ],
    ];
  }

  function menuHintTr() {
    var t = String(konseptSlug || "").toLowerCase();
    if (/fine|premium|fine-dining|ozgun|özgün|özgun/.test(t))
      return "Fine dining yüzdesi düşük porsyon sıklığı getirdiği için ocak yayılımı genelde geniş kalır;";
    if (/coffee|kahve|espresso|spec/.test(t))
      return "Espresso ağırlıklı işletmede su filtrasyon ve basınç doğrulamasını espresso seçiminden önce sabitleyin;";
    if (/catering|toplu|banket/.test(t))
      return "Yüksek hacimli çıkışlarda sıcak banket ile soğuk zincir paralel yüklenecek şekilde parsellenir;";
    return "Konsepte göre sıcak pişir ile soğuk holding dengesi tekrar modellenmeli;";
  }

  function pfosIterateSentence() {
    return (
      "PFOS'ta ilk turda ana hatları kilitleyin, MEP güncellenince sıra davlumbaz ve soğuk hat revizyonundadır." 
    );
  }

  function setMeta(sel, attr, val) {
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      var parts = sel.match(/meta\[name="([^"]+)"\]/);
      if (!parts) parts = sel.match(/meta\[property="([^"]+)"\]/);
      if (parts) {
        if (sel.indexOf("property") !== -1) el.setAttribute("property", parts[1]);
        else el.setAttribute("name", parts[1]);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, val);
  }

  document.title = title;
  setMeta('meta[name="description"]', "content", description);
  var canon = document.querySelector('link[rel="canonical"]');
  if (!canon) {
    canon = document.createElement("link");
    canon.rel = "canonical";
    document.head.appendChild(canon);
  }
  canon.href = canonical;
  setMeta('meta[property="og:url"]', "content", canonical);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  if (isEn) {
    document.documentElement.setAttribute("lang", "en");
    setMeta('meta[property="og:locale"]', "content", "en_US");
    setMeta('meta[property="og:locale:alternate"]', "content", "tr_TR");
  }

  var eqSkPfos = "EQ-SK-2026-PFOS-" + pathHash(path.replace(/^\//, ""));

  var itemListEl = EQUIP_ROWS.map(function (row, i) {
    var href = ORIGIN + prefixShop() + "/shop/" + row.dept + "/" + encodeURIComponent(row.slug);
    var nm = isEn ? row.catEn + ": " + row.labelEn : row.catTr + ": " + row.labelTr;
    return {
      "@type": "ListItem",
      position: i + 1,
      item: href,
      name: nm,
    };
  });

  var faqSchema = faqPairs.map(function (qa) {
    return {
      "@type": "Question",
      name: qa[0],
      acceptedAnswer: { "@type": "Answer", text: qa[1] },
    };
  });

  var ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical + "#webpage",
        url: canonical,
        name: title,
        description: description,
        inLanguage: isEn ? "en-US" : "tr-TR",
        dateModified: "2026-05-15",
        isPartOf: { "@type": "WebSite", name: "Equsto", url: ORIGIN },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: isEn ? "Home" : "Anasayfa", item: ORIGIN + (isEn ? "/en/" : "/") },
          {
            "@type": "ListItem",
            position: 2,
            name: isEn ? "Project Factory" : "Proje Fabrikası",
            item: ORIGIN + (isEn ? "/en/pfos" : "/pfos"),
          },
          { "@type": "ListItem", position: 3, name: h1, item: canonical },
        ],
      },
      {
        "@type": "Service",
        "@id": canonical + "#svc",
        name: h1,
        serviceType: isEn ? "Industrial kitchen equipment project" : "Endüstriyel mutfak ekipmanı projesi",
        description: description,
        provider: { "@type": "Organization", "@id": ORIGIN + "#org", name: "Equsto", url: ORIGIN },
        areaServed: [{ "@type": "City", name: sehir, containedInPlace: { "@type": "Country", name: "Turkey" } }],
      },
      {
        "@type": "LocalBusiness",
        "@id": canonical + "#local",
        name: "Equsto Satış Mühendisliği",
        url: ORIGIN + (isEn ? "/en/pfos" : "/pfos"),
        image: ORIGIN + "/og-cover-pfos.jpg",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Istanbul",
          addressCountry: "TR",
        },
        areaServed: [{ "@type": "City", name: sehir }],
        parentOrganization: { "@type": "Organization", name: "Equsto", url: ORIGIN },
      },
      { "@type": "ItemList", name: isEn ? "Catalogue-backed equipment" : "Vitrin ürün omurgası", numberOfItems: EQUIP_ROWS.length, itemListElement: itemListEl },
      { "@type": "FAQPage", mainEntity: faqSchema },
    ],
  };

  var ldEl = document.createElement("script");
  ldEl.type = "application/ld+json";
  ldEl.textContent = JSON.stringify(ld);
  document.head.appendChild(ldEl);

  var qs = new URLSearchParams({
    pfos_land: "1",
    meslek: meslekSlug,
    sehir: sehirSlug,
    konsept: konseptSlug,
    m2: m2token,
  });
  var wizardHref = (isEn ? "/en" : "") + "/pfos?" + qs.toString();

  var faqHtml = faqPairs
    .map(function (qa) {
      return (
        '<details><summary>' + esc(qa[0]) + '</summary><p class="eq-pfos-faq-a">' + esc(qa[1]) + "</p></details>"
      );
    })
    .join("");

  var relatedBlock =
    '<div class="eq-pfos-related"><strong>' +
    esc(isEn ? "Related GEO guides:" : "İlgili rehberler:") +
    "</strong> " +
    relatedGuides().join(", ") +
    "</div>";

  var dateLine = isEn ? "Last updated: 15 May 2026" : "Son güncelleme: 15 Mayıs 2026";

  var inner =
    '<div class="eq-pfos-seo-land__inner">' +
    '<span style="display:none" aria-hidden="true">' +
    eqSkPfos +
    "</span>" +
    "<h1>" +
    esc(h1) +
    "</h1>" +
    '<p class="eq-pfos-muted">' +
    esc(dateLine) +
    "</p>" +
    bodyTop +
    '<div class="eq-pfos-table-wrap">' +
    "<table class=\"eq-pfos-seo-table\" summary=\"" +
    esc(isEn ? "Backbone SKU links by department" : "Departmana göre omurga ürün linkleri") +
    '">' +
    "<thead><tr><th>" +
    esc(isEn ? "Lane" : "Hat") +
    "</th><th>" +
    esc(isEn ? "Catalogue example" : "Vitrin örneği") +
    "</th></tr></thead><tbody>" +
    tableRowsHtml +
    "</tbody></table></div>" +
    relatedBlock +
    '<section class="eq-pfos-faq" aria-label="FAQ"><h2>' +
    esc(isEn ? "Programmatic FAQ" : "Programatik SSS") +
    "</h2>" +
    faqHtml +
    "</section>" +
    '<p class="eq-pfos-cta-wrap"><a href="' +
    esc(wizardHref + "#pf-main") +
    "\" class=\"eq-pfos-seo-land__cta\">" +
    esc(isEn ? "Start this profile in Project Factory →" : "Bu projeyi başlat →") +
    "</a></p>" +
    "</div>";

  var land = document.createElement("section");
  land.id = "eq-pfos-seo-land";
  land.className = "eq-pfos-seo-land";
  land.setAttribute("aria-label", isEn ? "Programmatic PFOS landing" : "PFOS programatik hedef sayfası");

  land.innerHTML = inner;

  var style = document.createElement("style");
  style.textContent =
    ".eq-pfos-seo-land{background:#f4f6fa;border-bottom:1px solid #dde3ef;padding:22px 16px}" +
    ".eq-pfos-seo-land__inner{max-width:960px;margin:0 auto}" +
    ".eq-pfos-seo-land h1{font-size:clamp(1.2rem,2.5vw,1.45rem);margin:0 0 10px;color:#001e50}" +
    ".eq-pfos-muted{font-size:12px;color:#64748b;margin:0 0 14px}" +
    ".eq-pfos-seo-lead{font-size:15px;line-height:1.75;color:#1e293b;margin:0 0 16px}" +
    ".eq-pfos-seo-land p{font-size:14px;line-height:1.75;color:#334155;margin:0 0 14px}" +
    ".eq-pfos-seo-land h2{font-size:1.05rem;margin:22px 0 10px;color:#0f172a}" +
    ".eq-pfos-table-wrap{overflow:auto;border:1px solid #cbd5e1;border-radius:8px;background:#fff}" +
    ".eq-pfos-seo-table{width:100%;border-collapse:collapse;font-size:13px}" +
    ".eq-pfos-seo-table th,.eq-pfos-seo-table td{padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:left}" +
    ".eq-pfos-seo-table th{background:#f1f5f9;font-weight:600;color:#001e50}" +
    ".eq-pfos-seo-land__ul{margin:0 0 12px 18px;color:#334155;line-height:1.65}" +
    ".eq-pfos-related{font-size:13px;line-height:1.65;margin:18px 0;color:#334155}" +
    ".eq-pfos-related a{color:#001e50;font-weight:600;text-decoration:underline}" +
    ".eq-pfos-faq details{margin:8px 0;padding:8px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:6px}" +
    ".eq-pfos-faq summary{cursor:pointer;font-weight:600;color:#001e50}" +
    ".eq-pfos-faq-a{margin:8px 0 0;font-size:13px;line-height:1.65;color:#475569}" +
    ".eq-pfos-cta-wrap{margin-top:18px}" +
    ".eq-pfos-seo-land__cta{display:inline-block;font-weight:700;color:#001e50;padding:8px 0}";
  document.head.appendChild(style);

  var pg = document.querySelector(".pg");
  if (pg) pg.insertBefore(land, pg.firstChild);
})();
