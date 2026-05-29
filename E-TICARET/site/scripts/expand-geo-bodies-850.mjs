/**
 * geo-bodies-600.json — temiz 850–900 karakter gövde (4 paragraf, kırık trim yok).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bodiesPath = path.join(root, "scripts/geo-bodies-600.json");
const MIN = 850;
const MAX = 900;

const CLOSING =
  "Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.";

const PAD =
  "2026 fiyatları KDV hariç özetlenir; proje iskontoları teklif sırasında uygulanır.";
const PAD2 = "Teklif özeti satış mühendisliği onayıyla kesinleşir.";

/** @param {string} html */
function plainText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitParas(html) {
  return [...String(html || "").matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) =>
    m[1].replace(/\s+/g, " ").trim()
  );
}

function joinParas(paras) {
  return paras.map((t) => `<p>${t}</p>`).join("");
}

function stripClosing(text) {
  let t = String(text || "").replace(/\s+/g, " ").trim();
  const escaped = CLOSING.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t = t.replace(new RegExp(`(?:\\s*${escaped}\\.?)+`, "gi"), "").trim();
  const padEsc = PAD.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t = t.replace(new RegExp(`(?:\\s*${padEsc}\\.?)+`, "gi"), "").trim();
  return t.replace(/[,;:\s]+$/, "").trim();
}

const EXTRA = {
  steakhouse:
    "Menü profili dry-age ağırlığını, grill kapasitesini ve et hazırlık yoğunluğunu belirler. 2026 steakhouse projelerinde saha ölçüsü Proje Fabrikası girdilerinin temelidir.",
  cafe:
    "Günlük bardak adedi, paket oranı ve oturma kapasitesi makine grubu sayısını belirler. 2026 kafe açılışlarında su filtrasyonu ve basınç testi makine siparişinden önce tamamlanmalıdır.",
  catering:
    "Banket ve toplu yemek senaryolarında taşıma ekipmanları ile termobox kapasitesi menü profiline göre eklenir. 2026 catering projelerinde pik kişi sayısı yıkama hızını belirler; saha keşfi montaj takviminin ilk adımıdır.",
  fastfood:
    "Paket ağırlığı yükseldikçe hazırlık, muhafaza ve soğutma modülleri artar. 2026 fast food hatlarında fritöz ve ızgara yoğunluğu menü karmasıyla doğrudan orantılıdır.",
  finedining:
    "Bitirme ve sos hatları servis stiline göre ayrılır; porsiyonlama ritmi ocak yayılımını etkiler. 2026 fine dining projelerinde Gastronomi Tasarımı yerleşim çizimini derinleştirir; CAD planı sonraki aşamada eklenebilir.",
  bulut:
    "Çok markalı senaryoda MEP yükü toplam menüye göre hesaplanır; yağ sıyırıcı kapasitesi erken doğrulanmalıdır. 2026 bulut mutfak projelerinde marka sayısı ve saha ölçüsü planın ilk girdileridir.",
  allday:
    "Kahvaltı piki yıkama ve kahve hatlarını belirler; banket çıkışları kısa sürede kapasiteyi yükseltir. 2026 otel ve all day dining projelerinde öğün profili soğutma derinliğini etkiler.",
  marketKasap:
    "Hijyen zonları kasap hazırlık hattında et tahtası, el yıkama ve hızlı yıkama modülleriyle tamamlanır. 2026 market projelerinde reyon genişliği soğutucu adedini belirler.",
  projelerHub:
    "Demonte vakalar saha koşullarını örnekler; kesin ekipman listesi projeye özel üretilir. 2026 referans sayfaları vitrin SKU’larına köprü kurar.",
  projeIstanbul:
    "Yoğun şehir içi cateringde cephe kapasitesi ve baca kuyusu sipariş öncesi doğrulanmalıdır. 2026 demode diziliminde konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır.",
  projeIzmir:
    "Bar ölçüsü modül parsellemesini belirler; elektrik ve su noktaları yerleşimden önce kontrol edilir. 2026 modüler bar projelerinde Besos vitrininde kırk iki örnek modül listelenir.",
  rehberM2:
    "2026 kapasite varsayımları oturma, paket ve banket senaryolarını ayrı okur. Kişi başı metrekare rehberi footer ve sitemap üzerinden erişilir; PFOS alan soruları aynı mantığı otomatikler.",
  rehberCatering500:
    "Pik öğün ile sürekli banket ayrı PFOS senaryolarıdır; konveyörlü yıkama pik dakikada darboğaz oluşturmamalıdır. 2026 catering planlamasında taşıma modülleri menü profiline göre eklenir; banket çıkışları kapasiteyi yükseltir.",
  rehberDarkKitchen:
    "Markalar arası depo ve sevkiyat alanı net sınırlandırılmalıdır. 2026 dark kitchen rehberi çok markalı ruhsat senaryosunda MEP kapasitesini vurgular.",
  rehberRestoranChecklist:
    "Checklist saha toplantılarında manuel kontrol içindir; PFOS menü-kapasite-alan-teklif sırasını otomatikler. 2026 restoran açılışlarında tesisat ve davlumbaz rotası modül adedini etkiler.",
  rehberKafeAcilis:
    "Espresso merkezi ve soğuk stok cafe konseptinde paralel planlanır; paket oranı soğutma derinliğini artırır. 2026 kafe açılış listesinde su filtrasyonu makine seçiminden önce sabitlenmelidir.",
  seoTurkiye:
    "Türkiye geneli ve seçili ihracat pazarlarında canlı katalog ve satış mühendisliği aynı akışta yürür. 2026 endüstriyel mutfak aramalarında tüm departmanlar tek vitrinde listelenir; ihracat için iletişim hattı açıktır.",
  seoRestoranTeklif:
    "Menü, kapasite ve servis stili PFOS kural setinin temel girdileridir. 2026 restoran tekliflerinde KDV ve lojistik kalemleri özet dosyada yer alır.",
  seoOtel:
    "Kahvaltı piki kahve ve yıkama hatlarını belirler; oda servisi ile açık büfe aynı mutfakta farklı yoğunluk oluşturur. 2026 otel tedarik dosyalarında banket çıkışları kapasiteyi yükseltir.",
  seoOzti:
    "Yetkili bayii ilişkisi resmi fiyat listesi, garanti hattı ve servis yönlendirmesini kapsar. 2026 katalogda teknik ölçüler mm cinsinden ürün kartlarında okunur.",
  seoSogukOda:
    "Soğuk oda projeleri ayrı mühendislik hattıyla yürür; tezgah ve dik tip modüller vitrin tablosunda örneklenir. 2026 soğuk zincir planlamasında menü ve hacim soğutma adedini belirler.",
  seoHavuzlu:
    "GN uyumu ve dış ölçü vitrin kartında listelenir; hazırlık hattına göre adet ve derinlik değişir. 2026 havuzlu tezgah seçiminde enerji tipi saha tesisatına göre belirlenir.",
  seoPisirme:
    "Gazlı ve elektrikli seçenekler saha tesisatına göre filtrelenir. 2026 pişirme hatlarında davlumbaz kapasitesi ocak adediyle birlikte hesaplanır; pik çıkış cookline yayılımını belirler.",
  seoTeklifPlatform:
    "Kural motoru menü ve kapasiteye göre modül adetlerini üretir. 2026 teklif PDF’lerinde SKU satırları yapılandırılmış biçimde yer alır.",
  seoBar:
    "Vitrum Group modüler istasyonları saha ölçüsüne göre seçilir. 2026 bar projelerinde buz makinesi kapasitesi günlük bardak adedine bağlıdır.",
  seoEnIndustrial:
    "Export markets include the Gulf, Central Asia and Eastern Europe. 2026 quote summaries via Project Factory take about five minutes before sales engineering sign-off.",
  seoEnQuotation:
    "VAT and logistics lines are included in the output file. 2026 commercial kitchen projects start from capacity and concept inputs in Project Factory.",
};

function closingFor(key) {
  return key === "seoEnIndustrial" || key === "seoEnQuotation"
    ? "Complete the equipment list via Project Factory or contact; installation is planned with sales engineering."
    : CLOSING;
}

function buildFourth(key, level = 0) {
  const extra = EXTRA[key];
  if (!extra) throw new Error(`missing EXTRA: ${key}`);
  const parts = [extra];
  if (level >= 1) parts.push(PAD);
  if (level >= 2) parts.push(PAD2);
  parts.push(closingFor(key));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function expandBody(key, html) {
  if (key === "blogHub") return html;

  let paras = splitParas(html).map(stripClosing).filter(Boolean);
  paras = paras.filter((p, i) => i === 0 || p !== paras[i - 1]);
  const keep = key === "marketKasap" ? 2 : 3;
  paras = paras.slice(0, keep);
  if (key === "marketKasap" && paras[0]) {
    paras[0] =
      "Market kurulumunda müşteri yolculuğu reyondan başlar. Dondurulmuş ada, soğutmalı gondol ve kasap bankosu aynı koridorda dizilir; hazırlık ve depo arkada ayrılır. Kasap hattında kıyma, dilimleme ve vitrin sergisi farklı zonlardadır.";
  }

  let level = 0;
  paras.push(buildFourth(key, level));
  let len = plainText(joinParas(paras)).length;
  while (len < MIN && level < 2) {
    level++;
    paras[paras.length - 1] = buildFourth(key, level);
    len = plainText(joinParas(paras)).length;
  }

  while (len > MAX && level > 0) {
    level--;
    paras[paras.length - 1] = buildFourth(key, level);
    len = plainText(joinParas(paras)).length;
  }

  if (len < MIN) {
    const tail = " Liste Proje Fabrikası’nda tamamlanır.";
    const c = closingFor(key);
    const core = stripClosing(paras[paras.length - 1]);
    paras[paras.length - 1] = `${core}${tail} ${c}`.replace(/\s+/g, " ").trim();
    len = plainText(joinParas(paras)).length;
  }

  if (len < MIN || len > MAX) {
    console.warn(`[warn] ${key}: ${len} (hedef ${MIN}-${MAX})`);
  } else {
    console.log(`[ok] ${key}: ${len}`);
  }

  return joinParas(paras);
}

const bodies = JSON.parse(fs.readFileSync(bodiesPath, "utf8"));
const out = {};
for (const [key, html] of Object.entries(bodies)) {
  out[key] = expandBody(key, html);
}
fs.writeFileSync(bodiesPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("Wrote", bodiesPath);
