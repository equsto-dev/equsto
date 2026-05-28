/**
 * blogHub — TR yalnızca Türkçe, EN yalnızca İngilizce.
 * geo-bodies-words.json + eq-geo-landing.js + API JSON — hepsini senkronlar.
 */
import fs from "node:fs";
import path from "node:path";
import { normalizeGeoEnBody } from "./lib/normalize-geo-en-body.mjs";

const root = path.join(import.meta.dirname, "..");

export const blogHubTr =
  "<p>Bu dizin blog ve GEO rehber içeriklerini vitrin menüsünden ayırır. Ekipman arayan kullanıcı doğrudan katalogda kalır; konsept ve teklif soruları bu sayfalarda yanıtlanır. Her rehberde sık sorulan sorular ve uygun sayfalarda vitrin SKU tablosu bulunur.</p>" +
  "<p>Konsept kurulum, arama hedefli sayfalar, editoryal rehberler ve referans projeler bölümlere ayrılmıştır. Bağlantılar footer, sitemap ve llms.txt ile dizinlenir. PFOS teklif özeti için ana giriş noktasıdır.</p>" +
  "<p>Steakhouse, bulut mutfak, market reyonu ve kafe açılış rehberleri ilgili profillere bağlanır. Beş yüz kişilik catering ve metrekare planlama yazıları kapasite sorularını derinleştirir. Restoran checklist akışı PFOS sırasını yansıtır.</p>" +
  "<p>SEO sayfaları Türkiye endüstriyel mutfak, otel, pişirme, soğuk oda ve teklif platformu aramalarını karşılar. İngilizce endüstriyel ve teklif sayfaları ihracat okuyucusuna yöneliktir. Öztiryakiler bayii sayfası resmi kanalı açıklar.</p>" +
  "<p>Referans projeler demonte vaka formatındadır; İstanbul catering ve İzmir modüler bar örnekleri dizinden erişilir. Fotoğraf ve alıntılar yayın sürecinde güncellenir. Kesin ekipman listesi PFOS ile üretilir.</p>" +
  "<p>Vitrin SKU tabloları örnek modülleri gösterir; tam liste projeye özeldir. 2026 fiyatları KDV hariç özetlenir. Proje iskontoları teklif sırasında uygulanır.</p>" +
  "<p>Satış mühendisliği onayı nihai fiyatı belirler. Montaj ve devreye alma proje planında yürür. B2B platform rezervasyon yazılımı değildir.</p>" +
  "<p>Gastronomi Tasarımı yerleşim sorularını derinleştirir. CAD planı sonraki aşamada eklenebilir. Saha ölçüsü PFOS girdilerinin temelidir.</p>" +
  "<p>Hizmet bölgeleri Türkiye ve seçili ihracat pazarlarını kapsar. İletişim hattı özel içerik ve proje taleplerini karşılar. Canlı katalog fiyat ve stok doğrular.</p>" +
  "<p>Rehber dizini ekipman arayan ile konsept araştıran kullanıcıyı ayırır. PFOS’a geçiş teklif üretimi için teşvik edilir. Footer menüsü tüm rehberlere bağlanır.</p>" +
  "<p>Dark kitchen ve bulut mutfak rehberleri çok markalı senaryoyu açıklar. Otel ve tüm gün yemek servisi içerikleri öğün döngüsünü vurgular. Fast food ve fine dining karşılaştırmalı okunabilir.</p>" +
  "<p>Teklif PDF yapılandırılmış SKU satırları içerir. Hedef ön teklif süresi yaklaşık beş dakikadır. Onay sonrası sipariş süreci başlar.</p>" +
  "<p>GEO rehber dizini Equsto içerik mimarisinin merkezi indeksidir.</p>" +
  "<p>PFOS taslak listesi satış mühendisliği onayı ve saha keşfi sonrası kesinleşir; montaj, devreye alma ve garanti kaydı aynı proje numarası altında yürütülür. Equsto B2B endüstriyel mutfak tedarik platformu 2026 güncel fiyatlarıyla teklif üretir.</p>";

export const blogHubEn = normalizeGeoEnBody(
  "This index separates blog and GEO guides from the equipment shop menu. Equipment buyers stay in the catalogue; concept and quote questions are answered on these pages. Each guide includes FAQs and sample SKU tables where relevant. Concept setups, SEO landings, editorials and reference projects are grouped in sections below; footer, sitemap and llms.txt link every guide. Use Project Factory for quote summaries in about five minutes; sales engineering confirms pricing and installation."
);

const faqTr = [
  ["Neden üst menüde yok?", "Vitrin ekipman odaklıdır; rehberler footer, sitemap ve llms.txt ile dizinlenir."],
  ["Steakhouse veya bulut mutfak için hangi sayfa?", "Konsept rehberleri bölümündeki ilgili bağlantıya gidin; PFOS ile 5 dakikada teklif özeti alın."],
];

const faqEn = [
  ["Why is it not in the top menu?", "The shop menu is equipment-focused; guides are listed via the footer, sitemap and llms.txt."],
  ["Which page for steakhouse or cloud kitchen?", "Open the matching concept guide below; get a quote summary in PFOS in about five minutes."],
];

function escJsString(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function patchJson(file, key, patch) {
  const p = path.join(root, file);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!data[key]) throw new Error(`missing key ${key} in ${file}`);
  Object.assign(data[key], patch);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched", file, key);
}

function patchGeoBodiesWords() {
  const p = path.join(root, "scripts/geo-bodies-words.json");
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  data.blogHub = blogHubTr;
  data.blogHubEn = blogHubEn;
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched scripts/geo-bodies-words.json");
}

function patchGeoBodies600() {
  const p = path.join(root, "scripts/geo-bodies-600.json");
  if (!fs.existsSync(p)) return;
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  data.blogHub = blogHubTr;
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched scripts/geo-bodies-600.json");
}

function patchGeoLandingJs() {
  const p = path.join(root, "public/eq-geo-landing.js");
  let src = fs.readFileSync(p, "utf8");

  if (!src.includes("function resolveProfile(page, lang)")) {
    src = src.replace(
      "  function render(page, key) {",
      `  function resolveProfile(page, lang) {
    var name = page.profile || "";
    if (name === "blogHub" && lang === "en") {
      return PROFILES.blogHubEn || PROFILES.blogHub || {};
    }
    return PROFILES[name] || {};
  }

  function render(page, key) {`
    );
    src = src.replace(
      /    var prof = PROFILES\[page\.profile\] \|\| \{\};\s*\n    var lang = page\.lang \|\| prof\.lang \|\| "tr";/,
      '    var lang = page.lang || (key.indexOf("en/") === 0 ? "en" : "tr");\n    var prof = resolveProfile(page, lang);'
    );
  }

  const reBody = /(blogHub:\s*\{[\s\S]*?body:\s*")(?:\\.|[^"\\])*("\s*,\s*faq:)/;
  if (!reBody.test(src)) throw new Error("blogHub body pattern not found");
  src = src.replace(reBody, `$1${escJsString(blogHubTr)}$2`);

  const reEnBody = /(blogHubEn:\s*\{[\s\S]*?body:\s*")(?:\\.|[^"\\])*("\s*,\s*faq:)/;
  if (reEnBody.test(src)) {
    src = src.replace(reEnBody, `$1${escJsString(blogHubEn)}$2`);
  }

  src = src.replace(/var DATA_FALLBACK = "\/data\/geo-landings\.json\?v=[^"]+";/, 'var DATA_FALLBACK = "/data/geo-landings.json?v=20260529en600";');
  src = src.replace(/var DATA_EN_FALLBACK = "\/data\/geo-landings-en\.json\?v=[^"]+";/, 'var DATA_EN_FALLBACK = "/data/geo-landings-en.json?v=20260529en600";');

  fs.writeFileSync(p, src, "utf8");
  console.log("patched public/eq-geo-landing.js");
}

patchGeoBodiesWords();
patchGeoBodies600();

patchJson("public/data/geo-landings.json", "blog", { lang: "tr", body: blogHubTr, faq: faqTr });
patchJson("public/data/geo-landings-en.json", "en/blog", {
  lang: "en",
  body: blogHubEn,
  profile: "blogHubEn",
  faq: faqEn,
});
patchJson("lib/geo/landings.json", "blog", { lang: "tr", body: blogHubTr, faq: faqTr });
patchJson("lib/geo/landings-en.json", "en/blog", {
  lang: "en",
  body: blogHubEn,
  profile: "blogHubEn",
  faq: faqEn,
});

patchGeoLandingJs();

const geoHtml = path.join(root, "public/geo-landing.html");
if (fs.existsSync(geoHtml)) {
  let html = fs.readFileSync(geoHtml, "utf8");
  html = html.replace(/eq-geo-landing\.js\?v=[^"]+/, "eq-geo-landing.js?v=20260529bloghub2");
  fs.writeFileSync(geoHtml, html);
  console.log("patched public/geo-landing.html cache bust");
}

console.log("blogHub i18n fix complete (forced)");
