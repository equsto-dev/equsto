/**
 * GEO sprint 2 — Otel/all-day + Kafe/kafe-açılış (B: ayrıştır, C: hiyerarşi)
 * node scripts/rewrite-geo-sprint2.mjs
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

const PATCHES = {
  "cafe-kurulumu": {
    description:
      "Cafe ve espresso bar konsept kurulumu: kahve istasyonu yerleşimi, bar ergonomisi, hazırlık ve soğutma zonları.",
    lead: "Konsept hub: espresso merkezi, bar yerleşimi ve mutfak zonları. Açılış checklist için kafe açılış rehberine bakın.",
    body: `<p>Cafe kurulumu, espresso barın müşteri akışı ve barista ergonomisi etrafında planlanır. Bu sayfa konsept ve mutfak zonlarını anlatır; ruhsat takvimi ve açılış adımları için <a href="/rehber/kafe-acilis-ekipman-listesi-2026">kafe açılış ekipman listesi</a> rehberine geçin.</p><h2>Espresso ve bar istasyonu</h2><p>Grup sayısı, buhar wand konumu ve bar tezgahı derinliği günlük bardak adedine göre belirlenir. Su filtrasyonu ve basınç testi makine siparişinden önce tamamlanmalıdır. Bar arkası elektrik, su ve atık hatları modül yerleşiminden önce işaretlenir.</p><h2>Mutfak zonları</h2><p>Hazırlık tezgahı, vitrin soğutucu ve yıkama hattı bar istasyonundan bağımsız koridorda planlanır. Pastane ağırlıklı konseptlerde fırın ve mayalama modülleri ayrı zon oluşturur. Dar mutfaklarda dikey depolama ve modüler tezgahlar alan verimliliğini artırır.</p><h2>Soğutma ve paket</h2><p>Oturma kapasitesi ile paket oranı birlikte okunduğunda stok derinliği netleşir. Yaz sezonunda buz makinesi ve soğutmalı stok dolapları ek yük oluşturur; pano kapasitesi pik profille doğrulanmalıdır.</p><p>Gün boyu yemek menüsü taşıyan işletmeler <a href="/all-day-casual-cafe-kurulumu">all day casual cafe</a> referansına bakabilir. Ekipman listesi için <a href="/pfos">Proje Fabrikası</a> cafe konseptini kullanın.</p>`,
  },
  "rehber/kafe-acilis-ekipman-listesi-2026": {
    description:
      "Kafe açılış checklist 2026: ruhsat, tesisat, espresso kurulumu, devreye alma adımları ve ekipman listesi.",
    lead: "Açılış checklist: ruhsat → tesisat → ekipman → devreye alma. Konsept derinliği için cafe kurulum rehberi.",
    body: `<p>Kafe açılış ekipman listesi, açılış öncesi sırayı takip eden bir checklist rehberidir. Konsept yerleşimi ve bar ergonomisi <a href="/cafe-kurulumu">cafe kurulum rehberinde</a> ayrı ele alınır; bu sayfa adım adım uygulama listesine odaklanır.</p><h2>1 — Ruhsat ve altyapı</h2><p>Gıda işletme kaydı, yangın güvenliği ve atık su bağlantısı ekipman siparişinden önce netleştirilmelidir. Elektrik panosu espresso makinesi, fırın ve soğutma gruplarının toplam yükünü taşımalıdır. Gaz hattı varsa basınç testi tutanağı ruhsat dosyasına eklenir.</p><h2>2 — Tesisat ve makine hazırlığı</h2><p>Su filtrasyonu, basınç doğrulaması ve drenaj bağlantıları makine kurulumundan önce tamamlanır. Bar arkası kablo kanalı ve topraklama hatları güvenlik standardına uymalıdır. Makine garantisi ve servis sözleşmesi devreye alma tarihiyle eşleştirilir.</p><h2>3 — Ekipman listesi omurgası</h2><ul><li>Espresso makinesi ve öğütücü</li><li>Soğutmalı stok dolapları ve buz makinesi</li><li>Hazırlık tezgahı, vitrin soğutucu</li><li>Bardak yıkama ve genel yıkama hattı</li><li>Terazi, blender, el ekipmanları</li></ul><p>Pastane ürünü varsa konveksiyonlu fırın ve mayalama modülü listeye eklenir. Paket oranı yükseldikçe ambalajlama istasyonu genişler.</p><h2>4 — Devreye alma</h2><p>İlk hafta süt tüketimi ve bardak adedi gerçek veriyle PFOS girdileri güncellenir. Kahve çekirdeği nem kontrollü depoda tutulur. Barista eğitimi makine devreye alma haftasında planlanır.</p><p><a href="/pfos">Proje Fabrikası</a> cafe konsepti bardak adedi ve menü profiliyle modül adetlerini üretir.</p>`,
  },
  "all-day-dining-kurulumu": {
    description:
      "All day dining mutfak kurulumu: kahvaltı–öğle–akşam öğün döngüsü, büfe teşhir ve mutfak zon planlaması.",
    lead: "Konsept kurulum hub: gün boyu öğün döngüsü ve mutfak zonları. Otel tedarik ve teklif için otel mutfak sayfasına bakın.",
    body: `<p>All day dining mutfağı, kahvaltıdan gece servisine uzanan menüyü tek tesiste taşır. Bu sayfa konsept kurulumu ve ekipman zonlarını anlatır; satın alma ve kurumsal tedarik akışı <a href="/otel-mutfak-ekipman-tedarik">otel mutfak ekipman tedariki</a> sayfasında ele alınır.</p><h2>Öğün döngüsü ve zonlar</h2><p>Kahvaltı piki kahve, sıcak holding ve büfe teşhir hatlarını belirler. Öğle ve akşam servisinde sıcak hat kapasitesi artar; soğutma derinliği salata, tatlı ve içecek payına göre ayrılır. Pişirme, hazırlık, soğutma ve yıkama zonları HACCP akışına göre fiziksel olarak ayrılır.</p><h2>Büfe ve oda servisi</h2><p>Açık büfe teşhir uzunluğu soğutucu adedini doğrudan etkiler. Oda servisi arabası kapasitesi oda sayısıyla orantılı planlanır; ana mutfaktan bağımsız holding modülü gerekebilir. Banket ve balo çıkışları kısa sürede kapasiteyi yükseltir; pik senaryo ayrı modellenmelidir.</p><h2>Enerji ve mevsim</h2><p>Yaz açık büfe profili kış profilinden farklı ekipman yoğunluğu oluşturur. Mevsimsel menü değişiminde soğutma ve depo modülleri yeniden dengelenir. Lounge bar entegrasyonu lobide ayrı modül seti gerektirebilir.</p><p><a href="/pfos">Proje Fabrikası</a> otel/all day dining konsepti kişi sayısı, segment ve öğün profili girdileriyle liste üretir.</p>`,
  },
  "otel-mutfak-ekipman-tedarik": {
    description:
      "Otel mutfak ekipman tedarikçisi: kurumsal satın alma, PFOS teklif, pişirme-soğutma-yıkama katalog tedariki.",
    lead: "B2B tedarik: otel zinciri ve yenileme projeleri için katalog, teklif ve lojistik. Kurulum zonları için all day dining rehberi.",
    body: `<p>Otel mutfak ekipman tedariki, kurumsal satın alma ve proje bazlı teklif sürecini kapsar. Konsept kurulum ve öğün zon planlaması <a href="/all-day-dining-kurulumu">all day dining kurulum rehberinde</a> ayrı okunmalıdır; bu sayfa tedarik kanalı, teklif dosyası ve katalog akışına odaklanır.</p><h2>Tedarik kapsamı</h2><p>Pişirme, soğutma, yıkama, hazırlık ve kahve departmanları canlı katalogda listelenir. Öztiryakiler yetkili bayii kanalı resmi fiyat listesi ve garanti hattını kapsar. Tek ürün değişiminden anahtar teslim yenilemeye aynı vitrin akışı kullanılır.</p><h2>Kurumsal teklif</h2><p>PFOS otel konsepti oda sayısı, segment ve öğün profili girdileriyle modül listesi üretir. Otel zinciri standart modül seti PFOS şablonu olarak saklanır; şube açılışları aynı listeyi kapasite girdisiyle günceller. İhale dosyalarına PFOS çıktısı satış mühendisliği onayından sonra eklenir.</p><h2>Yenileme ve lojistik</h2><p>Otel yenileme projelerinde eski ekipman sökümü montaj planına dahil edilir. Mini bar replenishment soğutma stok derinliğini artırır. Kurumsal alıcılar için vade ve proje iskontosu teklif dosyasında ayrı satır olarak gösterilir.</p><p>Bar Design Studio lounge bar modüllerini otel lobisi projelerinde planlar. Genel tedarik kapsamı: <a href="/endustriyel-mutfak-ekipmani-turkiye">endüstriyel mutfak ekipmanı — Türkiye</a>.</p>`,
  },
};

function patchBlogLinks(data) {
  const blog = data.blog;
  if (!blog?.sections) return;
  for (const section of blog.sections) {
    for (const link of section.links || []) {
      if (link.href === "/cafe-kurulumu") {
        link.label = "Cafe konsept kurulumu";
      }
      if (link.href === "/rehber/kafe-acilis-ekipman-listesi-2026") {
        link.label = "Kafe açılış checklist";
      }
      if (link.href === "/all-day-dining-kurulumu") {
        link.label = "All day dining konsept kurulumu";
      }
      if (link.href === "/otel-mutfak-ekipman-tedarik") {
        link.label = "Otel mutfak ekipman tedariki (B2B)";
      }
    }
  }
}

function apply(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const [key, patch] of Object.entries(PATCHES)) {
    if (!data[key]) {
      console.warn("missing:", key);
      continue;
    }
    Object.assign(data[key], patch);
  }
  patchBlogLinks(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched", filePath);
}

for (const p of PATHS) apply(p);
console.log("done — rewrite-geo-sprint2");
