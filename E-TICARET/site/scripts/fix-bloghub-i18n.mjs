/**
 * blogHub — TR yalnızca Türkçe, EN yalnızca İngilizce.
 * geo-bodies-350w.json + eq-geo-landing.js + API JSON — senkronlar.
 */
import fs from "node:fs";
import path from "node:path";
import {
  assertGeoEnBodyStructured,
  normalizeGeoEnBodyStructured,
} from "./lib/normalize-geo-en-body.mjs";

const root = path.join(import.meta.dirname, "..");
const bodies350 = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/geo-bodies-350w.json"), "utf8")
);

export const blogHubTr = bodies350.blogHub;
export const blogHubEn = assertGeoEnBodyStructured(
  "en/blog",
  normalizeGeoEnBodyStructured(bodies350.blogHubEn),
  { minParas: 8, minChars: 1200 }
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

function patchGeoBodies350() {
  const p = path.join(root, "scripts/geo-bodies-350w.json");
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  data.blogHub = blogHubTr;
  data.blogHubEn = blogHubEn;
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched scripts/geo-bodies-350w.json");
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

  fs.writeFileSync(p, src, "utf8");
  console.log("patched public/eq-geo-landing.js");
}

patchGeoBodies350();

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

console.log("blogHub i18n fix complete (350w)");
