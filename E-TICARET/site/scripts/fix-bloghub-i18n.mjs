/**
 * blogHub — TR yalnızca Türkçe, EN yalnızca İngilizce.
 * geo-bodies-words.json + eq-geo-landing.js + API JSON — hepsini senkronlar.
 */
import fs from "node:fs";
import path from "node:path";
import {
  assertGeoEnBodyStructured,
  normalizeGeoEnBodyStructured,
} from "./lib/normalize-geo-en-body.mjs";

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

export const blogHubEn = assertGeoEnBodyStructured(
  "en/blog",
  normalizeGeoEnBodyStructured(
    "<p>This index separates blog and GEO guide content from the shop menu. Users looking for equipment stay in the catalogue; concept and quote questions are answered on these pages. Each guide includes FAQs and, where relevant, a catalogue SKU table.</p>" +
      "<p>Concept setup, search-targeted pages, editorial guides and reference projects are grouped in sections below. Links are indexed via footer, sitemap and llms.txt. This is the main entry point for Project Factory quote summaries.</p>" +
      "<p>Steakhouse, cloud kitchen, market aisle and cafe opening guides link to their concept profiles. Five-hundred-guest catering and square-metre planning articles deepen capacity questions. The restaurant checklist flow mirrors the PFOS sequence.</p>" +
      "<p>SEO pages address searches for industrial kitchen equipment in Turkey, hotels, cooking lines, cold rooms and the quote platform. English industrial and quotation pages target export readers. The Öztiryakiler dealer page explains the official channel.</p>" +
      "<p>Reference projects use a demount case-study format; Istanbul catering and Izmir modular bar examples are reachable from this index. Photography and quotes will be updated as publishing continues. The definitive equipment list is generated in PFOS.</p>" +
      "<p>Catalogue SKU tables show sample modules only; the full list is project-specific. 2026 prices are summarised excluding VAT. Project discounts are applied during quoting.</p>" +
      "<p>Sales engineering approval sets the final price. Installation and commissioning follow the project plan. This is a B2B platform, not reservation software.</p>" +
      "<p>Gastronomy Design deepens layout questions. A CAD plan can be added in a later phase. Site survey dimensions are the foundation for PFOS inputs.</p>" +
      "<p>Service areas cover Turkey and selected export markets. The contact channel handles bespoke content and project requests. The live catalogue validates price and stock.</p>" +
      "<p>The guide index separates equipment shoppers from concept researchers. Transition to PFOS is encouraged for quote production. The footer menu links to every guide.</p>" +
      "<p>Dark kitchen and cloud kitchen guides explain multi-brand scenarios. Hotel and all-day dining content emphasises meal cycles. Fast food and fine dining can be read comparatively.</p>" +
      "<p>Quote PDFs contain structured SKU rows. Target draft quote time is about five minutes. The ordering process starts after approval.</p>" +
      "<p>The GEO guide index is the central content architecture hub for Equsto.</p>" +
      "<p>PFOS draft lists are finalised after sales engineering approval and site survey; installation, commissioning and warranty registration run under the same project number. Equsto generates quotes as a B2B industrial kitchen supply platform with 2026 pricing.</p>"
  ),
  { minParas: 10, minChars: 1500 }
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

  src = src.replace(/var DATA_FALLBACK = "\/data\/geo-landings\.json\?v=[^"]+";/, 'var DATA_FALLBACK = "/data/geo-landings.json?v=20260528geo-en-full";');
  src = src.replace(/var DATA_EN_FALLBACK = "\/data\/geo-landings-en\.json\?v=[^"]+";/, 'var DATA_EN_FALLBACK = "/data/geo-landings-en.json?v=20260528geo-en-full";');

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
  html = html.replace(/eq-geo-landing\.js\?v=[^"]+/, "eq-geo-landing.js?v=20260528geo-en-full");
  fs.writeFileSync(geoHtml, html);
  console.log("patched public/geo-landing.html cache bust");
}

console.log("blogHub i18n fix complete (forced)");
