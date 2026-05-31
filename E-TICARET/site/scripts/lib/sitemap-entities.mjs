/**
 * Sitemap + SEO audit — ortak URL / slug yardımcıları.
 */
import fs from "node:fs";
import path from "node:path";

export const ORIGIN = "https://equsto.com";
export const SHOP_DEPTS = [
  "pisirme",
  "sogutma",
  "kahve",
  "yikama",
  "hazirlik",
  "icecek",
  "tezgah",
  "dolap",
  "davlumbaz",
  "tasima",
  "araba",
  "istif",
  "set-ustu-mutfak",
  "kuvetler",
  "market-reyonlari",
];

const BRAND_SLUG_ALIAS = {
  atalay: "Atalay Endüstriyel Mutfak Ekipmanları",
  oztiryakiler: "Öztiryakiler Endüstriyel Mutfak",
  electrolux: "Electrolux Professional",
  inoksan: "İnoksan",
  "la-cimbali": "La Cimbali",
  faema: "Faema",
  rational: "Rational",
  empero: "Empero",
  samixir: "Samixir",
  gtech: "Gtech",
  "robot-coupe": "Robot Coupe",
};

const TR_ASCII = {
  ğ: "g",
  ü: "u",
  ş: "s",
  ı: "i",
  ö: "o",
  ç: "c",
  Ğ: "g",
  Ü: "u",
  Ş: "s",
  İ: "i",
  Ö: "o",
  Ç: "c",
};

export function foldTr(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i");
}

export function slugifyPart(s) {
  return foldTr(s)
    .replace(/[/\\]+/g, "-")
    .replace(/[^a-z0-9+\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

export function catalogSlug(row) {
  const id = String(row.id || "").trim();
  if (id) return id.toLowerCase();
  const b = slugifyPart(row.brand);
  const n = slugifyPart(row.name);
  return (b ? `${b}-` : "") + n;
}

export function resolveDept(row) {
  let d = String(row.dept || "").trim().toLowerCase();
  if (d === "market-reyon") return "market-reyonlari";
  return d;
}

export function tipDeptToShop(dept) {
  const d = String(dept || "").trim().toLowerCase();
  if (d === "market-reyon") return "market-reyonlari";
  if (d === "tezgah") return "tezgah";
  if (d === "kuvetler") return "kuvetler";
  if (d === "set-ustu-mutfak") return "set-ustu-mutfak";
  return d;
}

function brandSlugify(name) {
  const folded = String(name || "")
    .normalize("NFC")
    .trim()
    .replace(/[ğüşıöçĞÜŞİÖÇ]/g, (c) => TR_ASCII[c] || c);
  return folded
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** eq-site-urls.js / brand-shop-redirect.ts ile uyumlu */
export function brandSlugFromName(brandName) {
  const n = String(brandName || "")
    .normalize("NFC")
    .trim();
  if (!n) return "";
  for (const [slug, canon] of Object.entries(BRAND_SLUG_ALIAS)) {
    if (canon === n) return slug;
  }
  const low = n.toLocaleLowerCase("tr");
  for (const slug of Object.keys(BRAND_SLUG_ALIAS)) {
    const lab = slug.replace(/-/g, " ");
    if (low === lab || low.startsWith(lab)) return slug;
  }
  return brandSlugify(n);
}

export function loadEkipmanlar(publicDir) {
  const p = path.join(publicDir, "data", "ekipmanlar.json");
  if (!fs.existsSync(p)) return [];
  const rows = JSON.parse(fs.readFileSync(p, "utf8"));
  return Array.isArray(rows) ? rows : [];
}

/** eq-dept-tips.js RAW satırlarından tip/dept çiftleri */
export function loadDeptTips(publicDir) {
  const p = path.join(publicDir, "eq-dept-tips.js");
  if (!fs.existsSync(p)) return [];
  const src = fs.readFileSync(p, "utf8");
  const tips = [];
  const re = /\{\s*tip:\s*"([^"]+)"\s*,\s*dept:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    tips.push({ tip: m[1], dept: m[2] });
  }
  return tips;
}

export function uniqueBrandSlugs(rows) {
  const map = new Map();
  for (const row of rows) {
    const brand = String(row.brand || "").trim();
    if (!brand) continue;
    const slug = brandSlugFromName(brand);
    if (!slug) continue;
    if (!map.has(slug)) map.set(slug, { slug, brand, count: 0 });
    map.get(slug).count += 1;
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function productPageUrl(row, langPrefix = "") {
  const name = String(row.name || "").trim();
  if (!name) return null;
  const dept = resolveDept(row);
  if (!SHOP_DEPTS.includes(dept)) return null;
  const slug = catalogSlug(row);
  if (!slug) return null;
  const prefix = langPrefix ? `/${langPrefix.replace(/^\//, "")}` : "";
  return `${ORIGIN}${prefix}/shop/${dept}/${encodeURIComponent(slug)}`;
}

export function collectExpectedUrls(rows, tips) {
  const urls = new Set();

  const add = (pathname) => {
    if (!pathname) return;
    urls.add(pathname.startsWith("http") ? pathname : `${ORIGIN}${pathname}`);
  };

  add("/");
  add("/shop");
  add("/shop/marka");
  add("/pfos");
  add("/besos");
  add("/arama");

  for (const lang of ["", "/en"]) {
    add(`${lang}/shop`);
    add(`${lang}/shop/marka`);
    for (const d of SHOP_DEPTS) {
      add(`${lang}/shop/${d}`);
    }
  }

  for (const { slug } of uniqueBrandSlugs(rows)) {
    add(`/shop/marka/${encodeURIComponent(slug)}`);
    add(`/en/shop/marka/${encodeURIComponent(slug)}`);
  }

  for (const t of tips) {
    const dept = tipDeptToShop(t.dept);
    if (!SHOP_DEPTS.includes(dept)) continue;
    const q = `?tip=${encodeURIComponent(t.tip)}`;
    add(`/shop/${dept}${q}`);
    add(`/en/shop/${dept}${q}`);
  }

  const seen = new Set();
  for (const row of rows) {
    const tr = productPageUrl(row, "");
    const en = productPageUrl(row, "en");
    if (tr) {
      const key = tr.replace(ORIGIN, "");
      if (!seen.has(key)) {
        seen.add(key);
        urls.add(tr);
        if (en) urls.add(en);
      }
    }
  }

  return urls;
}

export function parseSitemapLocs(publicDir) {
  const files = fs.readdirSync(publicDir).filter((f) => f.startsWith("sitemap") && f.endsWith(".xml"));
  const locs = new Set();
  for (const file of files) {
    const xml = fs.readFileSync(path.join(publicDir, file), "utf8");
    const re = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = re.exec(xml))) locs.add(m[1].trim());
  }
  return locs;
}
