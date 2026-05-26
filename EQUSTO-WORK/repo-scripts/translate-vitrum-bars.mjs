// scripts/translate-vitrum-bars.mjs
// Tek seferlik script: vitrum-bars-catalogue.json içindeki İngilizce
// `description` ve `features` alanlarını Türkçe ile değiştirir.
// Çalıştırma:  node scripts/translate-vitrum-bars.mjs

import fs from 'node:fs';
import path from 'node:path';

const JSON_PATH = path.resolve('public/data/vitrum-bars-catalogue.json');

// Sayfa numarasına göre açıklama çevirileri (42 ürün)
const DESC_BY_PAGE = {
  23: 'En çok tercih ettiğimiz iki-bartender istasyonu; entegre dondurucu çekmeceler, uzatılmış damlalık, lavabo ve cam saklama bölmesi içerir.',
  24: 'Özel kokteyl hazırlığı için tasarlanmış iki-bartender istasyonu; uzun damlalık bölümü ve çift lavabo barındırır.',
  25: 'Uzun şişe speed rack’i, kolay erişimli garnitür tepsileri ve geniş izolasyonlu buz haznesine sahip bayrak bar modülümüz.',
  26: 'Entegre dondurucu çekmeceleri, lavabo ve pratik cam saklama bölmesi olan bar modülü.',
  27: 'Akıcı ve verimli yıkama için entegre cam saklama ve tezgâh altı bulaşık makinesi içeren bulaşık modülü.',
  28: 'Entegre dondurucu çekmeceler, lavabo ve cam saklama bölmesi; verimli şişe stoklaması için uzatılmış speed rack’li bar modülü.',
  29: 'Entegre dondurucu çekmece ve hızlı erişimli speed rack ile donatılmış bar modülü.',
  30: 'Entegre dondurucu çekmeceler ve hızlı erişimli speed rack ile donatılmış bar modülü.',
  31: 'Entegre soğutmalı çekmeceler ve hızlı erişimli speed rack ile donatılmış bar istasyonu.',
  32: 'Akıcı ve verimli yıkama için entegre cam saklama ve tezgâh altı bulaşık makinesi içeren bulaşık modülü.',
  33: 'Entegre soğutmalı çekmeceler ve uzun speed rack ile donatılmış, hızlı şişe erişimi sunan bar istasyonu.',
  34: 'Entegre dondurucu çekmeceler ve uzun speed rack ile donatılmış, hızlı şişe erişimi sunan bar istasyonu.',
  35: 'İzolasyonlu buz haznesi ve iki nötr saklama çekmecesi içeren bar modülü.',
  36: 'İzolasyonlu buz haznesi, çoklu nötr çekmece ve fonksiyonel lavabo içeren bar modülü.',
  37: 'Organik atık imhasına ayrılmış bölmesiyle öne çıkan lavabo modülü.',
  38: 'İzolasyonlu buz haznesi, şişe speed rack’i ve servis akışını hızlandıran lavabo içeren bar modülü.',
  39: 'Çift izolasyonlu buz haznesi, şişe speed rack’i ve lavabo ile verimli servis sağlayan uzun bar modülü.',
  40: 'Hızlı kurulum ve toplama için kolay-monte yapısıyla öne çıkan etkinlik bar istasyonu.',
  41: 'Entegre dondurucu çekmeceler ve uzun speed rack ile donatılmış, hızlı şişe erişimi sunan bar istasyonu.',
  42: 'Tezgâh altı soğutucu için yer ve ek saklama çekmeceleri sunan kahve modülü.',
  43: 'Servis akışını hızlandıran entegre nötr saklama dolabıyla donatılmış kahve modülü.',
  44: 'Uzun cam saklama, çift damlalık ve özel pre-mix bölmeleri içeren lavabo modülü.',
  45: 'Entegre cam saklama ile donatılmış lavabo modülü.',
  46: 'Cam saklama, entegre damlalık ve pre-mix bölmesi içeren lavabo modülü.',
  47: 'Pratik düzen için nötr saklama bölmeli lavabo modülü.',
  48: 'Organik atık imhasına ayrılmış bölmesi olan lavabo modülü.',
  49: 'Akıcı ve verimli yıkama için entegre cam saklama ve tezgâh altı bulaşık makinesi içeren bulaşık modülü.',
  50: 'Entegre buz makinesi ve ek saklama bölmesi içeren modüler bar ünitesi.',
  51: 'Çok amaçlı saklama için nötr çekmecelerle donatılmış modüler bar ünitesi.',
  52: 'Geniş saklama alanı sunan kasiyer modülü.',
  53: 'Yüksekliği ayarlanabilir çekmecelerle entegre cam saklamaya sahip bar ünitesi.',
  54: 'Dökülme kontrolü için entegre cam saklama ve damlalık içeren bar ünitesi.',
  55: 'Özel bar konfigürasyonları için tasarlanmış, fonksiyonel damlalıklı köşe modülü.',
  56: 'Özel bar konfigürasyonları için tasarlanmış, dahili damlalıklı köşe modülü.',
  57: 'Özel bar düzenleri için tasarlanmış; damlalık ve entegre bira musluğu mekanizması içeren köşe modülü.',
  58: 'Polisajlı krom kolu ve seramik valfli profesyonel karışım musluğu.',
  59: 'Seramik valf, krom kol ve kromajlı pirinç gövdeli döner ağızlı karışım musluğu.',
  60: 'Sağlam seramik valf, polisajlı krom kol ve döner ağız özellikli karıştırıcı musluk.',
  61: 'Sağlam seramik valf, polisajlı krom kol ve döner ağız özellikli karıştırıcı musluk.',
  62: 'Seramik valf, polisajlı krom kol ve kromajlı çelik yaylı döner karışım musluğu.',
  63: 'Paslanmaz çelik örgülü hortum; döner ağız, polisajlı krom kol ve yay ile donatılmış.',
  64: 'Kromajlı pirinçten üretilmiş, fotoseli dahili, 10 cm’ye kadar mesafeden çalışan elektrikli musluk.'
};

// Features çevirileri (İngilizce → Türkçe). Eşleşmeyen geldiğinde aynen bırakılır.
const FEAT_MAP = {
  "3/8″ connections": "3/8″ bağlantılar",
  "3/8\" connections": "3/8″ bağlantılar",
  "3/8” connections": "3/8″ bağlantılar",
  "3/8�?? connections": "3/8″ bağlantılar",
  "6 l/min flow rate at 3 bar pressure": "3 bar basınçta 6 l/dk akış debisi",
  "Additional neutral storage drawers": "Ek nötr saklama çekmeceleri",
  "Additional storage drawers": "Ek saklama çekmeceleri",
  "Adjustable slides for variable glass heights": "Farklı bardak yüksekliklerine uyumlu ayarlanabilir kızaklar",
  "Bar condiment compartment with 4 GN 1/9 trays": "4 adet GN 1/9 tepsili bar garnitür bölmesi",
  "Built-in freezer with 4 drawers": "4 çekmeceli dahili dondurucu",
  "Ceramic headwork valve": "Seramik kafa valfi",
  "Ceramic headwork valve in faucet": "Musluk içinde seramik kafa valfi",
  "Ceramic headwork valves": "Seramik kafa valfleri",
  "Chromed brass body": "Kromajlı pirinç gövde",
  "Chromed brass body construction": "Kromajlı pirinç gövde yapısı",
  "Chromed brass faucet body": "Kromajlı pirinç musluk gövdesi",
  "Chromed steel spring": "Kromajlı çelik yay",
  "Coffee waste knock box": "Kahve telve atma kutusu (knock box)",
  "Constructed with AISI-304 stainless steel": "AISI-304 paslanmaz çelikten üretim",
  "Counter hole diameter ⌀35 mm": "Tezgâh deliği çapı ⌀35 mm",
  "Counter hole diameter Ø35 mm": "Tezgâh deliği çapı ⌀35 mm",
  "Counter hole diameter �~35 mm": "Tezgâh deliği çapı ⌀35 mm",
  "Counter hole diameter ⌀40 mm": "Tezgâh deliği çapı ⌀40 mm",
  "Counter hole diameter Ø40 mm": "Tezgâh deliği çapı ⌀40 mm",
  "Counter hole diameter �~40 mm": "Tezgâh deliği çapı ⌀40 mm",
  "Countertop hole diameter ⌀35 mm": "Tezgâh üstü delik çapı ⌀35 mm",
  "Countertop hole diameter Ø35 mm": "Tezgâh üstü delik çapı ⌀35 mm",
  "Countertop hole diameter �~35 mm": "Tezgâh üstü delik çapı ⌀35 mm",
  "Designated space for payment terminal and cash box": "POS terminali ve kasa için ayrılmış alan",
  "Dishwasher basket storage drawers": "Bulaşık sepeti saklama çekmeceleri",
  "Dishwasher basket storage in 2 drawers": "2 çekmecede bulaşık sepeti saklama",
  "Drip tray": "Damlalık",
  "Drip tray with integrated glass rinser": "Entegre cam yıkayıcılı damlalık",
  "Drip tray with pre-mix storage": "Pre-mix saklamalı damlalık",
  "Drip-tray featuring pre-mix storage": "Pre-mix saklamalı damlalık",
  "Dual insulated ice wells with removable dividers": "Sökülebilir bölmeli çift izolasyonlu buz haznesi",
  "Dual neutral storage drawers": "Çift nötr saklama çekmecesi",
  "Dual organic waste compartments with front garbage hatch": "Ön çöp kapaklı çift organik atık bölmesi",
  "Dual sinks with integrated glass rinsers": "Entegre cam yıkayıcılı çift lavabo",
  "Durable stainless steel construction": "Dayanıklı paslanmaz çelik yapı",
  "Durable stainless steel constructionstainless steel construction": "Dayanıklı paslanmaz çelik yapı",
  "Expanded speed rack for bottles": "Genişletilmiş şişe speed rack",
  "Extended speed rack for bottles": "Uzun şişe speed rack",
  "Features a swiveling spout": "Döner ağız özelliği",
  "Flow rate between 26-32 l/min": "26-32 l/dk akış debisi",
  "Flow rate between 9-15 l/min at 2-4 bar pressure": "2-4 bar basınçta 9-15 l/dk akış debisi",
  "Flow rate of 23 to 28 l/min": "23-28 l/dk akış debisi",
  "Flow rate ranges from 26 l/min to 32 l/min": "26-32 l/dk akış debisi",
  "Flow rate ranges from 26–32 l/min": "26-32 l/dk akış debisi",
  "Flow rate ranges from 26�?\"32 l/min": "26-32 l/dk akış debisi",
  "Four neutral drawers for bottle storage": "Şişe saklama için 4 nötr çekmece",
  "Four neutral storage drawers": "4 nötr saklama çekmecesi",
  "Four open-shelf storage compartment": "4 açık raflı saklama bölmesi",
  "Front-mounted blender platform": "Ön montajlı blender platformu",
  "Front-mounted bottle speed rack": "Ön montajlı şişe speed rack",
  "Front-mounted double speed rack for bottles": "Ön montajlı çift şişe speed rack",
  "Front-mounted platform for blender convenience": "Blender için ön montajlı pratik platform",
  "Front-mounted speed rack for bottles": "Ön montajlı şişe speed rack",
  "Front-mounted speedrack for bottles": "Ön montajlı şişe speed rack",
  "Garnish compartment with 5 GN 1/9 trays": "5 adet GN 1/9 tepsili garnitür bölmesi",
  "Garnish compartment with 8 GN 1/9 trays": "8 adet GN 1/9 tepsili garnitür bölmesi",
  "Headwork hole diameter ⌀35 mm": "Kafa valfi delik çapı ⌀35 mm",
  "Headwork hole diameter Ø35 mm": "Kafa valfi delik çapı ⌀35 mm",
  "Headwork hole diameter �~35 mm": "Kafa valfi delik çapı ⌀35 mm",
  "Insulated ice well with removable dividers": "Sökülebilir bölmeli izolasyonlu buz haznesi",
  "Integrated beer taps": "Entegre bira muslukları",
  "Integrated freezer with 2 drawers": "2 çekmeceli entegre dondurucu",
  "Integrated freezer with 4 drawers": "4 çekmeceli entegre dondurucu",
  "Integrated freezer with 6 drawers": "6 çekmeceli entegre dondurucu",
  "Integrated freezer with single drawer": "Tek çekmeceli entegre dondurucu",
  "Integrated sink unit": "Entegre lavabo ünitesi",
  "Integrated sink with glass rinser": "Cam yıkayıcılı entegre lavabo",
  "Integrated sink with glass rinser on the left side": "Sol tarafta cam yıkayıcılı entegre lavabo",
  "Lever with polished chrome finish": "Polisajlı krom kaplı kol",
  "Neutral storage drawers": "Nötr saklama çekmeceleri",
  "Neutral temperature drawer for bottle storage": "Şişe saklama için nötr sıcaklıkta çekmece",
  "Operates at pressure 3 to 5 bar": "3-5 bar basınçta çalışır",
  "Operates at pressure 3-5 bar": "3-5 bar basınçta çalışır",
  "Operates at pressure between 3-5 bar": "3-5 bar basınçta çalışır",
  "Operating distance up to 10 cm": "10 cm’ye kadar çalışma mesafesi",
  "Optimal performance at 3–5 bar pressure": "3-5 bar basınçta optimum performans",
  "Optimal performance at 3�?\"5 bar pressure": "3-5 bar basınçta optimum performans",
  "Organic waste compartment with front garbage hatch": "Ön çöp kapaklı organik atık bölmesi",
  "Plastic cutting board with slide feature": "Kaydırmalı plastik kesim tahtası",
  "Polished chrome lever": "Polisajlı krom kol",
  "Polished chrome steel knobs and spring": "Polisajlı krom çelik düğmeler ve yay",
  "Powered by 4x1.5V batteries or 230V supply voltage": "4x1.5V pil veya 230V şebeke beslemesi",
  "Pre-mix storage compartments": "Pre-mix saklama bölmeleri",
  "Removable spray head with 1m hose": "1m hortumlu sökülebilir spreyli başlık",
  "Robust stainless steel build": "Sağlam paslanmaz çelik yapı",
  "Side control lever": "Yan kontrol kolu",
  "Single drip tray": "Tek damlalık",
  "Sink unit": "Lavabo ünitesi",
  "Sink unit with integrated organic waste compartment": "Entegre organik atık bölmeli lavabo ünitesi",
  "Sink with integrated glass rinser": "Entegre cam yıkayıcılı lavabo",
  "Sink with integrated glass rinser right side": "Sağ tarafta entegre cam yıkayıcılı lavabo",
  "Sink with integrated organic waste compartment": "Entegre organik atık bölmeli lavabo",
  "Slides with adjustable height for various glasses": "Farklı bardaklara uyumlu yüksekliği ayarlanabilir kızaklar",
  "Sliding plastic cutting board": "Kaydırmalı plastik kesim tahtası",
  "Smooth under shelf": "Düz alt raf",
  "Smooth under shelf for additional storage": "Ek saklama için düz alt raf",
  "Smooth undershelf for additional storage": "Ek saklama için düz alt raf",
  "Smooth under-shelf storage": "Düz alt raf saklama",
  "Space allocated for customizable under-counter dishwasher": "Özel ölçüde tezgâh altı bulaşık makinesi için ayrılmış alan",
  "Space for custom under-counter cooler": "Özel ölçüde tezgâh altı soğutucu için alan",
  "Space for under-counter ice machine": "Tezgâh altı buz makinesi için alan",
  "Speed rack for bottles": "Şişe speed rack",
  "Spout with swiveling feature": "Döner ağız özelliği",
  "SS-braided reinforced flexible hose": "Paslanmaz çelik örgülü güçlendirilmiş esnek hortum",
  "Star/Stop function": "Çalıştır/Durdur fonksiyonu",
  "Storage cupboard with middle shelf and hinged door": "Orta raflı ve menteşeli kapaklı saklama dolabı",
  "Storage drawers for dishwashing baskets": "Bulaşık sepetleri için saklama çekmeceleri",
  "Storage for dishwasher baskets": "Bulaşık sepeti saklama",
  "Storage for dishwasher baskets in 4 drawers": "4 çekmecede bulaşık sepeti saklama",
  "Storage for dishwashing baskets": "Bulaşık sepeti saklama",
  "Storage for three dishwasher baskets": "3 bulaşık sepeti için saklama",
  "Swiveling spout feature": "Döner ağız özelliği",
  "Three drawers for dishwashing basket storage": "Bulaşık sepeti saklama için 3 çekmece",
  "Three neutral storage drawers": "3 nötr saklama çekmecesi",
  "Two drawers for dishwashing basket storage": "Bulaşık sepeti saklama için 2 çekmece",
  "Two drawers for neutral temperature bottle storage": "Nötr sıcaklıkta şişe saklama için 2 çekmece",
  "Two neutral storage drawers": "2 nötr saklama çekmecesi",
  "Works under pressure 3 to 5 bar": "3-5 bar basınçta çalışır"
};

function translateFeature(f) {
  if (!f) return f;
  const stripped = String(f).replace(/^→\s*/, '').trim();
  if (FEAT_MAP[stripped]) return FEAT_MAP[stripped];
  // Eşleşme yoksa orijinali döndür (script idempotent: TR ile zaten doluysa atla)
  return f;
}

function main() {
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.products)) {
    console.error('Beklenmeyen JSON yapısı.');
    process.exit(1);
  }
  let descChanged = 0;
  let featChanged = 0;
  let featUntranslated = new Set();

  for (const p of data.products) {
    // Açıklama
    if (DESC_BY_PAGE[p.page]) {
      if (p.description !== DESC_BY_PAGE[p.page]) {
        p.description = DESC_BY_PAGE[p.page];
        descChanged++;
      }
    }
    // Özellikler
    if (Array.isArray(p.features)) {
      p.features = p.features.map(f => {
        const t = translateFeature(f);
        if (t !== f) featChanged++;
        else if (f && !/[ğüşıöçĞÜŞİÖÇ]/.test(f) && /[A-Za-z]/.test(f)) {
          featUntranslated.add(String(f).replace(/^→\s*/, '').trim());
        }
        return t;
      });
    }
  }
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ Açıklama güncellendi: ${descChanged}/${data.products.length}`);
  console.log(`✓ Özellik çevrildi: ${featChanged}`);
  if (featUntranslated.size > 0) {
    console.log(`⚠ Çevrilmeyen özellikler (${featUntranslated.size}):`);
    for (const f of featUntranslated) console.log('   ·', f);
  }
}

main();
