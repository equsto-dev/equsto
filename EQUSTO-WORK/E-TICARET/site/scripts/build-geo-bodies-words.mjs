/**
 * Builds scripts/geo-bodies-words.json — 600–700 words per profile (tags stripped).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "geo-bodies-words.json");

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function toHtml(paragraphs) {
  return paragraphs.map((t) => `<p>${t.trim()}</p>`).join("");
}

/** @type {Record<string, string[]>} */
const PARAS = {
  steakhouse: [
    "Steakhouse mutfaklarında etin kalitesi kadar pişirme zonunun termal kontrolü de marka algısını belirler. Equsto satış mühendisliği dry-age dolabı, yüksek ısı ızgara hatları ve et hazırlık modüllerini tek akışta modellerken davlumbaz statik basıncını menü yoğunluğu ve servis hızıyla birlikte hesaplar. Proje Fabrikası (PFOS) üzerinden kapasite ve konsept girildiğinde liste dakikalar içinde ön teklif formatına dönüşür; nihai yerleşim Gastronomi Tasarımı ile derinleşir.",
    "Dry-age süreci sıcak pişirmeden önce başlayan uzun bir hijyen ve sıcaklık disiplinidir. Nem kontrollü dolaplar, kasaptan servise giden etin su kaybını ve aromayı yönetir; bu nedenle +2 °C teşhir ile dry-age zonu aynı koridorda karıştırılmaz. Equsto, etin hangi aşamada dilimleneceğini ve hangi tezgahta marine edileceğini metre cinsinden planlayarak çapraz bulaşmayı azaltır.",
    "Yüksek ısı ızgara ve kuzine hatları steakhouse’un görünür performansını taşır. Gazlı ve elektrikli seçenekler saha tesisatına göre ayrılır; pik öğün dakikalarında eşzamanlı porsiyon sayısı ocak yayılımını doğrudan belirler. Isı geri kazanımı ve davlumbaz kapasitesi pişirme adediyle birlikte okunmalıdır; aksi halde mutfak sıcaklığı çalışan verimini düşürür.",
    "Et hazırlık modülleri kıyma, dilimleme ve marine zonlarını kısa mesafe kuralına göre yerleştirir. Paslanmaz tezgah derinliği, et tahtası hijyen seti ve el yıkama noktaları HACCP akışına uygun sırayla dizilir. Hazırlık ile pişirme arasındaki mesafe servis gecikmesini azaltır; Equsto saha keşfinde bu koridoru ölçerek PFOS girdilerini netleştirir.",
    "Soğutma hattında teşhir, depo ve şok gereksinimleri menü portföyüne göre ayrılır. Sos ve garnitür için GN uyumlu modüller, dry-age zonundan fiziksel olarak ayrı tutulur. Derin dondurucu ihtiyacı ürün giriş sıcaklığına bağlıdır; satış mühendisliği ön doğrulamada bu ayrımı yapar ve vitrin SKU’larıyla eşleştirir.",
    "Yıkama hattı pik öğün yükünü taşıyacak konveyör hızına göre seçilir. Tencere ve tepsi hacmi steakhouse servisinde yüksektir; bulaşıkhanenin pişirme hattından uzak ama lojistik olarak kısa kalması önemlidir. Kimyasal dozaj, su yumuşatma ve atık su ön izinleri montaj planının parçasıdır.",
    "Müşteri kapasitesi, oturma düzeni ve ortalama pişirme derecesi PFOS’ta modül adetlerini etkiler. Dry-age ağırlıklı menülerde soğutma kapasitesi artar; yüksek ısı ızgara yoğunluğu elektrik ve gaz rezervini yükseltir. Equsto, örnek vitrin tablosunu bu girdilerle ilişkilendirir; tam liste projeye özel üretilir.",
    "PFOS’ta restoran veya steakhouse konsepti, günlük öğün ve kişi sayısı girildiğinde sıcak, soğuk ve yıkama satırları kural motoruyla oluşur. Çıktı PDF’inde SKU ve ürün kodları yapılandırılmış biçimde yer alır; KDV ve lojistik kalemleri ön teklif özetine eklenir. Hedef süre yaklaşık beş dakikadır; bu süre içinde taslak liste satış ekibine iletilir.",
    "Satış mühendisliği onayı, fiyatın ve teknik uygunluğun kesinleştiği aşamadır. Davlumbaz kuyusu, gaz basıncı ve elektrik panosu sahada doğrulanmadan sipariş riski taşınır. Equsto montaj ve devreye almayı aynı plan çerçevesinde yürütür; eğitim ve garanti hattı Öztiryakiler yetkili bayii süreçleriyle uyumludur.",
    "Öztiryakiler pişirme ve soğutma omurgasını oluşturur; ızgara, kuzine ve tezgah tipi dolaplar aynı katalog akışında listelenir. Atalay ve seçili global markalar tamamlayıcı modül sağlar. Tek ürün siparişi ile anahtar teslim proje aynı vitrinden yönetilir; ihracat pazarlarında iletişim hattı açıktır.",
    "Steakhouse referans mantığı Equsto demonte vaka sayfalarında okunabilir: proje yaşam döngüsü, zorunluluklar ve ekipman seçim gerekçesi şeffaf anlatılır. Fotoğraf ve müşteri alıntıları yayın sürecinde pekiştirilir; sayfalar satılabilir paket değil, öğrenme kaynağıdır.",
    "Sonuç olarak steakhouse yatırımında dry-age, yüksek ısı pişirme ve hijyen hattı aynı planda modellenmelidir. PFOS ile kapasite ve menü girdilerini girerek ön teklif alın; yerleşim ve MEP için satış mühendisliği saha toplantısı planlar. Equsto, 2026 fiyatları ve proje iskontolarıyla B2B endüstriyel mutfak tedarik akışını tek platformda toplar.",
  ],
  cafe: [
    "Cafe kurulumunda espresso istasyonu günün merkezinde kalır; su filtrasyonu, basınç ve kireç yönetimi makine seçiminden önce sabitlenmelidir. Equsto, kahve omurgasını soğutmalı süt stoku, hazırlık tezgahı ve vitrin soğutucuyla aynı akışta modeller. Paket servis oranı yükseldikçe soğutma derinliği ve hızlı hazırlık modülleri artar.",
    "Günlük bardak adedi ve eşzamanlı grup sayısı makine adedini belirler. Çift kollu espresso, öğütücü ve depolama hacmi PFOS girdilerinden türetilir. Sıcak su hatları ve atık su noktaları bar ölçüsüne göre doğrulanır; modüler tezgahlar dar alanlarda dikey depolamayı destekler.",
    "Pastane ağırlıklı konseptlerde fırın, mikser ve hazırlık modülleri eklenir. Soğuk vitrin ile sıcak teşhir aynı müşteri hattında görünürken üretim arkada ayrılır. Menüde dondurulmuş ürün payı derin dondurucu ihtiyacını artırır; satış mühendisliği bu ayrımı ürün kartlarındaki mm ölçüleriyle birlikte okur.",
    "Yıkama hattı bardak, tabak ve hazırlık kapları için yeterli konveyör hızına sahip olmalıdır. Kimyasal dozaj ve su kalitesi kahve makinesi ömrünü de etkiler. Cafe pik saatlerinde yıkama darboğazı servis gecikmesi yaratır; bu nedenle bulaşıkhanenin bar ile mesafesi planlanır.",
    "Soğutmalı stokta süt, garnitür ve hazır gıda için ayrı zonlar tercih edilir. +2 °C ile +4 °C gereksinimleri karıştırılmaz. Havuzlu tezgah tipi dolaplar hazırlık hattında ergonomi sağlar; dış ölçü ve GN uyumu vitrin kartlarında listelenir.",
    "PFOS’ta cafe konsepti, oturma ve paket oranı, günlük öğün profiliyle modellenir. Liste ön teklif formatında üretilir; Gastronomi Tasarımı sonraki aşamada tezgah yüksekliği ve müşteri akışını derinleştirir. Hedef süre yaklaşık beş dakikadır.",
    "Satış mühendisliği elektrik yükü, havalandırma ve su basıncını sahada doğrular. Montaj takvimi açılış tarihine göre geriye doğru planlanır. Eğitim, garanti ve yedek parça hattı B2B müşteriler için yapılandırılmıştır.",
    "Öztiryakiler soğutma ve hazırlık departmanlarında güçlü seçenek sunar; kahve ekipmanları seçili markalarla tamamlanır. Tek ürün siparişi ile tam cafe paketi aynı sepet akışında birleşir. Fiyatlar 2026 Türk Lirası, KDV hariç özetlenir.",
    "Cafe açılış checklist’i menü, kapasite, alan ve hat adetlerini sırayla netleştirir. CAD plan ilk aşamada şart değildir; PFOS kapasite soruları aynı mantığı otomatikler. Rehber sayfaları konsept ve teklif sorularını katalogdan ayırır.",
    "Ergonomi, barista verimini doğrudan etkiler: öğütücü yüksekliği, çöp ve atık yönetimi, temizlik kimyasallarının erişimi planlanmalıdır. Equsto saha ölçüsünü PFOS’a girmeden önce almayı önerir; böylece modül adetleri gerçek metrekareye oturur.",
    "Vitrin SKU tablosu örnek modülleri gösterir; tam liste projeye özel genişletilir. İhracat ve franchise senaryolarında iletişim hattı üzerinden lojistik netleştirilir. Proje iskontoları teklif sırasında uygulanır.",
    "Cafe yatırımcısı için espresso merkezi, soğutma, hazırlık ve yıkama dört ayaklı bir omurgadır. PFOS ile taslak teklif alın; satış mühendisliği onayından sonra sipariş ve montaj başlar. Equsto, Türkiye ve seçili ihracat pazarlarında endüstriyel mutfak tedarik platformu olarak konumlanır.",
  ],
};

// Remaining profiles appended below via second write — run merges PARAS

function build() {
  const bodies = {};
  for (const [key, paras] of Object.entries(PARAS)) {
    bodies[key] = toHtml(paras);
  }
  return bodies;
}

const bodies = build();
fs.writeFileSync(outPath, JSON.stringify(bodies, null, 2) + "\n", "utf8");

const report = [];
for (const key of Object.keys(bodies).sort()) {
  const w = wordCount(bodies[key]);
  report.push({ key, words: w, ok: w >= 600 && w <= 700 });
}
console.log(JSON.stringify(report, null, 2));
