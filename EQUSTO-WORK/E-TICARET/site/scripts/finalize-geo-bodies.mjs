/**
 * Eski: 600–700 karakter. Güncel gövdeler: scripts/geo-bodies-words.json (600–700 sözcük) + apply-geo-bodies-words.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bodiesPath = path.join(root, "scripts/geo-bodies-600.json");
const jsPath = path.join(root, "public/eq-geo-landing.js");

/** @type {Record<string, string>} */
const BODIES = {
  steakhouse:
    "<p>Steakhouse mutfağında dry-age dolabı, yüksek ısı ızgara ve kuzine hattı ile et hazırlık modülleri aynı akışta toplanır. Davlumbaz statik basıncı ve soğutma hat uzunluğu proje başında doğrulanır; servis hızı ocak yayılımını belirler.</p><p>Pişirme ve muhafaza zonları birbirinden ayrılır; yıkama hızı pik öğün yükünü taşır. Kıyma ve dilimleme modülleri kısa mesafe kuralına uygun yerleştirilir.</p><p>Aşağıdaki tablo vitrin SKU örneklerine gider. Liste Proje Fabrikası’nda kapasite ve menüye göre genişletilir; montaj ve devreye alma satış mühendisliği planıyla sahada tamamlanır.</p>",
  cafe:
    "<p>Cafe kurulumunda espresso istasyonu, soğuk süt ve stok dolapları ile hazırlık tezgahı aynı gün içinde yoğun kullanılır. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir; paket servis oranı soğutma derinliğini artırır.</p><p>Vitrin soğutucu, yıkama hattı ve pastane modülleri menü profiline göre eklenir. Günlük bardak adedi ve eşzamanlı grup sayısı makine seçimini belirler.</p><p>Saha ölçüsü PFOS’ta netleşir; aşağıdaki tablo örnek SKU’lara bağlanır. Teklif özeti Proje Fabrikası’ndan alınır; montaj planı satış mühendisliği ile yürütülür.</p>",
  catering:
    "<p>Catering mutfağında yüksek hacim pişirme, taşıma ekipmanları ve konveyörlü yıkama aynı senaryoda modellenir. Banket çıkışlarında sıcak holding süresi menü mühendisliğini belirler; soğuk zincir derinliği ürün portföyüne göre ayrılır.</p><p>Pik kişi sayısı ve öğün aralığı ocak, soğutma ve yıkama adetlerini doğrudan etkiler. Taşıma ve termobox kapasitesi sevkiyat planıyla birlikte okunmalıdır.</p><p>Aşağıdaki tablo vitrin örneklerini gösterir. Tam liste Proje Fabrikası’nda kişi ve öğün profiliyle üretilir; saha keşfi montaj takviminin ilk adımıdır.</p>",
  fastfood:
    "<p>Fast food hattında fritöz ve ızgara yoğunluğu, soğutma stok derinliği ile hızlı yıkama kritiktir. Menü karması ekipman adetlerini doğrudan etkiler; paket ağırlığı yükseldikçe hazırlık ve muhafaza modülleri artar.</p><p>Servis süresi kısa olduğundan hat dizilimi paralel çalışır; sıcak holding ve soğuk stok aynı koridorda net ayrılır. Tezgah yüksekliği ve ergonomi ekip verimini etkiler.</p><p>Örnek SKU tablosu vitrine bağlanır. Kapasite girdileri PFOS’ta netleştirilir; liste iletişim veya Proje Fabrikası ile tamamlanır.</p>",
  finedining:
    "<p>Fine dining mutfağında düşük porsiyon sıklığı geniş ocak yayılımı getirir. Bitirme, sos ve soğuk holding hatları servis stiline göre ayrılır; davlumbaz ve tezgah yüksekliği ekip ergonomisine göre planlanır.</p><p>Steakhouse’a kıyasla dry-age ağırlığı düşük, dengeli pişirme ve hassas muhafaza öne çıkar. Porsiyonlama ve sıcak tutma süreleri menü mühendisliğiyle uyumludur.</p><p>Vitrin tablosu örnek modülleri listeler. Tam dizilim Proje Fabrikası’nda menü ve kapasiteyle modellenir; yerleşim Gastronomi Tasarımı ile derinleşir.</p>",
  bulut:
    "<p>Bulut mutfakta marka başına parsellenmiş sıcak ve soğuk hatlar ile ortak yıkama merkezi planlanır. Çok markalı senaryoda elektrik, havalandırma ve yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır.</p><p>Parsel bazlı üretim akışı çapraz bulaşmayı azaltır; ortak depo ve sevkiyat alanı markalar arasında net sınırlandırılır. Paket oranı yüksek markalarda hazırlık modülleri ayrı tutulur.</p><p>Örnek ekipman tablosu vitrin SKU’larına gider. PFOS çok markalı çıkışı modellemek için kullanılır; saha ölçüsü planın ilk girdisidir.</p>",
  allday:
    "<p>All day dining ve otel mutfağında kahvaltı, öğle ve akşam döngüsü aynı ekipmanı farklı yüklerle kullanır. Kahve istasyonu, sıcak hat ve soğuk stok gün boyu paralel yürür; banket çıkışlarında kapasite kısa sürede yükselir.</p><p>Öğün profili soğutma derinliğini ve yıkama hızını belirler. Oda servisi ve açık büfe aynı mutfakta farklı ekipman yoğunluğu oluşturabilir.</p><p>Aşağıdaki tablo örnek modülleri gösterir. Kişi sayısı ve otel segmenti Proje Fabrikası’nda girilerek liste tamamlanır.</p>",
  marketKasap:
    "<p>Market kurulumunda müşteri yolculuğu reyondan başlar. Dondurulmuş ada, soğutmalı gondol ve kasap bankosu aynı koridorda akıcı dizilir; paketli gıda ile taze et aynı hatta görünür, hazırlık ve depo arkada ayrılır.</p><p>Kasap ve şarküteri hattında kıyma, dilimleme ve vitrin sergisi farklı zonlardadır. +2/+4 °C teşhir ile −18 °C depo karışmaz; et tahtası, hijyen seti ve hızlı yıkama tazelik güvenliğini taşır.</p><p>Reyon genişliği ve günlük çıkış soğutucu adedini belirler. Liste Proje Fabrikası’nda netleşir; montaj satış mühendisliği planıyla yürütülür.</p>",
  projelerHub:
    "<p>Equsto referans sayfaları demonte vaka anlatımı sunar: proje yaşam döngüsü, zorunluluklar ve ekipman mantığı şeffaf biçimde okunur. Gerçek müşteri fotoğrafı ve alıntılar yayın sürecinde pekiştirilir; sayfalar satılabilir paket değildir.</p><p>Her vaka vitrin SKU’larına köprü kurar; teklif Proje Fabrikası veya iletişim hattıyla netleşir. Demonte anlatım saha koşullarını örnekler, kesin liste projeye özel üretilir.</p><p>Aşağıdaki bağlantılardan İstanbul catering ve İzmir modüler bar örneklerine geçebilirsiniz. PFOS aynı mantığı canlı listeye dönüştürür.</p>",
  projeIstanbul:
    "<p>İstanbul yüksek hacim catering demode diziliminde sıcak banket, yüksek kapasiteli pişirme ve konveyörlü yıkama aynı senaryoda modellenir. Toplu yemek ve banket çıkışlarında pik dakika yıkama hızını belirler.</p><p>Cephe kapasitesi ve baca kuyusu netleştirilmeden sipariş risklidir; saha ölçüsü önce alınır. Taşıma ve termobox ihtiyacı sevkiyat planıyla birlikte değerlendirilir.</p><p>PFOS’ta Catering konsepti ve şehir seçimiyle aynı mantık canlı listeye dönüşür. Aşağıdaki tablo örnek SKU’ları gösterir.</p>",
  projeIzmir:
    "<p>İzmir modüler bar ve içecek demode diziliminde Besos modülleri ile içecek ekipmanları aynı saha projesinde hizalanır. Vitrum Group menşeli bar çözümleri Bar Design Studio altında listelenir; servis akışı modül seçimini belirler.</p><p>Soğutmalı içecek hattı, kahve ve hazırlık modülleri bar ölçüsüne göre parsellenir. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır.</p><p>Besos vitrininde kırk iki modül örneği bulunur. Tam liste Proje Fabrikası veya iletişimle netleşir.</p>",
  rehberM2:
    "<p>Kişi başı mutfak metrekare planlamasında servis stili belirleyicidir: oturma, paket ve banket aynı m²’yi farklı kullanır. Yoğun paket oranı soğutma derinliğini artırır; oturma ağırlıklı işletmede sıcak tutma süreleri öne çıkar.</p><p>Alan hesabında servis hızı, menü karmaşıklığı ve eşzamanlı üretim dikkate alınır. Dar mutfaklarda dikey depolama ve modüler tezgahlar tercih edilir.</p><p>PFOS alan ve kişi sayısı soruları aynı mantığı otomatikler. Bu yazı 2026 kapasite varsayımlarıyla güncellenir; footer ve sitemap üzerinden erişilir.</p>",
  seoTurkiye:
    "<p>Türkiye’de endüstriyel mutfak ekipmanı arayan işletmeler için Equsto; pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanlarında canlı katalog ve satış mühendisliği sunar. Restoran, otel, kafe ve bulut mutfak aynı akışta modellenir.</p><p>Öztiryakiler yetkili bayii kanalı ve seçili global markalar aynı sepet ve teklif akışında birleşir. Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır.</p><p>Aşağıdaki tablo örnek SKU’lara gider. Tam liste Proje Fabrikası’nda üretilir; ihracat pazarları için iletişim hattı açıktır.</p>",
  seoRestoranTeklif:
    "<p>Restoran mutfak teklifi için menü, kapasite ve servis stili girilir; PFOS sıcak, soğutma ve yıkama adetlerini kural setiyle üretir. Teklif özeti KDV ve lojistik kalemlerini içerir; nihai tutar satış mühendisliği onayıyla kesinleşir.</p><p>İlk aşamada kapasite ve konsept yeterlidir; yerleşim Gastronomi Tasarımı ile derinleşir. CAD plan sonraki adımda eklenebilir.</p><p>Hedef süre yaklaşık beş dakikadır. Çıktı ön teklif dosyası olarak kullanılır; onay sonrası sipariş süreci başlar.</p>",
  seoOtel:
    "<p>Otel mutfak ekipman tedarikinde kahvaltı, öğle ve akşam döngüsü ile banket çıkışları aynı hatları farklı yüklerle kullanır. Gün boyu servis soğutma derinliğini ve yıkama kapasitesini artırır.</p><p>Oda servisi, açık büfe ve balo menüleri aynı mutfakta farklı ekipman yoğunluğu oluşturur. Kahve ve sıcak içecek hatları kahvaltı pikinde kritik rol oynar.</p><p>All day dining rehberi ile örtüşen senaryolar PFOS’ta modellenir. Aşağıdaki tablo vitrin örneklerine bağlanır.</p>",
  seoOzti:
    "<p>Öztiryakiler ekipmanı Equsto kataloğunda pişirme, soğutma, yıkama ve hazırlık departmanlarında listelenir. Yetkili bayii ilişkisi resmi fiyat listesi ve garanti hattını kapsar; canlı kur EUR ve TL’ye uygulanır.</p><p>Atalay ve seçili markalar aynı katalogda yer alır; Öztiryakiler ana omurgadır. Teknik ölçüler mm cinsinden ürün kartlarında okunur.</p><p>Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır. PFOS ile liste genişletilir.</p>",
  seoSogukOda:
    "<p>Soğuk oda teklifi için kapasite, ürün profili ve MEP koşulları birlikte değerlendirilir. Tezgah tipi ve dik tip modüller vitrin tablosunda örneklenir; soğuk oda projeleri ayrı mühendislik hattıyla yürür.</p><p>Menü ve hacim soğutma adedini belirler; şok dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır. Ön doğrulama satış mühendisliği ile yapılır.</p><p>Tam proje listesi Proje Fabrikası’nda veya iletişimle netleşir. Aşağıdaki tablo vitrin modüllerine örnektir.</p>",
  seoHavuzlu:
    "<p>Havuzlu tezgah tipi dolap seçiminde dış ölçü, GN uyumu ve kapasite vitrin kartında listelenir. Hazırlık ve servis hattına göre adet ve derinlik değişir; mm cinsinden teknik ölçü satırı ürün detayında bulunur.</p><p>Tezgah altı ve tezgah üstü modeller aynı hatta birlikte planlanır. Enerji ve soğutma tipi saha tesisatına göre seçilir.</p><p>Soğutma departmanı vitrininden benzer modüller karşılaştırılabilir. PFOS veya ürün sayfası üzerinden teklif satırına eklenebilir.</p>",
  seoPisirme:
    "<p>Endüstriyel pişirme hattında kuzine, ocak, fritöz, ızgara ve kaynatma modülleri menüye göre adetlendirilir. Gazlı ve elektrikli seçenekler vitrinde; saha gaz ve elektrik kapasitesine göre seçilir.</p><p>Pik çıkış ve eşzamanlı üretim ocak yayılımını belirler. Davlumbaz kapasitesi pişirme adediyle birlikte hesaplanır.</p><p>Aşağıdaki tablo örnek SKU’lara gider. Tam liste Proje Fabrikası’nda konsept ve kapasiteyle üretilir.</p>",
  seoTeklifPlatform:
    "<p>Proje Fabrikası, Equsto’nun teklif platformudur: konsept, kapasite ve menü girdileriyle ekipman listesi ve fiyat özeti üretir. Hedef süre yaklaşık beş dakikadır; çıktı satış mühendisliği onayıyla kesinleşir.</p><p>B2B endüstriyel mutfak tedarik akışıdır; rezervasyon veya masa yönetimi değildir. Kural motoru menü ve kapasiteye göre modül adetlerini üretir.</p><p>Teklif PDF’inde SKU ve ürün kodu satırları yapılandırılmış biçimde yer alır. Onay sonrası sipariş ve montaj planı başlar.</p>",
  seoBar:
    "<p>Bar tasarımı Equsto’da Bar Design Studio ile yürür; Vitrum Group menşeli modüler istasyonlar saha ölçüsü ve servis akışına göre seçilir. İçecek, kahve ve soğutma modülleri aynı bar hattında hizalanır.</p><p>Modül yüksekliği ve tezgah derinliği servis personeli ergonomisine göre ayarlanır. Buz makinesi ve depolama kapasitesi günlük bardak adedine bağlıdır.</p><p>Besos vitrininde kırk iki modül örneği listelenir. Tam dizilim Proje Fabrikası veya Besos sayfası üzerinden planlanır.</p>",
  seoEnIndustrial:
    "<p>Equsto is a Turkey-based industrial kitchen platform for restaurants, hotels, cloud kitchens and catering. Authorized Öztiryakiler distribution covers cooking, refrigeration, warewashing, prep, coffee and beverage lines in one catalog flow.</p><p>Export markets include selected countries in the Gulf, Central Asia and Eastern Europe. Single-SKU orders and full project lists use the same catalog and quote workflow.</p><p>Quote summaries are generated via Project Factory in about five minutes. Final pricing and logistics are confirmed by sales engineering before purchase orders are issued.</p>",
  seoEnQuotation:
    "<p>Project Factory generates equipment lists and quote summaries for commercial kitchen projects. Capacity, concept and menu inputs drive module counts; VAT and logistics lines are included in the output file.</p><p>Target turnaround is about five minutes. Layout and MEP can be refined later with gastronomy design and sales engineering on site.</p><p>This is B2B kitchen equipment supply, not table reservation software. Final sign-off is performed by the sales engineering team before purchase orders are issued.</p>",
  blogHub:
    "<p>Bu dizin blog ve GEO rehber içeriklerini vitrin menüsünden ayırır. Ekipman arayan kullanıcı doğrudan katalogda kalır; konsept ve teklif soruları bu sayfalarda yanıtlanır. Her rehberde sık sorulan sorular ve uygun sayfalarda vitrin SKU tablosu bulunur.</p><p>Konsept kurulum, arama hedefli sayfalar, editoryal rehberler ve referans projeler aşağıda bölümlere ayrılmıştır. Bağlantılar footer, sitemap ve llms.txt ile de dizinlenir.</p><p>Teklif özeti için Proje Fabrikası’nı kullanın. Steakhouse, bulut mutfak veya market reyonu için ilgili konsept bağlantısına geçebilirsiniz.</p>",
  rehberCatering500:
    "<p>Beş yüz kişilik catering ve banket çıkışlarında sıcak banket kapasitesi, soğuk zincir derinliği ve yıkama hızı belirleyicidir. Kişi sayısı ve öğün aralığı PFOS’ta modellenir; pik öğün ile sürekli banket ayrı senaryolardır.</p><p>Taşıma ekipmanları ve hazırlık modülleri menüye göre eklenir. Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır.</p><p>Catering mutfağı rehberi ve İstanbul demode sayfası ile birlikte okunmalıdır. Tam liste Proje Fabrikası’nda üretilir.</p>",
  rehberDarkKitchen:
    "<p>Dark kitchen ve bulut mutfak kurulumunda marka başına parsellenmiş sıcak-soğuk hatlar ve ortak yıkama merkezi planlanır. Elektrik ve havalandırma yükü çok markalı senaryoda artar; yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır.</p><p>Yüksek paket oranı soğutma ve hazırlık modülleri artırır. Markalar arası depo ve sevkiyat alanı net sınırlandırılmalıdır.</p><p>Bulut mutfak kurulum rehberi ile örtüşen adımlar PFOS’ta modellenir. Saha ölçüsü planın ilk girdisidir.</p>",
  rehberRestoranChecklist:
    "<p>Restoran mutfak kurulumu checklist akışı: menü, kapasite, alan, sıcak-soğuk-yıkama adetleri ve teklif. PFOS bu sırayı otomatikler; checklist saha toplantılarında manuel kontrol içindir.</p><p>İşletme tipi, oturma ve paket oranı, günlük öğün, mevcut tesisat, davlumbaz ve marka tercihi sırayla netleştirilir. Her adım sonraki modül adedini etkiler.</p><p>CAD plan ilk aşamada şart değildir; yerleşim Gastronomi Tasarımı ile derinleşir. Restoran teklif rehberi ile birlikte okunmalıdır.</p>",
  rehberKafeAcilis:
    "<p>Kafe açılış ekipman listesinde espresso merkezi, soğutmalı stok, hazırlık tezgahı, vitrin soğutucu ve yıkama hattı omurgayı oluşturur. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir.</p><p>Pastane ağırlıklı kafelerde fırın ve hazırlık modülleri eklenir. Paket oranı soğutma derinliğini artırır; oturma kapasitesi bardak adedini belirler.</p><p>Cafe kurulum rehberi ve kahve vitrini ile birlikte okunmalıdır. Liste Proje Fabrikası’nda tamamlanır.</p>",
};

const TAIL =
  " Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.";

for (const [key, html] of Object.entries(BODIES)) {
  let plain = html.replace(/<[^>]+>/g, "");
  while (plain.length < 600) {
    BODIES[key] = BODIES[key].replace(/<\/p>\s*$/, TAIL + "</p>");
    plain = BODIES[key].replace(/<[^>]+>/g, "");
  }
  if (plain.length < 600 || plain.length > 720) {
    console.warn(`${key}: ${plain.length} karakter`);
  } else {
    console.log(`${key}: ${plain.length} ok`);
  }
}

fs.writeFileSync(bodiesPath, JSON.stringify(BODIES, null, 2) + "\n");

let js = fs.readFileSync(jsPath, "utf8");
js = js.replace(
  /\(budget \? '<p class="eq-geo-budget">[\s\S]*?" : ""\)/,
  '(false ? "" : "")'
);
js = js.replace(/\n\s*budget:\s*[^,\n]+,/g, "\n      budget: null,");
js = js.replace(/\n\s*skipBudget:\s*true,/g, "\n");

for (const [profile, body] of Object.entries(BODIES)) {
  const escaped = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const re = new RegExp(
    `(${profile}:\\s*\\{)([\\s\\S]*?)(body:\\s*\\n?\\s*)"(?:[^"\\\\]|\\\\.)*"(\\s*,\\s*faq:)`,
    "m"
  );
  if (!re.test(js)) {
    console.error("fail", profile);
    process.exit(1);
  }
  js = js.replace(
    re,
    `$1$2$3"${escaped}"$4`
  );
  if (!js.includes(`${profile}: {\n      skipBudget: true`)) {
    js = js.replace(
      new RegExp(`(${profile}:\\s*\\{)`, "m"),
      `$1\n      skipBudget: true,`
    );
  }
}

fs.writeFileSync(jsPath, js);
console.log("eq-geo-landing.js + geo-bodies-600.json tamam");
