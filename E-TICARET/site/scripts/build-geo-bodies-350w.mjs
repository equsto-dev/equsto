/**
 * Generates geo-bodies-350w.json — 300–350 words/profile, <p> only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXT } from "./geo-bodies-350w-ext.mjs";
import { FILL, FILL3, FILL4, FILL5, FILL6 } from "./geo-bodies-350w-fill.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "geo-bodies-350w.json");

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function body(paragraphs) {
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

const CONTENT = {
  steakhouse: [
    "Steakhouse mutfağında dry-age dolabı, yüksek ısılı ızgara ve kuzine hattı ile et hazırlık modülleri tek servis akışında bir araya gelir. Davlumbaz statik basıncı ve soğutma hat uzunluğu mimari plan aşamasında doğrulanmalıdır; pik öğün yoğunluğu ocak yayılımını ve grill kapasitesini doğrudan belirler. Menüde yaşlandırılmış kesim ağırlığı arttıkça muhafaza zonları genişler, kıyma ve dilimleme modülleri kısa mesafe kuralına göre yerleştirilir.",
    "Dry-age süreci sıcak pişirmeden önce başlayan uzun vadeli sıcaklık ve nem disiplinidir. Nem kontrollü dolaplar etin su kaybını ve aromayı yönetir; teşhir vitrini ile karıştırılmaz. Kasaptan servise giden yolculuk santimetre cinsinden planlanarak çapraz bulaşma azaltılır. Equsto satış mühendisliği bu zonları PFOS steakhouse konseptinde menü profiline göre adetlendirir.",
    "Yüksek ısı ızgara ve kuzine hatları steakhouse'un görünür performansını taşır. Gazlı ve elektrikli seçenekler saha tesisatına göre ayrılır; eşzamanlı porsiyon sayısı ocak yayılımını belirler. Isı geri kazanımı ve davlumbaz kapasitesi pişirme adediyle birlikte okunmalıdır. Ocak altı dolap ve tepsi rafları servis hızına göre konumlandırılır.",
    "Pişirme ile muhafaza zonları fiziksel olarak ayrılır; yıkama hattı pik öğün yükünü taşıyacak kapasitede seçilir. Et hazırlık modülleri paslanmaz tezgah derinliği, et tahtası hijyen seti ve el yıkama noktalarıyla HACCP sırasına uyar. Hazırlık ile pişirme arası mesafe servis gecikmesini azaltır.",
    "PFOS steakhouse profili menü, kapasite ve servis stili girdileriyle ön teklif listesini dakikalar içinde üretir. Öztiryakiler pişirme ve soğutma modülleri aynı vitrin akışında listelenir. Saha keşfi sonrası yerleşim Gastronomi Tasarımı ile derinleşir; montaj ve devreye alma proje takvimine göre fazlanır.",
  ],
  cafe: [
    "Cafe kurulumunda espresso istasyonu, soğutmalı süt ve stok dolapları ile hazırlık tezgahı gün boyu yoğun kullanılır. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir; paket servis oranı soğutma derinliğini artırır. Günlük bardak adedi ve eşzamanlı grup sayısı makine seçimini belirler.",
    "Vitrin soğutucu, yıkama hattı ve pastane modülleri menü profiline göre eklenir. Pastane ağırlıklı kafelerde fırın ve hazırlık modülleri ayrı zon oluşturur. Bar arkası kablo kanalı ve gaz bağlantıları güvenlik standartlarına uygun planlanır. Oturma kapasitesi ile paket oranı birlikte okunduğunda stok derinliği netleşir.",
    "Kahve makinesi garantisi ve servis sözleşmesi devreye alma ile birlikte başlar. PFOS cafe konsepti bardak adedini, menü karmaşıklığını ve alan ölçüsünü sorarak modül adetlerini üretir. Soğutma zinciri denetiminde dijital termometreler sıcaklık kayıtlarını destekler.",
    "Dar mutfaklı kafelerde dikey depolama ve modüler tezgahlar alan verimliliğini artırır. Hazırlık tezgahı altı depolama bardak ve kapak stoğunu taşır. Ön teklif ile kesin teklif arasındaki fark saha keşfi ve marka tercihidir; Equsto satış mühendisliği bu boşluğu kapatır.",
    "2026 kafe açılışlarında su filtrasyonu ve basınç testi makine siparişinden önce tamamlanmalıdır. Canlı katalog fiyatları KDV hariç özetlenir; proje iskontoları teklif sırasında uygulanır. Montaj planı satış mühendisliği ile sahada yürütülür.",
  ],
  catering: [
    "Catering mutfağında yüksek hacimli pişirme, taşıma ekipmanları ve konveyörlü yıkama aynı senaryoda modellenir. Banket çıkışlarında sıcak holding süresi menü mühendisliğini belirler; soğuk zincir derinliği ürün portföyüne göre ayrılır. Pik kişi sayısı ve öğün aralığı ocak, soğutma ve yıkama adetlerini doğrudan etkiler.",
    "Taşıma ekipmanları ve termobox kapasitesi sevkiyat planıyla birlikte okunmalıdır. Banket menüsünde glütensiz veya vejetaryen hat ayrımı ek modül gerektirebilir; PFOS menü profili güncellenerek yeniden hesaplanır. Sevkiyat saatleri mutfak üretim penceresiyle çakışmamalıdır.",
    "Toplu yemek projelerinde yedek konveyör bant veya yedek pompa kurumsal sözleşmelerde tanımlanabilir. PFOS çıktısı ihale dosyasına eklenmeden önce satış mühendisliği onayı alınır. Soğuk zincir taşıma süresi menü güvenliğini belirler.",
    "Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır; bulaşık hattı üretim hattı devreye alınmadan tamamlanmalıdır. Ekipman montajı üretim penceresine göre fazlanır. Saha keşfi montaj takviminin ilk adımıdır.",
    "Equsto catering konsepti kişi sayısı, öğün profili ve menü girdileriyle tam ekipman listesini üretir. Öztiryakiler pişirme ve soğutma modülleri aynı teklif akışında yer alır. İstanbul referans projeleri yüksek hacim senaryolarını örnekler.",
  ],
  fastfood: [
    "Fast food hattında fritöz ve ızgara yoğunluğu, soğutma stok derinliği ile hızlı yıkama kritiktir. Menü karması ekipman adetlerini doğrudan etkiler; paket ağırlığı yükseldikçe hazırlık ve muhafaza modülleri artar. Servis süresi kısa olduğundan hat dizilimi paralel çalışır.",
    "Sıcak holding ve soğuk stok aynı koridorda net ayrılır; tezgah yüksekliği ve ergonomi ekip verimini etkiler. Hızlı servis zincirlerinde standart modül seti PFOS şablonu olarak saklanır. Yeni şube açılışları aynı listeyi kopyalayıp kapasite girdisini günceller.",
    "Paketleme istasyonu soğuk içecek ve sıcak ürün akışını ayırır. Kurye bekleme alanı mutfak çıkışına yakın planlanır. Ön teklif onayı franchise teknik şartnamesiyle karşılaştırılır.",
    "PFOS fast food profili menü karması, günlük kapasite ve paket oranını sorarak modül adetlerini hesaplar. Davlumbaz kapasitesi fritöz ve ızgara adediyle birlikte okunmalıdır. Enerji yükü elektrik panosu boyutlandırmasını etkiler.",
    "2026 fast food hatlarında fritöz ve ızgara yoğunluğu menü karmasıyla doğrudan orantılıdır. Canlı vitrin fiyatları KDV hariç özetlenir; proje iskontoları teklif sırasında uygulanır. Montaj ve devreye alma satış mühendisliği planıyla yürütülür.",
  ],
  finedining: [
    "Fine dining mutfağında düşük porsiyon sıklığı geniş ocak yayılımı getirir. Bitirme, sos ve soğuk holding hatları servis stiline göre ayrılır; davlumbaz ve tezgah yüksekliği ekip ergonomisine göre planlanır. Steakhouse'a kıyasla dry-age ağırlığı düşük, dengeli pişirme ve hassas muhafaza öne çıkar.",
    "Porsiyonlama ve sıcak tutma süreleri menü mühendisliğiyle uyumludur. Fine dining projelerinde şef brifingi ekipman listesini doğrular; PFOS taslağı bu brifingle güncellenir. Açık mutfak projelerinde ses ve koku yönetimi havalandırma tasarımına bağlıdır.",
    "Işık planı teşhir ve pişirme zonlarını ayırır. Premium malzeme teslimatı montaj takvimine göre fazlanabilir. Gastronomi Tasarımı yerleşim çizimini derinleştirir; CAD planı sonraki aşamada eklenebilir.",
    "Bitirme ve sos hatları servis stiline göre ayrılır; porsiyonlama ritmi ocak yayılımını etkiler. Soğuk holding ve sıcak tutma modülleri menüdeki hassasiyet derecesine göre seçilir. Yıkama hattı düşük hacimli ama yüksek hijyen standardında planlanır.",
    "PFOS fine dining konsepti kapasite, menü ve servis stili girdileriyle ön teklif üretir. Öztiryakiler pişirme modülleri ve soğutma ekipmanları aynı vitrin akışında listelenir. Saha keşfi sonrası kesin liste satış mühendisliği onayıyla netleşir.",
  ],
  bulut: [
    "Bulut mutfakta marka başına parsellenmiş sıcak ve soğuk hatlar ile ortak yıkama merkezi planlanır. Çok markalı senaryoda elektrik, havalandırma ve yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır. Parsel bazlı üretim akışı çapraz bulaşmayı azaltır.",
    "Ortak depo ve sevkiyat alanı markalar arasında net sınırlandırılır. Paket oranı yüksek markalarda hazırlık modülleri ayrı tutulur. Çok markalı tesiste ortak fire ve atık yönetimi sözleşmeyle netleşir.",
    "PFOS her marka için ayrı modül satırı üretebilir; marka sayısı ve saha ölçüsü planın ilk girdileridir. Elektrik panosu marka toplam yüküne göre yeniden boyutlandırılır. Gece üretim profili ayrı senaryoda modellenir.",
    "Kurye platformu entegrasyonu mutfak çıkış layoutunu etkiler. Yüksek paket oranı soğutma ve hazırlık modüllerini artırır. MEP kapasitesi ruhsat aşamasında erken doğrulanmalıdır.",
    "Equsto bulut mutfak konsepti çok markalı çıkışı PFOS ile modellemek için kullanılır. Öztiryakiler pişirme ve soğutma modülleri marka başına adetlendirilir. Saha keşfi montaj takviminin temelidir.",
  ],
  allday: [
    "All day dining ve otel mutfağında kahvaltı, öğle ve akşam döngüsü aynı ekipmanı farklı yüklerle kullanır. Kahve istasyonu, sıcak hat ve soğuk stok gün boyu paralel yürür; banket çıkışlarında kapasite kısa sürede yükselir. Öğün profili soğutma derinliğini ve yıkama hızını belirler.",
    "Oda servisi ve açık büfe aynı mutfakta farklı ekipman yoğunluğu oluşturabilir. Kahvaltı piki yıkama ve kahve hatlarını belirler. Otel yenileme projelerinde eski ekipman sökümü montaj planına dahil edilir.",
    "Kahvaltı büfe teşhir uzunluğu soğutucu adedini artırır. Gece mini bar replenishment soğutma stok derinliğini etkiler. Banket hafta sonu pikleri geçici personel ve ekipman rezervi gerektirebilir.",
    "PFOS otel konsepti kişi sayısı, otel segmenti ve öğün profili girdileriyle liste üretir. All day dining rehberi ile örtüşen senaryolar aynı PFOS akışındadır. Bar Design Studio lounge bar entegrasyonunu planlar.",
    "2026 otel ve all day dining projelerinde öğün profili soğutma derinliğini etkiler. Canlı vitrin fiyatları KDV hariç özetlenir. Montaj ve devreye alma proje fazlarına göre yürütülür.",
  ],
  marketKasap: [
    "Market kurulumunda müşteri yolculuğu reyondan başlar. Dondurulmuş ada, soğutmalı gondol ve kasap bankosu aynı koridorda dizilir; hazırlık ve depo arkada ayrılır. Kasap hattında kıyma, dilimleme ve vitrin sergisi farklı zonlardadır.",
    "Hijyen zonları kasap hazırlık hattında et tahtası, el yıkama ve hızlı yıkama modülleriyle tamamlanır. Market reyonu yenilemede müşteri trafiği geçici yönlendirme gerektirir. PFOS reyon uzunluğu girdisi güncellenir.",
    "Kasap vitrin sergisi günlük kesim planıyla uyumlu olmalıdır. Şarküteri peynir humidor ihtiyacı ayrı modül gerektirir. Soğutma zinciri alarm sistemi kurumsal market standardına uyar.",
    "2026 market projelerinde reyon genişliği soğutucu adedini belirler. Dondurulmuş ada ile soğutmalı gondol arasındaki mesafe müşteri akışını düzenler. Hazırlık zonu reyonun arkasında gizlenir.",
    "Equsto market kasap konsepti reyon uzunluğu ve ürün portföyü girdileriyle liste üretir. Öztiryakiler soğutma modülleri vitrin akışında listelenir. Teklif özeti satış mühendisliği onayıyla kesinleşir.",
  ],
  projelerHub: [
    "Equsto referans sayfaları demonte vaka anlatımı sunar: proje yaşam döngüsü, zorunluluklar ve ekipman mantığı şeffaf biçimde okunur. Gerçek müşteri fotoğrafı ve alıntılar yayın sürecinde pekiştirilir; sayfalar satılabilir paket değildir.",
    "Her vaka canlı katalog modüllerine köprü kurar; teklif Proje Fabrikası veya iletişim hattıyla netleşir. Demonte anlatım saha koşullarını örnekler, kesin liste projeye özel üretilir. Hub okuyucusu PFOS veya iletişim kanalına yönlendirilir.",
    "Vaka güncellemeleri yeni vitrin fiyatlarıyla senkronize edilir. Teknik sorular satış mühendisliğine iletilir. Referans listesi demonte formatını korur; satılabilir paket iddiası taşınmaz.",
    "İstanbul catering ve İzmir modüler bar örnekleri dizinden erişilir. PFOS aynı mantığı canlı listeye dönüştürür. Fotoğraf ve alıntılar yayın sürecinde güncellenir.",
    "2026 referans sayfaları proje yaşam döngüsünü şeffaf biçimde anlatır. Kesin ekipman listesi PFOS ile üretilir. Montaj ve devreye alma proje takvimine göre fazlanır.",
  ],
  projeIstanbul: [
    "İstanbul yüksek hacim catering demode diziliminde sıcak banket, yüksek kapasiteli pişirme ve konveyörlü yıkama aynı senaryoda modellenir. Toplu yemek ve banket çıkışlarında pik dakika yıkama hızını belirler. Cephe kapasitesi ve baca kuyusu netleştirilmeden sipariş risklidir.",
    "Saha ölçüsü önce alınır; taşıma ve termobox ihtiyacı sevkiyat planıyla birlikte değerlendirilir. İstanbul catering demode baca ve cephe kısıtını örnekler. PFOS aynı kapasite profiliyle tekrarlanabilir.",
    "Sevkiyat trafiği üretim penceresini daraltabilir; plan buna göre fazlanır. Pik banket provası devreye almanın parçasıdır. Yoğun şehir içi cateringde MEP koşulları erken doğrulanmalıdır.",
    "Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır. Ekipman montajı üretim hattı devreye alınmadan tamamlanmalıdır. PFOS Catering konsepti ve şehir seçimiyle canlı listeye dönüşür.",
    "Equsto İstanbul referans projesi yüksek hacim senaryolarını demonte vaka formatında anlatır. Öztiryakiler pişirme ve yıkama modülleri aynı teklif akışında yer alır. Saha keşfi montaj takviminin ilk adımıdır.",
  ],
  projeIzmir: [
    "İzmir modüler bar ve içecek demode diziliminde Besos modülleri ile içecek ekipmanları aynı saha projesinde hizalanır. Vitrum Group menşeli bar çözümleri Bar Design Studio altında listelenir; servis akışı modül seçimini belirler.",
    "Soğutmalı içecek hattı, kahve ve hazırlık modülleri bar ölçüsüne göre parsellenir. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır. İzmir modüler bar demode su ve elektrik noktalarını örnekler.",
    "Bar açılış haftası montaj ve eğitim yoğunluğu yaratır. PFOS bar konseptiyle liste yenilenir. İçecek ve kahve modülleri aynı garanti hattında kayıt altına alınır.",
    "Besos vitrininde kırk iki modül örneği bulunur. Bar ölçüsü modül parsellemesini belirler. Modül yüksekliği ve tezgah derinliği servis personeli ergonomisine göre ayarlanır.",
    "Equsto İzmir referans projesi modüler bar senaryolarını demonte vaka formatında anlatır. Tam dizilim Proje Fabrikası veya Besos sayfası üzerinden planlanır. Montaj planı satış mühendisliği ile yürütülür.",
  ],
  rehberM2: [
    "Kişi başı mutfak metrekare planlamasında servis stili belirleyicidir: oturma, paket ve banket aynı metrekareyi farklı kullanır. Yoğun paket oranı soğutma derinliğini artırır; oturma ağırlıklı işletmede sıcak tutma süreleri öne çıkar. Alan hesabında servis hızı, menü karmaşıklığı ve eşzamanlı üretim dikkate alınır.",
    "Dar mutfaklarda dikey depolama ve modüler tezgahlar tercih edilir. Metrekare planı depo ve yıkama alanını içermelidir. PFOS alan sorusu planı otomatikler.",
    "2026 kapasite varsayımları oturma, paket ve banket senaryolarını ayrı okur. Kişi başı metrekare rehberi footer ve sitemap üzerinden erişilir. Rehber 2026 kapasite varsayımlarıyla güncellenir.",
    "Servis stili değiştikçe ocak yayılımı ve soğutma adedi farklılaşır. Banket ağırlıklı işletmelerde taşıma ekipmanları alan planına dahil edilmelidir. Yıkama zonu genellikle göz ardı edilen ama kritik alandır.",
    "PFOS alan ve kişi sayısı soruları aynı mantığı otomatikler. Equsto satış mühendisliği dar mutfak çözümlerinde modüler tezgah önerir. Kesin liste proje girdileriyle üretilir.",
  ],
  rehberCatering500: [
    "Beş yüz kişilik catering ve banket çıkışlarında sıcak banket kapasitesi, soğuk zincir derinliği ve yıkama hızı belirleyicidir. Kişi sayısı ve öğün aralığı PFOS'ta modellenir; pik öğün ile sürekli banket ayrı senaryolardır. Taşıma ekipmanları ve hazırlık modülleri menüye göre eklenir.",
    "Konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır. Banket menüsünde glütensiz veya vejetaryen hat ayrımı ek modül gerektirebilir. Sevkiyat saatleri mutfak üretim penceresiyle çakışmamalıdır.",
    "Catering mutfağı rehberi ve İstanbul demode sayfası ile birlikte okunmalıdır. PFOS catering konsepti kişi sayısı girdisiyle modül adetlerini hesaplar. Saha keşfi montaj takviminin ilk adımıdır.",
    "Sıcak holding süresi menü mühendisliğini belirler; soğuk zincir derinliği ürün portföyüne göre ayrılır. Termobox kapasitesi sevkiyat planıyla birlikte okunmalıdır. Ekipman montajı üretim hattı devreye alınmadan tamamlanmalıdır.",
    "2026 catering planlamasında taşıma modülleri menü profiline göre eklenir. Banket çıkışları kapasiteyi kısa sürede yükseltir. Equsto satış mühendisliği pik senaryoyu ayrı modellemeyi önerir.",
  ],
  rehberDarkKitchen: [
    "Dark kitchen ve bulut mutfak kurulumunda marka başına parsellenmiş sıcak-soğuk hatlar ve ortak yıkama merkezi planlanır. Elektrik ve havalandırma yükü çok markalı senaryoda artar; yağ sıyırıcı kapasitesi toplam menüye göre hesaplanır. Yüksek paket oranı soğutma ve hazırlık modülleri artırır.",
    "Markalar arası depo ve sevkiyat alanı net sınırlandırılmalıdır. Çok markalı tesiste ortak fire ve atık yönetimi sözleşmeyle netleşir. Kurye platformu entegrasyonu mutfak çıkış layoutunu etkiler.",
    "Bulut mutfak kurulum rehberi ile örtüşen adımlar PFOS'ta modellenir. Saha ölçüsü planın ilk girdisidir. PFOS her marka için ayrı modül satırı üretebilir.",
    "2026 dark kitchen rehberi çok markalı ruhsat senaryosunda MEP kapasitesini vurgular. Gece üretim profili ayrı senaryoda modellenir. Elektrik panosu marka toplam yüküne göre yeniden boyutlandırılır.",
    "Equsto bulut mutfak konsepti marka sayısı ve menü girdileriyle liste üretir. Öztiryakiler pişirme ve soğutma modülleri marka başına adetlendirilir. Montaj planı satış mühendisliği ile yürütülür.",
  ],
  rehberRestoranChecklist: [
    "Restoran mutfak kurulumu checklist akışı menü, kapasite, alan, sıcak-soğuk-yıkama adetleri ve teklif sırasını izler. PFOS bu sırayı otomatikler; checklist saha toplantılarında manuel kontrol içindir. İşletme tipi, oturma ve paket oranı, günlük öğün, mevcut tesisat, davlumbaz ve marka tercihi sırayla netleştirilir.",
    "Her adım sonraki modül adedini etkiler. CAD plan ilk aşamada şart değildir; yerleşim Gastronomi Tasarımı ile derinleşir. Restoran teklif rehberi ile birlikte okunmalıdır.",
    "2026 restoran açılışlarında tesisat ve davlumbaz rotası modül adedini etkiler. Checklist saha toplantılarında manuel kontrol içindir. PFOS menü-kapasite-alan-teklif sırasını otomatikler.",
    "Marka tercihi teklif dosyasına yansır; Öztiryakiler ana omurga olarak listelenir. Saha keşfi ön teklif ile kesin teklif arasındaki boşluğu kapatır. Montaj takvimi proje fazlarına göre hazırlanır.",
    "Equsto restoran checklist akışı PFOS sırasını yansıtır. Satış mühendisliği onayı kesin fiyatı belirler. Gastronomi Tasarımı yerleşim sorularını derinleştirir.",
  ],
  rehberKafeAcilis: [
    "Kafe açılış ekipman listesinde espresso merkezi, soğutmalı stok, hazırlık tezgahı, vitrin soğutucu ve yıkama hattı omurgayı oluşturur. Su filtrasyonu ve basınç doğrulaması makine seçiminden önce sabitlenmelidir. Pastane ağırlıklı kafelerde fırın ve hazırlık modülleri eklenir.",
    "Paket oranı soğutma derinliğini artırır; oturma kapasitesi bardak adedini belirler. Cafe kurulum rehberi ve kahve vitrini ile birlikte okunmalıdır. PFOS cafe konsepti bardak adedini ve menü profilini sorar.",
    "2026 kafe açılış listesinde su filtrasyonu makine seçiminden önce sabitlenmelidir. Espresso merkezi ve soğuk stok cafe konseptinde paralel planlanır. Bar arkası kablo kanalı güvenlik standartlarına uymalıdır.",
    "Makine garantisi ve servis sözleşmesi devreye alma ile birlikte başlar. Hazırlık tezgahı altı depolama bardak ve kapak stoğunu taşır. Dar mutfaklı kafelerde dikey depolama tercih edilir.",
    "Equsto kafe açılış rehberi PFOS cafe profiliyle liste üretir. Canlı vitrin fiyatları KDV hariç özetlenir. Montaj planı satış mühendisliği ile sahada yürütülür.",
  ],
  seoTurkiye: [
    "Türkiye'de endüstriyel mutfak ekipmanı arayan işletmeler için Equsto; pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanlarında canlı katalog ve satış mühendisliği sunar. Restoran, otel, kafe ve bulut mutfak aynı akışta modellenir. Öztiryakiler yetkili bayii kanalı ve seçili global markalar aynı sepet ve teklif akışında birleşir.",
    "Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır. PFOS ile liste genişletilir. Türkiye endüstriyel mutfak aramasında Equsto katalog ve PFOS birleşir.",
    "İhracat iletişim hattı lojistik sorularını yanıtlar. Satış mühendisliği onayı zorunludur. GEO sayfaları konsept derinliği sağlar; vitrin doğrudan alışveriş akışıdır.",
    "2026 endüstriyel mutfak aramalarında tüm departmanlar tek vitrinde listelenir. Canlı katalog fiyat ve stok doğrular. Hizmet bölgeleri Türkiye ve seçili ihracat pazarlarını kapsar.",
    "Equsto B2B endüstriyel mutfak tedarik platformu restoran, otel ve catering projelerini aynı akışta yönetir. Proje Fabrikası teklif özeti üretir. Montaj ve devreye alma proje planında yürür.",
  ],
  seoRestoranTeklif: [
    "Restoran mutfak teklifi için menü, kapasite ve servis stili girilir; PFOS sıcak, soğutma ve yıkama adetlerini kural setiyle üretir. Teklif özeti KDV ve lojistik kalemlerini içerir; nihai tutar satış mühendisliği onayıyla kesinleşir. İlk aşamada kapasite ve konsept yeterlidir.",
    "Yerleşim Gastronomi Tasarımı ile derinleşir; CAD plan sonraki adımda eklenebilir. Hedef süre yaklaşık beş dakikadır. Çıktı ön teklif dosyası olarak kullanılır.",
    "Restoran teklif PFOS menü, kapasite ve servis girdileriyle üretilir. Sıcak-soğuk-yıkama adetleri kural motoruyla belirlenir. Checklist rehberi saha toplantısında manuel kontrol sağlar.",
    "2026 restoran tekliflerinde KDV ve lojistik kalemleri özet dosyada yer alır. Onay sonrası sipariş süreci başlar. Marka tercihi teklif dosyasına yansır.",
    "Equsto restoran teklif akışı B2B endüstriyel mutfak tedarikidir. PFOS taslak listesi satış mühendisliği onayı sonrası kesinleşir. Montaj planı proje takvimine göre hazırlanır.",
  ],
  seoOtel: [
    "Otel mutfak ekipman tedarikinde kahvaltı, öğle ve akşam döngüsü ile banket çıkışları aynı hatları farklı yüklerle kullanır. Gün boyu servis soğutma derinliğini ve yıkama kapasitesini artırır. Oda servisi, açık büfe ve balo menüleri aynı mutfakta farklı ekipman yoğunluğu oluşturur.",
    "Kahve ve sıcak içecek hatları kahvaltı pikinde kritik rol oynar. All day dining rehberi ile örtüşen senaryolar PFOS'ta modellenir. Otel mutfak teklifi kahvaltı, banket ve oda servisi yüklerini birleştirir.",
    "PFOS otel konseptiyle modellenir. Bar Design Studio lounge bar entegrasyonunu planlar. Kahvaltı piki kahve ve yıkama hatlarını belirler.",
    "2026 otel tedarik dosyalarında banket çıkışları kapasiteyi yükseltir. Otel yenileme projelerinde eski ekipman sökümü montaj planına dahil edilir. Canlı vitrin fiyatları KDV hariç özetlenir.",
    "Equsto otel mutfak tedarik akışı PFOS otel profiliyle liste üretir. Öztiryakiler pişirme ve soğutma modülleri aynı teklif akışında yer alır. Montaj ve devreye alma proje fazlarına göre yürütülür.",
  ],
  seoOzti: [
    "Öztiryakiler ekipmanı Equsto kataloğunda pişirme, soğutma, yıkama ve hazırlık departmanlarında listelenir. Yetkili bayii ilişkisi resmi fiyat listesi ve garanti hattını kapsar; canlı kur EUR ve TL'ye uygulanır. Atalay ve seçili markalar aynı katalogda yer alır.",
    "Öztiryakiler ana omurgadır. Teknik ölçüler mm cinsinden ürün kartlarında okunur. Tek ürün siparişinden anahtar teslim projeye aynı vitrin kullanılır.",
    "Öztiryakiler yetkili bayii Equsto üzerinden listelenir. PFOS modül adetlerini üretir. Garanti bayii süreciyle uyumludur.",
    "2026 katalogda teknik ölçüler mm cinsinden ürün kartlarında okunur. Canlı vitrin fiyatları KDV hariç özetlenir. Proje iskontoları teklif sırasında uygulanır.",
    "Equsto Öztiryakiler bayii kanalı resmi fiyat sunar. PFOS ile liste genişletilir. Satış mühendisliği onayı kesin fiyatı belirler.",
  ],
  seoSogukOda: [
    "Soğuk oda teklifi için kapasite, ürün profili ve MEP koşulları birlikte değerlendirilir. Tezgah tipi ve dik tip modüller proje listesinde örneklenir; soğuk oda projeleri ayrı mühendislik hattıyla yürür. Menü ve hacim soğutma adedini belirler.",
    "Şok dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır. Ön doğrulama satış mühendisliği ile yapılır. Soğuk oda kapasite ve MEP birlikte değerlendirilir.",
    "PFOS soğutma modüllerini listeler. Ayrı mühendislik hattı büyük projelerde devreye girer. Soğuk zincir planlamasında menü ve hacim soğutma adedini belirler.",
    "2026 soğuk zincir planlamasında menü ve hacim soğutma adedini belirler. Enerji yükü elektrik panosu boyutlandırmasını etkiler. Alarm sistemi kurumsal standarda uyar.",
    "Equsto soğuk oda teklif akışı kapasite ve ürün profili girdileriyle liste üretir. Öztiryakiler soğutma modülleri vitrin akışında listelenir. Montaj planı satış mühendisliği ile yürütülür.",
  ],
  seoHavuzlu: [
    "Havuzlu tezgah tipi dolap seçiminde dış ölçü, GN uyumu ve kapasite vitrin kartında listelenir. Hazırlık ve servis hattına göre adet ve derinlik değişir; mm cinsinden teknik ölçü satırı ürün detayında bulunur. Tezgah altı ve tezgah üstü modeller aynı hatta birlikte planlanır.",
    "Enerji ve soğutma tipi saha tesisatına göre seçilir. Soğutma departmanı vitrininden benzer modüller karşılaştırılabilir. PFOS veya ürün sayfası üzerinden teklif satırına eklenebilir.",
    "GN uyumu ve dış ölçü vitrin kartında listelenir. Hazırlık hattına göre adet ve derinlik değişir. 2026 havuzlu tezgah seçiminde enerji tipi saha tesisatına göre belirlenir.",
    "Havuzlu tezgah modelleri hazırlık ve servis zonlarında farklı derinlik gerektirir. Paslanmaz yüzey hijyen standardına uyar. Modüler yerleşim dar mutfaklarda alan verimliliğini artırır.",
    "Equsto havuzlu tezgah seçim rehberi PFOS soğutma profiliyle liste üretir. Canlı vitrin fiyatları KDV hariç özetlenir. Teklif özeti satış mühendisliği onayıyla kesinleşir.",
  ],
  seoPisirme: [
    "Endüstriyel pişirme hattında kuzine, ocak, fritöz, ızgara ve kaynatma modülleri menüye göre adetlendirilir. Gazlı ve elektrikli seçenekler vitrinde; saha gaz ve elektrik kapasitesine göre seçilir. Pik çıkış ve eşzamanlı üretim ocak yayılımını belirler.",
    "Davlumbaz kapasitesi pişirme adediyle birlikte hesaplanır. PFOS pişirme profili menü ve kapasite girdileriyle modül adetlerini üretir. Isı geri kazanımı enerji verimliliğini etkiler.",
    "Gazlı ve elektrikli seçenekler saha tesisatına göre filtrelenir. 2026 pişirme hatlarında davlumbaz kapasitesi ocak adediyle birlikte hesaplanır. Pik çıkış cookline yayılımını belirler.",
    "Öztiryakiler pişirme modülleri ana omurga olarak listelenir. Kuzine, fritöz ve ızgara modülleri menü karmasına göre adetlendirilir. Montaj planı davlumbaz rotasıyla birlikte hazırlanır.",
    "Equsto endüstriyel pişirme rehberi PFOS konsept profiliyle liste üretir. Canlı vitrin fiyatları KDV hariç özetlenir. Satış mühendisliği onayı kesin fiyatı belirler.",
  ],
  seoTeklifPlatform: [
    "Proje Fabrikası, Equsto'nun teklif platformudur: konsept, kapasite ve menü girdileriyle ekipman listesi ve fiyat özeti üretir. Hedef süre yaklaşık beş dakikadır; çıktı satış mühendisliği onayıyla kesinleşir. B2B endüstriyel mutfak tedarik akışıdır.",
    "Rezervasyon veya masa yönetimi değildir. Kural motoru menü ve kapasiteye göre modül adetlerini üretir. Teklif PDF'inde SKU ve ürün kodu satırları yapılandırılmış biçimde yer alır.",
    "Onay sonrası sipariş ve montaj planı başlar. Kural motoru menü ve kapasiteye göre modül adetlerini üretir. 2026 teklif PDF'lerinde SKU satırları yapılandırılmış biçimde yer alır.",
    "PFOS taslak listesi satış mühendisliği onayı ve saha keşfi sonrası kesinleşir. Hedef ön teklif süresi yaklaşık beş dakikadır. B2B platform rezervasyon yazılımı değildir.",
    "Equsto Proje Fabrikası restoran, otel ve catering projelerini aynı akışta yönetir. Öztiryakiler modülleri kural motoruyla adetlendirilir. Montaj ve devreye alma proje numarası altında yürütülür.",
  ],
  seoBar: [
    "Bar tasarımı Equsto'da Bar Design Studio ile yürür; Vitrum Group menşeli modüler istasyonlar saha ölçüsü ve servis akışına göre seçilir. İçecek, kahve ve soğutma modülleri aynı bar hattında hizalanır. Modül yüksekliği ve tezgah derinliği servis personeli ergonomisine göre ayarlanır.",
    "Buz makinesi ve depolama kapasitesi günlük bardak adedine bağlıdır. Besos vitrininde kırk iki modül örneği listelenir. Tam dizilim Proje Fabrikası veya Besos sayfası üzerinden planlanır.",
    "Vitrum Group modüler istasyonları saha ölçüsüne göre seçilir. 2026 bar projelerinde buz makinesi kapasitesi günlük bardak adedine bağlıdır. Elektrik ve su noktaları modül yerleşiminden önce doğrulanır.",
    "Bar açılış haftası montaj ve eğitim yoğunluğu yaratır. İçecek ve kahve modülleri aynı garanti hattında kayıt altına alınır. PFOS bar konseptiyle liste yenilenir.",
    "Equsto Bar Design Studio modüler bar projelerini planlar. Besos modülleri saha ölçüsüne göre parsellenir. Montaj planı satış mühendisliği ile yürütülür.",
  ],
  seoEnIndustrial: [
    "Equsto is a Turkey-based industrial kitchen platform serving restaurants, hotels, cloud kitchens and catering operators. Authorized Öztiryakiler distribution covers cooking, refrigeration, warewashing, prep, coffee and beverage lines in one catalog workflow. Single-SKU orders and full project lists use the same shop and quote flow.",
    "Export markets include selected countries in the Gulf, Central Asia and Eastern Europe. Live catalogue pricing and sales engineering sit in one B2B workflow. GEO landing pages provide concept depth while the catalogue handles direct purchasing.",
    "Project Factory generates equipment lists and quote summaries in about five minutes. Final pricing, logistics and installation are confirmed by sales engineering before purchase orders are issued. This is commercial kitchen supply, not reservation software.",
    "Gastronomy design refines layout after the initial PFOS draft. Site surveys close the gap between preliminary and final quotes. Installation and commissioning follow the project schedule agreed with sales engineering.",
    "Equsto supports turnkey projects from concept input through equipment delivery. Öztiryakiler modules form the core of most cooking and refrigeration lines. Contact the export desk for markets outside Turkey.",
  ],
  seoEnQuotation: [
    "Project Factory is Equsto's quotation platform for commercial kitchen projects. Capacity, concept and menu inputs drive module counts; VAT and logistics lines are included in the output file. Target turnaround is about five minutes for a preliminary quote summary.",
    "Layout and MEP can be refined later with gastronomy design and on-site sales engineering. The rule engine calculates hot, cold and warewashing module counts from menu and capacity data. Final sign-off is performed by the sales engineering team.",
    "This is B2B kitchen equipment supply, not table reservation software. Quote PDFs include structured SKU and product code rows. Approval triggers the order and installation planning phase.",
    "Preliminary lists become firm quotes after site survey and sales engineering review. Öztiryakiler and selected global brands share the same cart and quote workflow. Export markets use the same platform with logistics confirmed separately.",
    "Equsto quotation workflow covers restaurants, hotels, cloud kitchens and catering from one entry point. PFOS concept profiles model each operation type differently. Installation is planned against the approved equipment list.",
  ],
  blogHub: [
    "Bu dizin blog ve GEO rehber içeriklerini vitrin menüsünden ayırır. Ekipman arayan kullanıcı doğrudan katalogda kalır; konsept ve teklif soruları bu sayfalarda yanıtlanır. Her rehberde sık sorulan sorular bulunur; PFOS teklif özeti için ana giriş noktasıdır.",
    "Konsept kurulum, arama hedefli sayfalar, editoryal rehberler ve referans projeler bölümlere ayrılmıştır. Bağlantılar footer, sitemap ve llms.txt ile dizinlenir. Steakhouse, bulut mutfak, market reyonu ve kafe açılış rehberleri ilgili profillere bağlanır.",
    "Beş yüz kişilik catering ve metrekare planlama yazıları kapasite sorularını derinleştirir. Restoran checklist akışı PFOS sırasını yansıtır. Dark kitchen rehberi çok markalı senaryoyu açıklar.",
    "SEO sayfaları Türkiye endüstriyel mutfak, otel, pişirme, soğuk oda ve teklif platformu aramalarını karşılar. İngilizce endüstriyel ve teklif sayfaları ihracat okuyucusuna yöneliktir. Öztiryakiler bayii sayfası resmi kanalı açıklar.",
    "Referans projeler demonte vaka formatındadır; İstanbul catering ve İzmir modüler bar örnekleri dizinden erişilir. Fotoğraf ve alıntılar yayın sürecinde güncellenir. Kesin ekipman listesi PFOS ile üretilir; satış mühendisliği onayı nihai fiyatı belirler.",
  ],
  blogHubEn: [
    "This index separates blog and GEO guide content from the shop menu. Users looking for equipment stay in the catalogue; concept and quote questions are answered on these pages. Each guide includes FAQs; this is the main entry point for Project Factory quote summaries.",
    "Concept setup, search-targeted pages, editorial guides and reference projects are grouped in sections below. Links are indexed via footer, sitemap and llms.txt. Steakhouse, cloud kitchen, market aisle and cafe opening guides link to their concept profiles.",
    "Five-hundred-guest catering and square-metre planning articles deepen capacity questions. The restaurant checklist flow mirrors the PFOS sequence. The dark kitchen guide explains multi-brand scenarios.",
    "SEO pages address searches for industrial kitchen equipment in Turkey, hotels, cooking lines, cold rooms and the quote platform. English industrial and quotation pages target export readers. The Öztiryakiler dealer page explains the official channel.",
    "Reference projects use a demounted case-study format; Istanbul catering and Izmir modular bar examples are reachable from this index. Photos and quotes are strengthened during publication. Firm equipment lists are generated via PFOS; sales engineering sign-off sets final pricing.",
  ],
};

const REQUIRED_KEYS = [
  "steakhouse", "cafe", "catering", "fastfood", "finedining", "bulut", "allday",
  "marketKasap", "projelerHub", "projeIstanbul", "projeIzmir", "rehberM2",
  "rehberCatering500", "rehberDarkKitchen", "rehberRestoranChecklist", "rehberKafeAcilis",
  "seoTurkiye", "seoRestoranTeklif", "seoOtel", "seoOzti", "seoSogukOda", "seoHavuzlu",
  "seoPisirme", "seoTeklifPlatform", "seoBar", "seoEnIndustrial", "seoEnQuotation",
  "blogHub", "blogHubEn",
];

function buildBody(key, globalUsed = new Set()) {
  if (!CONTENT[key]) throw new Error(`Missing content for ${key}`);
  const fillParts = FILL[key] ? (Array.isArray(FILL[key]) ? FILL[key] : [FILL[key]]) : [];
  const fill3 = FILL3[key] ? [FILL3[key]] : [];
  const fill4 = FILL4[key] ? [FILL4[key]] : [];
  const fill5 = FILL5[key] ? [FILL5[key]] : [];
  const fill6 = FILL6[key] ? [FILL6[key]] : [];
  const rawPool = [...CONTENT[key], ...(EXT[key] || []), ...fillParts, ...fill3, ...fill4, ...fill5, ...fill6];
  const workPool = rawPool;
  let bestSlice = null;
  let bestDist = Infinity;
  for (let start = 0; start < workPool.length; start++) {
    for (let end = start + 1; end <= workPool.length; end++) {
      const slice = workPool.slice(start, end);
      const w = wordCount(body(slice));
      if (w >= 300 && w <= 350) {
        const dupCount = splitSentences(body(slice)).filter((s) =>
          globalUsed.has(s.toLowerCase())
        ).length;
        const dist = Math.abs(w - 325) + dupCount * 25;
        if (dist < bestDist) {
          bestDist = dist;
          bestSlice = slice;
        }
      }
    }
  }
  if (bestSlice) return body(bestSlice);
  let selected = [];
  for (const p of workPool) {
    const candidate = [...selected, p];
    if (wordCount(body(candidate)) <= 350) selected = candidate;
  }
  let w = wordCount(body(selected));
  if (w >= 300 && w <= 350) return body(selected);
  const allW = wordCount(body(workPool));
  if (allW >= 300 && allW <= 350) return body(workPool);
  if (w < 300 && allW > w) {
    selected = workPool;
    w = allW;
  }
  if (w >= 300 && w <= 350) return body(selected);
  if (w < 300) {
    throw new Error(`${key}: ${w} sözcük — hedef 300-350 (pool ${workPool.length} paragraf, toplam ${allW})`);
  }
  while (selected.length > 1 && wordCount(body(selected)) > 350) selected.pop();
  return body(selected);
}

function splitSentences(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9"']|[A-Za-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24);
}

const bodies = {};
const buildErrors = [];
const globalUsed = new Set();
for (const key of REQUIRED_KEYS) {
  try {
    bodies[key] = buildBody(key, globalUsed);
    for (const s of splitSentences(bodies[key])) {
      globalUsed.add(s.toLowerCase());
    }
  } catch (e) {
    buildErrors.push(e.message);
  }
}
if (buildErrors.length) {
  console.error(buildErrors.join("\n"));
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify(bodies, null, 2) + "\n", "utf8");

const globalSeen = new Map();
for (const [key, html] of Object.entries(bodies)) {
  for (const s of splitSentences(html)) {
    const k = s.toLowerCase();
    if (globalSeen.has(k) && globalSeen.get(k) !== key) {
      console.warn(`[dup] ${key} ↔ ${globalSeen.get(k)}: ${s.slice(0, 55)}…`);
    } else {
      globalSeen.set(k, key);
    }
  }
}

const rows = [];
for (const key of REQUIRED_KEYS) {
  const w = wordCount(bodies[key]);
  rows.push({ key, words: w, ok: w >= 300 && w <= 350 });
}
const words = rows.map((r) => r.words);
console.log("File:", outPath);
console.log("min", Math.min(...words), "max", Math.max(...words));
console.log("--- per profile ---");
for (const r of rows) {
  const flag = r.ok ? "OK" : "OUT";
  console.log(`${flag}  ${r.key.padEnd(24)} ${r.words}`);
}
const outOfRange = rows.filter((r) => !r.ok);
if (outOfRange.length) {
  console.log("\nOUT OF RANGE:", outOfRange.map((r) => `${r.key}(${r.words})`).join(", "));
  process.exitCode = 1;
} else {
  console.log("\nAll profiles in 300–350 range.");
}
