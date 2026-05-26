/**
 * FRONTEND v2.docx + ekipmanlar.json → public/data/eq-category-seo.json
 * Çalıştır: npm run seo:categories
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categoryToDeptSeg } from "./eq-seo-lib.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public", "data", "ekipmanlar.json");
const outPath = path.join(root, "public", "data", "eq-category-seo.json");

const DEPT_LABELS = {
  pisirme: "Pişirme Ekipmanları",
  sogutma: "Soğutma Ekipmanları",
  kahve: "Kahve Ekipmanları",
  yikama: "Yıkama Ekipmanları",
  hazirlik: "Hazırlık Ekipmanları",
  icecek: "İçecek Ekipmanları",
};

/** FRONTEND v2 sol liste — tip= slug + departman (katalogda henüz olmayanlar dahil) */
const FRONTEND_TIPS = [
  // Pişirme
  { tip: "firinlar", dept: "pisirme", label: "Fırınlar", desc: "Kombi, konveksiyonlu, pizza ve pastane fırınları — profesyonel sıcak hat." },
  { tip: "kombi-firin", dept: "pisirme", label: "Kombi Fırınlar", desc: "Fırın arabası uyumlu kombi fırınlar; otel ve catering hacmi için." },
  { tip: "konveksiyonlu-firin", dept: "pisirme", label: "Konveksiyonlu Fırınlar", desc: "Hava sirkülasyonlu pişirme; restoran ve pastane üretim hattı." },
  { tip: "jet-mikrodalga-firin", dept: "pisirme", label: "Jet ve Mikrodalga Fırınlar", desc: "Hızlı servis ve kafeterya hatları için kompakt pişirme." },
  { tip: "komurlu-firin", dept: "pisirme", label: "Kömürlü Fırınlar", desc: "Taş fırın ve kömür aromalı pişirme; pide ve lahmacun konseptleri." },
  { tip: "pizza-firinlari", dept: "pisirme", label: "Pizza Fırınları", desc: "Taş tabanlı, kubbeli ve konveyörlü pizza fırınları." },
  { tip: "mayalama-dolabi", dept: "pisirme", label: "Mayalama Dolapları", desc: "Hamur mayalama ve kontrollü nem ortamı; pastane üretimi." },
  { tip: "induksiyonlu-ocak", dept: "pisirme", label: "İndüksiyonlu Ocaklar", desc: "Enerji verimli setüstü ve ankastre indüksiyon ocaklar." },
  { tip: "asansorlu-izgara", dept: "pisirme", label: "Asansörlü Izgaralar", desc: "Yüksek hacimli ızgara hatları; otel ve banquette servis." },
  { tip: "doner-ocaklari", dept: "pisirme", label: "Döner Ocakları", desc: "Döner robot ve aksesuarlarıyla tam döner hattı." },
  { tip: "pilic-cevirme", dept: "pisirme", label: "Piliç Çevirme Makineleri", desc: "Rotisserie ve piliç çevirme ekipmanları." },
  { tip: "lavtasli_izgara", dept: "pisirme", label: "Lavtaşlı Izgara", desc: "Steakhouse ve et restoranı için eşit ısı dağılımlı ızgara." },
  { tip: "char_izgara", dept: "pisirme", label: "Char Izgara", desc: "Kömür alevli autantik ızgara; davlumbaz altyapısı kritik." },
  { tip: "salamander", dept: "pisirme", label: "Salamander", desc: "Üst ızgara ve gratin; et yüzeyi mühürleme." },
  { tip: "patates_dinlendirme", dept: "pisirme", label: "Patates Dinlendirme", desc: "İki aşamalı kızartma için yan ürün hazırlığı." },
  // Soğutma
  { tip: "tezgah-tipi-buzdolabi", dept: "sogutma", label: "Tezgah Tipi Buzdolapları", desc: "Mutfak hattına entegre tezgah altı soğutma." },
  { tip: "make-up-dolabi", dept: "sogutma", label: "Make Up Dolapları", desc: "Hazırlık ve servis arası soğuk depolama." },
  { tip: "dik-tip-buzdolap", dept: "sogutma", label: "Dik Tip Buzdolaplar", desc: "GN uyumlu dikey soğutucular; restoran ana stoğu." },
  { tip: "buz-makinesi", dept: "sogutma", label: "Buz Makineleri", desc: "Küp ve kar buzu üretimi; bar ve catering." },
  { tip: "derin-dondurucu", dept: "sogutma", label: "Derin Dondurucular", desc: "Dikey ve yatay derin dondurma üniteleri." },
  { tip: "dry_age_dolabi", dept: "sogutma", label: "Dry-Age Dolabı", desc: "Et olgunlaştırma; steakhouse farklılaştırıcı ekipman." },
  { tip: "blast-chiller", dept: "sogutma", label: "Blast Chiller", desc: "Hızlı şoklama; HACCP soğuk zincir." },
  { tip: "soguk-oda", dept: "sogutma", label: "Soğuk Odalar", desc: "Modüler soğuk oda ve hesaplama; ana depo çözümleri." },
  { tip: "balik-teshir", dept: "sogutma", label: "Balık Teşhir Reyonları", desc: "Balık restoranı ve market teşhir soğutması." },
  { tip: "sarap-dolabi", dept: "sogutma", label: "Şarap Dolapları", desc: "Şarap saklama ve servis sıcaklığı." },
  // Kahve
  { tip: "espresso-makinesi", dept: "kahve", label: "Espresso Kahve Makineleri", desc: "Kafe ve restoran espresso istasyonu." },
  { tip: "kahve-degirmeni", dept: "kahve", label: "Kahve Değirmenleri", desc: "Taze öğütme; barista kalitesi." },
  { tip: "filtre-kahve", dept: "kahve", label: "Filtre Kahve Makineleri", desc: "Toplu demleme ve otel kahvaltı hattı." },
  { tip: "turk-kahve", dept: "kahve", label: "Türk Kahve Makineleri", desc: "Geleneksel Türk kahvesi üretim ekipmanı." },
  // Yıkama
  { tip: "setalti-bulasik", dept: "yikama", label: "Setaltı Bulaşık Makineleri", desc: "Kompakt mutfaklar ve bar için tezgah altı yıkama." },
  { tip: "giyotin-bulasik", dept: "yikama", label: "Giyotin Tip Bulaşık Makineleri", desc: "Kapaklı giyotin tip; orta ölçek restoran." },
  { tip: "konveyorlu-bulasik", dept: "yikama", label: "Konveyörlü Bulaşık Makineleri", desc: "Yüksek hacim otel ve catering yıkama hattı." },
  { tip: "tirnakli-bulasik", dept: "yikama", label: "Tırnaklı Bulaşık Makineleri", desc: "Ağır hizmet ve ithal endüstriyel yıkama." },
  { tip: "kazan-yikama", dept: "yikama", label: "Kazan Yıkama Makineleri", desc: "Büyük hacimli tencere ve kazan yıkama." },
  // Hazırlık
  { tip: "et-hazirlik", dept: "hazirlik", label: "Et Hazırlık Ekipmanları", desc: "Kıyma, dilimleme, kemik testere; kasap hattı." },
  { tip: "et_kutugu", dept: "hazirlik", label: "Et Kütüğü", desc: "Profesyonel kasap çalışma yüzeyi." },
  { tip: "kiyma_makinesi", dept: "hazirlik", label: "Et Kıyma Makinesi", desc: "Burger ve köfte üretimi; steakhouse yan menü." },
  { tip: "et_kemik_testeresi", dept: "hazirlik", label: "Et Kemik Testeresi", desc: "T-bone ve tomahawk kesimi." },
  { tip: "sebze-dograma", dept: "hazirlik", label: "Sebze Doğrama Makineleri", desc: "Hızlı sebze hazırlık; catering hacmi." },
  { tip: "hamur-hazirlik", dept: "hazirlik", label: "Hamur Hazırlık", desc: "Mikser, hamur yoğurma ve pastane hattı." },
  { tip: "vakum-makinesi", dept: "hazirlik", label: "Vakum Makineleri", desc: "Sous vide ve paketleme öncesi vakum." },
  { tip: "sous-vide", dept: "hazirlik", label: "Sous Vide", desc: "Düşük sıcaklıkta hassas pişirme hazırlığı." },
  // İçecek
  { tip: "bar-blender", dept: "icecek", label: "Bar Blenderlar", desc: "Kokteyl ve buz kırma; bar hattı." },
  { tip: "portakal-sikma", dept: "icecek", label: "Portakal & Narenciye Sıkma", desc: "Taze meyve suyu istasyonu." },
  { tip: "soguk-dispenser", dept: "icecek", label: "Soğuk İçecek Dispenseri", desc: "Limonata, meyve suyu ve soğuk servis." },
  { tip: "sicak-cikolata", dept: "icecek", label: "Sıcak Çikolata & Sahlep", desc: "Kafe ve pastane sıcak içecek hattı." },
  { tip: "cay-makinesi", dept: "icecek", label: "Çay Makineleri", desc: "Demlikli ve otomatik çay demleme." },
  { tip: "cay-kazani", dept: "icecek", label: "Çay Kazanları", desc: "Yoğun servis için çay kulesi ve kazan." },
  { tip: "buz-makinesi", dept: "icecek", label: "Buz Makineleri", desc: "Berrak ve küp buz üretimi." },
];

const CATALOG_LABELS = {
  "sanayi-ocaklari": "Endüstriyel Ocaklar",
  "sanayi-tipi-izgaralar": "Endüstriyel Izgaralar",
  kuzineler: "Kuzineler",
  fritozler: "Fritözler",
  "doner-ocaklari-": "Döner Ocakları",
  "tost-makineleri": "Tost Makineleri",
  "pilic-cevirme-makineleri": "Piliç Çevirme Makineleri",
  "ocakbasi-izgara": "Ocakbaşı Izgaralar",
  "sogutma-ekipmanlari": "Soğutma Ekipmanları",
  "kahve-makineleri": "Kahve Makineleri",
  "bulasik-makineleri": "Bulaşık Makineleri",
  "hamur-hazirlik-makineleri": "Hamur Hazırlık Makineleri",
  "et-hazirlik-makineleri": "Et Hazırlık Makineleri",
  "cay-kazanlari-cay-makineleri-cay-otomatlari": "Çay Kazanları ve Otomatları",
  "yiyecek-ve-icecek-otomatlari-": "Yiyecek ve İçecek Otomatları",
  "cikolata-temperleme-makinesi-": "Çikolata Temperleme",
};

function faqDept(dept, label) {
  return [
    {
      q: `${label} için hangi işletmeler uygundur?`,
      a: `Restoran, otel, kafe, catering ve bulut mutfak projelerinde ${label.toLowerCase()} seçimi kapasite ve menüye göre Equsto Satış Mühendisliği ile netleştirilir.`,
    },
    {
      q: `${label} teklifi nasıl alınır?`,
      a: "Proje Fabrikası akışında konsept bilgisi girerek liste oluşturabilir veya bu vitrindeki ürün kartlarından teklif isteyebilirsiniz.",
    },
  ];
}

function faqTip(label, deptLabel) {
  return [
    {
      q: `${label} seçerken nelere dikkat edilmeli?`,
      a: `Kapasite, enerji, montaj tipi ve ${deptLabel} hattındaki yerleşim proje planına göre belirlenir; Equsto Gastronomi Tasarımı CAD yerleşim desteği sunar.`,
    },
    {
      q: `${label} fiyatı ne kadar?`,
      a: "Katalog referans fiyatları ürün kartlarında görünür; nihai teklif proje şartnamesi ve montaj kapsamına göre onaylanır.",
    },
  ];
}

function titleDept(label) {
  return `${label} — Endüstriyel Mutfak Kataloğu · Equsto`;
}

function titleTip(label, deptLabel) {
  return `${label} — ${deptLabel} · Equsto`;
}

const items = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const counts = {};
for (const row of items) {
  if (!row?.category) continue;
  counts[row.category] = (counts[row.category] || 0) + 1;
}

const departments = {};
for (const [id, label] of Object.entries(DEPT_LABELS)) {
  departments[id] = {
    id,
    label,
    title: titleDept(label),
    description: `${label}: restoran, otel, catering ve bulut mutfak için Equsto kataloğu. Proje Fabrikası ile anında teklif.`,
    keywords: `${label.toLowerCase()}, endüstriyel mutfak, Equsto, Proje Fabrikası, Türkiye`,
    faq: faqDept(id, label),
    path: `/shop/${id}`,
  };
}

const catalogCategories = {};
for (const [slug, label] of Object.entries(CATALOG_LABELS)) {
  const dept = categoryToDeptSeg(slug);
  if (!dept) continue;
  const deptLabel = DEPT_LABELS[dept];
  catalogCategories[slug] = {
    slug,
    dept,
    label,
    productCount: counts[slug] || 0,
    title: titleTip(label, deptLabel),
    description: `${label} — ${deptLabel} vitrininde ${counts[slug] || 0}+ model. Öztiryakiler ve global markalar; Equsto ile teklif.`,
    keywords: `${label}, ${deptLabel}, endüstriyel mutfak ekipmanı, Equsto`,
    faq: faqTip(label, deptLabel),
    path: `/shop/${dept}?tip=${slug}`,
  };
}

const tips = {};
for (const t of FRONTEND_TIPS) {
  const deptLabel = DEPT_LABELS[t.dept];
  tips[t.tip] = {
    tip: t.tip,
    dept: t.dept,
    label: t.label,
    title: titleTip(t.label, deptLabel),
    description: t.desc + ` ${deptLabel} — Equsto kataloğu ve Proje Fabrikası teklif.`,
    keywords: `${t.label}, ${deptLabel}, endüstriyel mutfak, Equsto`,
    faq: faqTip(t.label, deptLabel),
    path: `/shop/${t.dept}?tip=${t.tip}`,
    source: "frontend-v2",
  };
}

const out = {
  version: "2026-05-15",
  source: "FRONTEND v2.docx + ekipmanlar.json",
  departments,
  catalogCategories,
  tips,
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log(
  `[seo:categories] ${outPath} — ${Object.keys(departments).length} dept, ${Object.keys(catalogCategories).length} katalog, ${Object.keys(tips).length} tip`
);
