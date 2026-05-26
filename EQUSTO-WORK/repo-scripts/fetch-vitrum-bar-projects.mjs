/**
 * Vitrum Group — bar projeleri (projects-category/bar) kazıyıcısı.
 * Çıktı: public/data/vitrum-bar-projects.json
 *
 *   node scripts/fetch-vitrum-bar-projects.mjs
 *   node scripts/fetch-vitrum-bar-projects.mjs --insecure   # TLS doğrulama kapalı (yerel ağ)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "data", "vitrum-bar-projects.json");
const BASE = "https://www.vitrumgroup.org";
const LIST_URL = `${BASE}/projects-category/bar`;
const INSECURE = process.argv.includes("--insecure");

if (INSECURE) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const UA = "EqustoVitrumProjects/1.0 (+https://equsto.com; data sync)";

async function fetchText(url) {
  const r = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-GB,en;q=0.9",
    },
  });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.text();
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(s) {
  return decodeHtml(String(s || "").replace(/<[^>]+>/g, " "));
}

/** Kategori sayfasındaki proje kartlarını çıkar */
function parseListPage(html) {
  const projects = [];
  const seen = new Set();

  // Webflow: /projects/slug bağlantıları
  const linkRe = /href="(\/projects\/([a-z0-9-]+))"/gi;
  let m;
  const slugs = [];
  while ((m = linkRe.exec(html)) !== null) {
    if (!seen.has(m[2])) {
      seen.add(m[2]);
      slugs.push(m[2]);
    }
  }

  // Kart blokları: başlık + konum + yıl (sıra korunur)
  const cardRe =
    /class="[^"]*project[^"]*"[^>]*>[\s\S]*?<\/(?:div|a|article)>/gi;
  // Alternatif: w-dyn-item içindeki metin parçaları
  const dynChunks = html.split("w-dyn-item");
  for (let i = 1; i < dynChunks.length; i++) {
    const chunk = dynChunks[i].slice(0, 8000);
    const slugM = chunk.match(/href="\/projects\/([a-z0-9-]+)"/i);
    if (!slugM) continue;
    const slug = slugM[1];
    if (projects.some((p) => p.slug === slug)) continue;

    const titleM =
      chunk.match(/class="[^"]*project[^"]*title[^"]*"[^>]*>([^<]+)</i) ||
      chunk.match(/class="[^"]*heading[^"]*"[^>]*>([^<]+)</i);
    const locM = chunk.match(/class="[^"]*location[^"]*"[^>]*>([^<]+)</i);
    const yearM = chunk.match(/class="[^"]*year[^"]*"[^>]*>([^<]+)</i) ||
      chunk.match(/>(20\d{2})</);
    const tagM = chunk.match(/class="[^"]*tag[^"]*"[^>]*>([^<]+)</gi);
    const tags = tagM ? tagM.map((t) => decodeHtml(t.replace(/.*>([^<]+)</, "$1"))) : [];

    const imgM =
      chunk.match(/src="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+)"/i) ||
      chunk.match(/srcset="(https:\/\/cdn\.prod\.website-files\.com\/[^"\s]+)/i);

    projects.push({
      slug,
      name: titleM ? decodeHtml(titleM[1]) : slugToTitle(slug),
      location: locM ? decodeHtml(locM[1]) : "",
      year: yearM ? decodeHtml(yearM[1]).replace(/\D/g, "") || decodeHtml(yearM[1]) : "",
      categories: tags.length ? tags : ["Bars"],
      teaser: "",
      image: imgM ? imgM[1].split(" ")[0] : "",
      url: `${BASE}/projects/${slug}`,
    });
  }

  // dyn parse boşsa slug listesinden iskelet
  if (!projects.length && slugs.length) {
    for (const slug of slugs) {
      projects.push({
        slug,
        name: slugToTitle(slug),
        location: "",
        year: "",
        categories: ["Bars"],
        teaser: "",
        image: "",
        url: `${BASE}/projects/${slug}`,
      });
    }
  }

  return projects;
}

function slugToTitle(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Detay sayfası — Webflow proje şablonu */
function parseDetailPage(html, base) {
  const plain = stripTags(html);

  const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const name = h1M ? stripTags(h1M[1]) : base.name;

  const subtitle =
    pickMeta(plain, /SERVICES\s+([^]+?)(?:\s+With\s|\s+When\s|\s+November\s|\s+Hospitality\s|\s+Aesthetics\s|\s+Housed\s|\s+Two More\s)/i) ||
    (() => {
      const h2M = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      const t = h2M ? stripTags(h2M[1]) : "";
      return t && !/^about the project$/i.test(t) ? t : "";
    })();

  const location =
    pickMeta(plain, /\bLOCATION\s+([^]+?)(?:\s+Project type|\s+YEAR|\s+SERVICES\b)/i) ||
    base.location;
  const year =
    (pickMeta(plain, /\bYEAR\s+(20\d{2})\b/i) || "").replace(/\D/g, "") || base.year;
  const categoriesRaw = pickMeta(
    plain,
    /\bCATEGORY\s+([^]+?)(?:\s+LOCATION|\s+Project type|\s+YEAR\b)/i
  );
  const categories = categoriesRaw
    ? categoriesRaw
        .split(/\s{2,}|\s+(?=Bars|Restaurants|Retail|Professional)/)
        .map((c) => c.trim())
        .filter(Boolean)
    : base.categories;

  const projectType = pickMeta(
    plain,
    /Project type\s+Project type\s+([^]+?)(?:\s+YEAR|\s+SERVICES\b)/i
  );
  const client = pickMeta(plain, /\bClient\s+([^]+?)(?:\s+CATEGORY\b)/i) || name;

  let teaser = extractBodyTeaser(plain, name);
  if (!teaser || teaser.length < 60) teaser = base.teaser || "";

  let quote = "";
  const quoteM = plain.match(
    /[“"]([^”"]{40,800})[”"]\s*[—–-]\s*([^”"]{3,80})/i
  );
  if (quoteM) quote = `${quoteM[1].trim()} — ${quoteM[2].trim()}`;

  const ogImg =
    html.match(/property="og:image"[^>]+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"[^>]+property="og:image"/i);
  const image = ogImg ? ogImg[1] : base.image;

  const listTeaser = pickMeta(plain, new RegExp(`${escapeRe(name)}\\s+([^]+?)\\s+Client\\s`, "i"));

  return {
    ...base,
    name: name || base.name,
    client: client || name,
    subtitle: subtitle || base.subtitle || "",
    teaser: listTeaser && listTeaser.length < teaser.length ? listTeaser : teaser,
    quote: quote || base.quote || "",
    image: image || base.image,
    location: location || base.location,
    year: year || base.year,
    categories: categories.length ? categories : base.categories,
    projectType: projectType || "",
    url: base.url,
  };
}

function pickMeta(text, re) {
  const m = text.match(re);
  return m ? decodeHtml(m[1]).trim() : "";
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeProject(row, fb) {
  const bad =
    /Featured projects|View all projects|All projects |Need a reliable partner|Contact us/i;
  if (!row.teaser || bad.test(row.teaser) || row.teaser.length > 520) {
    row.teaser = fb.teaser || row.teaser || "";
  }
  if (!row.subtitle || bad.test(row.subtitle) || row.subtitle.length > 120) {
    row.subtitle = fb.subtitle || "";
  }
  if (row.projectType === "No items found.") row.projectType = "";
  if (row.quote && bad.test(row.quote)) {
    row.quote = (fb.quote || "").replace(bad, "").trim();
  }
  if (row.teaser) {
    row.teaser = row.teaser
      .replace(/[“"][^”"]{40,}[”"]\s*[—–-][^”"]+$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (!row.quote && fb.quote) row.quote = fb.quote;
  return row;
}

function extractBodyTeaser(plain, name) {
  const starters = [
    "With a smart",
    "When hospitality",
    "November is",
    "Two More Beers",
    "Housed in",
    "Aesthetics are",
    "Hospitality Group",
  ];
  for (const start of starters) {
    const i = plain.indexOf(start);
    if (i < 0) continue;
    let chunk = plain.slice(i);
    const stop = chunk.search(
      /\b(Client |Featured projects|View all projects|Contact us|All projects )/i
    );
    if (stop > 80) chunk = chunk.slice(0, stop);
    chunk = chunk.replace(/\s+/g, " ").trim();
    if (chunk.length >= 80) return chunk;
  }
  const afterServices = plain.split(/\bSERVICES\b/i)[1];
  if (afterServices) {
    const chunk = afterServices
      .replace(/^[^.]{0,120}?(\.|)\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    const stop = chunk.search(/\b(Client |Featured )/i);
    const body = (stop > 60 ? chunk.slice(0, stop) : chunk).trim();
    if (body.length >= 80 && !body.startsWith("All projects")) return body;
  }
  return "";
}

/** WebFetch / katalogdan bilinen bar projeleri (yedek) */
const FALLBACK_BAR = [
  {
    slug: "suelo-bar",
    name: "Suelo Bar",
    location: "Paris",
    year: "2024",
    categories: ["Bars"],
    subtitle: "Halcyon glamour powered by modern innovation",
    teaser:
      "Smart Spanish restaurant with an intimate speakeasy. Upstairs, a two-person bar station; downstairs, a customized U-shaped speakeasy bar.",
    quote:
      "We are very pleased with the outstanding work carried out by VITRUM and their dedicated team… — Iryna Ulanska, Bulldozer Group",
    url: `${BASE}/projects/suelo-bar`,
  },
  {
    slug: "cato-covent-garden-bar",
    name: "Cato Covent Garden Bar",
    location: "London, UK",
    year: "2026",
    categories: ["Bars"],
    subtitle: "Engineered for speed and soul",
    teaser:
      "Hospitality Group Bart & Taylor brings New York City soul and a boundary-pushing cocktail list to Seven Dials. Vitrum partnered with beverage lead Angelos Bafas to engineer a custom workspace that handles peak demand of over 100 drinks per hour.",
    url: `${BASE}/projects/cato-covent-garden-bar`,
  },
  {
    slug: "november",
    name: "November",
    location: "Berlin",
    year: "2020",
    categories: ["Restaurants", "Bars"],
    subtitle: "A bar at the heart of the neighbourhood",
    teaser:
      "Neighbourhood gem in a listed monument. Custom bar as centrepiece for the main dining room; 6m wood slab with embedded Vitrum bar system.",
    url: `${BASE}/projects/november`,
  },
  {
    slug: "two-more-beers",
    name: "Two More Beers",
    location: "UK, London",
    year: "2024",
    categories: ["Bars", "Restaurants"],
    subtitle: "Turnkey kitchen & bar for debut UK venue",
    teaser:
      "Vibrant beer spot crafted for a warm atmosphere, excellent food and meaningful conversations. Vitrum designed the kitchen and bar, supplied equipment, and commissioned the Manhattan Bar module before opening.",
    quote:
      "Vitrum delivered exactly what they promised: a kitchen and bar that work as hard as our team—and they did it faster than we thought possible. — Founder, Two More Beers",
    url: `${BASE}/projects/two-more-beers`,
  },
  {
    slug: "piazza-italiana",
    name: "Piazza Italiana",
    location: "London",
    year: "2024",
    categories: ["Bars"],
    subtitle: "A hard-working spot for London's professionals",
    teaser:
      "Former bank in the City. Full-service kitchen and two bars; high-volume covers from an extensive menu; sympathetic restoration of listed building.",
    url: `${BASE}/projects/piazza-italiana`,
  },
  {
    slug: "the-catch",
    name: "The Catch",
    location: "Berlin",
    year: "2024",
    categories: ["Bars"],
    subtitle: "High-end service requires a high-end bar solution",
    teaser:
      "Bar integrating with wooden countertop seating, neon lighting and stainless steel details for Alexander Slobin's Berlin restaurant.",
    url: `${BASE}/projects/the-catch`,
  },
];

async function main() {
  let listHtml = "";
  let projects = [];

  try {
    listHtml = await fetchText(LIST_URL);
    projects = parseListPage(listHtml);
    console.log("[vitrum] liste:", projects.length, "proje");
  } catch (e) {
    console.warn("[vitrum] liste alınamadı:", e.message);
    projects = FALLBACK_BAR.map((p) => ({ ...p }));
  }

  if (!projects.length) {
    console.warn("[vitrum] parse boş — yedek veri kullanılıyor");
    projects = FALLBACK_BAR.map((p) => ({ ...p }));
  }

  // Slug birleştir: fallback alanları doldur
  const fbBySlug = Object.fromEntries(FALLBACK_BAR.map((p) => [p.slug, p]));
  projects = projects.map((p) => ({ ...fbBySlug[p.slug], ...p, slug: p.slug }));

  const enriched = [];
  for (const p of projects) {
    const fb = fbBySlug[p.slug] || {};
    try {
      const html = await fetchText(p.url);
      const row = sanitizeProject(parseDetailPage(html, { ...fb, ...p }), fb);
      enriched.push(row);
      console.log("[vitrum] ✓", p.slug);
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      console.warn("[vitrum] detay atlandı:", p.slug, e.message);
      enriched.push(sanitizeProject({ ...fb, ...p }, fb));
    }
  }

  const payload = {
    source: LIST_URL,
    fetchedAt: new Date().toISOString(),
    category: "Bars",
    count: enriched.length,
    projects: enriched.sort((a, b) => (b.year || "").localeCompare(a.year || "")),
  };

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log("[vitrum] yazıldı →", path.relative(ROOT, OUT));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
