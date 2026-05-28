/**
 * Generates geo-bodies-words.json — 600–700 words/profile, <p> only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXT } from "./geo-bodies-words-ext.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "geo-bodies-words.json");

const join = (...parts) => parts.filter(Boolean).join(" ");

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

/** @param {(string|string[])[]} items - full <p> text or legacy 4-sentence groups */
function body(items) {
  return items
    .map((item) => `<p>${Array.isArray(item) ? join(...item) : item}</p>`)
    .join("");
}

const steakhouse = [
  [
    "Steakhouse mutfaklarında etin kalitesi kadar pişirme zonunun termal kontrolü marka algısını belirler.",
    "Equsto satış mühendisliği dry-age dolabı, yüksek ısı ızgara hatları ve et hazırlık modüllerini tek akışta modeller.",
    "Davlumbaz statik basıncı menü yoğunluğu ve servis hızıyla birlikte proje başında doğrulanır.",
    "PFOS ön teklif listesini kapasite girdileriyle dakikalar içinde üretir.",
  ],
  [
    "Dry-age süreci sıcak pişirmeden önce başlayan uzun hijyen ve sıcaklık disiplinidir.",
    "Nem kontrollü dolaplar etin su kaybını ve aromayı yönetir; teşhir zonu ile karıştırılmaz.",
    "Kasaptan servise giden yolculuk santimetre cinsinden planlanarak çapraz bulaşma azaltılır.",
    "Sıcak pişirme öncesi et dinlendirme alanı soğutma hattından ayrı konumlandırılır.",
  ],
  [
    "Yüksek ısı ızgara ve kuzine hatları steakhouse’un görünür performansını taşır.",
    "Gazlı ve elektrikli seçenekler saha tesisatına göre ayrılır; pik öğün eşzamanlı porsiyon ocak yayılımını belirler.",
    "Isı geri kazanımı ve davlumbaz kapasitesi pişirme adediyle birlikte okunmalıdır.",
    "Ocak altı dolap ve tepsi rafları servis hızına göre konumlandırılır.",
  ],
  [
    "Et hazırlık modülleri kıyma, dilimleme ve marine zonlarını kısa mesafe kuralına göre yerleştirir.",
    "Paslanmaz tezgah derinliği, et tahtası hijyen seti ve el yıkama HACCP sırasına uyar.",
    "Hazırlık ile pişirme arası mesafe servis gecikmesini azaltır.",
    "Et kıyma ve dilimleme ekipmanı güç ve hijyen gereksinimine göre seçilir.",
  ],
  [
    "Soğutma hattında teşhir, depo ve şok gereksinimleri menü portföyüne göre ayrılır.",
    "Sos ve garnitür GN uyumlu modüllerde dry-age zonundan fiziksel olarak ayrı tutulur.",
    "Derin dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır; ön doğrulama satış mühendisliğinde yapılır.",
    "Şok soğutma ihtiyacı menüdeki deniz ürünü ve yan ürün oranına göre değişir.",
  ],
  [
    "Yıkama hattı pik öğün yükünü taşıyacak konveyör hızına göre seçilir.",
    "Tencere ve tepsi hacmi steakhouse servisinde yüksektir; bulaşıkhanenin pişirme hattına mesafesi planlanır.",
    "Kimyasal dozaj, su yumuşatma ve atık su ön izinleri montaj planının parçasıdır.",
    "Grease trap kapasitesi ızgara yoğunluğuyla birlikte hesaplanır.",
  ],
  [
    "Müşteri kapasitesi, oturma düzeni ve ortalama pişirme derecesi PFOS modül adetlerini etkiler.",
    "Dry-age ağırlıklı menülerde soğutma kapasitesi artar; yüksek ısı ızgara yoğunluğu enerji rezervini yükseltir.",
    "Vitrin SKU tablosu örnek modülleri gösterir; tam liste projeye özel genişletilir.",
    "Banket ve özel etkinlik günleri geçici kapasite artışını gerektirebilir.",
  ],
  [
    "PFOS’ta steakhouse konsepti, günlük öğün ve kişi sayısı girildiğinde sıcak-soğuk-yıkama satırları oluşur.",
    "Çıktı PDF’inde SKU ve ürün kodları yapılandırılmış biçimde yer alır.",
    "KDV ve lojistik kalemleri ön teklif özetine eklenir; hedef süre yaklaşık beş dakikadır.",
    "Menü ve servis stili girdileri sıcak-soğuk-yıkama adetlerini kural motoruyla belirler.",
  ],
  [
    "Satış mühendisliği onayı fiyat ve teknik uygunluğun kesinleştiği aşamadır.",
    "Gaz basıncı, elektrik panosu ve baca kuyusu sahada doğrulanmadan sipariş risk taşır.",
    "Montaj ve devreye alma aynı plan çerçevesinde yürütülür.",
    "Devreye alma sonrası ekip eğitimi ve garanti kaydı tamamlanır.",
  ],
  [
    "Öztiryakiler pişirme ve soğutma omurgasını oluşturur; ızgara ve kuzine aynı katalog akışındadır.",
    "Atalay ve seçili global markalar tamamlayıcı modül sağlar.",
    "Tek ürün siparişi ile anahtar teslim proje aynı vitrinden yönetilir.",
    "Canlı kur EUR ve TL üzerinden güncel fiyat listesine bağlanır.",
  ],
  [
    "Gastronomi Tasarımı yerleşim ve ergonomiyi derinleştirir; CAD plan sonraki adımda eklenebilir.",
    "Tezgah yüksekliği ve ocak dizilimi ekip verimini doğrudan etkiler.",
    "Saha ölçüsü PFOS girdilerinin ilk ve en kritik verisidir.",
    "Modüler tezgahlar dar mutfaklarda koridor verimliliğini artırır.",
  ],
  [
    "Steakhouse referans mantığı Equsto demonte vaka sayfalarında okunabilir.",
    "Proje yaşam döngüsü, zorunluluklar ve ekipman seçim gerekçesi şeffaf anlatılır.",
    "Sayfalar satılabilir paket değil; öğrenme ve teklif hazırlığı kaynağıdır.",
    "Demonte vakalar saha koşullarını örnekler; kesin liste projeye özeldir.",
  ],
  [
    "Hijyen zonları pişirme, muhafaza ve yıkama arasında net sınırlandırılır.",
    "Çapraz bulaşma riski yüksek et işleme hatlarında önceliklidir.",
    "El yıkama, sanitasyon ve atık yağ yönetimi aynı planda modellenir.",
    "Personel akışı müşteri görünürlüğünden arka zonlara yönlendirilir.",
  ],
  [
    "İhracat ve franchise senaryolarında lojistik ve garanti hattı iletişim kanalıyla netleşir.",
    "2026 Türk Lirası fiyatları ve proje iskontoları teklif sırasında uygulanır.",
    "Hizmet bölgeleri Türkiye, Ortadoğu, Kafkaslar, Orta Asya ve Balkanları kapsar.",
    "Lojistik ve gümrük süreçleri ihracat tekliflerinde ayrı satır olarak özetlenir.",
  ],
  [
    "Menü mühendisliği pişirme süreleri ile holding kapasitesini birlikte belirler.",
    "Sıcak tutma ve bitirme zonları servis stiline göre ayrılır.",
    "Porsiyonlama hızı yıkama ve hazırlık adetlerini dolaylı etkiler.",
    "Bitirme sosları ve garnitür hatları soğuk zonla senkronize edilir.",
  ],
  [
    "Steakhouse yatırımında dry-age, yüksek ısı pişirme ve hijyen hattı aynı planda modellenmelidir.",
    "PFOS ile kapasite ve menü girdilerini girerek ön teklif alın.",
    "Satış mühendisliği saha toplantısıyla yerleşim ve MEP kesinleşir.",
    "Equsto B2B endüstriyel mutfak tedarik platformu olarak 2026 güncellemeleriyle yayınlanır.",
  ],
];

const REQUIRED = [
  "steakhouse",
  "cafe",
  "catering",
  "fastfood",
  "finedining",
  "bulut",
  "allday",
  "marketKasap",
  "projelerHub",
  "projeIstanbul",
  "projeIzmir",
  "rehberM2",
  "seoTurkiye",
  "seoRestoranTeklif",
  "seoOtel",
  "seoOzti",
  "seoSogukOda",
  "seoHavuzlu",
  "seoPisirme",
  "seoTeklifPlatform",
  "seoBar",
  "seoEnIndustrial",
  "seoEnQuotation",
  "blogHub",
  "rehberCatering500",
  "rehberDarkKitchen",
  "rehberRestoranChecklist",
  "rehberKafeAcilis",
];

const PROFILES = { steakhouse, ...EXT };

const bodies = {};
for (const key of REQUIRED) {
  if (!PROFILES[key]) throw new Error(`Missing profile: ${key}`);
  bodies[key] = body(PROFILES[key]);
}

fs.writeFileSync(outPath, JSON.stringify(bodies, null, 2) + "\n", "utf8");

const report = [];
for (const key of REQUIRED) {
  const w = wordCount(bodies[key]);
  report.push({ key, words: w, ok: w >= 600 && w <= 700 });
}
const words = report.map((r) => r.words);
console.log("path", outPath);
console.log("profiles", report.length);
console.log("min", Math.min(...words), "max", Math.max(...words));
for (const r of report.filter((x) => !x.ok)) {
  console.log("OUT OF RANGE:", r.key, r.words);
}
