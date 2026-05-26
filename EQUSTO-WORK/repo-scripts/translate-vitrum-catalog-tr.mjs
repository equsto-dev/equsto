/**
 * vitrum-bars-catalogue.json — TR vitrin metinleri (isimler aynı kalır).
 * EN: descriptionEn / featuresEn · TR: description / features
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "public", "data", "vitrum-bars-catalogue.json");

const FEAT_TR = {
  "Insulated ice well with removable dividers": "Çıkarılabilir bölmeli yalıtımlı buz kuyusu",
  "Speed rack for bottles": "Şişeler için speed rack",
  "Dishwasher basket storage drawers": "Bulaşık makinesi sepeti saklama çekmeceleri",
  "Neutral storage drawers": "Nötr saklama çekmeceleri",
  "Sink with integrated glass rinser": "Entegre bardak yıkayıcılı evye",
  "Integrated freezer with 4 drawers": "4 çekmeceli entegre dondurucu",
  "Pre-mix storage compartments": "Pre-miks saklama bölmeleri",
  "Organic waste compartment with front garbage hatch": "Ön çöp hazneli organik atık bölmesi",
  "Storage for dishwashing baskets": "Bulaşık makinesi sepeti saklama",
  "Dual sinks with integrated glass rinsers": "Entegre bardak yıkayıcılı çift evye",
  "Built-in freezer with 4 drawers": "4 çekmeceli gömme dondurucu",
  "Dual organic waste compartments with front garbage hatch": "Ön çöp hazneli çift organik atık bölmesi",
  "Bar condiment compartment with 4 GN 1/9 trays": "4 adet GN 1/9 tepsili bar garnitür bölmesi",
  "Four neutral drawers for bottle storage": "Şişe saklama için dört nötr çekmece",
  "Organic waste compartment with front garbage hatch": "Ön çöp hazneli organik atık bölmesi",
  "Dishwasher basket storage in 2 drawers": "2 çekmecede bulaşık makinesi sepeti saklama",
  "Two neutral storage drawers": "İki nötr saklama çekmecesi",
  "Integrated freezer with 2 drawers": "2 çekmeceli entegre dondurucu",
  "Storage drawers for dishwashing baskets": "Bulaşık makinesi sepeti saklama çekmeceleri",
  "Additional neutral storage drawers": "Ek nötr saklama çekmeceleri",
  "Extended speed rack for bottles": "Genişletilmiş şişe speed rack'i",
  "Additional storage drawers": "Ek saklama çekmeceleri",
  "Integrated freezer with single drawer": "Tek çekmeceli entegre dondurucu",
  "Durable stainless steel construction": "Dayanıklı paslanmaz çelik gövde",
  "Dual insulated ice wells with removable dividers": "Çıkarılabilir bölmeli çift yalıtımlı buz kuyusu",
  "Expanded speed rack for bottles": "Genişletilmiş şişe speed rack'i",
  "Integrated freezer with 6 drawers": "6 çekmeceli entegre dondurucu",
  "Two drawers for neutral temperature bottle storage": "Nötr sıcaklıkta şişe saklama için iki çekmece",
  "Garnish compartment with 8 GN 1/9 trays": "8 adet GN 1/9 tepsili garnitür bölmesi",
  "Front-mounted speed rack for bottles": "Ön montaj şişe speed rack'i",
  "Neutral temperature drawer for bottle storage": "Şişe saklama için nötr sıcaklık çekmecesi",
  "Garnish compartment with 5 GN 1/9 trays": "5 adet GN 1/9 tepsili garnitür bölmesi",
  "Sink unit with integrated organic waste compartment": "Entegre organik atık bölmeli evye ünitesi",
  "Front-mounted speedrack for bottles": "Ön montaj şişe speed rack'i",
  "Sliding plastic cutting board": "Kayar plastik kesme tahtası",
  "Front-mounted double speed rack for bottles": "Ön montaj çift şişe speed rack'i",
  "Smooth under shelf for additional storage": "Ek depolama için düz alt raf",
  "Front-mounted platform for blender convenience": "Blender için ön montaj platformu",
  "Smooth under-shelf storage": "Alt raf depolama",
  "Front-mounted blender platform": "Ön montaj blender platformu",
  "Front-mounted speed rack for bottles": "Ön montaj şişe speed rack'i",
  "Smooth under shelf": "Düz alt raf",
  "Sink unit": "Evye ünitesi",
  "Front-mounted bottle speed rack": "Ön montaj şişe speed rack'i",
  "Smooth undershelf for additional storage": "Ek depolama için alt raf",
  "Integrated sink unit": "Entegre evye ünitesi",
  "Coffee waste knock box": "Kahve atığı knock box",
  "Space for custom under-counter cooler": "Tezgah altı soğutucu için alan",
  "Two neutral storage drawers": "İki nötr saklama çekmecesi",
  "Dual neutral storage drawers": "Çift nötr saklama çekmecesi",
  "Drip tray with integrated glass rinser": "Entegre bardak yıkayıcılı damlama tepsisi",
  "Integrated sink with glass rinser": "Entegre bardak yıkayıcılı evye",
  "Storage for dishwasher baskets in 4 drawers": "4 çekmecede bulaşık makinesi sepeti saklama",
  "Four neutral storage drawers": "Dört nötr saklama çekmecesi",
  "Drip-tray featuring pre-mix storage": "Pre-miks saklamalı damlama tepsisi",
  "Integrated sink with glass rinser on the left side": "Solda entegre bardak yıkayıcılı evye",
  "Storage for dishwasher baskets in 4 drawers": "4 çekmecede bulaşık makinesi sepeti saklama",
  "Sink with integrated glass rinser right side": "Sağda entegre bardak yıkayıcılı evye",
  "Drip tray with pre-mix storage": "Pre-miks saklamalı damlama tepsisi",
  "Plastic cutting board with slide feature": "Kayar plastik kesme tahtası",
  "Two drawers for dishwashing basket storage": "Bulaşık makinesi sepeti için iki çekmece",
  "Sink with integrated organic waste compartment": "Entegre organik atık bölmeli evye",
  "Storage cupboard with middle shelf and hinged door": "Orta raflı ve menteşeli kapılı dolap",
  "Storage for three dishwasher baskets": "Üç bulaşık makinesi sepeti saklama",
  "Slides with adjustable height for various glasses": "Farklı bardak yükseklikleri için ayarlanabilir raylar",
  "Space allocated for customizable under-counter dishwasher": "Özelleştirilebilir tezgah altı bulaşık makinesi alanı",
  "Four open-shelf storage compartment": "Dört açık raf saklama bölmesi",
  "Space for under-counter ice machine": "Tezgah altı buz makinesi alanı",
  "Three neutral storage drawers": "Üç nötr saklama çekmecesi",
  "Designated space for payment terminal and cash box": "POS terminali ve kasa için ayrılmış alan",
  "Three drawers for dishwashing basket storage": "Bulaşık makinesi sepeti için üç çekmece",
  "Adjustable slides for variable glass heights": "Değişken bardak yükseklikleri için ayarlanabilir raylar",
  "Drip tray": "Damlama tepsisi",
  "Single drip tray": "Tek damlama tepsisi",
  "Robust stainless steel build": "Sağlam paslanmaz çelik gövde",
  "Durable stainless steel constructionstainless steel construction": "Dayanıklı paslanmaz çelik gövde",
  "Integrated beer taps": "Entegre bira muslukları",
  "Ceramic headwork valve": "Seramik kartuşlu musluk gövdesi",
  "Polished chrome lever": "Parlak krom kol",
  "Counter hole diameter Ø40 mm": "Tezgah delik çapı Ø40 mm",
  "Removable spray head with 1m hose": "1 m hortumlu çıkarılabilir duş başlığı",
  "Flow rate of 23 to 28 l/min": "Debi 23–28 l/dk",
  "Operates at pressure 3 to 5 bar": "3–5 bar basınçta çalışır",
  "Lever with polished chrome finish": "Parlak krom kaplama kol",
  "Features a swiveling spout": "Döner çıkış borusu",
  "Headwork hole diameter Ø35 mm": "Gövde delik çapı Ø35 mm",
  "Flow rate ranges from 26 l/min to 32 l/min": "Debi 26–32 l/dk",
  "Works under pressure 3 to 5 bar": "3–5 bar basınçta çalışır",
  "Chromed brass faucet body": "Krom kaplama pirinç musluk gövdesi",
  "Swiveling spout feature": "Döner çıkış borusu",
  "Countertop hole diameter Ø35 mm": "Tezgah delik çapı Ø35 mm",
  "Flow rate ranges from 26–32 l/min": "Debi 26–32 l/dk",
  "Optimal performance at 3–5 bar pressure": "3–5 bar basınçta optimum performans",
  "Chromed brass body construction": "Krom kaplama pirinç gövde",
  "Flow rate between 26-32 l/min": "Debi 26–32 l/dk",
  "Constructed with AISI-304 stainless steel": "AISI-304 paslanmaz çelik gövde",
  "Operates at pressure between 3-5 bar": "3–5 bar basınçta çalışır",
  "Counter hole diameter Ø35 mm": "Tezgah delik çapı Ø35 mm",
  "Ceramic headwork valve in faucet": "Seramik kartuşlu musluk",
  "Operates at pressure 3-5 bar": "3–5 bar basınçta çalışır",
  "Spout with swiveling feature": "Döner çıkış borusu",
  "Chromed steel spring": "Krom kaplama çelik yay",
  "Ceramic headwork valves": "Seramik kartuşlu musluklar",
  "3/8” connections": "3/8” bağlantılar",
  "SS-braided reinforced flexible hose": "Paslanmaz örgülü güçlendirilmiş esnek hortum",
  "Flow rate between 9-15 l/min at 2-4 bar pressure": "2–4 bar’da 9–15 l/dk debi",
  "Polished chrome steel knobs and spring": "Parlak krom düğmeler ve yay",
  "Chromed brass body": "Krom kaplama pirinç gövde",
  "Powered by 4x1.5V batteries or 230V supply voltage": "4×1,5 V pil veya 230 V besleme",
  "Operating distance up to 10 cm": "10 cm’ye kadar algılama mesafesi",
  "Side control lever": "Yan kontrol kolu",
  "6 l/min flow rate at 3 bar pressure": "3 bar’da 6 l/dk debi",
  "Star/Stop function": "Başlat/Durdur fonksiyonu",
};

const DESC_TR_BY_PAGE = {
  23: "En çok satan iki kişilik istasyonumuz; entegre dondurucu çekmeceleri, genişletilmiş damlama tepsisi, evye ve bardak saklama alanı ile.",
  24: "Artizan kokteyller için tasarlanmış iki kişilik istasyon; genişletilmiş damlama tepsisi bölümü ve çift evye.",
  25: "Genişletilmiş şişe speed rack’i, kolay erişimli garnitür tepsileri ve büyük yalıtımlı buz kuyusu ile imza bar modülümüz.",
  26: "Entegre dondurucu çekmeceleri, evye ve pratik bardak saklama alanına sahip bar modülü.",
  27: "Entegre bardak saklama ve tezgah altı bulaşık makinesi ile bulaşık yıkama modülü; hızlı ve verimli temizlik.",
  28: "Entegre dondurucu çekmeceleri, evye, bardak saklama ve genişletilmiş şişe speed rack’ine sahip bar modülü.",
  29: "Entegre dondurucu çekmecesi ve hızlı erişimli şişe speed rack’i ile bar modülü.",
  30: "Entegre dondurucu çekmeceleri ve hızlı erişimli şişe speed rack’i ile donatılmış bar modülü.",
  31: "Entegre soğutma çekmeceleri ve hızlı erişimli şişe speed rack’ine sahip bar istasyonu.",
  32: "Entegre bardak saklama ve tezgah altı bulaşık makinesi ile bulaşık yıkama modülü.",
  33: "Entegre soğutma çekmeceleri ve genişletilmiş speed rack ile bar istasyonu.",
  34: "Entegre dondurucu çekmeceleri ve genişletilmiş speed rack ile bar istasyonu.",
  35: "Yalıtımlı buz kuyusu ve iki nötr saklama çekmeceli bar modülü.",
  36: "Yalıtımlı buz kuyusu, birden fazla nötr çekmece ve fonksiyonel evye ile bar modülü.",
  37: "Organik atık bertarafı için özel bölümlü evye modülü.",
  38: "Yalıtımlı buz kuyusu, şişe speed rack’i ve akıcı servis için evye içeren bar modülü.",
  39: "İki yalıtımlı buz kuyusu, şişe speed rack’i ve evye ile genişletilmiş bar modülü.",
  40: "Kurulum ve sökümü hızlı olan, kolay montajlı etkinlik bar istasyonu.",
  41: "Entegre dondurucu çekmeceleri ve genişletilmiş speed rack ile bar istasyonu.",
  42: "Tezgah altı soğutucu alanı ve ek saklama çekmeceleri olan kahve modülü.",
  43: "Entegre nötr saklama dolabı ile kahve modülü.",
  44: "Genişletilmiş bardak saklama, çift damlama tepsisi ve pre-miks bölmeleri olan evye modülü.",
  45: "Entegre bardak saklama alanlı evye modülü.",
  46: "Bardak saklama, entegre damlama tepsisi ve pre-miks bölmesi olan evye modülü.",
  47: "Pratik düzen ve kullanım için nötr saklama bölümlü evye modülü.",
  48: "Organik atık için özel bölüm içeren evye modülü.",
  49: "Entegre bardak saklama ve tezgah altı bulaşık makinesi ile bulaşık yıkama modülü.",
  50: "Entegre buz makinesi ve ek saklama bölmesi olan modüler bar ünitesi.",
  51: "Çok amaçlı saklama için nötr çekmeceli modüler bar ünitesi.",
  52: "Geniş saklama alanına sahip kasa modülü.",
  53: "Ayarlanabilir çekmece yüksekliği ile entegre bardak saklamalı bar ünitesi.",
  54: "Entegre bardak saklama ve dökülmelere karşı damlama tepsili bar ünitesi.",
  55: "Özel bar konfigürasyonları için, fonksiyonel damlama tepsili köşe modülü.",
  56: "Gömme damlama tepsili, özel bar konfigürasyonları için köşe modülü.",
  57: "Damlama tepsisi ve entegre bira musluk mekanizması ile köşe modülü.",
  58: "Seramik kartuşlu, parlak krom kollu profesyonel karışım musluğu.",
  59: "Seramik kartuşlu, krom kollu, döner çıkışlı karışım musluğu; krom kaplama pirinç gövde.",
  60: "Sağlam seramik kartuş, parlak krom kol ve döner çıkışlı karışım musluğu.",
  61: "Seramik kartuşlu karışım musluğu; AISI-304 paslanmaz çelik gövde.",
  62: "Seramik kartuşlu, parlak krom kollu, krom çelik yaylı döner karışım musluğu.",
  63: "Paslanmaz örgülü hortumlu, döner çıkışlı, krom kol ve yaylı musluk seti.",
  64: "Fotoselli, krom kaplama pirinç gövde; 10 cm’ye kadar algılama mesafesi.",
};

const LABEL_TR = {
  "Ice Well": "Buz kuyusu",
  "Ice well": "Buz kuyusu",
  "Two Ice Well": "Çift buz kuyusu",
  Sink: "Evye",
  Diameter: "Çap",
  Total: "Toplam",
};

function trFeat(s) {
  return FEAT_TR[s] || s;
}

function trLabel(s) {
  return LABEL_TR[s] || s;
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));

for (const p of data.products) {
  if (!p.descriptionEn && p.description) {
    p.descriptionEn = p.description;
    p.featuresEn = Array.isArray(p.features) ? p.features.slice() : [];
  }
  const page = p.page;
  if (DESC_TR_BY_PAGE[page]) {
    p.description = DESC_TR_BY_PAGE[page];
  } else if (p.descriptionEn) {
    p.description = p.descriptionEn;
  }
  const srcFeats = p.featuresEn && p.featuresEn.length ? p.featuresEn : p.features || [];
  p.features = srcFeats.map(trFeat);
  if (Array.isArray(p.dimensionsMm)) {
    p.dimensionsMm = p.dimensionsMm.map((d) => ({
      ...d,
      label: trLabel(d.label),
      labelEn: d.labelEn || d.label,
    }));
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("[translate-vitrum] Güncellendi:", file, "—", data.products.length, "ürün");
