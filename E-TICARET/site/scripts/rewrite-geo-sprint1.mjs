/**
 * GEO içerik sprint 1 — tekrarsız metinler + birleştirme sonrası güncellemeler
 * Kullanım: node scripts/rewrite-geo-sprint1.mjs
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

const BODIES = {
  "all-day-casual-cafe-kurulumu": `<p>All day casual cafe, kahvaltıdan gece atıştırmalığına uzanan menüyü tek mutfakta taşır. House Cafe tarzı işletmelerde fırın, kuzine, ızgara ve makarna hattı gün içinde farklı yüklerle çalışır; bar ve soğuk içecek istasyonu servis koridorundan bağımsız konumlandırılır. Bu sayfa 19- THE HOUSE CAFE referans proformasından türetilmiştir; aşağıdaki tablo fiyat içermez.</p><h2>Pişirme ve fırın hattı</h2><p>Konveksiyonlu fırın ve mayalama kabini pastane ağırlıklı menülerde omurgayı oluşturur. Dört gözlü kuzine, plakalı ızgara, fritöz ve makarna haşlama modülü öğle ve akşam piklerinde eşzamanlı devreye girer. Davlumbaz kapasitesi açık alevli ocak adediyle birlikte hesaplanmalı; pişirme zonu hazırlık hattından fiziksel olarak ayrılır.</p><h2>Soğuk zincir ve depo</h2><p>Panel soğuk oda (250×200×220 cm) ve panel buz odası (200×150×220 cm) günlük tedarik döngüsünü destekler. Tezgah altı ve dik tip dolaplar salata, pizza ve bar stoklarını taşır. Soğuk zincir kesintisizliği denetim odağıdır; dijital sıcaklık kaydı ruhsat dosyasına eklenebilir.</p><h2>Bar ve içecek</h2><p>Bardak yıkama makinesi, buz makinesi, portakal ve katı meyve sıkacağı, blender ve üç adet bar buzdolabı yoğun içecek trafiğini karşılar. Bar arkası elektrik ve su noktaları modül yerleşiminden önce doğrulanmalıdır. <a href="/cafe-kurulumu">Cafe kurulum rehberi</a> espresso odaklı konseptler için ayrı okunmalıdır.</p><h2>Hazırlık ve bulaşık</h2><p>Hamur yoğurma, sebze doğrama, kıyma makinesi ve el blenderi hazırlık zonunu tamamlar. Giyotin tip bulaşık makinesi giriş-çıkış tezgahları ve ön yıkama duşuyla birlikte planlanır; pik öğün yükü bulaşık kapasitesini belirler.</p><p>Kapasite ve m² bilgisiyle <a href="/pfos">Proje Fabrikası</a> cafe konseptinden kişiselleştirilmiş liste oluşturabilirsiniz. Aşağıdaki tablo 48 kalemlik referans ekipman listesidir.</p>`,

  "rehber/dark-kitchen-bulut-mutfak-2026": `<p>Dark kitchen (bulut mutfak), yalnızca paket servis veya kurye platformları üzerinden satış yapan, müşteri oturma alanı bulunmayan üretim tesisidir. Çok markalı sahalarda her marka kendi pişirme ve hazırlık parselinde çalışır; ortak yıkama, atık ve MEP altyapısı ruhsat sahibi ile marka kiracı arasındaki sözleşmeyle netleştirilir.</p><h2>Ruhsat ve MEP</h2><p>Belediye ruhsatında marka sayısı, toplam elektrik yükü, yağ sıyırıcı kapasitesi ve havalandırma debisi birlikte değerlendirilir. Çok markalı tesiste pano boyutu markaların toplam pişirme yüküne göre yeniden hesaplanır; gece vardiyası gürültü sınırı komşu birimlerle sözleşmede tanımlanmalıdır. 15 m² altı parsellerde PFOS yalnızca Grab&amp;Go ve Coffee Counter alt-konseptlerini açar.</p><h2>Operasyon ve marka ayrımı</h2><p>Markalar arası depo, fire ve sevkiyat alanı fiziksel bariyerle ayrılır; ortak soğuk oda kullanımında erişim logları tutulması önerilir. Kurye toplama noktası ile üretim çıkışı arasında sıcaklık kaybını önleyen bekleme rafı planlanır. Paket ve termal torba standardizasyonu marka başına ayrı stok alanı gerektirir.</p><h2>Ekipman planlama</h2><p>Her marka için sıcak hat, soğutma ve hazırlık modülleri ayrı satırda modellenir; ortak yıkama merkezi tüm markaların pik dakikasını taşıyacak kapasitede seçilir. Yüksek paket oranı soğutma derinliğini ve hazırlık tezgahı adedini artırır. <a href="/rehber/bulut-mutfak-operatoreleri-turkiye-2026">Bulut mutfak operatörleri</a> rehberi kiracı–operatör ilişkisini ayrı ele alır.</p><p><a href="/pfos">Proje Fabrikası</a> bulut mutfak konsepti marka sayısı, menü ve m² girdileriyle modül listesi üretir. Operatör listesi ve maliyet bandı için ilgili rehberlere bakın; saha keşfi montaj takviminin ilk adımıdır.</p>`,

  "endustriyel-mutfak-ekipmani-turkiye": `<p>Equsto, Türkiye merkezli B2B endüstriyel mutfak platformudur: pişirme, soğutma, yıkama, hazırlık, kahve ve içecek departmanları canlı katalogda listelenir. Restoran, otel, kafe, catering ve bulut mutfak projeleri aynı vitrin ve teklif akışında yönetilir; tek ürün siparişi ile anahtar teslim proje aynı sepet mantığını kullanır.</p><h2>Departman kapsamı</h2><p>Pişirme hattında kuzine, fritöz, ızgara ve konveksiyonlu fırın modülleri menüye göre adetlendirilir. Soğutma tarafında tezgah tipi dolap, panel soğuk oda ve şok dondurucu seçenekleri vitrin kartlarında mm ölçüleriyle yer alır. Yıkama, hazırlık tezgahları ve kahve istasyonları konsept rehberleriyle birlikte okunmalıdır.</p><h2>Öztiryakiler ve marka karması</h2><p>Equsto, Öztiryakiler Endüstriyel Mutfak yetkili bayii kanalıyla resmi fiyat listesi, garanti hattı ve servis yönlendirmesi sunar. Atalay ve seçili global markalar aynı katalogda tamamlayıcı modül sağlar. Canlı kur EUR ve TL'ye uygulanır; stok doğrulaması sipariş öncesi yapılır.</p><h2>Teklif ve proje akışı</h2><p><a href="/mutfak-teklif-platformu">Proje Fabrikası (PFOS)</a> konsept ve kapasite girdileriyle ekipman listesi üretir. Konsept derinliği için <a href="/steakhouse-kurulumu">steakhouse</a>, <a href="/balik-restorani-mutfak-projesi-kurulumu">balık restoranı</a> ve <a href="/rehber/dark-kitchen-bulut-mutfak-2026">dark kitchen</a> rehberlerine bakın. İhracat pazarları için iletişim hattı lojistik ve proforma sürecini yönetir.</p><p>Hizmet bölgeleri Türkiye genelini ve seçili ihracat pazarlarını kapsar. Kurumsal alıcılar için vade ve proje iskontosu teklif dosyasında ayrı satır olarak gösterilir.</p>`,

  "mutfak-teklif-platformu": `<p>Equsto Proje Fabrikası (PFOS), endüstriyel mutfak projeleri için kural motoru tabanlı ekipman listesi ve fiyat özeti üreten B2B teklif platformudur. Rezervasyon veya masa yönetimi yazılımı değildir; çıktı satın alma ve montaj planlaması için kullanılır.</p><h2>Nasıl çalışır?</h2><p>Kullanıcı konsept (restoran, otel, cafe, bulut mutfak, catering), menü profili, kapasite ve m² bilgisini girer. Kural motoru sıcak, soğutma ve yıkama modül adetlerini hesaplar; teklif PDF'inde SKU ve ürün kodu satırları yapılandırılmış biçimde yer alır. Revizyonlar proje numarası altında saklanır.</p><h2>Restoran ve konsept projeleri</h2><p>Restoran tekliflerinde menü, oturma kapasitesi, paket oranı ve servis stili temel girdilerdir. Balık restoranı için <a href="/balik-restorani-mutfak-projesi-kurulumu">mutfak projesi rehberi</a>, adım adım kontrol için <a href="/rehber/restoran-mutfak-kurulumu-checklist-2026">kurulum checklist</a> kullanılabilir. Yerleşim soruları Gastronomi Tasarımı ile derinleşir; CAD plan ikinci fazda eklenebilir.</p><h2>Onay ve kesinleşme</h2><p>PFOS çıktısı ön teklif dosyasıdır; saha keşfi ve satış mühendisliği incelemesi sonrası kesin fiyat, lojistik ve montaj kalemleri netleşir. Onay sonrası sipariş süreci başlar; mobil cihazdan saha keşfinde taslak oluşturulabilir.</p><p>Platforma <a href="/pfos">equsto.com/pfos</a> adresinden erişilir. İngilizce teklif akışı için <a href="/en/commercial-kitchen-quotation">commercial kitchen quotation</a> sayfasına bakın.</p>`,

  "oztiryakiler-ekipmani-tedarik": `<p>Equsto, Öztiryakiler Endüstriyel Mutfak ile yetkili bayii ilişkisiyle Türkiye ve seçili ihracat pazarlarında tedarik sunar. Pişirme, soğutma, yıkama ve hazırlık departmanlarında resmi fiyat listesi, garanti hattı ve servis yönlendirmesi bayii süreciyle uyumludur.</p><h2>Katalog ve teknik veriler</h2><p>Ürün kartlarında mm cinsinden dış ölçüler, güç tüketimi, CE işareti ve net ağırlık standart satırlardır. Canlı kur EUR ve TL'ye uygulanır; bayii fiyat listesi günlük güncellenir. Katalog: <a href="/shop/marka/oztiryakiler">equsto.com/shop/marka/oztiryakiler</a></p><h2>Sipariş tipleri</h2><p>Tek ürün siparişinden anahtar teslim projeye aynı vitrin akışı kullanılır. PFOS konsept girdileriyle modül adetlerini üretir; proje iskontoları teklif aşamasında uygulanır. Yedek parça siparişi garanti kaydı üzerinden yürütülür.</p><p>Öztiryakiler ana omurgadır; Atalay ve seçili markalar aynı sepette tamamlayıcı modül sağlar. Genel tedarik kapsamı için <a href="/endustriyel-mutfak-ekipmani-turkiye">endüstriyel mutfak ekipmanı — Türkiye</a> sayfasına bakın.</p>`,

  "steakhouse-kurulumu": `<p>Yüksek ısı ızgara ve kuzine hatları steakhouse'un görünür performansını taşır. Gazlı ve elektrikli seçenekler saha tesisatına göre ayrılır; eşzamanlı porsiyon sayısı ocak yayılımını belirler. Isı geri kazanımı ve davlumbaz kapasitesi pişirme adediyle birlikte okunmalıdır.</p><h2>Et hazırlık ve pişirme</h2><p>Et hazırlık modülleri paslanmaz tezgah derinliği, et tahtası hijyen seti ve el yıkama noktalarıyla HACCP sırasına uyar. Dry-age dolabı menü derinliğine göre eklenir; pişirme ile muhafaza zonları fiziksel olarak ayrılır. Ocak altı dolap ve tepsi rafları servis hızına göre konumlandırılır.</p><h2>Açık mutfak ve enerji</h2><p>Açık mutfak projelerinde görünür ızgara hatları ek havalandırma kapasitesi gerektirir; cam bariyer ve aspirasyon planlanmalıdır. Enerji altyapısında yağ sıyırıcı kapasitesi fritöz ve ızgara adediyle orantılı seçilir; yangın güvenliği ve baca rotası proje başında netleştirilir.</p><h2>Montaj ve devreye alma</h2><p>Montaj fazları soğutma ve hazırlık zonlarından başlar; pişirme hatları tesisat doğrulaması sonrası kurulur. Devreye almada sıcaklık kayıtları ve davlumbaz performans testi yapılır. PFOS steakhouse profili menü, kapasite ve servis stili girdileriyle ön liste üretir.</p><p>Aşağıdaki tablo 2018-199-3 referans proforma ekipman listesidir (63 kalem, fiyat içermez).</p>`,

  "endustriyel-pisirme-ekipmanlari": `<p>Endüstriyel pişirme hattı menü profili, pik çıkış ve eşzamanlı üretim kapasitesine göre modellenir. Kuzine, ocak, fritöz, ızgara, konveksiyonlu fırın ve kaynatma modülleri cookline'da yan yana dizilir; gazlı ve elektrikli seçenekler saha tesisatına göre filtrelenir.</p><h2>Davlumbaz ve enerji</h2><p>Davlumbaz debisi açık alevli ocak ve ızgara adediyle birlikte hesaplanır; wok ocakları Asya mutfağı ağırlıklı menülerde ayrı yük oluşturur. Induction modüller hassas sıcaklık kontrolü gerektiren ürünlerde tercih edilir. Isı geri kazanımı uzun vadeli enerji maliyetini etkiler.</p><h2>Modül seçimi</h2><p>Combi fırınlar pastane ve ana yemek hattını tek modülde birleştirebilir. Öztiryakiler pişirme modülleri vitrinde mm ölçüleriyle listelenir; benzer modüller <a href="/shop/pisirme">pişirme departmanı</a>ndan karşılaştırılabilir.</p><p>Konsept bazlı adetlendirme için <a href="/pfos">Proje Fabrikası</a> kullanılır. Steakhouse ve fast food hatları için <a href="/steakhouse-kurulumu">steakhouse</a> ve <a href="/fast-food-kurulumu">fast food</a> rehberlerine bakın.</p>`,

  "havuzlu-dolap-tedarik": `<p>Havuzlu tezgah tipi dolap, salata barı, self-servis reyonu ve hazırlık hattında GN kaplarıyla çalışan soğutmalı vitrin modülüdür. Seçimde dış ölçü, GN derinliği, kapasite ve enerji tipi (statik, ventilasyonlu) belirleyicidir.</p><h2>Teknik seçim kriterleri</h2><p>Self-servis salata barlarında GN derinliği menü çeşidine göre seçilir; tezgah altı ve tezgah üstü modeller aynı hatta birlikte planlanır. Paslanmaz yüzey pürüzsüzlüğü hijyen denetiminde değerlendirilir. Drenaj bağlantısı ve kondenser konumu saha keşfinde işaretlenir.</p><h2>Yerleşim</h2><p>Modüler yerleşim dar mutfaklarda alan verimliliğini artırır. Benzer modüller <a href="/shop/sogutma">soğutma vitrininden</a> karşılaştırılabilir; PFOS soğutma profili menü hacmine göre adet üretir.</p><p>Panel soğuk oda projeleri ayrı mühendislik hattıyla yürür; büyük kapasite için <a href="/soguk-oda-teklif">soğuk oda teklifi</a> rehberine bakın.</p>`,

  "market-kasap-sarkuteri-kurulumu": `<p>Market, kasap ve şarküteri reyonu aynı müşteri koridorunda planlanır: dondurulmuş ada, soğutmalı gondol ve kasap bankosu önden, hazırlık ve depo arkadan konumlandırılır. Müşteri yolculuğu kesintisiz olmalı; HACCP akışı hazırlık ile vitrin arasındaki mesafeyi belirler.</p><h2>Kasap hattı</h2><p>Kıyma, dilimleme ve vitrin sergisi farklı zonlardadır. Et tahtası, el yıkama ve hızlı yıkama modülleri hijyen zonunu tamamlar. Kasap vitrin sergisi günlük kesim planıyla uyumlu olmalıdır; tezgah yüksekliği personel ergonomisi için standartlaştırılır.</p><h2>Şarküteri ve enerji</h2><p>Şarküteri reyonunda nem kontrollü vitrin peynir ve salam grubu için ayrıdır. Soğutma zinciri alarm sistemi kurumsal market standardına uyar. Dondurma adalarının enerji yükü gece doldurma saatlerine göre planlanır; soğutucu grupları sıralı devreye alınarak maliyet düşürülebilir.</p><p>Reyon metrajı ve ürün portföyü PFOS market konseptinin temel girdileridir. Perakende reyon yenilemede müşteri trafiği geçici yönlendirme gerektirir.</p>`,
};

const LEADS = {
  "all-day-casual-cafe-kurulumu":
    "19- THE HOUSE CAFE referans proforması: gün boyu cafe menüsü için pişirme, bar, soğutma ve bulaşık hatları.",
  "rehber/dark-kitchen-bulut-mutfak-2026":
    "Dark kitchen kurulumu: ruhsat, MEP, çok markalı operasyon ve ekipman planlama rehberi.",
  "mutfak-teklif-platformu":
    "Equsto Proje Fabrikası — konsept ve kapasite girdileriyle B2B ekipman listesi ve teklif özeti.",
};

const BLOG_LINK_FIXES = [
  { from: "/bulut-mutfak-kurulumu", to: "/rehber/dark-kitchen-bulut-mutfak-2026", label: "Dark kitchen / bulut mutfak" },
  { from: "/restoran-mutfak-teklif", to: "/mutfak-teklif-platformu", label: "Mutfak teklif platformu (PFOS)" },
];

function patchBlogLinks(data) {
  const blog = data.blog;
  if (!blog?.sections) return;
  for (const section of blog.sections) {
    for (const link of section.links || []) {
      for (const fix of BLOG_LINK_FIXES) {
        if (link.href === fix.from) {
          link.href = fix.to;
          if (fix.label) link.label = fix.label;
        }
      }
    }
  }
  // blog body — kısa, tekrarsız intro
  blog.body =
    "<p>Equsto GEO rehberleri ekipman vitrininden ayrı tutulan programatik içeriklerdir. Konsept kurulum sayfaları referans proforma tabloları içerir; arama hedefli sayfalar departman ve tedarik odaklıdır; editoryal rehberler checklist ve operasyon derinliği sağlar.</p><p>Teklif için <a href=\"/mutfak-teklif-platformu\">Proje Fabrikası (PFOS)</a> kullanın. Aşağıdaki bölümlerden ilgili konuya gidin.</p>";
  blog.lead =
    "Konsept kurulumları, GEO hedef sayfaları, editoryal rehberler ve referans projeler — tek dizin.";
}

function patchBalikLink(data) {
  const balik = data["balik-restorani-mutfak-projesi-kurulumu"];
  if (!balik?.body) return;
  balik.body = balik.body.replace(
    'href="/restoran-mutfak-teklif"',
    'href="/mutfak-teklif-platformu"',
  );
  balik.body = balik.body.replace(
    "restoran mutfak teklifi",
    "mutfak teklif platformu",
  );
}

function patchChecklistLink(data) {
  const cl = data["rehber/restoran-mutfak-kurulumu-checklist-2026"];
  if (!cl?.body) return;
  cl.body = cl.body.replace(/restoran teklif rehberi/gi, "mutfak teklif platformu");
  cl.body = cl.body.replace(
    'href="/restoran-mutfak-teklif"',
    'href="/mutfak-teklif-platformu"',
  );
}

function patchDarkKitchenMeta(data) {
  const dk = data["rehber/dark-kitchen-bulut-mutfak-2026"];
  if (!dk) return;
  dk.title = "Dark kitchen / bulut mutfak kurulum rehberi | Equsto";
  dk.description =
    "Dark kitchen kurulumu: ruhsat, MEP, çok markalı operasyon, kurye entegrasyonu ve ekipman planlama — 2026 rehberi.";
  dk.h1 = "Dark kitchen — bulut mutfak kurulumu";
}

function apply(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  for (const [key, body] of Object.entries(BODIES)) {
    if (!data[key]) {
      console.warn("missing key:", key, "in", filePath);
      continue;
    }
    data[key].body = body;
    if (LEADS[key]) data[key].lead = LEADS[key];
  }

  patchBlogLinks(data);
  patchBalikLink(data);
  patchChecklistLink(data);
  patchDarkKitchenMeta(data);

  // dark kitchen rehber — bulut sayfasına referans kaldır
  const dk = data["rehber/dark-kitchen-bulut-mutfak-2026"];
  if (dk?.body) {
    dk.body = dk.body.replace(/Bulut mutfak kurulum rehberi ile örtüşen[^<]*/g, "");
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched", filePath);
}

for (const p of PATHS) apply(p);
console.log("done — rewrite-geo-sprint1");
