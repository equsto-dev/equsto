/**
 * GEO sprint 3 — tam landings + catering cluster (hub → rehber → vaka)
 * node scripts/rewrite-geo-sprint3.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PATHS = [
  path.join(root, "lib/geo/landings.json"),
  path.join(root, "public/data/geo-landings.json"),
];

const PATCHES = {
  "catering-mutfagi": {
    description:
      "Catering mutfağı konsept kurulumu: pişirme, taşıma, soğutma ve yıkama zonları; banket ve toplu yemek hatları.",
    lead: "Konsept hub: catering mutfak zonları ve ekipman omurgası. Kapasite planı için 500 kişilik rehber, vaka için İstanbul demode.",
    body: `<p>Catering mutfağı, yüksek hacimli pişirme ile sevkiyata hazırlık arasında kesintisiz bir akış gerektirir. Bu sayfa konsept kurulumu ve mutfak zonlarını anlatır; belirli kişi sayısı planlaması <a href="/rehber/500-kisilik-catering-ekipman-planlama-2026">500 kişilik catering ekipman planlama</a> rehberinde, saha uygulaması <a href="/projeler/istanbul-yuksek-hacim-catering-demode">İstanbul yüksek hacim catering</a> vakasında ele alınır.</p><h2>Pişirme ve holding</h2><p>Sıcak banket modülleri menüdeki holding süresine göre seçilir; pik öğün ile sürekli üretim farklı kapasite profilleri oluşturur. Pişirme hattı hazırlık ve paketleme zonlarından fiziksel olarak ayrılır. Blast chiller soğuk ürünler için ayrı hesaplanır.</p><h2>Taşıma ve soğuk zincir</h2><p>Termobox kapasitesi sevkiyat planıyla birlikte okunmalı; üretim penceresi ile sevkiyat saati çakışmamalıdır. Soğuk zincir derinliği salata, tatlı ve içecek payına göre ayrılır. Taşıma arabaları pik öğünden en az otuz dakika önce sahada hazır olmalıdır.</p><h2>Yıkama</h2><p>Konveyörlü yıkama hattı pik dakikada darboğaz oluşturmamalıdır. Bulaşık kapasitesi üretim hattı devreye alınmadan test edilmelidir. Banket öncesi prova gününde yıkama hattı pik yük altında doğrulanır.</p><p><a href="/pfos">Proje Fabrikası</a> catering konsepti kişi sayısı, öğün profili ve menü girdileriyle modül listesi üretir.</p>`,
  },

  "rehber/500-kisilik-catering-ekipman-planlama-2026": {
    description:
      "500 kişilik catering kapasite planı 2026: pik senaryo, sıcak banket, yıkama hızı ve taşıma ekipmanları.",
    lead: "Kapasite derinliği: 500 kişilik pik senaryo hesabı. Konsept zonları catering mutfağı hub'ında.",
    body: `<p>Beş yüz kişilik catering planlaması, konsept mutfak zonlarından bağımsız olarak kapasite girdilerini sayısallaştirir. Mutfak yerleşimi ve hat mantığı için önce <a href="/catering-mutfagi">catering mutfağı kurulum rehberini</a> okuyun; bu sayfa pik kişi sayısına özel modül adetlerine odaklanır.</p><h2>Pik senaryo girdileri</h2><p>Pik öğün ile sürekli banket ayrı PFOS senaryolarıdır. Menüde çorba ve ana yemek aynı dakikada çıkıyorsa sıcak banket modülü ikiye ayrılabilir. Soğuk meze hattı banketten bağımsız soğutma derinliği ister.</p><h2>Yıkama ve taşıma</h2><p>Konveyörlü yıkama debisi pik dakikadaki tabak adedine göre hesaplanır. Taşıma arabası ve GN kapasitesi pik öğünden önce sahada test edilir. Glütensiz veya vejetaryen hat ayrımı ek hazırlık modülü gerektirebilir.</p><h2>Doğrulama</h2><p>PFOS catering konseptinde kişi sayısını 500 olarak girerek modül adetlerini üretin. Saha koşulları için <a href="/projeler/istanbul-yuksek-hacim-catering-demode">İstanbul yüksek hacim catering</a> demode vakasına bakın.</p>`,
  },

  "projeler/istanbul-yuksek-hacim-catering-demode": {
    description:
      "İstanbul yüksek hacim catering demode vakası: şehir içi MEP, baca kısıtı, pik banket provası.",
    lead: "Demonte vaka: İstanbul şehir içi catering — baca, sevkiyat trafiği ve pik banket provası.",
    body: `<p>Bu sayfa İstanbul'da yüksek hacim catering senaryosunun demonte vaka anlatımıdır; satılabilir paket iddiası taşımaz. Konsept zonları <a href="/catering-mutfagi">catering mutfağı rehberinde</a>, 500 kişilik kapasite hesabı <a href="/rehber/500-kisilik-catering-ekipman-planlama-2026">planlama rehberinde</a> ayrı okunmalıdır.</p><h2>Saha kısıtları</h2><p>Yoğun şehir içi lokasyonda baca ve cephe kapasitesi ekipman sipariş takviminden önce netleştirilmelidir. Sevkiyat trafiği üretim penceresini daraltır; sabah erken ve gece geç vardiya senaryoları plana dahil edilir.</p><h2>Devreye alma</h2><p>Pik banket provası konveyörlü yıkama hattını pik yük altında test eder. Saha ölçüsü ve MEP koşulları montaj takviminin ilk adımıdır. Kesin ekipman listesi <a href="/pfos">Proje Fabrikası</a> catering konseptiyle projeye özel üretilir.</p><p>Teknik sorular satış mühendisliği hattına iletilir; vaka güncellemeleri demonte formatını korur.</p>`,
  },

  "fast-food-kurulumu": {
    description:
      "Fast food mutfak kurulumu: paralel pişirme hattı, paket istasyonu, kurye bekleme ve franchise şablonu.",
    lead: "Hızlı servis konsepti: fritöz-ızgara paralel hat, paket ağırlığı ve franchise şablon listesi.",
    body: `<p>Fast food mutfağında servis süresi kısa olduğundan pişirme, hazırlık ve paketleme hatları tamamen paralel dizilir. Fritöz ve ızgara yoğunluğu menü karmasıyla doğrudan orantılıdır; paket ağırlığı yükseldikçe ambalajlama istasyonu genişler.</p><h2>Hat dizilimi</h2><p>Sıcak holding ile soğuk stok aynı koridorda net ayrılır. Kurye bekleme alanı mutfak çıkışına yakın planlanarak teslimat gecikmesi azaltılır. Tezgah yüksekliği ve ergonomi ekip verimini etkiler.</p><h2>Franchise ve enerji</h2><p>Franchise teknik şartnamesi ile PFOS çıktısı karşılaştırılır; standart modül seti şube açılışlarında şablon olarak saklanır. Enerji yükü fritöz ve ızgara adediyle orantılıdır; davlumbaz kapasitesi pişirme adediyle birlikte hesaplanır.</p><p><a href="/pfos">Proje Fabrikası</a> fast food profili menü karması, günlük kapasite ve paket oranını sorarak modül adetlerini üretir.</p>`,
  },

  "fine-dining-kurulumu": {
    description:
      "Fine dining mutfak kurulumu: düşük porsiyon sıklığı, bitirme hattı, sous-vide ve sessiz yıkama.",
    lead: "Fine dining konsepti: geniş ocak yayılımı, hassas muhafaza, bitirme ve sos hatları.",
    body: `<p>Fine dining mutfağında düşük porsiyon sıklığı geniş ocak yayılımı getirir. Steakhouse'a kıyasla dry-age ağırlığı düşük; dengeli pişirme, bitirme ve hassas muhafaza öne çıkar. Bitirme, sos ve soğuk holding hatları servis stiline göre ayrılır.</p><h2>Pişirme ve bitirme</h2><p>Sous-vide ve düşük sıcaklık pişirme modülleri ayrı elektrik hattı gerektirebilir. Mis en place alanı servis başlangıcından önce hazırlanır. Şef brifingi ekipman listesini doğrular; PFOS taslağı bu brifingle güncellenir.</p><h2>Açık mutfak ve yıkama</h2><p>Açık mutfak projelerinde ses ve koku yönetimi havalandırma tasarımına bağlıdır. Yıkama hattı düşük hacimli ama yüksek hijyen standardında planlanır. Işık planı teşhir ve pişirme zonlarını ayırır.</p><p><a href="/pfos">Proje Fabrikası</a> fine dining konsepti kapasite, menü ve servis stili girdileriyle ön liste üretir. Izgara ağırlıklı konseptler için <a href="/steakhouse-kurulumu">steakhouse rehberine</a> bakın.</p>`,
  },

  "bar-tasarimi-turkiye": {
    description:
      "Bar tasarımı Türkiye — Besos: modüler bar istasyonları, Vitrum Group modülleri, 42 örnek vitrin.",
    lead: "Bar Design Studio (Besos): modüler istasyon seçimi, servis akışı ve buz/kahve entegrasyonu.",
    ctaBesos: true,
    body: `<p>Bar tasarımı Equsto'da Bar Design Studio (Besos) ile yürür. Vitrum Group menşeli modüler istasyonlar saha ölçüsü ve servis akışına göre seçilir; içecek, kahve ve soğutma modülleri aynı bar hattında hizalanır.</p><h2>Modül seçimi</h2><p>Besos vitrininde 42 modül örneği listelenir. Modül yüksekliği ve tezgah derinliği servis personeli ergonomisine göre ayarlanır. Buz makinesi kapasitesi günlük bardak adedine bağlıdır.</p><h2>Tesisat ve devreye alma</h2><p>Elektrik ve su noktaları modül yerleşiminden önce doğrulanmalıdır. Kokteyl yoğunluğu yüksek barlarda ek hazırlık tezgahı gerekir. Referans vaka: <a href="/projeler/izmir-moduler-bar-icecek-demode">İzmir modüler bar demode</a>.</p><p>Tam dizilim <a href="/besos">Besos</a> veya <a href="/pfos">Proje Fabrikası</a> bar konsepti üzerinden planlanır.</p>`,
  },

  "soguk-oda-teklif": {
    description:
      "Soğuk oda ve endüstriyel soğutma teklifi: panel oda, şok dondurucu, tezgah tipi dolap — kapasite ve MEP.",
    lead: "Soğutma teklif rehberi: kapasite, ürün profili, MEP doğrulama; büyük projelerde mühendislik hattı.",
    body: `<p>Soğuk oda teklifi kapasite, ürün profili ve MEP koşullarının birlikte değerlendirilmesiyle başlar. Tezgah tipi ve dik tip modüller günlük mutfak listesinde; panel soğuk oda projeleri ayrı mühendislik hattıyla yürür.</p><h2>Kapasite hesabı</h2><p>Menü hacmi ve giriş sıcaklığı soğutma adedini belirler. Şok dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır. Panel kalınlığı, oda hacmi ve kapı sayısı birlikte hesaplanır; sık açılan kapılar için hızlı açılır kapı önerilir.</p><h2>Tezgah tipi soğutma</h2><p>Tezgah altı ve tezgah üstü modeller hazırlık hattında birlikte planlanır. Havuzlu dolap seçimi için <a href="/havuzlu-dolap-tedarik">tezgah tipi havuzlu dolap</a> rehberine bakın. PFOS soğutma modüllerini menü girdileriyle listeler.</p><p>Ön doğrulama satış mühendisliği ile yapılır; dijital sıcaklık kaydı denetim dosyasına aktarılabilir.</p>`,
  },

  "rehber/mutfak-alani-kisi-basi-metrekare-2026": {
    description:
      "Mutfak alanı planlama 2026: kişi başı m², servis stili (oturma/paket/banket) ve PFOS alan girdisi.",
    lead: "Kapasite rehberi: kişi başı metrekare varsayımları servis stiline göre ayrılır.",
    skipTable: true,
    body: `<p>Kişi başı mutfak metrekare planlamasında servis stili belirleyicidir: oturma, paket ve banket aynı brüt alanı farklı kullanır. Bu rehber alan varsayımlarını sayısallaştirir; konsept ekipman listesi ilgili kurulum rehberlerinde okunmalıdır.</p><h2>Varsayımlar (2026)</h2><ul><li>Oturma ağırlıklı restoran: sıcak tutma ve vitrin öne çıkar</li><li>Yüksek paket oranı: soğutma derinliği ve ambalajlama istasyonu artar</li><li>Banket/catering: taşıma ekipmanları ve holding modülleri alana dahil edilir</li></ul><p>Metrekare planına personel sirkülasyon koridoru, mal kabul ve yıkama zonu dahil edilmelidir; yıkama alanı sık göz ardı edilen kritik kalemdir.</p><h2>PFOS entegrasyonu</h2><p>PFOS alan ve kişi sayısı soruları bu rehberdeki varsayımlarla uyumludur. Dar mutfaklarda dikey depolama ve modüler tezgahlar tercih edilir.</p><p>Konsept derinliği: <a href="/cafe-kurulumu">cafe</a>, <a href="/catering-mutfagi">catering</a>, <a href="/fast-food-kurulumu">fast food</a> kurulum rehberleri.</p>`,
  },

  "rehber/restoran-mutfak-kurulumu-checklist-2026": {
    description:
      "Restoran mutfak kurulum checklist 2026: menü → kapasite → tesisat → PFOS teklif adımları.",
    lead: "Restoran açılış checklist: beş adımda ekipman listesi ve teklif hazırlığı.",
    skipTable: true,
    body: `<p>Restoran mutfak kurulumu checklist, yeni açılış veya tadilat projelerinde ekipman listesi sırasını takip eder. Konsepte özel derinlik için <a href="/balik-restorani-mutfak-projesi-kurulumu">balık restoranı mutfak projesi</a> gibi rehberlere bakın; teklif akışı <a href="/mutfak-teklif-platformu">mutfak teklif platformunda</a> anlatılır.</p><h2>Checklist adımları</h2><ol><li>İşletme tipi ve konsept (menü profili)</li><li>Oturma kapasitesi, paket oranı, günlük öğün</li><li>Alan m² ve mevcut tesisat (gaz, elektrik, davlumbaz rotası)</li><li>Marka tercihi ve modül adetleri (PFOS girdisi)</li><li>Ön teklif → saha keşfi → kesin teklif</li></ol><p>CAD plan ilk aşamada şart değildir; yerleşim Gastronomi Tasarımı ile ikinci fazda derinleşir. PFOS menü-kapasite-alan-teklif sırasını otomatikler; checklist saha toplantılarında manuel kontrol içindir.</p><p>Tesisat doğrulama tutanağı sipariş öncesi imzalanmalı; gaz basıncı ve elektrik yükü onaylanmadan ocak siparişi verilmemelidir.</p>`,
  },

  "projeler": {
    description:
      "Equsto referans projeler: demonte vaka anlatımları — catering ve modüler bar örnekleri.",
    lead: "Demonte vaka dizini: ekipman mantığı ve proje yaşam döngüsü; satılabilir paket iddiası yok.",
    body: `<p>Equsto referans sayfaları demonte vaka formatında yayınlanır: proje yaşam döngüsü, saha kısıtları ve ekipman seçim mantığı şeffaf biçimde okunur. Gerçek müşteri fotoğrafı ve alıntılar yayın sürecinde eklenebilir; sayfalar satılabilir paket değildir.</p><p>Her vaka canlı katalog modüllerine köprü kurar. Kesin liste <a href="/pfos">Proje Fabrikası</a> veya satış mühendisliği ile projeye özel üretilir.</p><ul><li><a href="/projeler/istanbul-yuksek-hacim-catering-demode">İstanbul yüksek hacim catering</a> — catering cluster vakası</li><li><a href="/projeler/izmir-moduler-bar-icecek-demode">İzmir modüler bar ve içecek</a> — Besos bar vakası</li></ul><p>Konsept rehberleri: <a href="/catering-mutfagi">catering mutfağı</a>, <a href="/bar-tasarimi-turkiye">bar tasarımı</a>.</p>`,
  },

  "projeler/izmir-moduler-bar-icecek-demode": {
    description:
      "İzmir modüler bar demode vakası: Besos modülleri, sahil nem koşulu, devreye alma.",
    lead: "Demonte vaka: İzmir modüler bar — Besos modül dizilimi ve sahil nem koşulu.",
    body: `<p>İzmir modüler bar demode vakası, Besos modülleri ile içecek ekipmanlarının aynı saha projesinde hizalanmasını anlatır. Bar tasarım mantığı <a href="/bar-tasarimi-turkiye">bar tasarımı rehberinde</a>; modül listesi <a href="/besos">Besos vitrininde</a> listelenir.</p><h2>Saha koşulları</h2><p>Sahil nem koşulu paslanmaz yüzey seçimini etkiler. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır; montaj sırasında su sızıntı testi yapılır.</p><h2>Devreye alma</h2><p>Bar personeli eğitimi devreye alma haftasında planlanır. İçecek ve kahve modülleri aynı garanti kaydı altında devreye alınır. Tam dizilim <a href="/pfos">Proje Fabrikası</a> bar konseptiyle yenilenir.</p><p>Demonte anlatım; kesin modül adetleri saha ölçüsüne göre değişir.</p>`,
  },

  "bulut-mutfak-kurulumu": {
    description: "Bulut mutfak kurulum rehberi artık dark kitchen rehberinde birleştirildi.",
    lead: "Bu sayfa /rehber/dark-kitchen-bulut-mutfak-2026 adresine taşındı.",
    body: `<p>Bulut mutfak ve dark kitchen kurulum içeriği tek rehberde toplandı. Güncel metin, ruhsat, MEP ve operasyon planlaması için <a href="/rehber/dark-kitchen-bulut-mutfak-2026">dark kitchen / bulut mutfak kurulum rehberine</a> gidin.</p><p>Teklif için <a href="/pfos">Proje Fabrikası</a> bulut mutfak konseptini kullanın.</p>`,
  },

  "restoran-mutfak-teklif": {
    description: "Restoran mutfak teklifi artık mutfak teklif platformunda birleştirildi.",
    lead: "Bu sayfa /mutfak-teklif-platformu adresine taşındı.",
    body: `<p>TR restoran teklif içeriği <a href="/mutfak-teklif-platformu">mutfak teklif platformu (PFOS)</a> sayfasında birleştirildi. Restoran checklist için <a href="/rehber/restoran-mutfak-kurulumu-checklist-2026">kurulum checklist</a> rehberine bakın.</p><p>Doğrudan teklif: <a href="/pfos">equsto.com/pfos</a></p>`,
  },

  "en/industrial-kitchen-supplier-turkey": {
    description:
      "Industrial kitchen supplier Turkey: B2B catalogue, Öztiryakiler distribution, Project Factory quotes, export.",
    lead: "B2B industrial kitchen equipment from Turkey — catalogue, authorized Öztiryakiler, export desk.",
    body: `<p>Equsto is a Turkey-based B2B industrial kitchen platform for restaurants, hotels, cloud kitchens and catering. Authorized Öztiryakiler distribution covers cooking, refrigeration, warewashing, prep, coffee and beverage lines in one workflow.</p><h2>Catalogue and projects</h2><p>Single-SKU orders and full turnkey lists use the same shop and quote flow. Live catalogue pricing applies EUR and TRY rates; stock is verified before order confirmation.</p><h2>Export</h2><p>Export markets include selected countries in the Gulf, Central Asia and Eastern Europe. Proforma invoices state Incoterms on the quote cover page. Öztiryakiler spare parts ship through the authorised dealer channel.</p><h2>Quotes</h2><p><a href="/en/commercial-kitchen-quotation">Commercial kitchen quotation</a> via Project Factory (PFOS) — concept and floor area inputs generate an equipment list. Site surveys close the gap between preliminary and final quotes.</p><p>Concept depth: GEO guides for steakhouse, fish restaurant, dark kitchen and hotel supply.</p>`,
  },

  "en/commercial-kitchen-quotation": {
    description:
      "Commercial kitchen quotation via Project Factory (PFOS): equipment list, VAT, logistics — Turkey B2B.",
    lead: "PFOS quotation platform — capacity, concept, menu inputs; sales engineering sign-off.",
    body: `<p>Project Factory (PFOS) is Equsto's B2B quotation platform for commercial kitchen projects. Capacity, concept and menu inputs drive module counts through the rule engine; VAT and logistics lines are included in the output file.</p><h2>Workflow</h2><p>Target turnaround is about five minutes for a preliminary quote summary. Quote PDFs include structured SKU and product code rows. Revisions are versioned under one project number.</p><h2>From draft to firm quote</h2><p>Preliminary lists become firm quotes after site survey and sales engineering review. Layout and MEP can be refined with gastronomy design on site. This is kitchen equipment supply, not reservation software.</p><p>Start at <a href="/en/pfos">equsto.com/en/pfos</a>. Supplier overview: <a href="/en/industrial-kitchen-supplier-turkey">industrial kitchen supplier Turkey</a>.</p>`,
  },
};

function patchBlog(data) {
  const blog = data.blog;
  if (!blog?.sections) return;
  for (const section of blog.sections) {
    for (const link of section.links || []) {
      if (link.href === "/catering-mutfagi") link.label = "Catering mutfağı (konsept hub)";
      if (link.href === "/rehber/500-kisilik-catering-ekipman-planlama-2026")
        link.label = "500 kişilik catering planlama";
      if (link.href === "/projeler/istanbul-yuksek-hacim-catering-demode")
        link.label = "İstanbul catering vakası";
    }
  }
}

function apply(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const [key, patch] of Object.entries(PATCHES)) {
    if (!data[key]) {
      console.warn("missing:", key);
      continue;
    }
    Object.assign(data[key], patch);
  }
  patchBlog(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched", filePath);
}

for (const p of PATHS) apply(p);

// EN landings — supplier + quotation only
const enPath = path.join(root, "lib/geo/landings-en.json");
const enOut = path.join(root, "public/data/geo-landings-en.json");
for (const p of [enPath, enOut]) {
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const key of ["en/industrial-kitchen-supplier-turkey", "en/commercial-kitchen-quotation"]) {
    if (data[key] && PATCHES[key]) Object.assign(data[key], PATCHES[key]);
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched EN", p);
}

console.log("done — rewrite-geo-sprint3");
