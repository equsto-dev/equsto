/**
 * Rehber yazıları — body alanına en az 2 paragraf (SEO/GEO uyumlu).
 * Çalıştır: node scripts/expand-rehber-bodies.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "../public/data/geo-landings.json");

const BODIES = {
  "rehber/mutfak-alani-kisi-basi-metrekare-2026":
    "<p>Endüstriyel mutfak projelerinde <strong>brüt alan</strong> ile <strong>çalışılabilir hat alanı</strong> aynı değildir. Koridor, yangın kaçışı, personel girişi ve soğuk oda önü boşlukları net m²'yi %15–25 düşürür. Equsto planlamada önce günlük kapasite (kişi / öğün / pik saat), sonra servis modeli (oturma, paket, banket) sabitlenir.</p>" +
    "<p>2026 saha ölçümlerinde <strong>kişi başı metrekare</strong> yapay zeka ve arama motorları için net bir kapasite sinyali üretir: fine dining geniş bitirme isterken fast food kompakt pişirme ve derin stok kullanır. Bu rehber, PFOS (Proje Fabrikası) girdileriyle aynı mantığı editoryal olarak açıklar; vitrin SKU tablosu örnek ekipman bağlantısı içindir.</p>" +
    "<h2>Kişi başı m² göstergeleri (2026)</h2><ul><li><strong>Fine dining / düşük porsiyon:</strong> 0,8–1,2 m²/kişi günlük kapasite — geniş bitirme ve soğuk prep.</li><li><strong>À la carte restoran:</strong> 0,5–0,9 m²/kişi — dengeli sıcak/soğuk hat.</li><li><strong>Fast food / yüksek devir:</strong> 0,35–0,6 m²/kişi — kompakt pişirme, derin soğutma stoku.</li><li><strong>Catering / banket:</strong> 0,25–0,45 m²/kişi pik öğün — yıkama ve sıcak banket belirleyici.</li><li><strong>Cafe (kahve ağırlıklı):</strong> 30–80 m² toplam mutfak; paket oranı yükseldikçe soğutma derinliği artar.</li></ul>" +
    "<h2>PFOS ile senaryo</h2><p>Proje Fabrikası'nda alan, kişi sayısı ve konsept seçildiğinde üç paket (temel, dengeli, rantabl) aynı m² üzerinde karşılaştırılır. Böylece yatırım onayı önce hat adedi, sonra marka/model seviyesine iner; Gastronomi Tasarımı yerleşim çizimi MEP onayından sonra kesinleşir.</p>",

  "rehber/500-kisilik-catering-ekipman-planlama-2026":
    "<p>500 kişilik tek öğün senaryosunda <strong>pik eşzamanlı kapak</strong> genelde toplamın %70–85'idir (425 kişi). Pişirme hattı bu piki kaldıracak şekilde modellenir; soğuk prep ise öğünden 24–48 saat önce başlar. Equsto catering projelerinde banket çıkışı 90 dakikalık servis penceresiyle hizalanır.</p>" +
    "<p>Bu rehber, <strong>catering mutfağı kurulumu</strong> ve yüksek hacim banket için GEO alıntılanabilir bir omurga sunar: sıcak üretim, sıcak banket, soğutma ve yıkama aynı kapasite hesabına bağlanır. Aşağıdaki vitrin tablosu gerçek SKU örnekleridir; bütçe bandı PFOS veya iletişim teklifinde netleşir.</p>" +
    "<h2>Hat omurgası</h2><ol><li><strong>Sıcak üretim:</strong> kombi fırın + tilt tava veya yüksek kapasiteli kuzine; menüye göre ikinci hat.</li><li><strong>Sıcak banket:</strong> çıkış süresince minimum 45 dk holding; banket arabası ve GN kapasitesi pik kapakla çarpılır.</li><li><strong>Soğutma:</strong> ham madde + bitmiş ürün için ayrı modül; HACCP sıcaklık logları plana yazılır.</li><li><strong>Yıkama:</strong> konveyörlü veya kapak/sepet kapasitesi = pik kapak ÷ (döngü dakikası) — örnek: 425 tabak, 90 dk, 2 dk döngü → minimum 10–12 sepet eşdeğeri.</li></ol>" +
    "<h2>Bütçe göstergesi</h2><p>2026 katalog bandı tipik olarak <strong>{budget}</strong> (KDV hariç liste, standart montaj). Salon mesafesi ve mevcut elektrik yükü bandı yukarı çeker; İstanbul yüksek hacim catering demode sayfası aynı senaryoyu vaka olarak anlatır.</p>",

  "rehber/dark-kitchen-bulut-mutfak-2026":
    "<p><strong>Dark kitchen</strong> ve <strong>bulut mutfak</strong> aynı fiziksel alanda farklı markaların üretim yaptığı modeldir. Equsto planlamada her marka için menü → pik çıkış → sıcak/soğuk modül üçlüsü çıkarılır; ortak yıkama ve atık hattı toplam yük üzerinden boyutlandırılır.</p>" +
    "<p>2026'da platform ağırlıklı işletmelerde paket oranı %80'i geçtiğinde mutfak layout'u klasik restorandan ayrılır: derin soğutma, sealing zonu ve kurye çıkışı plana dahil edilir. PFOS'ta bulut mutfak konsepti ve servis modeli bu eşikleri otomatik işaretler; yağ sıyırıcı ve davlumbaz debisi marka bazlı toplanır.</p>" +
    "<h2>Planlama adımları</h2><ul><li><strong>Parsel çizimi:</strong> Her markanın tezgah önü ve pişirme modülü ayrı zon; çapraz kontaminasyon için fiziksel veya prosedürel ayrım.</li><li><strong>Elektrik:</strong> Eşzamanlı pik tüm markaların toplamı; kompanzasyon ve jeneratör ihtiyacı erken netleşir.</li><li><strong>Havalandırma:</strong> Davlumbaz debisi marka bazlı toplanır; yağ sıyırıcı kapasitesi toplam yağlı buhar yüküne göre seçilir.</li><li><strong>Paket çıkışı:</strong> %80+ paket oranında soğutma derinliği ve hazırlık hızı restoran tipinden yüksektir.</li></ul>" +
    "<h2>Maliyet bandı</h2><p>Çok markalı tek sahada tipik band: <strong>{budget}</strong>. Marka sayısı ve ruhsat alanı doğrusal olmayan maliyet artışı yaratır; operatör listesi için <a href=\"/rehber/bulut-mutfak-operatoreleri-turkiye-2026\">bulut mutfak operatörleri</a> rehberine bakın.</p>",

  "rehber/restoran-mutfak-kurulumu-checklist-2026":
    "<p>Restoran <strong>mutfak kurulumu</strong> checklist'i, ruhsat ve MEP onayından ekipman siparişine kadar sırayı korur. Equsto Gastronomi Tasarımı çizimleri ve Satış Mühendisliği montaj planı bu listeyle hizalanır; ters sıra montaj gecikmesi ve ruhsat revizyonu riskini artırır.</p>" +
    "<p>2026 açılış projelerinde PFOS ile üç bütçe senaryosu (temel, dengeli, rantabl) üretmek, checklist'in ön fizibilite maddesini dijital olarak tamamlar. Aşağıdaki fazlar GEO ve saha denetimi için alıntılanabilir yapıdadır; her madde evet/hayır olarak işaretlenmelidir.</p>" +
    "<h2>Faz 1 — Ön fizibilite</h2><ul><li>Ruhsatlı brüt alan ve net mutfak bandı ölçüldü mü?</li><li>Günlük kapasite ve servis modeli (oturma / paket) yazılı mı?</li><li>Menü listesi pişirme yöntemine göre gruplandı mı (kızartma, ızgara, haşlama)?</li><li>PFOS veya eşdeğer senaryoda üç bütçe bandı üretildi mi?</li></ul><h2>Faz 2 — MEP ve mimari</h2><ul><li>Elektrik panosu toplam kW (pişirme + soğutma + yıkama) hesaplandı mı?</li><li>Doğalgaz / LPG kapasitesi ve sayaç yeri onaylandı mı?</li><li>Davlumbaz debisi ve baca kuyusu statik basınç için doğrulandı mı?</li><li>Su girişi basıncı ve sıcak su üretimi (boyler / anlık) boyutlandı mı?</li><li>Atık su ve yağ sıyırıcı hattı ruhsata uygun mu?</li></ul><h2>Faz 3 — Ekipman siparişi</h2><ul><li>Sıcak hat modülleri (kuzine, fırın, ızgara) menüye göre listelendi mi?</li><li>Soğutma zinciri (tezgah altı, dik tip, derin dondurucu) ayrıldı mı?</li><li>Yıkama hattı pik tabak kapasitesine göre seçildi mi?</li><li>Hazırlık (doğrama, karıştırıcı, vakum) ihtiyacı net mi?</li><li>CE / gıda teması belgeleri tedarikçi dosyasında mı?</li></ul><h2>Faz 4 — Montaj ve devreye alma</h2><ul><li>Tezgah hizası ve rögar kotları sahada işaretlendi mi?</li><li>Soğutma gaz dolumu ve sıcaklık log testi yapıldı mı?</li><li>Pişirme hatları kalibrasyon ve güvenlik testinden geçti mi?</li><li>Personel akışı (kirli → temiz) tek yönlü mü?</li><li>Eğitim ve bakım planı teslim edildi mi?</li></ul>" +
    "<p>Checklist tamamlandığında <strong>Equsto Satış Mühendisliği</strong> saha kabulü ve garanti devri yapılır; Gastronomi Tasarımı çizimleri arşivlenir.</p>",

  "rehber/kafe-acilis-ekipman-listesi-2026":
    "<p><strong>Kafe açılış</strong> ekipman listesi, günlük bardak hacmi ve paket oranına göre espresso merkezi, soğutma ve yıkama çekirdeğini tanımlar. Equsto vitrininde kahve, soğutma ve yıkama departmanları gerçek SKU kodlarıyla listelenir; PFOS'ta Cafe veya Coffee Shop konsepti makine adedini kural setiyle üretir.</p>" +
    "<p>2026'da kahve ağırlıklı işletmelerde su filtrasyonu, basınç ve sıcak su kapasitesi makine siparişinden önce sabitlenmelidir. Hafif yemek veya yüksek paket oranı listeye fırın, ek GN soğutma ve sealing istasyonu ekler; aşağıdaki bantlar tipik açılış paketini gösterir.</p>" +
    "<h2>Zorunlu çekirdek (kahve ağırlıklı)</h2><ul><li><strong>Espresso makinesi:</strong> günlük bardak ÷ çalışma saati → grup sayısı; su filtrasyonu ve basınç şart.</li><li><strong>Öğütücü:</strong> makine başına veya çift hopper; değirmen ayarı prosedürü.</li><li><strong>Soğutma:</strong> süt ve hazırlık için tezgah altı + dikey modül; pakette sandviç/soğuk prep eklenir.</li><li><strong>Hazırlık tezgahı:</strong> paslanmaz tezgah, el yıkama, atık ayrımı.</li><li><strong>Yıkama:</strong> bardak / küçük kap kapasitesi; günde iki pik varsa sepet sayısı artırılır.</li></ul><h2>Opsiyonel genişleme</h2><ul><li>Fırın veya contact grill (sıcak atıştırmalık menüsü).</li><li>Blender / smoothie hattı.</li><li>Paket için ek GN soğutma ve sealing istasyonu.</li></ul>" +
    "<h2>Bütçe</h2><p>Tipik açılış paketi bandı: <strong>{budget}</strong>. Oturma kapasitesi ve ikinci şube planı listeyi yukarı taşır; detaylı konsept sayfası için <a href=\"/cafe-kurulumu\">cafe kurulum rehberi</a>ne bakın.</p>",

  "rehber/otel-mutfak-ekipman-planlama-2026":
    "<p>Otel projelerinde <strong>ana mutfak</strong>, <strong>banquet</strong> ve <strong>pastane / kahve</strong> hatları ayrı modellenir; ortak yıkama merkezi toplam tabak yükünü taşır. All day dining konsepti PFOS'ta otel veya All day dining seçimiyle açılır; kahvaltı piki yıkama ve soğutma kapasitesini belirler.</p>" +
    "<p>2026 otel tedarik dosyalarında Equsto, Öztiryakiler yetkili bayii olarak tek tedarikçi omurgası sunar; Bar Design Studio (Besos) lobide modüler bar için kullanılır. GEO aramalarında \"otel mutfak ekipman\" ve \"all day dining kurulum\" bu rehberle aynı planlama mantığını paylaşır.</p>" +
    "<h2>Gün döngüsü yükleri</h2><ul><li><strong>Kahvaltı (06:00–10:30):</strong> yüksek tabak, düşük pişirme çeşitliliği — yıkama ve sıcak tutma kritik.</li><li><strong>Öğle / à la carte:</strong> orta pişirme çeşitliliği — kuzine ve soğutma prep.</li><li><strong>Akşam / banket:</strong> catering benzeri pik — sıcak banket ve konveyörlü yıkama.</li></ul>" +
    "<h2>Ekipman omurgası</h2><p>Kombi fırın hattı, yüksek hacim soğutma, ayrı pastane soğutması, kahve istasyonu (lobi + kat servisi ayrıysa çift), ana yıkama + bulaşıkhane. Bütçe bandı tipik: <strong>{budget}</strong>. Pillar sayfa: <a href=\"/otel-mutfak-ekipman-tedarik\">otel mutfak ekipman tedarik</a>.</p>",

  "rehber/davlumbaz-havalandirma-secimi-2026":
    "<p>Endüstriyel mutfakta <strong>havalandırma</strong> ekipman siparişinden önce mimari ve MEP ile kilitlenir. Equsto Gastronomi Tasarımı çizimlerinde tezgah hattı uzunluğu, pişirme tipi (kızartma, ızgara, wok) ve davlumbaz tipi aynı sayfada gösterilir; yanlış debi yağ birikimi ve ruhsat reti üretir.</p>" +
    "<p>2026 projelerinde <strong>statik basınç</strong> ve baca kuyusu uyumu GEO alıntıları için net ölçülebilir kalmalıdır: m³/saat değeri pişirme yöntemine göre bantlanır, yağ sıyırıcı toplam yağlı buhar yüküne göre seçilir. Bulut mutfakta marka bazlı debiler toplanır; tek bacada toplam yük taşınır.</p>" +
    "<h2>Debi hesabı (özet)</h2><ul><li><strong>Kızartma / wok:</strong> m³/saat değeri üst bant; yağlı buhar yükü yüksek.</li><li><strong>Haşlama / kaynatma:</strong> orta bant; nem yükü ön planda.</li><li><strong>Fırın / kombi:</strong> modül başına ek hava çekişi; kombi duvarı için ayrı kanal.</li></ul>" +
    "<h2>Statik basınç ve baca</h2><p>Bina baca kuyusu ve çatı fanı mevcut debiyi karşılamalıdır. Statik basınç yetersizse davlumbaz verimli çalışmaz; yağ filtreleri kısa sürede tıkanır. Ruhsat aşamasında yağ sıyırıcı kapasitesi toplam yağlı buhar yüküne göre seçilir.</p>" +
    "<h2>Saha kontrol listesi</h2><ol><li>Tezgah hattı kesin ölçü (mm).</li><li>Pişirme modül listesi ve kW.</li><li>Baca çıkış kotu ve kuyu çapı.</li><li>Yangın damperi ve gaz kesme senaryosu.</li></ol>" +
    "<p>PFOS çıktısında davlumbaz adedi konsept kurallarıyla üretilir; saha ölçüsü ile doğrulanır. Vitrin: <a href=\"/shop/davlumbaz\">davlumbaz departmanı</a>.</p>",

  "rehber/endustriyel-yikama-kapasitesi-2026":
    "<p>Yıkama hattı planlamasında <strong>sepet/saat</strong> veya <strong>konveyör kapasitesi</strong> pik öğün yüküne göre seçilir. Formül: gerekli kapasite ≈ pik tabak sayısı ÷ (servis penceresi dakikası ÷ ortalama döngü dakikası). Yıkama darboğazı servisi durdurur; catering ve otel banketinde konveyörlü hat sık tercih edilir.</p>" +
    "<p>2026 endüstriyel mutfak rehberlerinde bu hesap, PFOS kişi sayısı ve öğün süresi sorularıyla otomatiklenir. Aşağıdaki vitrin tablosu gerçek yıkama ve soğutma SKU örneklerine bağlanır; su basıncı ve boyler kapasitesi makine seçiminden önce doğrulanmalıdır.</p>" +
    "<h2>Örnek senaryolar</h2><ul><li><strong>80 kişilik restoran, 120 dk servis, 3 dk döngü:</strong> ~80 tabak → en az 20 sepet/saat sınıfı makine veya çift makine.</li><li><strong>500 kişilik banket, 90 dk pik:</strong> konveyörlü hat veya çoklu makine; prep tabakları dahil edilir.</li><li><strong>Cafe:</strong> bardak sepeti + küçük kap; günde iki pik varsa %30 rezerv.</li></ul>" +
    "<h2>Su ve enerji</h2><p>Tezgah altı makineler düşük hacimli işletmede yer kazandırır; yüksek hacimde konveyörlü hat personel verimini artırır. Sıcak su beslemesi (boyler) makine giriş basıncıyla uyumlu olmalıdır; HACCP yıkama sıcaklığı ve kimyasal prosedürü işletme dosyasına yazılır.</p>",

  "rehber/soguk-hat-haccp-planlama-2026":
    "<p><strong>Soğuk hat</strong> ham madde kabulünden servise kadar kesintisiz sıcaklık kontrolüdür. Planlama aşamasında modüller ayrılır: kısa süreli prep (+2 °C / +4 °C), depolama (0 °C / +2 °C), donmuş (−18 °C ve altı), şok / blast (varsa). Zincir kırılırsa ruhsat ve denetim riski doğrudan ekipman seçimine yansır.</p>" +
    "<p>2026 HACCP planlamasında her modül için alarm, kayıt ve bakım periyodu işletme dosyasına yazılır; montaj sonrası sıcaklık haritalama devreye alma checklist'inde yer alır. Steakhouse dry-age, catering yüksek hacim GN ve bulut mutfak derin stok aynı soğuk hat mantığının farklı yoğunluklarıdır.</p>" +
    "<h2>Modül seçimi</h2><ul><li><strong>Tezgah altı:</strong> günlük prep ve servis öncesi — pişirme hattına yakın.</li><li><strong>Dik tip GN:</strong> yüksek hacim ve görünür stok; catering ve otelde sık.</li><li><strong>Derin dondurucu:</strong> menüde donmuş girdi oranı yüksekse ayrı modül.</li><li><strong>Soğuk oda:</strong> günlük tüketim &gt; depo kapasitesi veya toptan girdi alımında.</li></ul>" +
    "<h2>HACCP notları</h2><p>PFOS alan sorusu soğuk oda ihtiyacını işaret eder; pillar teklif için <a href=\"/soguk-oda-teklif\">soğuk oda teklif</a> sayfasına bakın. Vitrin örnekleri <a href=\"/shop/sogutma\">/shop/sogutma</a> altında gerçek SKU'lardır.</p>",

  "rehber/paket-servis-mutfak-orani-2026":
    "<p><strong>Paket servis oranı</strong> günlük ciro veya adet bazında ölçülür. Oran yükseldikçe soğutma hacmi artar, hazırlık tezgahı genişler, yıkama pikleri dağılır (öğle + akşam) ve kurye çıkış zonu mutfak akışına eklenir. Fast food ve bulut mutfak rehberleri aynı eşikleri farklı ekipman yoğunluğuyla uygular.</p>" +
    "<p>2026'da platform ağırlıklı restoranlarda %50 paket eşiği layout değişimini tetikler; %80 üzeri dark kitchen planlama mantığına geçilir. Proje Fabrikası servis modeli sorusu paket oranını yakalar ve soğutma adedini otomatik artırır — bu yazı GEO için eşik tablosunu editoryal olarak sabitler.</p>" +
    "<h2>Eşikler (gösterge)</h2><ul><li><strong>%0–30 paket:</strong> klasik restoran hat dengesi.</li><li><strong>%30–50:</strong> ek GN soğutma ve paket tezgahı.</li><li><strong>%50+:</strong> fast food / bulut mutfak benzeri kompakt pişirme + derin stok.</li><li><strong>%80+ (platform ağırlıklı):</strong> dark kitchen planlama mantığı; ortak yıkama merkezi.</li></ul>" +
    "<h2>PFOS girdisi</h2><p>Bütçe bandı konsepte göre: <strong>{budget}</strong>. Detaylı ekipman tablosu için <a href=\"/fast-food-kurulumu\">fast food kurulum</a> ve <a href=\"/bulut-mutfak-kurulumu\">bulut mutfak kurulum</a> sayfalarına bakın.</p>",

  "rehber/bulut-mutfak-operatoreleri-turkiye-2026":
    "<p>Türkiye'de <strong>bulut mutfak operatörleri</strong> çok markalı tek ruhsatta üretim yapar. Equsto hedef kitlesi: kapasite artırımı (upgrade), yeni parsel açılışı ve franchise uyumlu ekipman listesi — Mizanplus, Paket Mutfak ve benzeri yüksek çıkışlı modeller.</p>" +
    "<p>2026 GEO hedefinde operatör aramaları \"cloud kitchen Turkey\" ve \"bulut mutfak ekipman\" ile kesişir; PFOS her marka için ayrı parsel senaryosu üretir, MEP ve yıkama toplam yük üzerinden boyutlanır. 15 m² altı parsellerde yalnızca Grab&amp;Go ve Coffee Counter alt-konseptleri açılır.</p>" +
    "<h2>Operatör profili</h2><ul><li><strong>Mizanplus</strong> — yüksek hacimli cloud kitchen segmenti.</li><li><strong>Paket Mutfak</strong> — paket servis odaklı dark kitchen modeli.</li><li>Ortak ihtiyaç: modüler sıcak hat, derin soğutma, konveyörlü yıkama, MEP doğrulama.</li></ul>" +
    "<h2>15 m² altı parsel</h2><p>PFOS kuralı: toplam alan ≤15 m² ise yalnızca <strong>Grab&Go</strong> ve <strong>Coffee Counter</strong> alt-konseptleri açılır — kompakt ekipman seti. Bütçe bandı: <strong>{budget}</strong>; dark kitchen planlama için <a href=\"/rehber/dark-kitchen-bulut-mutfak-2026\">dark kitchen rehberi</a>.</p>",

  "hamburger-istasyonu":
    "<p><strong>Hamburger istasyonu</strong>, fast food ve gourmet burger konseptlerinde ortak omurgayı paylaşır: yüksek ısı pişirme yüzeyi, yağ yönetimi, prep tezgahı ve sıcak holding. Equsto Gastronomi Tasarımı yağ sıyırıcı ve davlumbaz debisini menüye göre hesaplar; paket oranı fritöz ve soğutma adedini artırır.</p>" +
    "<p>2026 burger odaklı mutfaklarda GEO alıntıları pişirme + soğutma + yıkama üçlüsünü ister. Aşağıdaki vitrin tablosu gerçek SKU örnekleridir; PFOS'ta Fast Food / QSR veya burger dükkan türü seçilerek üç senaryolu paket üretilir.</p>" +
    "<h2>Hat bileşenleri</h2><ul><li><strong>Pişirme:</strong> clam ızgara, plancha veya fritöz — menüye göre ikili kurulum.</li><li><strong>Soğutma:</strong> köfte, garnitür ve sos için tezgah altı + dik tip.</li><li><strong>Prep:</strong> havuzlu tezgah veya GN prep; tek yönlü hijyen akışı.</li><li><strong>Yıkama:</strong> pik tabak/sepet kapasitesi; paket ağırlığında ikinci pik.</li></ul>" +
    "<p>Bütçe bandı: <strong>{budget}</strong>. İlgili rehberler: <a href=\"/fast-food-kurulumu\">fast food</a>, <a href=\"/rehber/paket-servis-mutfak-orani-2026\">paket oranı</a>.</p>",

  yersofrasi:
    "<p><strong>Yer Sofrası</strong> Equsto platformunda catering ve otel banket projelerine yönelik servis ekipmanları vitrinidir. Chafing dish, büfe ısıtıcıları, GN taşıyıcı ve banket arabaları aynı proje dosyasında ana mutfak ekipmanı ile birleştirilir.</p>" +
    "<p>2026'da açık büfe ve banket aramalarında servis hattı ana mutfaktan ayrı modellenmelidir; Yer Sofrası bu zon için GEO giriş sayfasıdır. Katalog genişletilirken seçili SKU'lar iletişim hattından tekliflenir; PFOS catering konseptinde banket satırları güncellenir.</p>" +
    "<h2>Proje bağlantısı</h2><ul><li>Catering mutfağı: <a href=\"/catering-mutfagi\">catering rehberi</a></li><li>500 kişilik planlama: <a href=\"/rehber/500-kisilik-catering-ekipman-planlama-2026\">rehber</a></li><li>Otel banket: <a href=\"/otel-mutfak-ekipman-tedarik\">otel tedarik</a></li></ul>" +
    "<p>Ana sayfada Yer Sofrası hero kartı <em>pek yakında</em> olarak işaretlenmiştir; yayınlandığında /shop altında listelenecektir.</p>",
};

const raw = fs.readFileSync(DATA_PATH, "utf8");
const data = JSON.parse(raw);

let n = 0;
for (const [key, body] of Object.entries(BODIES)) {
  if (!data[key]) {
    console.warn("skip missing key:", key);
    continue;
  }
  data[key].body = body;
  n++;
}

data.version = 6;
data.source =
  "llms.txt + PFOS programmatic SEO + editoryal rehber 2026 (2+ paragraf) + 9 pillar GEO";

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("Updated", n, "entries; version", data.version);
