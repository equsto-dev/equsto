/**
 * Builds geo-bodies-words.json: geo-bodies-600 seed + unique expansions → 600–700 words.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, "geo-bodies-600.json");
const outPath = path.join(__dirname, "geo-bodies-words.json");

const FOOTER_RE =
  /\s*Detaylı ekipman listesi[\s\S]*?satış mühendisliği ile yürütülür\.?\s*/gi;

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

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function cleanSeed(html) {
  return html.replace(FOOTER_RE, "").trim();
}

/** @type {Record<string, string[]>} */
const EXPAND = {
  steakhouse: [
    "Dry-age dolabında nem ve hava sirkülasyonu et kalitesini belirler; sıcaklık kayıtları satış mühendisliği ön doğrulamasında istenir. Yaşlandırma süresi menü fiyatlamasıyla birlikte planlanır; teşhir zonu ile dry-age fiziksel olarak ayrılır. PFOS steakhouse konseptinde soğutma adedini menü ağırlığına göre artırır.",
    "Yüksek ısı ızgara seçiminde ısı geri kazanımı ve yüzey malzemesi servis standardını etkiler. Gazlı hatlarda basınç düşümü montaj öncesi ölçülür; elektrikli alternatifler yedek kapasite sağlar. Ocak yayılımı pik dakikadaki porsiyon sayısıyla modellenir.",
    "Et hazırlık zonunda kıyma, dilimleme ve marine işlemleri kısa mesafe kuralına uyar. Paslanmaz tezgah derinliği ekip ergonomisine göre ayarlanır; et tahtası renk kodlaması çapraz bulaşmayı azaltır. El yıkama ve sanitasyon noktaları HACCP sırasına göre dizilir.",
    "Sos, garnitür ve bitirme hatları sıcak pişirmeden sonra ayrı muhafaza ister. GN uyumlu modüller servis hızına göre adetlendirilir; sıcak tutma süreleri menü mühendisliğiyle uyumlu olmalıdır. Soğuk garnitür hattı dry-age zonundan uzak tutulur.",
    "Yıkama kapasitesi tencere ve ızgara tepsisi hacmine göre seçilir; konveyör hızı pik öğün yükünü taşımalıdır. Grease trap ve yağ sıyırıcı ızgara yoğunluğuyla birlikte hesaplanır. Atık su ve kimyasal dozaj izinleri montaj dosyasına eklenir.",
    "Davlumbaz statik basıncı ocak adedi ve ısı yüküyle doğrulanır; baca kuyusu ölçüsü keşifte netleşir. Mutfak tavan yüksekliği filtre ve kanal güzergahını etkiler. Havalandırma yetersizliği çalışan verimini ve ekipman ömrünü düşürür.",
    "PFOS’ta günlük öğün, kişi sayısı ve servis stili girildiğinde sıcak-soğuk-yıkama satırları oluşur. Ön teklif PDF’i SKU kodlarıyla yapılandırılır; hedef süre yaklaşık beş dakikadır. Satış mühendisliği onayı fiyat ve teknik uygunluğu kesinleştirir.",
    "Öztiryakiler ızgara, kuzine ve soğutma omurgasını sağlar; Atalay ve seçili markalar tamamlayıcı modül sunar. Canlı kur EUR ve TL fiyat listesine bağlanır. Tek ürün siparişi ile anahtar teslim proje aynı vitrinde yürür.",
    "Gastronomi Tasarımı yerleşim ve koridor genişliğini derinleştirir; CAD planı sonraki aşamada eklenebilir. Modüler tezgahlar dar mutfaklarda esneklik sağlar. Saha ölçüsü PFOS girdilerinin ilk kritik verisidir.",
    "Demonte referans sayfalar proje mantığını örnekler; müşteri fotoğrafları yayın sürecinde pekiştirilir. Vitrin SKU tablosu örnek modülleri gösterir; tam liste projeye özel üretilir. İletişim hattı özel ölçü taleplerini karşılar.",
    "Banket ve özel etkinlik günleri geçici kapasite artışı gerektirebilir; holding ve yıkama rezervi buna göre planlanır. Enerji tüketimi pik saatlerde tarife planlaması ister. Devreye alma testleri gaz, elektrik ve su bağlantılarını kapsar.",
    "İhracat ve franchise senaryolarında lojistik ve garanti süreçleri ayrı satırda özetlenir. Hizmet bölgeleri Türkiye, Ortadoğu, Kafkaslar, Orta Asya ve Balkanları kapsar. 2026 TL fiyatları KDV hariçtir; proje iskontoları teklifte uygulanır.",
    "Steakhouse yatırımında dry-age, yüksek ısı pişirme ve hijyen aynı planda modellenmelidir. PFOS ile kapasite girdilerini girerek ön teklif alın; montaj satış mühendisliği takvimiyle yürür. Equsto B2B endüstriyel mutfak platformu olarak konumlanır.",
    "Isı haritası çıkarımı ocak dizilimini doğrular; yan ürün ve sos istasyonları pişirme hattına yakın tutulur. Et dinlendirme süresi servis planıyla uyumlu olmalıdır. Şef istasyonu ergonomisi porsiyonlama hızını destekler.",
    "Soğutma kapasitesi yaz ve kış menü değişiminde yeniden hesaplanır. PFOS menü güncellemesi modül adetlerini yeniler. Vitrin bağlantıları canlı SKU doğrulaması sağlar.",
    "Bakım planı filtre, yağ ve davlumbaz temizliği periyotlarını içerir. Operasyonel kesinti riski yedek modül veya geçici kapasiteyle yönetilir. Ekip eğitimi HACCP ve ekipman kullanımını kapsar.",
    "Lojistik ağır ekipman teslimatı için saha erişimini doğrular. Montaj gece veya kapalı günlerde planlanabilir. Devreye alma sırasında termal testler kayıt altına alınır.",
    "Franchise steakhouse formatlarında modül tekrarı kullanılır; standart liste PFOS şablonu olarak saklanır. İletişim hattı yüksek kapasite ve özel dry-age taleplerini yönetir. Blog rehberleri konsept derinliği sağlar.",
    "Nihai teklif satış mühendisliği onayı, saha keşfi ve MEP doğrulaması sonrası kesinleşir. Sipariş, montaj ve garanti aynı proje numarası altında izlenir.",
  ],
};

// Import remaining expansions + six-paragraph tail per profile
const { EXPAND_REST } = await import("./geo-bodies-words-expand.mjs");
const { EXPAND_TAIL } = await import("./geo-bodies-words-expand-tail.mjs");
const { EXPAND_TAIL3 } = await import("./geo-bodies-words-expand-tail3.mjs");
Object.assign(EXPAND, EXPAND_REST);
for (const [key, tail] of Object.entries(EXPAND_TAIL)) {
  if (!EXPAND[key]) EXPAND[key] = [];
  EXPAND[key].push(...tail);
}
for (const [key, tail] of Object.entries(EXPAND_TAIL3)) {
  if (!EXPAND[key]) EXPAND[key] = [];
  EXPAND[key].push(...tail);
}

const { PAD } = await import("./geo-bodies-words-pad.mjs");

const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const bodies = {};

for (const key of REQUIRED) {
  const extra = EXPAND[key];
  if (!extra || extra.length < 27) {
    throw new Error(`EXPAND[${key}] must have at least 27 paragraphs, got ${extra?.length}`);
  }
  const base = cleanSeed(seed[key] || "");
  let html = base + extra.map((t) => `<p>${t}</p>`).join("");
  const pads = PAD[key] || [];
  let pi = 0;
  while (wordCount(html) < 600 && pi < pads.length) {
    html += `<p>${pads[pi++]}</p>`;
  }
  let fallbackN = 0;
  while (wordCount(html) < 600 && fallbackN < 10) {
    html += `<p>${key} profili için PFOS taslak listesi satış mühendisliği onayı ve saha keşfi sonrası kesinleşir; montaj, devreye alma ve garanti kaydı aynı proje numarası altında yürütülür. Equsto B2B endüstriyel mutfak tedarik platformu 2026 güncel fiyatlarıyla teklif üretir. Vitrin SKU tablosu örnek modülleri gösterir.</p>`;
    fallbackN++;
  }
  if (wordCount(html) < 600) {
    throw new Error(`${key}: ${wordCount(html)} words — still under 600 after fallback`);
  }
  while (wordCount(html) > 700 && pads.length) {
    const last = html.lastIndexOf("<p>");
    if (last <= 0) break;
    html = html.slice(0, last);
  }
  bodies[key] = html;
}

fs.writeFileSync(outPath, JSON.stringify(bodies, null, 2) + "\n", "utf8");

const report = [];
for (const key of REQUIRED) {
  const w = wordCount(bodies[key]);
  report.push({ key, words: w, ok: w >= 600 && w <= 700 });
}
const words = report.map((r) => r.words);
console.log("path", outPath);
console.log("min", Math.min(...words), "max", Math.max(...words));
for (const r of report.filter((x) => !x.ok)) {
  console.log("OUT OF RANGE:", r.key, r.words);
}
