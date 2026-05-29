/**
 * SEO / rehber sayfaları — eski site uzun metinleri (llms + PFOS şablonu).
 */
(function () {
  "use strict";

  var ORIGIN = "https://equsto.com";
  var DATA_URL = "/api/geo";
  var DATA_FALLBACK = "/data/geo-landings.json?v=20260530geo-no-table2";
  var DATA_EN_FALLBACK = "/data/geo-landings-en.json?v=20260530geo-no-table2";

  var UI = {
    tr: {
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
    loadScriptOnce("/eq-footer.js?v=20260530footer-letter1-word3");
    loadScriptOnce("/contact.js?v=20260522wa", true);
  }

  var PROFILES = {
    steakhouse: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Steakhouse",
      body: "<p>Yüksek ısı ızgara ve kuzine hatları steakhouse'un görünür performansını taşır. Gazlı ve elektrikli seçenekler saha tesisatına göre ayrılır; eşzamanlı porsiyon sayısı ocak yayılımını belirler. Isı geri kazanımı ve davlumbaz kapasitesi pişirme adediyle birlikte okunmalıdır. Ocak altı dolap ve tepsi rafları servis hızına göre konumlandırılır.</p><p>Pişirme ile muhafaza zonları fiziksel olarak ayrılır; yıkama hattı pik öğün yükünü taşıyacak kapasitede seçilir. Et hazırlık modülleri paslanmaz tezgah derinliği, et tahtası hijyen seti ve el yıkama noktalarıyla HACCP sırasına uyar. Hazırlık ile pişirme arası mesafe servis gecikmesini azaltır.</p><p>PFOS steakhouse profili menü, kapasite ve servis stili girdileriyle ön teklif listesini dakikalar içinde üretir. Öztiryakiler pişirme ve soğutma modülleri aynı vitrin akışında listelenir. Saha keşfi sonrası yerleşim Gastronomi Tasarımı ile derinleşir; montaj ve devreye alma proje takvimine göre fazlanır.</p><p>Steakhouse projelerinde açık mutfak ve kapalı mutfak ayrımı davlumbaz yükünü değiştirir; görünür ızgara hatları müşteri deneyimini güçlendirirken ek havalandırma kapasitesi gerektirir. Et dinlendirme alanı pişirme sonrası sıcaklık düşüşünü kontrollü yönetir; servis hattına yakın konumlandırma porsiyon hazırlık süresini kısaltır. Öztiryakiler kuzine ve ızgara modülleri mm ölçüleriyle vitrin kartlarında listelenir.</p><p>Enerji altyapısı steakhouse mutfağında kritik karar noktasıdır: gazlı hatlar yüksek ısı ihtiyacını karşılarken elektrikli alternatifler tesisat kısıtlı sahalarda devreye alınabilir. Yağ sıyırıcı kapasitesi fritöz ve ızgara adediyle orantılı seçilmeli; yangın güvenliği ve baca rotası proje başında netleştirilmelidir. PFOS çıktısı bu girdileri tek listede birleştirir.</p><p>Montaj fazları genellikle soğutma ve hazırlık zonlarından başlar; pişirme hatları tesisat doğrulaması sonrası kurulur. Devreye alma sürecinde sıcaklık kayıtları ve davlumbaz performans testi yapılır. Equsto satış mühendisliği sahada ekip yerleşimini proje numarası altında takip eder.</p><p>Ruhsat sürecinde steakhouse mutfağı için yağ sıyırıcı, yangın söndürme ve gaz dedektörü hatları proje dosyasına eklenir. Enerji tüketim profili ocak adediyle birlikte okunmalı; gece kapanış sonrası soğutma hatları sürekli çalışmaya devam eder. Ekipman garanti kayıtları devreye alma tutanağıyla birlikte açılır; servis yönlendirmesi bayii hattı üzerinden yürür.</p><p>Açık mutfaklı steakhouse projelerinde müşteri görüş alanı ızgara dumanını doğrudan etkiler; cam bariyer ve ek aspirasyon kapasitesi planlanmalıdır. Et dinlendirme süresi menü kartında belirtilen pişirme derecesiyle uyumlu tutulur.</p>",
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
      body: "<p>Vitrin soğutucu, yıkama hattı ve pastane modülleri menü profiline göre eklenir. Pastane ağırlıklı kafelerde fırın ve hazırlık modülleri ayrı zon oluşturur. Bar arkası kablo kanalı ve gaz bağlantıları güvenlik standartlarına uygun planlanır. Oturma kapasitesi ile paket oranı birlikte okunduğunda stok derinliği netleşir.</p><p>Kahve makinesi garantisi ve servis sözleşmesi devreye alma ile birlikte başlar. PFOS cafe konsepti bardak adedini, menü karmaşıklığını ve alan ölçüsünü sorarak modül adetlerini üretir. Soğutma zinciri denetiminde dijital termometreler sıcaklık kayıtlarını destekler.</p><p>Dar mutfaklı kafelerde dikey depolama ve modüler tezgahlar alan verimliliğini artırır. Hazırlık tezgahı altı depolama bardak ve kapak stoğunu taşır. Ön teklif ile kesin teklif arasındaki fark saha keşfi ve marka tercihidir; Equsto satış mühendisliği bu boşluğu kapatır.</p><p>2026 kafe açılışlarında su filtrasyonu ve basınç testi makine siparişinden önce tamamlanmalıdır. Canlı katalog fiyatları KDV hariç özetlenir; proje iskontoları teklif sırasında uygulanır. Montaj planı satış mühendisliği ile sahada yürütülür.</p><p>Kafe konseptinde kahve kalitesi kadar barista ergonomisi de makine seçimini etkiler; grup sayısı ve buhar wand konumu günlük servis yoğunluğuna göre belirlenir. Soğuk içecek hattı yaz aylarında kapasiteyi zorlar; buz makinesi ve soğutmalı stok dolapları birlikte planlanmalıdır. Pastane ürünleri fırın ve vitrin soğutucu ihtiyacını artırır.</p><p>Elektrik yükü espresso makinesi, fırın ve soğutma gruplarının toplamından oluşur; pano kapasitesi proje başında doğrulanmalıdır. Atık su ve yağ yönetimi kafe mutfağında sık göz ardı edilen ama ruhsat sürecinde zorunlu kalemlerdir. PFOS cafe profili bu modülleri menü ve kapasite girdileriyle adetlendirir.</p><p>Kafe açılış takviminde makine teslimatı ile tesisat işleri paralel yürütülür; su filtrasyonu ve basınç testi makine kurulumundan önce tamamlanmalıdır. Bar arkası depolama bardak, süt ve şurup stoğunu taşır. Equsto canlı katalog fiyatları KDV hariç özetlenir; proje iskontoları teklif aşamasında uygulanır.</p><p>Kafe açılışında müşteri akışı ile barista hareket alanı çakışmamalı; kasa, vitrin ve hazırlık zonları servis koridorunu daraltmamalıdır. Atık geri dönüşüm ve kahve telvesi yönetimi ruhsat dosyasında ayrı satır olarak planlanır. İlk ay operasyon verileri PFOS taslak listesini güncellemek için kullanılabilir.</p><p>Yaz sezonunda soğuk içecek ve buz tüketimi elektrik yükünü yükseltir; pano kapasitesi bu pik profille doğrulanmalıdır. Pastane ürünleri fırın ve vitrin soğutucu ihtiyacını birlikte artırır.</p>",
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
        "<p>Catering mutfağında yüksek hacimli pişirme, taşıma ekipmanları ve konveyörlü yıkama aynı senaryoda modellenir. Banket çıkışlarında sıcak holding süresi menü mühendisliğini belirler; soğuk zincir derinliği ürün portföyüne göre ayrılır. Pik kişi sayısı ve öğün aralığı ocak, soğutma ve yıkama adetlerini doğrudan etkiler.</p><p>Taşıma ekipmanları ve termobox kapasitesi sevkiyat planıyla birlikte okunmalıdır. Banket menüsünde glütensiz veya vejetaryen hat ayrımı ek modül gerektirebilir; PFOS menü profili güncellenerek yeniden hesaplanır. Sevkiyat saatleri mutfak üretim penceresiyle çakışmamalıdır.</p><p>Toplu yemek projelerinde yedek konveyör bant veya yedek pompa kurumsal sözleşmelerde tanımlanabilir. PFOS çıktısı ihale dosyasına eklenmeden önce satış mühendisliği onayı alınır. Soğuk zincir taşıma süresi menü güvenliğini belirler.</p><p>Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır; bulaşık hattı üretim hattı devreye alınmadan tamamlanmalıdır. Ekipman montajı üretim penceresine göre fazlanır. Saha keşfi montaj takviminin ilk adımıdır.</p><p>Equsto catering konsepti kişi sayısı, öğün profili ve menü girdileriyle tam ekipman listesini üretir. Öztiryakiler pişirme ve soğutma modülleri aynı teklif akışında yer alır. İstanbul referans projeleri yüksek hacim senaryolarını örnekler.</p><p>Catering mutfağında üretim penceresi dar olduğunda ekipman adetleri pik kişi sayısına göre fazlanır; sıcak banket modülleri ve taşıma arabaları aynı senaryoda modellenir. Soğuk zincir derinliği menüdeki salata, tatlı ve içecek payına göre ayrılır. Banket çıkışlarında holding süresi menü güvenliğini doğrudan etkiler.</p><p>Konveyörlü yıkama hattı pik dakikada darboğaz oluşturmamalı; bulaşık kapasitesi üretim hattı devreye alınmadan test edilmelidir. Termobox ve taşıma ekipmanları sevkiyat planıyla birlikte okunmalı; üretim ile sevkiyat saatleri çakışmamalıdır. PFOS catering konsepti kişi sayısı girdisiyle modül adetlerini hesaplar.</p><p>Kurumsal catering sözleşmelerinde yedek ekipman maddeleri tanımlanabilir; ihale dosyasına PFOS çıktısı satış mühendisliği onayından sonra eklenir. Montaj fazları üretim hattına göre planlanır. Equsto İstanbul referans projeleri yüksek hacim senaryolarını demonte vaka formatında anlatır.</p><p>Catering tesislerinde hijyen denetimi izlenebilirlik için sıcaklık kayıtları dijital ortamda arşivlenir. Üretim bandı ile paketleme bandı arasında bekletme süresi menü güvenliğini belirler; soğuk ürünler için blast chiller kapasitesi ayrı hesaplanır. Kurumsal müşteri sözleşmelerinde ekipman yedeklilik maddesi ihale dosyasına eklenebilir.</p><p>Banket öncesi prova gününde konveyörlü yıkama hattı pik yük altında test edilir. Taşıma arabası kapasitesi servis başlangıcından en az otuz dakika önce sahada hazır olmalıdır.</p>",
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
        "<p>Fast food hattında fritöz ve ızgara yoğunluğu, soğutma stok derinliği ile hızlı yıkama kritiktir. Menü karması ekipman adetlerini doğrudan etkiler; paket ağırlığı yükseldikçe hazırlık ve muhafaza modülleri artar. Servis süresi kısa olduğundan hat dizilimi paralel çalışır.</p><p>Sıcak holding ve soğuk stok aynı koridorda net ayrılır; tezgah yüksekliği ve ergonomi ekip verimini etkiler. Hızlı servis zincirlerinde standart modül seti PFOS şablonu olarak saklanır. Yeni şube açılışları aynı listeyi kopyalayıp kapasite girdisini günceller.</p><p>Paketleme istasyonu soğuk içecek ve sıcak ürün akışını ayırır. Kurye bekleme alanı mutfak çıkışına yakın planlanır. Ön teklif onayı franchise teknik şartnamesiyle karşılaştırılır.</p><p>PFOS fast food profili menü karması, günlük kapasite ve paket oranını sorarak modül adetlerini hesaplar. Davlumbaz kapasitesi fritöz ve ızgara adediyle birlikte okunmalıdır. Enerji yükü elektrik panosu boyutlandırmasını etkiler.</p><p>2026 fast food hatlarında fritöz ve ızgara yoğunluğu menü karmasıyla doğrudan orantılıdır. Canlı vitrin fiyatları KDV hariç özetlenir; proje iskontoları teklif sırasında uygulanır. Montaj ve devreye alma satış mühendisliği planıyla yürütülür.</p><p>Fast food mutfağında servis süresi kısa olduğundan hat dizilimi tamamen paralel çalışır; fritöz, ızgara ve hazırlık modülleri aynı koridorda net ayrılır. Paket ağırlığı yükseldikçe ambalajlama istasyonu ve soğuk stok derinliği artar. Kurye bekleme alanı mutfak çıkışına yakın planlanarak teslimat gecikmesi azaltılır.</p><p>Franchise teknik şartnamesi ile PFOS çıktısı karşılaştırılır; standart modül seti şube açılışlarında şablon olarak saklanır. Enerji yükü fritöz ve ızgara adediyle doğrudan orantılıdır; elektrik panosu boyutlandırması proje başında yapılmalıdır. Davlumbaz kapasitesi pişirme adediyle birlikte hesaplanır.</p><p>Hızlı servis zincirlerinde tezgah yüksekliği ve ergonomi ekip verimini etkiler; sıcak holding ve soğuk stok aynı hatta net sınırlandırılır. Montaj planı franchise açılış takvimine göre fazlanır. Equsto PFOS fast food profili menü karması ve günlük kapasite girdileriyle liste üretir.</p><p>Fast food şubelerinde dijital sipariş ekranı ile mutfak ekranı senkronizasyonu hat yoğunluğunu belirler. Gece temizliği için sökülebilir ocak ızgaraları ve yağ filtreleri bakım planına dahil edilir. Şube standardizasyonu PFOS şablon listesiyle korunur.</p><p>Paket menü ağırlığı arttıkça ambalajlama istasyonu genişler; kurye bekleme alanı mutfak çıkışına yakın konumlandırılır. Franchise teknik şartnamesi ile PFOS çıktısı karşılaştırılır.</p>",
      faq: [["Paket ağırlığı yüksekse?", "Soğutma ve hazırlık modülleri paket oranına göre artırılır."]],
      related: [{ label: "Bulut mutfak", href: "/bulut-mutfak-kurulumu" }],
    },
    finedining: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Fine dining",
      body:
        "<p>Fine dining mutfağında düşük porsiyon sıklığı geniş ocak yayılımı getirir. Bitirme, sos ve soğuk holding hatları servis stiline göre ayrılır; davlumbaz ve tezgah yüksekliği ekip ergonomisine göre planlanır. Steakhouse'a kıyasla dry-age ağırlığı düşük, dengeli pişirme ve hassas muhafaza öne çıkar.</p><p>Porsiyonlama ve sıcak tutma süreleri menü mühendisliğiyle uyumludur. Fine dining projelerinde şef brifingi ekipman listesini doğrular; PFOS taslağı bu brifingle güncellenir. Açık mutfak projelerinde ses ve koku yönetimi havalandırma tasarımına bağlıdır.</p><p>Işık planı teşhir ve pişirme zonlarını ayırır. Premium malzeme teslimatı montaj takvimine göre fazlanabilir. Gastronomi Tasarımı yerleşim çizimini derinleştirir; CAD planı sonraki aşamada eklenebilir.</p><p>Bitirme ve sos hatları servis stiline göre ayrılır; porsiyonlama ritmi ocak yayılımını etkiler. Soğuk holding ve sıcak tutma modülleri menüdeki hassasiyet derecesine göre seçilir. Yıkama hattı düşük hacimli ama yüksek hijyen standardında planlanır.</p><p>PFOS fine dining konsepti kapasite, menü ve servis stili girdileriyle ön teklif üretir. Öztiryakiler pişirme modülleri ve soğutma ekipmanları aynı vitrin akışında listelenir. Saha keşfi sonrası kesin liste satış mühendisliği onayıyla netleşir.</p><p>Fine dining mutfağında porsiyonlama hassasiyeti ocak yayılımını genişletir; bitirme, sos ve soğuk holding hatları servis stiline göre ayrılır. Steakhouse'a kıyasla dry-age ağırlığı düşük, dengeli pişirme ve hassas muhafaza öne çıkar. Açık mutfak projelerinde ses ve koku yönetimi havalandırma tasarımına bağlıdır.</p><p>Şef brifingi ekipman listesini doğrular; PFOS taslağı bu brifingle güncellenir. Işık planı teşhir ve pişirme zonlarını ayırır; premium malzeme teslimatı montaj takvimine göre fazlanabilir. Gastronomi Tasarımı yerleşim çizimini derinleştirir.</p><p>Yıkama hattı düşük hacimli ama yüksek hijyen standardında planlanır. Soğuk holding modülleri menüdeki hassasiyet derecesine göre seçilir. Equsto PFOS fine dining konsepti kapasite, menü ve servis stili girdileriyle ön teklif üretir.</p><p>Fine dining mutfaklarında mis en place alanı servis başlangıcından önce hazırlanır; sous-vide ve düşük sıcaklık pişirme modülleri ayrı elektrik hattı gerektirebilir. Şarap eşleştirmesi menüsü soğutma derinliğini etkiler. Misafir deneyimi odaklı işletmelerde sessiz yıkama tercih edilir.</p><p>Açık mutfak projelerinde ses seviyesi ve koku kontrolü havalandırma tasarımına bağlıdır. Premium malzeme teslimatı montaj takvimine göre fazlanabilir; şef brifingi ekipman listesini doğrular.</p>",
      faq: [["Steakhouse ile fark?", "Steakhouse dry-age ve yüksek ısı ızgara ağırlıklıdır; fine dining daha dengeli hatlar kullanır."]],
      related: [{ label: "Steakhouse rehberi", href: "/steakhouse-kurulumu" }],
    },
    bulut: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Bulut mutfak",
      body:
        "<p>Bulut mutfakta marka başına parsellenmiş sıcak ve soğuk hatlar ile ortak yıkama merkezi planlanır. Çok markalı senaryoda elektrik, havalandırma ve yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır. Parsel bazlı üretim akışı çapraz bulaşmayı azaltır.</p><p>Ortak depo ve sevkiyat alanı markalar arasında net sınırlandırılır. Paket oranı yüksek markalarda hazırlık modülleri ayrı tutulur. Çok markalı tesiste ortak fire ve atık yönetimi sözleşmeyle netleşir.</p><p>PFOS her marka için ayrı modül satırı üretebilir; marka sayısı ve saha ölçüsü planın ilk girdileridir. Elektrik panosu marka toplam yüküne göre yeniden boyutlandırılır. Gece üretim profili ayrı senaryoda modellenir.</p><p>Kurye platformu entegrasyonu mutfak çıkış layoutunu etkiler. Yüksek paket oranı soğutma ve hazırlık modüllerini artırır. MEP kapasitesi ruhsat aşamasında erken doğrulanmalıdır.</p><p>Equsto bulut mutfak konsepti çok markalı çıkışı PFOS ile modellemek için kullanılır. Öztiryakiler pişirme ve soğutma modülleri marka başına adetlendirilir. Saha keşfi montaj takviminin temelidir.</p><p>Bulut mutfakta marka başına parsellenmiş sıcak-soğuk hatlar çapraz bulaşmayı azaltır; ortak yıkama merkezi tüm markaların pik yükünü taşıyacak kapasitede seçilir. Çok markalı senaryoda elektrik, havalandırma ve yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır. MEP koşulları ruhsat aşamasında erken doğrulanmalıdır.</p><p>Kurye platformu entegrasyonu mutfak çıkış layoutunu etkiler; yüksek paket oranı soğutma ve hazırlık modüllerini artırır. Markalar arası depo ve sevkiyat alanı net sınırlandırılmalı; ortak fire ve atık yönetimi sözleşmeyle netleşir. Gece üretim profili ayrı senaryoda modellenir.</p><p>PFOS her marka için ayrı modül satırı üretebilir; marka sayısı ve saha ölçüsü planın ilk girdileridir. Elektrik panosu marka toplam yüküne göre yeniden boyutlandırılır. Equsto bulut mutfak konsepti çok markalı çıkışı PFOS ile modellemek için kullanılır.</p><p>Bulut mutfaklarda marka kimliği görünmez; paket ve termal torba standardizasyonu marka başına ayrı stok alanı gerektirir. Ruhsat sahibi ile marka kiracı arasındaki sözleşme ekipman sorumluluğunu netleştirir. Ortak soğuk oda kullanımında erişim logları tutulması önerilir.</p><p>Kurye toplama noktası ile üretim çıkışı arasında sıcaklık kaybını önleyen bekleme rafı planlanır. Gece vardiyası gürültü sınırı komşu birimlerle sözleşmede netleştirilir.</p>",
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
        "<p>All day dining ve otel mutfağında kahvaltı, öğle ve akşam döngüsü aynı ekipmanı farklı yüklerle kullanır. Kahve istasyonu, sıcak hat ve soğuk stok gün boyu paralel yürür; banket çıkışlarında kapasite kısa sürede yükselir. Öğün profili soğutma derinliğini ve yıkama hızını belirler.</p><p>Oda servisi ve açık büfe aynı mutfakta farklı ekipman yoğunluğu oluşturabilir. Kahvaltı piki yıkama ve kahve hatlarını belirler. Otel yenileme projelerinde eski ekipman sökümü montaj planına dahil edilir.</p><p>Kahvaltı büfe teşhir uzunluğu soğutucu adedini artırır. Gece mini bar replenishment soğutma stok derinliğini etkiler. Banket hafta sonu pikleri geçici personel ve ekipman rezervi gerektirebilir.</p><p>PFOS otel konsepti kişi sayısı, otel segmenti ve öğün profili girdileriyle liste üretir. All day dining rehberi ile örtüşen senaryolar aynı PFOS akışındadır. Bar Design Studio lounge bar entegrasyonunu planlar.</p><p>2026 otel ve all day dining projelerinde öğün profili soğutma derinliğini etkiler. Canlı vitrin fiyatları KDV hariç özetlenir. Montaj ve devreye alma proje fazlarına göre yürütülür.</p><p>Otel mutfağında kahvaltı piki yıkama ve kahve hatlarını belirler; banket çıkışları kısa sürede kapasiteyi yükseltir. Oda servisi ve açık büfe aynı mutfakta farklı ekipman yoğunluğu oluşturur. Öğün profili soğutma derinliğini ve yıkama hızını belirler.</p><p>Otel yenileme projelerinde eski ekipman sökümü montaj planına dahil edilir. Kahvaltı büfe teşhir uzunluğu soğutucu adedini artırır; gece mini bar replenishment soğutma stok derinliğini etkiler. Banket hafta sonu pikleri geçici personel ve ekipman rezervi gerektirebilir.</p><p>PFOS otel konsepti kişi sayısı, otel segmenti ve öğün profili girdileriyle liste üretir. Bar Design Studio lounge bar entegrasyonunu planlar. Equsto all day dining rehberi ile örtüşen senaryolar aynı PFOS akışındadır.</p><p>Otel mutfaklarında room service arabası kapasitesi oda sayısıyla orantılı planlanır. Spa ve wellness menüsü sağlıklı atıştırmalık hattı ekler. Mevsimsel menü değişiminde soğutma ve depo modülleri yeniden dengelenir.</p><p>Yaz açık büfe profili kış profilinden farklı ekipman yoğunluğu oluşturur. Banket hafta sonu pikleri geçici personel ve ekipman rezervi gerektirebilir.</p><p>Lounge bar entegrasyonu otel lobisinde ayrı modül seti gerektirebilir; Bar Design Studio bu hattı PFOS otel profiliyle birlikte planlar. Gece mini bar replenishment soğutma stok derinliğini artırır.</p>",
      faq: [["Otel mutfağı ile ortak mı?", "Evet — PFOS’ta otel / all day dining konseptleri benzer hatları paylaşır."]],
      related: [{ label: "Catering rehberi", href: "/catering-mutfagi" }],
    },
    marketKasap: {
      skipBudget: true,

      budget: null,

      pfosKonu: "Market reyonu",
      body:
        
        
        
        
        "<p>Market kurulumunda müşteri yolculuğu reyondan başlar. Dondurulmuş ada, soğutmalı gondol ve kasap bankosu aynı koridorda dizilir; hazırlık ve depo arkada ayrılır. Kasap hattında kıyma, dilimleme ve vitrin sergisi farklı zonlardadır.</p><p>Hijyen zonları kasap hazırlık hattında et tahtası, el yıkama ve hızlı yıkama modülleriyle tamamlanır. Market reyonu yenilemede müşteri trafiği geçici yönlendirme gerektirir. PFOS reyon uzunluğu girdisi güncellenir.</p><p>Kasap vitrin sergisi günlük kesim planıyla uyumlu olmalıdır. Şarküteri peynir humidor ihtiyacı ayrı modül gerektirir. Soğutma zinciri alarm sistemi kurumsal market standardına uyar.</p><p>2026 market projelerinde reyon genişliği soğutucu adedini belirler. Dondurulmuş ada ile soğutmalı gondol arasındaki mesafe müşteri akışını düzenler. Hazırlık zonu reyonun arkasında gizlenir.</p><p>Equsto market kasap konsepti reyon uzunluğu ve ürün portföyü girdileriyle liste üretir. Öztiryakiler soğutma modülleri vitrin akışında listelenir. Teklif özeti satış mühendisliği onayıyla kesinleşir.</p><p>Market reyonunda müşteri yolculuğu dondurulmuş adadan kasap bankosuna kadar kesintisiz planlanır; hazırlık ve depo zonları reyonun arkasında gizlenir. Kasap hattında kıyma, dilimleme ve vitrin sergisi farklı zonlardadır. Hijyen zonları et tahtası, el yıkama ve hızlı yıkama modülleriyle tamamlanır.</p><p>Market reyonu yenilemede müşteri trafiği geçici yönlendirme gerektirir; PFOS reyon uzunluğu girdisi güncellenir. Kasap vitrin sergisi günlük kesim planıyla uyumlu olmalıdır. Şarküteri peynir humidor ihtiyacı ayrı modül gerektirir.</p><p>Soğutma zinciri alarm sistemi kurumsal market standardına uyar. 2026 market projelerinde reyon genişliği soğutucu adedini belirler. Equsto market kasap konsepti reyon uzunluğu ve ürün portföyü girdileriyle liste üretir.</p><p>Perakende reyon projelerinde soğutma ve dondurma adalarının enerji yükü gece doldurma saatlerine göre planlanır. Kasap hazırlık hattı ile müşteri vitrin arasındaki mesafe HACCP akışını belirler. PFOS market konsepti reyon metrajını girdi olarak alır; satış mühendisliği kesin listeyi onaylar.</p><p>Market reyonlarında enerji maliyeti gece doldurma saatlerinde soğutucu gruplarının sıralı devreye alınmasıyla düşürülebilir. Kasap personeli ergonomisi için tezgah yüksekliği standartlaştırılır. Şarküteri reyonunda nem kontrollü vitrin peynir ve salam grubu için ayrıdır.</p><p>Perakende reyon projelerinde dondurma adalarının enerji yükü gece doldurma saatlerine göre planlanır. Kasap hazırlık hattı ile müşteri vitrin arasındaki mesafe HACCP akışını belirler.</p>",
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
        "<p>Equsto referans sayfaları demonte vaka anlatımı sunar: proje yaşam döngüsü, zorunluluklar ve ekipman mantığı şeffaf biçimde okunur. Gerçek müşteri fotoğrafı ve alıntılar yayın sürecinde pekiştirilir; sayfalar satılabilir paket değildir.</p><p>Her vaka canlı katalog modüllerine köprü kurar; teklif Proje Fabrikası veya iletişim hattıyla netleşir. Demonte anlatım saha koşullarını örnekler, kesin liste projeye özel üretilir. Hub okuyucusu PFOS veya iletişim kanalına yönlendirilir.</p><p>Vaka güncellemeleri yeni vitrin fiyatlarıyla senkronize edilir. Teknik sorular satış mühendisliğine iletilir. Referans listesi demonte formatını korur; satılabilir paket iddiası taşınmaz.</p><p>İstanbul catering ve İzmir modüler bar örnekleri dizinden erişilir. PFOS aynı mantığı canlı listeye dönüştürür. Fotoğraf ve alıntılar yayın sürecinde güncellenir.</p><p>2026 referans sayfaları proje yaşam döngüsünü şeffaf biçimde anlatır. Kesin ekipman listesi PFOS ile üretilir. Montaj ve devreye alma proje takvimine göre fazlanır.</p><p>Equsto referans sayfaları demonte vaka anlatımı sunar: proje yaşam döngüsü, zorunluluklar ve ekipman mantığı şeffaf biçimde okunur. Gerçek müşteri fotoğrafı ve alıntılar yayın sürecinde pekiştirilir; sayfalar satılabilir paket değildir. Hub okuyucusu PFOS veya iletişim kanalına yönlendirilir.</p><p>Vaka güncellemeleri yeni vitrin fiyatlarıyla senkronize edilir. İstanbul catering ve İzmir modüler bar örnekleri dizinden erişilir. PFOS aynı mantığı canlı listeye dönüştürür; kesin ekipman listesi projeye özel üretilir.</p><p>Referans listesi demonte formatını korur; satılabilir paket iddiası taşınmaz. Teknik sorular satış mühendisliğine iletilir. Montaj ve devreye alma proje takvimine göre fazlanır.</p><p>Referans hub okuyucusuna proje numarası, konsept kodu ve kapasite girdilerini hazırlayarak PFOS'a geçmesi önerilir. Demonte vakalar gerçek müşteri adı taşımadan anlatılır; teknik detaylar satış mühendisliği brifinginde derinleşir. Yeni vaka yayınları sitemap güncellemesiyle eş zamanlı yapılır.</p><p>Hub sayfaları satılabilir paket iddiası taşımaz; ekipman mantığı şeffaf biçimde okunur. Teknik sorular satış mühendisliğine iletilir; kesin liste projeye özel üretilir.</p><p>Hub ziyaretçisi konsept rehberini okuduktan sonra PFOS'ta aynı profil kodunu seçerek canlı listeye geçebilir. Demonte vakalar saha koşullarını örnekler; fotoğraf ve alıntılar yayın sürecinde güncellenir. Teknik sorular satış mühendisliğine iletilir.</p><p>Montaj ve devreye alma proje takvimine göre fazlanır; hub okuyucusu iletişim kanalı üzerinden özel içerik talep edebilir.</p>",
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
        "<p>İstanbul yüksek hacim catering demode diziliminde sıcak banket, yüksek kapasiteli pişirme ve konveyörlü yıkama aynı senaryoda modellenir. Toplu yemek ve banket çıkışlarında pik dakika yıkama hızını belirler. Cephe kapasitesi ve baca kuyusu netleştirilmeden sipariş risklidir.</p><p>Saha ölçüsü önce alınır; taşıma ve termobox ihtiyacı sevkiyat planıyla birlikte değerlendirilir. İstanbul catering demode baca ve cephe kısıtını örnekler. PFOS aynı kapasite profiliyle tekrarlanabilir.</p><p>Sevkiyat trafiği üretim penceresini daraltabilir; plan buna göre fazlanır. Pik banket provası devreye almanın parçasıdır. Yoğun şehir içi cateringde MEP koşulları erken doğrulanmalıdır.</p><p>Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır. Ekipman montajı üretim hattı devreye alınmadan tamamlanmalıdır. PFOS Catering konsepti ve şehir seçimiyle canlı listeye dönüşür.</p><p>Equsto İstanbul referans projesi yüksek hacim senaryolarını demonte vaka formatında anlatır. Öztiryakiler pişirme ve yıkama modülleri aynı teklif akışında yer alır. Saha keşfi montaj takviminin ilk adımıdır.</p><p>İstanbul yüksek hacim catering demode diziliminde sıcak banket, yüksek kapasiteli pişirme ve konveyörlü yıkama aynı senaryoda modellenir. Cephe kapasitesi ve baca kuyusu netleştirilmeden sipariş risklidir; saha ölçüsü önce alınır. Yoğun şehir içi cateringde MEP koşulları erken doğrulanmalıdır.</p><p>Sevkiyat trafiği üretim penceresini daraltabilir; plan buna göre fazlanır. Pik banket provası devreye almanın parçasıdır. Taşıma ve termobox ihtiyacı sevkiyat planıyla birlikte değerlendirilir.</p><p>PFOS Catering konsepti ve şehir seçimiyle canlı listeye dönüşür. Equsto İstanbul referans projesi yüksek hacim senaryolarını demonte vaka formatında anlatır. Montaj planı satış mühendisliği ile yürütülür.</p><p>İstanbul pilotunda yoğun trafik sevkiyat penceresini daraltır; üretim planı sabah erken ve gece geç vardiya senaryolarını kapsayabilir. Baca ve cephe izni süreci ekipman sipariş takviminden önce tamamlanmalıdır. Pik banket provası yıkama hattı kapasitesini sahada doğrular.</p><p>Yoğun şehir içi cateringde MEP koşulları erken doğrulanmalıdır. Taşıma ve termobox ihtiyacı sevkiyat planıyla birlikte değerlendirilir.</p><p>Demode dizilimde konveyörlü yıkama hattı pik banket provasında yük testi altına alınır. Cephe kapasitesi ve baca kuyusu netleştirilmeden sipariş risklidir; saha ölçüsü önce alınır. PFOS Catering konseptiyle canlı listeye dönüşür.</p><p>Montaj planı satış mühendisliği ile yürütülür; Equsto İstanbul referans projesi demonte vaka formatında anlatılır.</p>",
      faq: [["Canlı teklif?", "PFOS’ta Catering + İstanbul şehir seçimiyle sihirbazı açın."]],
      related: [{ label: "Tüm projeler", href: "/projeler" }],
    },
    projeIzmir: {
      skipBudget: true,

      budget: null,
      body:
        "<p>İzmir modüler bar ve içecek demode diziliminde Besos modülleri ile içecek ekipmanları aynı saha projesinde hizalanır. Vitrum Group menşeli bar çözümleri Bar Design Studio altında listelenir; servis akışı modül seçimini belirler.</p><p>Soğutmalı içecek hattı, kahve ve hazırlık modülleri bar ölçüsüne göre parsellenir. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır. İzmir modüler bar demode su ve elektrik noktalarını örnekler.</p><p>Bar açılış haftası montaj ve eğitim yoğunluğu yaratır. PFOS bar konseptiyle liste yenilenir. İçecek ve kahve modülleri aynı garanti hattında kayıt altına alınır.</p><p>Besos vitrininde kırk iki modül örneği bulunur. Bar ölçüsü modül parsellemesini belirler. Modül yüksekliği ve tezgah derinliği servis personeli ergonomisine göre ayarlanır.</p><p>Equsto İzmir referans projesi modüler bar senaryolarını demonte vaka formatında anlatır. Tam dizilim Proje Fabrikası veya Besos sayfası üzerinden planlanır. Montaj planı satış mühendisliği ile yürütülür.</p><p>İzmir modüler bar demode diziliminde Besos modülleri ile içecek ekipmanları aynı saha projesinde hizalanır. Vitrum Group menşeli bar çözümleri Bar Design Studio altında listelenir. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır.</p><p>Bar açılış haftası montaj ve eğitim yoğunluğu yaratır. Besos vitrininde kırk iki modül örneği bulunur; bar ölçüsü modül parsellemesini belirler. İçecek ve kahve modülleri aynı garanti hattında kayıt altına alınır.</p><p>Equsto İzmir referans projesi modüler bar senaryolarını demonte vaka formatında anlatır. Tam dizilim Proje Fabrikası veya Besos sayfası üzerinden planlanır. Montaj planı satış mühendisliği ile yürütülür.</p><p>İzmir bar demode projesinde sahil nem koşulu paslanmaz yüzey seçimini etkiler. Modül montajı sırasında su sızıntı testi yapılır. Bar personeli eğitimi devreye alma haftasında Besos teknik ekibiyle koordine edilir.</p><p>Elektrik ve su noktaları modül yerleşiminden önce doğrulanır. Bar açılış haftası montaj ve eğitim yoğunluğu yaratır.</p><p>Modüler bar demode projesinde içecek ve kahve modülleri aynı garanti kaydı altında devreye alınır. Besos vitrininde kırk iki örnek modül listelenir; bar ölçüsü modül parsellemesini belirler. Tam dizilim Proje Fabrikası üzerinden planlanır.</p><p>Montaj planı satış mühendisliği ile yürütülür; İzmir modüler bar demode su ve elektrik noktalarını örnekler.</p>",
      faq: [["Bar modülleri nerede?", "/besos vitrininde 42 modül listelenir."]],
      related: [
        { label: "Bar Design (Besos)", href: "/besos" },
        { label: "İçecek vitrini", href: "/shop/icecek" },
      ],
    },
    rehberM2: {
      skipBudget: true,

      budget: null,
      body: "<p>Kişi başı mutfak metrekare planlamasında servis stili belirleyicidir: oturma, paket ve banket aynı metrekareyi farklı kullanır. Yoğun paket oranı soğutma derinliğini artırır; oturma ağırlıklı işletmede sıcak tutma süreleri öne çıkar. Alan hesabında servis hızı, menü karmaşıklığı ve eşzamanlı üretim dikkate alınır.</p><p>Dar mutfaklarda dikey depolama ve modüler tezgahlar tercih edilir. Metrekare planı depo ve yıkama alanını içermelidir. PFOS alan sorusu planı otomatikler.</p><p>2026 kapasite varsayımları oturma, paket ve banket senaryolarını ayrı okur. Kişi başı metrekare rehberi footer ve sitemap üzerinden erişilir. Rehber 2026 kapasite varsayımlarıyla güncellenir.</p><p>Servis stili değiştikçe ocak yayılımı ve soğutma adedi farklılaşır. Banket ağırlıklı işletmelerde taşıma ekipmanları alan planına dahil edilmelidir. Yıkama zonu genellikle göz ardı edilen ama kritik alandır.</p><p>PFOS alan ve kişi sayısı soruları aynı mantığı otomatikler. Equsto satış mühendisliği dar mutfak çözümlerinde modüler tezgah önerir. Kesin liste proje girdileriyle üretilir.</p><p>Kişi başı mutfak metrekare planlamasında servis stili belirleyicidir: oturma, paket ve banket aynı metrekareyi farklı kullanır. Yoğun paket oranı soğutma derinliğini artırır; oturma ağırlıklı işletmede sıcak tutma süreleri öne çıkar. Alan hesabında servis hızı, menü karmaşıklığı ve eşzamanlı üretim dikkate alınır.</p><p>Dar mutfaklarda dikey depolama ve modüler tezgahlar tercih edilir. Metrekare planı depo ve yıkama alanını içermelidir; yıkama zonu genellikle göz ardı edilen ama kritik alandır. PFOS alan sorusu planı otomatikler.</p><p>2026 kapasite varsayımları oturma, paket ve banket senaryolarını ayrı okur. Equsto satış mühendisliği dar mutfak çözümlerinde modüler tezgah önerir. Kesin liste proje girdileriyle üretilir.</p><p>Metrekare hesabında personel sirkülasyon koridoru ve mal kabul alanı mutfak brüt alanına dahil edilmelidir. Yükleme kapasitesi servis asansörü varlığına bağlıdır. PFOS alan sorusu bu rehberdeki varsayımlarla uyumludur.</p><p>Oturma, paket ve banket senaryoları aynı metrekareyi farklı kullanır; yoğun paket oranı soğutma derinliğini artırır. Dar mutfaklarda dikey depolama tercih edilir.</p><p>Banket ağırlıklı işletmelerde taşıma ekipmanları alan planına dahil edilmelidir. Yıkama zonu genellikle göz ardı edilen ama kritik alandır. 2026 kapasite varsayımları oturma, paket ve banket senaryolarını ayrı okur.</p>",
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
        "<p>Türkiye'de endüstriyel mutfak ekipmanı arayan işletmeler için Equsto; pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanlarında canlı katalog ve satış mühendisliği sunar. Restoran, otel, kafe ve bulut mutfak aynı akışta modellenir. Öztiryakiler yetkili bayii kanalı ve seçili global markalar aynı sepet ve teklif akışında birleşir.</p><p>Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır. PFOS ile liste genişletilir. Türkiye endüstriyel mutfak aramasında Equsto katalog ve PFOS birleşir.</p><p>İhracat iletişim hattı lojistik sorularını yanıtlar. Satış mühendisliği onayı zorunludur. GEO sayfaları konsept derinliği sağlar; vitrin doğrudan alışveriş akışıdır.</p><p>2026 endüstriyel mutfak aramalarında tüm departmanlar tek vitrinde listelenir. Canlı katalog fiyat ve stok doğrular. Hizmet bölgeleri Türkiye ve seçili ihracat pazarlarını kapsar.</p><p>Equsto B2B endüstriyel mutfak tedarik platformu restoran, otel ve catering projelerini aynı akışta yönetir. Proje Fabrikası teklif özeti üretir. Montaj ve devreye alma proje planında yürür.</p><p>Türkiye'de endüstriyel mutfak ekipmanı arayan işletmeler için Equsto pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanlarında canlı katalog sunar. Restoran, otel, kafe ve bulut mutfak aynı akışta modellenir. Öztiryakiler yetkili bayii kanalı resmi fiyat listesi ve garanti hattını kapsar.</p><p>Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır. İhracat iletişim hattı lojistik sorularını yanıtlar. 2026 endüstriyel mutfak aramalarında tüm departmanlar tek vitrinde listelenir.</p><p>Equsto B2B endüstriyel mutfak tedarik platformu restoran, otel ve catering projelerini aynı akışta yönetir. PFOS teklif özeti üretir. Hizmet bölgeleri Türkiye ve seçili ihracat pazarlarını kapsar.</p><p>Türkiye genelinde lojistik hub'ları İstanbul, Ankara ve İzmir çıkışlı sevkiyat planına bağlanır. Kurumsal alıcılar için vade ve proje iskontosu teklif dosyasında ayrı satır olarak gösterilir. Canlı stok doğrulaması sipariş öncesi yapılır.</p><p>Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır. İhracat iletişim hattı lojistik sorularını yanıtlar.</p><p>GEO sayfaları konsept derinliği sağlar; vitrin doğrudan alışveriş akışıdır. Hizmet bölgeleri Türkiye ve seçili ihracat pazarlarını kapsar. Montaj ve devreye alma proje planında yürütülür.</p><p>Equsto B2B endüstriyel mutfak tedarik platformu restoran, otel ve catering projelerini aynı akışta yönetir.</p>",
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
        "<p>Restoran mutfak teklifi için menü, kapasite ve servis stili girilir; PFOS sıcak, soğutma ve yıkama adetlerini kural setiyle üretir. Teklif özeti KDV ve lojistik kalemlerini içerir; nihai tutar satış mühendisliği onayıyla kesinleşir. İlk aşamada kapasite ve konsept yeterlidir.</p><p>Yerleşim Gastronomi Tasarımı ile derinleşir; CAD plan sonraki adımda eklenebilir. Hedef süre yaklaşık beş dakikadır. Çıktı ön teklif dosyası olarak kullanılır.</p><p>Restoran teklif PFOS menü, kapasite ve servis girdileriyle üretilir. Sıcak-soğuk-yıkama adetleri kural motoruyla belirlenir. Checklist rehberi saha toplantısında manuel kontrol sağlar.</p><p>2026 restoran tekliflerinde KDV ve lojistik kalemleri özet dosyada yer alır. Onay sonrası sipariş süreci başlar. Marka tercihi teklif dosyasına yansır.</p><p>Equsto restoran teklif akışı B2B endüstriyel mutfak tedarikidir. PFOS taslak listesi satış mühendisliği onayı sonrası kesinleşir. Montaj planı proje takvimine göre hazırlanır.</p><p>Restoran mutfak teklifi menü, kapasite ve servis stili girdileriyle PFOS kural setinde modellenir. Teklif özeti KDV ve lojistik kalemlerini içerir; hedef süre yaklaşık beş dakikadır. İlk aşamada kapasite ve konsept yeterlidir.</p><p>Yerleşim Gastronomi Tasarımı ile derinleşir; CAD plan sonraki adımda eklenebilir. Checklist rehberi saha toplantısında manuel kontrol sağlar. Onay sonrası sipariş süreci başlar.</p><p>Equsto restoran teklif akışı B2B endüstriyel mutfak tedarikidir. PFOS taslak listesi satış mühendisliği onayı sonrası kesinleşir. Montaj planı proje takvimine göre hazırlanır.</p><p>Restoran teklif dosyasında montaj, nakliye ve devreye alma kalemleri ayrı bölümde sunulur. Menü revizyonu sonrası PFOS listesi yenilenir. Ön teklif PDF'si yatırımcı sunumuna doğrudan eklenebilir.</p><p>Hedef süre yaklaşık beş dakikadır; çıktı satış mühendisliği onayıyla kesinleşir. Yerleşim Gastronomi Tasarımı ile derinleşir.</p><p>Menü, kapasite ve servis stili PFOS kural setinin temel girdileridir. Checklist rehberi saha toplantısında manuel kontrol sağlar. Onay sonrası sipariş süreci başlar; montaj planı proje takvimine göre hazırlanır.</p><p>Equsto restoran teklif akışı B2B endüstriyel mutfak tedarikidir; PFOS taslak listesi satış mühendisliği onayı sonrası kesinleşir. Montaj planı proje takvimine göre hazırlanır.</p><p>KDV ve lojistik kalemleri özet dosyada yer alır. İlk aşamada kapasite ve konsept yeterlidir; CAD plan sonraki adımda eklenebilir.</p>",
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
        "<p>Otel mutfak ekipman tedarikinde kahvaltı, öğle ve akşam döngüsü ile banket çıkışları aynı hatları farklı yüklerle kullanır. Gün boyu servis soğutma derinliğini ve yıkama kapasitesini artırır. Oda servisi, açık büfe ve balo menüleri aynı mutfakta farklı ekipman yoğunluğu oluşturur.</p><p>Kahve ve sıcak içecek hatları kahvaltı pikinde kritik rol oynar. All day dining rehberi ile örtüşen senaryolar PFOS'ta modellenir. Otel mutfak teklifi kahvaltı, banket ve oda servisi yüklerini birleştirir.</p><p>PFOS otel konseptiyle modellenir. Bar Design Studio lounge bar entegrasyonunu planlar. Kahvaltı piki kahve ve yıkama hatlarını belirler.</p><p>2026 otel tedarik dosyalarında banket çıkışları kapasiteyi yükseltir. Otel yenileme projelerinde eski ekipman sökümü montaj planına dahil edilir. Canlı vitrin fiyatları KDV hariç özetlenir.</p><p>Equsto otel mutfak tedarik akışı PFOS otel profiliyle liste üretir. Öztiryakiler pişirme ve soğutma modülleri aynı teklif akışında yer alır. Montaj ve devreye alma proje fazlarına göre yürütülür.</p><p>Otel mutfak tedarikinde kahvaltı, öğle ve akşam döngüsü ile banket çıkışları aynı hatları farklı yüklerle kullanır. Oda servisi, açık büfe ve balo menüleri farklı ekipman yoğunluğu oluşturur. Kahvaltı piki kahve ve yıkama hatlarını belirler.</p><p>PFOS otel konseptiyle modellenir. Bar Design Studio lounge bar entegrasyonunu planlar. Otel yenileme projelerinde eski ekipman sökümü montaj planına dahil edilir.</p><p>Equsto otel mutfak tedarik akışı PFOS otel profiliyle liste üretir. 2026 otel tedarik dosyalarında banket çıkışları kapasiteyi yükseltir. Montaj ve devreye alma proje fazlarına göre yürütülür.</p><p>Otel mutfak tedarikinde balo ve toplantı salonu banket çıkışları ana mutfaktan bağımsız holding kapasitesi gerektirebilir. Mini bar replenishment soğutma stok derinliğini artırır. Otel zinciri standart modül seti PFOS şablonu olarak saklanır.</p><p>Kahvaltı piki kahve ve yıkama hatlarını belirler. Otel yenileme projelerinde eski ekipman sökümü montaj planına dahil edilir.</p><p>All day dining rehberi ile örtüşen senaryolar aynı PFOS otel akışındadır. Kahvaltı büfe teşhir uzunluğu soğutucu adedini artırır. Öztiryakiler pişirme ve soğutma modülleri aynı teklif akışında yer alır.</p><p>Equsto otel mutfak tedarik akışı PFOS otel profiliyle liste üretir; montaj ve devreye alma proje fazlarına göre yürütülür.</p>",
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
        "<p>Öztiryakiler ekipmanı Equsto kataloğunda pişirme, soğutma, yıkama ve hazırlık departmanlarında listelenir. Yetkili bayii ilişkisi resmi fiyat listesi ve garanti hattını kapsar; canlı kur EUR ve TL'ye uygulanır. Atalay ve seçili markalar aynı katalogda yer alır.</p><p>Öztiryakiler ana omurgadır. Teknik ölçüler mm cinsinden ürün kartlarında okunur. Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır.</p><p>Öztiryakiler yetkili bayii Equsto üzerinden listelenir. PFOS modül adetlerini üretir. Garanti bayii süreciyle uyumludur.</p><p>2026 katalogda teknik ölçüler mm cinsinden ürün kartlarında okunur. Canlı vitrin fiyatları KDV hariç özetlenir. Proje iskontoları teklif sırasında uygulanır.</p><p>Equsto Öztiryakiler bayii kanalı resmi fiyat sunar. PFOS ile liste genişletilir. Satış mühendisliği onayı kesin fiyatı belirler.</p><p>Öztiryakiler ekipmanı Equsto kataloğunda pişirme, soğutma, yıkama ve hazırlık departmanlarında listelenir. Yetkili bayii ilişkisi resmi fiyat listesi, garanti hattı ve servis yönlendirmesini kapsar. Canlı kur EUR ve TL'ye uygulanır.</p><p>Atalay ve seçili markalar aynı katalogda yer alır; Öztiryakiler ana omurgadır. Teknik ölçüler mm cinsinden ürün kartlarında okunur. Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır.</p><p>PFOS modül adetlerini üretir; garanti bayii süreciyle uyumludur. 2026 katalogda canlı vitrin fiyatları KDV hariç özetlenir. Equsto Öztiryakiler bayii kanalı resmi fiyat sunar.</p><p>Öztiryakiler ürün kartlarında CE işareti, güç tüketimi ve net ağırlık satırları standarttır. Yedek parça siparişi garanti kaydı üzerinden yürütülür. Bayii fiyat listesi canlı kur ile günlük güncellenir.</p><p>Atalay ve seçili global markalar aynı katalogda tamamlayıcı modül sağlar. Tek ürün siparişi ile anahtar teslim proje aynı vitrin akışındadır.</p><p>PFOS modül adetlerini üretir; garanti bayii süreciyle uyumludur. Proje iskontoları teklif sırasında uygulanır. Satış mühendisliği onayı kesin fiyatı belirler; yedek parça siparişi garanti kaydı üzerinden yürütülür.</p><p>Equsto Öztiryakiler bayii kanalı resmi fiyat sunar; teknik ölçüler mm cinsinden ürün kartlarında okunur. Canlı vitrin fiyatları KDV hariç özetlenir; montaj planı satış mühendisliği ile yürütülür.</p><p>Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır. PFOS ile liste genişletilir; bayii servis hattı garanti kaydı ile aynı proje numarasında yürür.</p>",
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
        "<p>Soğuk oda teklifi için kapasite, ürün profili ve MEP koşulları birlikte değerlendirilir. Tezgah tipi ve dik tip modüller proje listesinde örneklenir; soğuk oda projeleri ayrı mühendislik hattıyla yürür. Menü ve hacim soğutma adedini belirler.</p><p>Şok dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır. Ön doğrulama satış mühendisliği ile yapılır. Soğuk oda kapasite ve MEP birlikte değerlendirilir.</p><p>PFOS soğutma modüllerini listeler. Ayrı mühendislik hattı büyük projelerde devreye girer. Soğuk zincir planlamasında menü ve hacim soğutma adedini belirler.</p><p>2026 soğuk zincir planlamasında menü ve hacim soğutma adedini belirler. Enerji yükü elektrik panosu boyutlandırmasını etkiler. Alarm sistemi kurumsal standarda uyar.</p><p>Equsto soğuk oda teklif akışı kapasite ve ürün profili girdileriyle liste üretir. Öztiryakiler soğutma modülleri vitrin akışında listelenir. Montaj planı satış mühendisliği ile yürütülür.</p><p>Soğuk oda teklifi kapasite, ürün profili ve MEP koşulları birlikte değerlendirilir. Tezgah tipi ve dik tip modüller proje listesinde örneklenir. Şok dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır.</p><p>Soğuk oda projeleri ayrı mühendislik hattıyla yürür. PFOS soğutma modüllerini listeler. Enerji yükü elektrik panosu boyutlandırmasını etkiler.</p><p>Equsto soğuk oda teklif akışı kapasite ve ürün profili girdileriyle liste üretir. Alarm sistemi kurumsal standarda uyar. Montaj planı satış mühendisliği ile yürütülür.</p><p>Soğuk oda projelerinde panel kalınlığı ve oda hacmi birlikte hesaplanır. Kapı sayısı ısı köprüsünü artırır; sık açılan kapılar için hızlı açılır kapı önerilir. Dijital sıcaklık kaydı denetim dosyasına aktarılabilir.</p><p>Şok dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır. Büyük projelerde ayrı mühendislik hattı devreye girer.</p><p>Ön doğrulama satış mühendisliği ile yapılır. Alarm sistemi kurumsal standarda uyar; enerji yükü pano boyutlandırmasını etkiler. Equsto soğuk oda teklif akışı kapasite ve ürün profili girdileriyle liste üretir.</p><p>Menü hacmi soğutma adedini belirler; tezgah tipi modüller proje listesinde örneklenir. Montaj planı satış mühendisliği ile yürütülür.</p><p>Soğuk oda projeleri ayrı mühendislik hattıyla yürür. PFOS soğutma modüllerini listeler; büyük projelerde kapasite ve MEP birlikte değerlendirilir.</p><p>Şok dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır; teklif özeti satış mühendisliği onayıyla kesinleşir.</p>",
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
        "<p>Havuzlu tezgah tipi dolap seçiminde dış ölçü, GN uyumu ve kapasite vitrin kartında listelenir. Hazırlık ve servis hattına göre adet ve derinlik değişir; mm cinsinden teknik ölçü satırı ürün detayında bulunur. Tezgah altı ve tezgah üstü modeller aynı hatta birlikte planlanır.</p><p>Enerji ve soğutma tipi saha tesisatına göre seçilir. Soğutma departmanı vitrininden benzer modüller karşılaştırılabilir. PFOS veya ürün sayfası üzerinden teklif satırına eklenebilir.</p><p>GN uyumu ve dış ölçü vitrin kartında listelenir. Hazırlık hattına göre adet ve derinlik değişir. 2026 havuzlu tezgah seçiminde enerji tipi saha tesisatına göre belirlenir.</p><p>Havuzlu tezgah modelleri hazırlık ve servis zonlarında farklı derinlik gerektirir. Paslanmaz yüzey hijyen standardına uyar. Modüler yerleşim dar mutfaklarda alan verimliliğini artırır.</p><p>Equsto havuzlu tezgah seçim rehberi PFOS soğutma profiliyle liste üretir. Canlı vitrin fiyatları KDV hariç özetlenir. Teklif özeti satış mühendisliği onayıyla kesinleşir.</p><p>Havuzlu tezgah tipi dolap seçiminde dış ölçü, GN uyumu ve kapasite vitrin kartında listelenir. Tezgah altı ve tezgah üstü modeller aynı hatta birlikte planlanır. Enerji ve soğutma tipi saha tesisatına göre seçilir.</p><p>Havuzlu tezgah modelleri hazırlık ve servis zonlarında farklı derinlik gerektirir. Paslanmaz yüzey hijyen standardına uyar. PFOS soğutma profiliyle liste üretilir.</p><p>Equsto havuzlu tezgah seçim rehberi canlı vitrin fiyatları KDV hariç özetlenir. Teklif özeti satış mühendisliği onayıyla kesinleşir. Modüler yerleşim dar mutfaklarda alan verimliliğini artırır.</p><p>Havuzlu tezgah tipi dolaplarda drenaj bağlantısı ve kondenser konumu saha keşfinde işaretlenir. Self-servis salata barlarında GN derinliği menü çeşidine göre seçilir. Paslanmaz yüzey pürüzsüzlüğü hijyen denetiminde değerlendirilir.</p><p>Tezgah altı ve tezgah üstü modeller aynı hatta birlikte planlanır. Enerji tipi saha tesisatına göre belirlenir.</p><p>Soğutma departmanı vitrininden benzer modüller karşılaştırılabilir. Modüler yerleşim dar mutfaklarda alan verimliliğini artırır. Canlı vitrin fiyatları KDV hariç özetlenir.</p><p>Equsto havuzlu tezgah seçim rehberi PFOS soğutma profiliyle liste üretir; teklif özeti satış mühendisliği onayıyla kesinleşir.</p><p>Havuzlu tezgah modelleri hazırlık ve servis zonlarında farklı derinlik gerektirir. Paslanmaz yüzey hijyen standardına uyar.</p>",
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
        "<p>Endüstriyel pişirme hattında kuzine, ocak, fritöz, ızgara ve kaynatma modülleri menüye göre adetlendirilir. Gazlı ve elektrikli seçenekler vitrinde; saha gaz ve elektrik kapasitesine göre seçilir. Pik çıkış ve eşzamanlı üretim ocak yayılımını belirler.</p><p>Davlumbaz kapasitesi pişirme adediyle birlikte hesaplanır. PFOS pişirme profili menü ve kapasite girdileriyle modül adetlerini üretir. Isı geri kazanımı enerji verimliliğini etkiler.</p><p>Gazlı ve elektrikli seçenekler saha tesisatına göre filtrelenir. 2026 pişirme hatlarında davlumbaz kapasitesi ocak adediyle birlikte hesaplanır. Pik çıkış cookline yayılımını belirler.</p><p>Öztiryakiler pişirme modülleri ana omurga olarak listelenir. Kuzine, fritöz ve ızgara modülleri menü karmasına göre adetlendirilir. Montaj planı davlumbaz rotasıyla birlikte hazırlanır.</p><p>Equsto endüstriyel pişirme rehberi PFOS konsept profiliyle liste üretir. Canlı vitrin fiyatları KDV hariç özetlenir. Satış mühendisliği onayı kesin fiyatı belirler.</p><p>Endüstriyel pişirme hattında kuzine, ocak, fritöz, ızgara ve kaynatma modülleri menüye göre adetlendirilir. Gazlı ve elektrikli seçenekler saha tesisatına göre seçilir. Davlumbaz kapasitesi pişirme adediyle birlikte hesaplanır.</p><p>Pik çıkış ve eşzamanlı üretim ocak yayılımını belirler. Isı geri kazanımı enerji verimliliğini etkiler. Öztiryakiler pişirme modülleri ana omurga olarak listelenir.</p><p>Equsto endüstriyel pişirme rehberi PFOS konsept profiliyle liste üretir. Montaj planı davlumbaz rotasıyla birlikte hazırlanır. Satış mühendisliği onayı kesin fiyatı belirler.</p><p>Pişirme hattında wok ocakları Asya mutfağı ağırlıklı menülerde ayrı davlumbaz yükü oluşturur. Induction modüller hassas sıcaklık kontrolü gerektiren ürünlerde tercih edilir. Combı fırınlar pastane ve ana yemek hattını tek modülde birleştirebilir.</p><p>Gazlı ve elektrikli seçenekler saha tesisatına göre filtrelenir. Montaj planı davlumbaz rotasıyla birlikte hazırlanır.</p><p>Öztiryakiler pişirme modülleri ana omurga olarak listelenir. 2026 pişirme hatlarında davlumbaz kapasitesi ocak adediyle birlikte hesaplanır. Equsto endüstriyel pişirme rehberi PFOS konsept profiliyle liste üretir.</p><p>Canlı vitrin fiyatları KDV hariç özetlenir; satış mühendisliği onayı kesin fiyatı belirler.</p><p>Pik çıkış cookline yayılımını belirler. PFOS pişirme profili menü ve kapasite girdileriyle modül adetlerini üretir.</p><p>Isı geri kazanımı enerji verimliliğini etkiler; montaj planı davlumbaz rotasıyla birlikte hazırlanır. Satış mühendisliği onayı kesin fiyatı belirler.</p>",
      faq: [["Gazlı / elektrikli?", "Her ikisi de vitrinde; saha gaz ve elektrik kapasitesine göre seçilir."]],
      related: [{ label: "Pişirme vitrini", href: "/shop/pisirme" }],
    },
    seoTeklifPlatform: {
      skipBudget: true,

      budget: null,
      pfosKonu: "Restoran",
      body:
        "<p>Proje Fabrikası, Equsto'nun teklif platformudur: konsept, kapasite ve menü girdileriyle ekipman listesi ve fiyat özeti üretir. Hedef süre yaklaşık beş dakikadır; çıktı satış mühendisliği onayıyla kesinleşir. B2B endüstriyel mutfak tedarik akışıdır.</p><p>Rezervasyon veya masa yönetimi değildir. Kural motoru menü ve kapasiteye göre modül adetlerini üretir. Teklif PDF'inde SKU ve ürün kodu satırları yapılandırılmış biçimde yer alır.</p><p>Onay sonrası sipariş ve montaj planı başlar. Kural motoru menü ve kapasiteye göre modül adetlerini üretir. 2026 teklif PDF'lerinde SKU satırları yapılandırılmış biçimde yer alır.</p><p>PFOS taslak listesi satış mühendisliği onayı ve saha keşfi sonrası kesinleşir. Hedef ön teklif süresi yaklaşık beş dakikadır. B2B platform rezervasyon yazılımı değildir.</p><p>Equsto Proje Fabrikası restoran, otel ve catering projelerini aynı akışta yönetir. Öztiryakiler modülleri kural motoruyla adetlendirilir. Montaj ve devreye alma proje numarası altında yürütülür.</p><p>Proje Fabrikası konsept, kapasite ve menü girdileriyle ekipman listesi ve fiyat özeti üretir. Hedef süre yaklaşık beş dakikadır. B2B endüstriyel mutfak tedarik akışıdır; rezervasyon yazılımı değildir.</p><p>Kural motoru menü ve kapasiteye göre modül adetlerini üretir. Teklif PDF'inde SKU satırları yapılandırılmış biçimde yer alır. Onay sonrası sipariş ve montaj planı başlar.</p><p>Equsto Proje Fabrikası restoran, otel ve catering projelerini aynı akışta yönetir. PFOS taslak listesi satış mühendisliği onayı sonrası kesinleşir. Montaj ve devreye alma proje numarası altında yürütülür.</p><p>PFOS kullanıcı hesabı proje numarası altında tüm revizyonları saklar. Teklif PDF dışa aktarımı muhasebe sistemine aktarılabilir formatta yapılandırılmıştır. Mobil cihazdan saha keşfinde taslak oluşturulabilir.</p><p>Kural motoru menü ve kapasiteye göre modül adetlerini üretir. Onay sonrası sipariş ve montaj planı başlar.</p><p>B2B platform rezervasyon yazılımı değildir. PFOS taslak listesi saha keşfi sonrası kesinleşir. Montaj ve devreye alma proje numarası altında yürütülür.</p><p>Equsto Proje Fabrikası restoran, otel ve catering projelerini aynı akışta yönetir; hedef ön teklif süresi yaklaşık beş dakikadır.</p><p>Teklif PDF'inde SKU satırları yapılandırılmış biçimde yer alır. Onay sonrası sipariş süreci başlar.</p><p>Kural motoru menü ve kapasiteye göre modül adetlerini üretir; montaj ve devreye alma proje numarası altında yürütülür.</p>",
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
        "<p>Bar tasarımı Equsto'da Bar Design Studio ile yürür; Vitrum Group menşeli modüler istasyonlar saha ölçüsü ve servis akışına göre seçilir. İçecek, kahve ve soğutma modülleri aynı bar hattında hizalanır. Modül yüksekliği ve tezgah derinliği servis personeli ergonomisine göre ayarlanır.</p><p>Buz makinesi ve depolama kapasitesi günlük bardak adedine bağlıdır. Besos vitrininde kırk iki modül örneği listelenir. Tam dizilim Proje Fabrikası veya Besos sayfası üzerinden planlanır.</p><p>Vitrum Group modüler istasyonları saha ölçüsüne göre seçilir. 2026 bar projelerinde buz makinesi kapasitesi günlük bardak adedine bağlıdır. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır.</p><p>Bar açılış haftası montaj ve eğitim yoğunluğu yaratır. İçecek ve kahve modülleri aynı garanti hattında kayıt altına alınır. PFOS bar konseptiyle liste yenilenir.</p><p>Equsto Bar Design Studio modüler bar projelerini planlar. Besos modülleri saha ölçüsüne göre parsellenir. Montaj planı satış mühendisliği ile yürütülür.</p><p>Bar tasarımı Bar Design Studio ile yürür; Vitrum Group modüler istasyonlar saha ölçüsüne göre seçilir. İçecek, kahve ve soğutma modülleri aynı bar hattında hizalanır. Buz makinesi kapasitesi günlük bardak adedine bağlıdır.</p><p>Besos vitrininde kırk iki modül örneği listelenir. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır. Bar açılış haftası montaj ve eğitim yoğunluğu yaratır.</p><p>Equsto Bar Design Studio modüler bar projelerini planlar. PFOS bar konseptiyle liste yenilenir. Montaj planı satış mühendisliği ile yürütülür.</p><p>Bar tasarımında LED aydınlatma ve buz bankası konumu müşteri etkileşimini belirler. Kokteyl yoğunluğu yüksek barlarda ek hazırlık tezgahı gerekir. Besos modül garantisi montaj sonrası devreye alma tutanağıyla başlar.</p><p>Vitrum Group modüler istasyonları saha ölçüsüne göre seçilir. Tam dizilim Besos veya Proje Fabrikası üzerinden planlanır.</p><p>Modül yüksekliği servis personeli ergonomisine göre ayarlanır. Buz makinesi kapasitesi günlük bardak adedine bağlıdır. PFOS bar konseptiyle liste yenilenir.</p><p>Equsto Bar Design Studio modüler bar projelerini planlar; montaj planı satış mühendisliği ile yürütülür.</p><p>Bar açılış haftası montaj ve eğitim yoğunluğu yaratır. Tam dizilim Proje Fabrikası veya Besos sayfası üzerinden planlanır.</p>",
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
        "<p>Equsto is a Turkey-based industrial kitchen platform serving restaurants, hotels, cloud kitchens and catering operators. Authorized Öztiryakiler distribution covers cooking, refrigeration, warewashing, prep, coffee and beverage lines in one catalog workflow. Single-SKU orders and full project lists use the same shop and quote flow.</p><p>Export markets include selected countries in the Gulf, Central Asia and Eastern Europe. Live catalogue pricing and sales engineering sit in one B2B workflow. GEO landing pages provide concept depth while the catalogue handles direct purchasing.</p><p>Project Factory generates equipment lists and quote summaries in about five minutes. Final pricing, logistics and installation are confirmed by sales engineering before purchase orders are issued. This is commercial kitchen supply, not reservation software.</p><p>Gastronomy design refines layout after the initial PFOS draft. Site surveys close the gap between preliminary and final quotes. Installation and commissioning follow the project schedule agreed with sales engineering.</p><p>Equsto supports turnkey projects from concept input through equipment delivery. Öztiryakiler modules form the core of most cooking and refrigeration lines. Contact the export desk for markets outside Turkey.</p><p>Equsto serves restaurants, hotels, cloud kitchens and catering operators from a single industrial kitchen catalogue. Öztiryakiler cooking and refrigeration modules form the core of most project lists. Export markets in the Gulf, Central Asia and Eastern Europe use the same quote workflow.</p><p>Live catalogue pricing and sales engineering sit in one B2B flow. GEO landing pages provide concept depth while the shop handles direct purchasing. Gastronomy design refines layout after the initial PFOS draft.</p><p>Site surveys close the gap between preliminary and final quotes. Installation and commissioning follow the project schedule agreed with sales engineering. Contact the export desk for markets outside Turkey.</p><p>Export buyers receive proforma invoices in EUR with Incoterms stated on the quote cover page. Installation supervision can be scheduled as a separate line item. Öztiryakiler spare parts ship from the authorised dealer channel with warranty registration.</p><p>Gastronomy design refines layout after the initial PFOS draft. Site surveys close the gap between preliminary and final quotes.</p>",
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
        "<p>Project Factory is Equsto's quotation platform for commercial kitchen projects. Capacity, concept and menu inputs drive module counts; VAT and logistics lines are included in the output file. Target turnaround is about five minutes for a preliminary quote summary.</p><p>Layout and MEP can be refined later with gastronomy design and on-site sales engineering. The rule engine calculates hot, cold and warewashing module counts from menu and capacity data. Final sign-off is performed by the sales engineering team.</p><p>This is B2B kitchen equipment supply, not table reservation software. Quote PDFs include structured SKU and product code rows. Approval triggers the order and installation planning phase.</p><p>Preliminary lists become firm quotes after site survey and sales engineering review. Öztiryakiler and selected global brands share the same cart and quote workflow. Export markets use the same platform with logistics confirmed separately.</p><p>Equsto quotation workflow covers restaurants, hotels, cloud kitchens and catering from one entry point. PFOS concept profiles model each operation type differently. Installation is planned against the approved equipment list.</p><p>Project Factory generates equipment lists and quote summaries for commercial kitchen projects. Capacity, concept and menu inputs drive module counts through the rule engine. Target turnaround is about five minutes for a preliminary quote summary.</p><p>Quote PDFs include structured SKU and product code rows. Final sign-off is performed by sales engineering before purchase orders are issued. Layout and MEP can be refined later with gastronomy design on site.</p><p>Equsto quotation workflow covers restaurants, hotels, cloud kitchens and catering from one entry point. PFOS concept profiles model each operation type differently. Installation is planned against the approved equipment list.</p><p>Quote revisions are versioned under one project number in PFOS. Structured SKU rows export to procurement spreadsheets without manual retyping. Sales engineering validates MEP assumptions before the quote is marked firm.</p><p>Layout and MEP can be refined later with gastronomy design on site. Installation is planned against the approved equipment list.</p>",
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
        "<p>Bu dizin blog ve GEO rehber içeriklerini vitrin menüsünden ayırır. Ekipman arayan kullanıcı doğrudan katalogda kalır; konsept ve teklif soruları bu sayfalarda yanıtlanır. Her rehberde sık sorulan sorular bulunur; PFOS teklif özeti için ana giriş noktasıdır.</p><p>Konsept kurulum, arama hedefli sayfalar, editoryal rehberler ve referans projeler bölümlere ayrılmıştır. Bağlantılar footer, sitemap ve llms.txt ile dizinlenir. Steakhouse, bulut mutfak, market reyonu ve kafe açılış rehberleri ilgili profillere bağlanır.</p><p>Beş yüz kişilik catering ve metrekare planlama yazıları kapasite sorularını derinleştirir. Restoran checklist akışı PFOS sırasını yansıtır. Dark kitchen rehberi çok markalı senaryoyu açıklar.</p><p>SEO sayfaları Türkiye endüstriyel mutfak, otel, pişirme, soğuk oda ve teklif platformu aramalarını karşılar. İngilizce endüstriyel ve teklif sayfaları ihracat okuyucusuna yöneliktir. Öztiryakiler bayii sayfası resmi kanalı açıklar.</p><p>Referans projeler demonte vaka formatındadır; İstanbul catering ve İzmir modüler bar örnekleri dizinden erişilir. Fotoğraf ve alıntılar yayın sürecinde güncellenir. Kesin ekipman listesi PFOS ile üretilir; satış mühendisliği onayı nihai fiyatı belirler.</p><p>Bu dizin blog ve GEO rehber içeriklerini vitrin menüsünden ayırır. Konsept kurulum, arama hedefli sayfalar, editoryal rehberler ve referans projeler bölümlere ayrılmıştır. Bağlantılar footer, sitemap ve llms.txt ile dizinlenir.</p><p>Steakhouse, bulut mutfak, market reyonu ve kafe açılış rehberleri ilgili profillere bağlanır. Beş yüz kişilik catering ve metrekare planlama yazıları kapasite sorularını derinleştirir. Restoran checklist akışı PFOS sırasını yansıtır.</p><p>Referans projeler demonte vaka formatındadır; kesin ekipman listesi PFOS ile üretilir. Satış mühendisliği onayı nihai fiyatı belirler. PFOS teklif özeti için ana giriş noktasıdır.</p><p>Dizin sayfası vitrin menüsünde yer almaz; footer ve sitemap üzerinden erişilir. Her rehber kendi FAQ bloğunu taşır. Konsept sayfaları PFOS profil koduna bağlanır; editoryal rehberler kapasite sorularını derinleştirir.</p><p>İngilizce endüstriyel ve teklif sayfaları ihracat okuyucusuna yöneliktir. Referans projeler demonte vaka formatındadır.</p><p>SEO sayfaları otel, pişirme ve soğuk oda aramalarını karşılar. Kesin ekipman listesi PFOS ile üretilir. Otel ve tüm gün yemek servisi içerikleri öğün döngüsünü vurgular.</p><p>Satış mühendisliği onayı nihai fiyatı belirler; PFOS teklif özeti için ana giriş noktasıdır.</p>",
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
        "<p>This index separates blog and GEO guide content from the shop menu. Users looking for equipment stay in the catalogue; concept and quote questions are answered on these pages. Each guide includes FAQs; this is the main entry point for Project Factory quote summaries.</p><p>Concept setup, search-targeted pages, editorial guides and reference projects are grouped in sections below. Links are indexed via footer, sitemap and llms.txt. Steakhouse, cloud kitchen, market aisle and cafe opening guides link to their concept profiles.</p><p>Five-hundred-guest catering and square-metre planning articles deepen capacity questions. The restaurant checklist flow mirrors the PFOS sequence. The dark kitchen guide explains multi-brand scenarios.</p><p>SEO pages address searches for industrial kitchen equipment in Turkey, hotels, cooking lines, cold rooms and the quote platform. English industrial and quotation pages target export readers. The Öztiryakiler dealer page explains the official channel.</p><p>Reference projects use a demounted case-study format; Istanbul catering and Izmir modular bar examples are reachable from this index. Photos and quotes are strengthened during publication. Firm equipment lists are generated via PFOS; sales engineering sign-off sets final pricing.</p><p>This index separates blog and GEO guide content from the shop menu. Concept setup, search-targeted pages, editorial guides and reference projects are grouped in sections. Links are indexed via footer, sitemap and llms.txt.</p><p>Steakhouse, cloud kitchen, market aisle and cafe opening guides link to their concept profiles. Five-hundred-guest catering and square-metre planning articles deepen capacity questions. The restaurant checklist flow mirrors the PFOS sequence.</p><p>Reference projects use a demounted case-study format. Firm equipment lists are generated via PFOS; sales engineering sign-off sets final pricing. This is the main entry point for Project Factory quote summaries.</p><p>This index is not in the shop menu; it is reached via the footer and sitemap. Each guide carries its own FAQ block. Concept pages link to PFOS profile codes; editorial guides deepen capacity planning questions.</p><p>English industrial and quotation pages target export readers. Reference projects use a demounted case-study format.</p>",
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
        "<p>Beş yüz kişilik catering ve banket çıkışlarında sıcak banket kapasitesi, soğuk zincir derinliği ve yıkama hızı belirleyicidir. Kişi sayısı ve öğün aralığı PFOS'ta modellenir; pik öğün ile sürekli banket ayrı senaryolardır. Taşıma ekipmanları ve hazırlık modülleri menüye göre eklenir.</p><p>Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır. Banket menüsünde glütensiz veya vejetaryen hat ayrımı ek modül gerektirebilir. Sevkiyat saatleri mutfak üretim penceresiyle çakışmamalıdır.</p><p>Catering mutfağı rehberi ve İstanbul demode sayfası ile birlikte okunmalıdır. PFOS catering konsepti kişi sayısı girdisiyle modül adetlerini hesaplar. Saha keşfi montaj takviminin ilk adımıdır.</p><p>Sıcak holding süresi menü mühendisliğini belirler; soğuk zincir derinliği ürün portföyüne göre ayrılır. Termobox kapasitesi sevkiyat planıyla birlikte okunmalıdır. Ekipman montajı üretim hattı devreye alınmadan tamamlanmalıdır.</p><p>2026 catering planlamasında taşıma modülleri menü profiline göre eklenir. Banket çıkışları kapasiteyi kısa sürede yükseltir. Equsto satış mühendisliği pik senaryoyu ayrı modellemeyi önerir.</p><p>Beş yüz kişilik catering çıkışlarında sıcak banket kapasitesi, soğuk zincir derinliği ve yıkama hızı belirleyicidir. Pik öğün ile sürekli banket ayrı PFOS senaryolarıdır; kişi sayısı ve öğün aralığı modül adetlerini doğrudan etkiler. Taşıma ekipmanları menü profiline göre eklenir.</p><p>Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır. Banket menüsünde glütensiz veya vejetaryen hat ayrımı ek modül gerektirebilir. Sevkiyat saatleri mutfak üretim penceresiyle çakışmamalıdır.</p><p>Catering mutfağı rehberi ve İstanbul demode sayfası ile birlikte okunmalıdır. Equsto satış mühendisliği pik senaryoyu ayrı modellemeyi önerir. PFOS catering konsepti kişi sayısı girdisiyle modül adetlerini hesaplar.</p><p>Beş yüz kişilik senaryoda taşıma arabası ve GN kapasitesi pik öğünden önce sahada test edilir. Menüde çorba ve ana yemek aynı dakikada çıkıyorsa sıcak banket modülü ikiye ayrılabilir. Soğuk meze hattı banketten bağımsız soğutma derinliği ister.</p><p>Pik öğün ile sürekli banket ayrı PFOS senaryolarıdır. Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır.</p><p>Catering mutfağı rehberi ve İstanbul demode sayfası birlikte okunduğunda pik senaryo netleşir. Termobox kapasitesi sevkiyat planıyla birlikte okunmalıdır. Ekipman montajı üretim hattı devreye alınmadan tamamlanmalıdır.</p><p>2026 catering planlamasında banket çıkışları kapasiteyi kısa sürede yükseltir; pik senaryo ayrı modellenmelidir.</p>",
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
        "<p>Dark kitchen ve bulut mutfak kurulumunda marka başına parsellenmiş sıcak-soğuk hatlar ve ortak yıkama merkezi planlanır. Elektrik ve havalandırma yükü çok markalı senaryoda artar; yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır. Yüksek paket oranı soğutma ve hazırlık modülleri artırır.</p><p>Markalar arası depo ve sevkiyat alanı net sınırlandırılmalıdır. Çok markalı tesiste ortak fire ve atık yönetimi sözleşmeyle netleşir. Kurye platformu entegrasyonu mutfak çıkış layoutunu etkiler.</p><p>Bulut mutfak kurulum rehberi ile örtüşen adımlar PFOS'ta modellenir. Saha ölçüsü planın ilk girdisidir. PFOS her marka için ayrı modül satırı üretebilir.</p><p>2026 dark kitchen rehberi çok markalı ruhsat senaryosunda MEP kapasitesini vurgular. Gece üretim profili ayrı senaryoda modellenir. Elektrik panosu marka toplam yüküne göre yeniden boyutlandırılır.</p><p>Equsto bulut mutfak konsepti marka sayısı ve menü girdileriyle liste üretir. Öztiryakiler pişirme ve soğutma modülleri marka başına adetlendirilir. Montaj planı satış mühendisliği ile yürütülür.</p><p>Dark kitchen kurulumunda marka başına parsellenmiş hatlar çapraz bulaşmayı azaltır; ortak yıkama merkezi tüm markaların pik yükünü taşır. Elektrik ve havalandırma yükü çok markalı senaryoda artar. Yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır.</p><p>Markalar arası depo ve sevkiyat alanı net sınırlandırılmalıdır. Kurye platformu entegrasyonu mutfak çıkış layoutunu etkiler. 2026 dark kitchen rehberi çok markalı ruhsat senaryosunda MEP kapasitesini vurgular.</p><p>PFOS her marka için ayrı modül satırı üretebilir. Equsto bulut mutfak konsepti marka sayısı ve menü girdileriyle liste üretir. Montaj planı satış mühendisliği ile yürütülür.</p><p>Dark kitchen ruhsatında marka sayısı elektrik panosu ve yağ sıyırıcı kapasitesini belirler. Kurye toplama noktası ile üretim çıkışı arasında sıcaklık kaybını önleyen bekleme rafı planlanır. Gece vardiyası gürültü sınırı komşu birimlerle sözleşmede netleştirilir.</p><p>Markalar arası depo ve sevkiyat alanı net sınırlandırılmalıdır. PFOS her marka için ayrı modül satırı üretebilir.</p><p>Bulut mutfak kurulum rehberi ile örtüşen adımlar aynı PFOS akışında modellenir. Yüksek paket oranı hazırlık modüllerini artırır. Elektrik panosu marka toplam yüküne göre boyutlandırılır.</p><p>2026 dark kitchen rehberi çok markalı ruhsat senaryosunda MEP kapasitesini vurgular; montaj planı satış mühendisliği ile yürütülür.</p>",
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
        "<p>Restoran mutfak kurulumu checklist akışı menü, kapasite, alan, sıcak-soğuk-yıkama adetleri ve teklif sırasını izler. PFOS bu sırayı otomatikler; checklist saha toplantılarında manuel kontrol içindir. İşletme tipi, oturma ve paket oranı, günlük öğün, mevcut tesisat, davlumbaz ve marka tercihi sırayla netleştirilir.</p><p>Her adım sonraki modül adedini etkiler. CAD plan ilk aşamada şart değildir; yerleşim Gastronomi Tasarımı ile derinleşir. Restoran teklif rehberi ile birlikte okunmalıdır.</p><p>2026 restoran açılışlarında tesisat ve davlumbaz rotası modül adedini etkiler. Checklist saha toplantılarında manuel kontrol içindir. PFOS menü-kapasite-alan-teklif sırasını otomatikler.</p><p>Marka tercihi teklif dosyasına yansır; Öztiryakiler ana omurga olarak listelenir. Saha keşfi ön teklif ile kesin teklif arasındaki boşluğu kapatır. Montaj takvimi proje fazlarına göre hazırlanır.</p><p>Equsto restoran checklist akışı PFOS sırasını yansıtır. Satış mühendisliği onayı kesin fiyatı belirler. Gastronomi Tasarımı yerleşim sorularını derinleştirir.</p><p>Restoran mutfak kurulumu checklist akışı menü, kapasite, alan, sıcak-soğuk-yıkama adetleri ve teklif sırasını izler. PFOS bu sırayı otomatikler; checklist saha toplantılarında manuel kontrol içindir. Her adım sonraki modül adedini etkiler.</p><p>CAD plan ilk aşamada şart değildir; yerleşim Gastronomi Tasarımı ile derinleşir. Marka tercihi teklif dosyasına yansır; saha keşfi ön teklif ile kesin teklif arasındaki boşluğu kapatır.</p><p>2026 restoran açılışlarında tesisat ve davlumbaz rotası modül adedini etkiler. Equsto restoran checklist akışı PFOS sırasını yansıtır. Satış mühendisliği onayı kesin fiyatı belirler.</p><p>Checklist dördüncü adımda tesisat doğrulama tutanağı imzalanır; gaz basıncı ve elektrik yükü sipariş öncesi onaylanır. Beşinci adımda PFOS çıktısı satın alma dosyasına eklenir. CAD plan ikinci fazda Gastronomi Tasarımı ile gelir.</p><p>Marka tercihi teklif dosyasına yansır; saha keşfi ön teklif ile kesin teklif arasındaki boşluğu kapatır. Checklist saha toplantılarında manuel kontrol içindir.</p><p>Restoran teklif rehberi checklist ile birlikte okunmalıdır. Tesisat ve davlumbaz rotası modül adedini doğrudan etkiler. Gastronomi Tasarımı yerleşim sorularını derinleştirir; CAD plan sonraki aşamada eklenebilir.</p><p>2026 restoran açılışlarında tesisat rotası modül adedini etkiler; satış mühendisliği onayı kesin fiyatı belirler.</p><p>PFOS menü-kapasite-alan-teklif sırasını otomatikler; montaj takvimi proje fazlarına göre hazırlanır.</p>",
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
        "<p>Kafe açılış ekipman listesinde espresso merkezi, soğutmalı stok, hazırlık tezgahı, vitrin soğutucu ve yıkama hattı omurgayı oluşturur. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir. Pastane ağırlıklı kafelerde fırın ve hazırlık modülleri eklenir.</p><p>Paket oranı soğutma derinliğini artırır; oturma kapasitesi bardak adedini belirler. Cafe kurulum rehberi ve kahve vitrini ile birlikte okunmalıdır. PFOS cafe konsepti bardak adedini ve menü profilini sorar.</p><p>2026 kafe açılış listesinde su filtrasyonu makine seçiminden önce sabitlenmelidir. Espresso merkezi ve soğuk stok cafe konseptinde paralel planlanır. Bar arkası kablo kanalı güvenlik standartlarına uymalıdır.</p><p>Makine garantisi ve servis sözleşmesi devreye alma ile birlikte başlar. Hazırlık tezgahı altı depolama bardak ve kapak stoğunu taşır. Dar mutfaklı kafelerde dikey depolama tercih edilir.</p><p>Equsto kafe açılış rehberi PFOS cafe profiliyle liste üretir. Canlı vitrin fiyatları KDV hariç özetlenir. Montaj planı satış mühendisliği ile sahada yürütülür.</p><p>Kafe açılış listesinde espresso merkezi, soğutmalı stok, hazırlık tezgahı, vitrin soğutucu ve yıkama hattı omurgayı oluşturur. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir. Pastane ağırlıklı kafelerde fırın ve hazırlık modülleri eklenir.</p><p>Paket oranı soğutma derinliğini artırır; oturma kapasitesi bardak adedini belirler. Makine garantisi ve servis sözleşmesi devreye alma ile birlikte başlar. Bar arkası kablo kanalı güvenlik standartlarına uymalıdır.</p><p>Equsto kafe açılış rehberi PFOS cafe profiliyle liste üretir. 2026 kafe açılış listesinde su filtrasyonu makine seçiminden önce tamamlanmalıdır. Montaj planı satış mühendisliği ile sahada yürütülür.</p><p>Kafe açılış listesinde ilk hafta süt tüketimi ve bardak adedi gerçek veriyle PFOS girdileri güncellenir. Kahve çekirdeği depolama nem kontrollü kapta tutulur. Ruhsat öncesi gıda işletme kaydı ile ekipman montaj takvimi eş gider.</p><p>Espresso merkezi ve soğuk stok cafe konseptinde paralel planlanır. Makine garantisi devreye alma ile birlikte başlar.</p><p>Cafe kurulum rehberi ve kahve vitrini ile birlikte okunduğunda liste tamamlanır. Bar arkası kablo kanalı güvenlik standartlarına uymalıdır. Dar mutfaklı kafelerde dikey depolama tercih edilir.</p><p>2026 kafe açılış listesinde su filtrasyonu makine seçiminden önce tamamlanmalıdır; montaj planı satış mühendisliği ile yürütülür.</p>",
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
      { title: page.title, description: page.description },
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
    var key = pathKey();
    var isEn = key.indexOf("en/") === 0;
    var miss = uiStrings(isEn ? "en" : "tr");
    ensureVitrinChrome()
      .then(function () {
        ensureGeoScripts();
        return loadGeoLandings();
      })
      .then(function (data) {
        var page = data[key];
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
