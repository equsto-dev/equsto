/**
 * İngilizce sayfa ajanı — /en kapsamı, çeviri kalitesi, SEO, sitemap
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = path.join(ROOT, "public");

const GEO_TR_SLUGS = [
  "steakhouse-kurulumu",
  "balik-restorani-mutfak-projesi-kurulumu",
  "bulut-mutfak-kurulumu",
  "cafe-kurulumu",
  "catering-mutfagi",
  "fine-dining-kurulumu",
  "dunya-mutfak-kurulumu",
  "italyan-restoran-kurulumu",
  "all-day-dining-kurulumu",
  "all-day-casual-cafe-kurulumu",
  "fast-food-kurulumu",
  "market-kasap-sarkuteri-kurulumu",
  "endustriyel-mutfak-ekipmani-turkiye",
  "restoran-mutfak-teklif",
  "otel-mutfak-ekipman-tedarik",
  "oztiryakiler-ekipmani-tedarik",
  "soguk-oda-teklif",
  "havuzlu-dolap-tedarik",
  "endustriyel-pisirme-ekipmanlari",
  "mutfak-teklif-platformu",
  "bar-tasarimi-turkiye",
  "blog",
];

const GEO_EN_SLUGS = [
  "steakhouse-kitchen-setup",
  "fish-restaurant-kitchen-project-and-equipment",
  "cloud-kitchen-setup",
  "cafe-setup",
  "catering-kitchen",
  "fast-food-kitchen-setup",
  "fine-dining-kitchen-setup",
  "all-day-dining-kitchen-setup",
  "all-day-casual-cafe-setup",
  "market-butcher-deli-setup",
  "world-cuisine-kitchen-setup",
  "italian-restaurant-kitchen-setup",
  "industrial-kitchen-equipment-turkey",
  "industrial-kitchen-supplier-turkey",
  "commercial-kitchen-quotation",
  "restaurant-kitchen-quote",
  "hotel-kitchen-equipment",
  "oztiryakiler-equipment-supply",
  "cold-room-quote",
  "deli-counter-refrigeration",
  "industrial-cooking-equipment",
  "kitchen-quote-platform",
  "bar-design-turkey",
];

const VITRIN_EN_ROUTES = [
  "/en",
  "/en/about",
  "/en/pfos",
  "/en/blog",
  "/en/contact",
  "/en/cart",
  "/en/search",
  "/en/besos",
];

const TR_TURKISH_CHARS = /[ğüşıöçĞÜŞİÖÇ]/;

/** @typedef {'critical'|'high'|'medium'|'low'|'info'} EnIssueSeverity */

/**
 * @param {object} p
 * @returns {import('./en-agent-types.mjs').EnIssue}
 */
export function makeIssue(p) {
  return {
    id: p.id,
    area: p.area,
    severity: p.severity,
    type: p.type,
    message: p.message,
    file: p.file || "",
    fix: p.fix || "",
    meta: p.meta || {},
  };
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function i18nLeaves(obj, prefix = "", acc = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === "$meta") continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") acc.push(key);
    else if (v && typeof v === "object") i18nLeaves(v, key, acc);
  }
  return acc;
}

/**
 * @returns {{ check: object, issues: import('./en-agent-types.mjs').EnIssue[] }}
 */
export function auditUiI18nParity() {
  const issues = [];
  const tr = readJson("public/i18n/tr.json");
  const en = readJson("public/i18n/en.json");
  const tl = i18nLeaves(tr);
  const el = i18nLeaves(en);
  const missing = tl.filter((k) => !el.includes(k));
  const extra = el.filter((k) => !tl.includes(k));

  if (missing.length) {
    issues.push(
      makeIssue({
        id: "ui:missing_en_keys",
        area: "ui",
        severity: missing.length > 20 ? "high" : "medium",
        type: "missing_translation",
        message: `en.json içinde ${missing.length} eksik UI anahtarı (tr.json'da var)`,
        file: "public/i18n/en.json",
        fix: "npm run i18n:build",
        meta: { sample: missing.slice(0, 10) },
      }),
    );
  }

  if (extra.length > 5) {
    issues.push(
      makeIssue({
        id: "ui:extra_en_keys",
        area: "ui",
        severity: "low",
        type: "extra_keys",
        message: `en.json'da ${extra.length} fazla anahtar (tr'de yok)`,
        file: "public/i18n/en.json",
        meta: { sample: extra.slice(0, 5) },
      }),
    );
  }

  return {
    check: {
      status: missing.length ? "warn" : "ok",
      tr_keys: tl.length,
      en_keys: el.length,
      missing: missing.length,
      extra: extra.length,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./en-agent-types.mjs').EnIssue[], stats: object }}
 */
export function auditProductEnCoverage() {
  const issues = [];
  const ekipPath = path.join(ROOT, "var/catalog/ekipmanlar.json");
  const enPath = path.join(PUBLIC, "data/i18n/products-en-by-id.json");

  if (!fs.existsSync(ekipPath) || !fs.existsSync(enPath)) {
    issues.push(
      makeIssue({
        id: "products:files_missing",
        area: "products",
        severity: "critical",
        type: "missing_file",
        message: "ekipmanlar.json veya products-en-by-id.json bulunamadı",
      }),
    );
    return { check: { status: "error" }, issues, stats: {} };
  }

  const catalog = readJson("var/catalog/ekipmanlar.json");
  const enData = readJson("public/data/i18n/products-en-by-id.json");
  const byId = enData.byId || {};
  const catalogIds = catalog.map((r) => String(r.id || "")).filter(Boolean);
  const enIds = Object.keys(byId);

  const missingInEn = catalogIds.filter((id) => !byId[id]);
  const orphanEn = enIds.filter((id) => !catalogIds.includes(id));

  let meta = {};
  if (fileExists("public/data/catalog-meta.json")) {
    meta = readJson("public/data/catalog-meta.json");
  }

  if (missingInEn.length) {
    issues.push(
      makeIssue({
        id: "products:missing_en_ids",
        area: "products",
        severity: "critical",
        type: "coverage_gap",
        message: `${missingInEn.length} katalog ürününün EN çevirisi yok`,
        file: "public/data/i18n/products-en-by-id.json",
        fix: "npm run i18n:products",
        meta: { sample: missingInEn.slice(0, 8) },
      }),
    );
  }

  if (orphanEn.length > 50) {
    issues.push(
      makeIssue({
        id: "products:orphan_en_ids",
        area: "products",
        severity: "low",
        type: "stale_data",
        message: `${orphanEn.length} EN kaydı katalogda yok (eski ürün)`,
        fix: "npm run i18n:products",
      }),
    );
  }

  const generated = enData.generated || null;
  const rebuiltAt = meta.rebuiltAt || null;
  if (generated && rebuiltAt && String(generated) < String(rebuiltAt).slice(0, 10)) {
    issues.push(
      makeIssue({
        id: "products:en_stale_generated",
        area: "products",
        severity: "medium",
        type: "stale_data",
        message: `products-en-by-id (${generated}) katalog rebuild'den (${rebuiltAt}) eski`,
        fix: "npm run i18n:products && deploy",
      }),
    );
  }

  const stats = {
    catalogCount: catalogIds.length,
    enCount: enIds.length,
    missingInEn: missingInEn.length,
    orphanEn: orphanEn.length,
    productsEnStale: meta.productsEnStale ?? null,
    generated,
    rebuiltAt,
  };

  return {
    check: {
      status: missingInEn.length ? "error" : stats.productsEnStale > 0 ? "warn" : "ok",
      ...stats,
    },
    issues,
    stats,
  };
}

/**
 * @returns {{ check: object, issues: import('./en-agent-types.mjs').EnIssue[] }}
 */
export function auditProductEnQuality() {
  const issues = [];
  const catalog = readJson("var/catalog/ekipmanlar.json");
  const enData = readJson("public/data/i18n/products-en-by-id.json");
  const byId = enData.byId || {};

  let turkishResidue = 0;
  let identicalName = 0;
  let missingDesc = 0;
  let hasDesc = 0;
  const residueSamples = [];

  for (const row of catalog) {
    const id = String(row.id || "");
    const en = byId[id];
    if (!en) continue;
    const trName = String(row.name || "").trim();
    const enName = String(en.n || "").trim();
    const enSpec = String(en.s || "").trim();
    const enDesc = String(en.d || "").trim();

    if (enName && TR_TURKISH_CHARS.test(enName)) {
      turkishResidue++;
      if (residueSamples.length < 5) residueSamples.push({ id, enName });
    }
    if (enName && trName && enName === trName) identicalName++;
    if (enDesc) hasDesc++;
    else if (enName || enSpec) missingDesc++;
  }

  const total = catalog.length;
  const residuePct = total ? Math.round((turkishResidue / total) * 1000) / 10 : 0;
  const identicalPct = total ? Math.round((identicalName / total) * 1000) / 10 : 0;
  const descPct = total ? Math.round((hasDesc / total) * 1000) / 10 : 0;

  if (residuePct > 5) {
    issues.push(
      makeIssue({
        id: "products:turkish_residue",
        area: "quality",
        severity: residuePct > 20 ? "high" : "medium",
        type: "translation_quality",
        message: `EN ürün adlarında Türkçe karakter: %${residuePct} (${turkishResidue} ürün)`,
        fix: "scripts/lib/product-i18n-en.mjs kurallarını genişletin veya npm run i18n:products",
        meta: { samples: residueSamples },
      }),
    );
  }

  if (identicalPct > 30) {
    issues.push(
      makeIssue({
        id: "products:identical_names",
        area: "quality",
        severity: "medium",
        type: "translation_quality",
        message: `EN adı TR ile aynı: %${identicalPct} (${identicalName} ürün)`,
        fix: "Ürün çeviri motorunu iyileştirin",
      }),
    );
  }

  if (descPct < 10) {
    issues.push(
      makeIssue({
        id: "products:sparse_descriptions",
        area: "quality",
        severity: "medium",
        type: "translation_quality",
        message: `EN açıklama (d) alanı yalnızca %${descPct} üründe dolu`,
        fix: "build-product-i18n-en.mjs ile description_en üretin",
      }),
    );
  }

  return {
    check: {
      status: issues.some((i) => i.severity === "high") ? "warn" : issues.length ? "info" : "ok",
      turkish_residue_pct: residuePct,
      identical_name_pct: identicalPct,
      description_pct: descPct,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./en-agent-types.mjs').EnIssue[] }}
 */
export function auditGeoEnPairing() {
  const issues = [];
  const trLandings = readJson("public/data/geo-landings.json");
  const enLandings = readJson("public/data/geo-landings-en.json");

  const trProfiles = new Map();
  for (const [key, val] of Object.entries(trLandings)) {
    if (key === "version" || key === "source") continue;
    const profile = val?.profile;
    if (profile) trProfiles.set(profile, key);
  }

  const enProfiles = new Map();
  for (const [key, val] of Object.entries(enLandings)) {
    if (key === "version" || key === "source") continue;
    const profile = val?.profile;
    if (profile) enProfiles.set(profile, key);
  }

  const trOnlyProfiles = [];
  for (const [profile, key] of trProfiles) {
    if (!enProfiles.has(profile)) {
      trOnlyProfiles.push({ profile, key });
    }
  }

  const trOnlySlugs = GEO_TR_SLUGS.filter(
    (slug) => slug !== "blog" && !enLandings[`en/${slug}`] && !Object.values(enLandings).some(
      (v) => v?.profile && trLandings[slug]?.profile === v.profile,
    ),
  );

  if (trOnlyProfiles.length) {
    issues.push(
      makeIssue({
        id: "geo:tr_profiles_without_en",
        area: "geo",
        severity: "high",
        type: "missing_page",
        message: `${trOnlyProfiles.length} TR GEO profili için EN karşılığı yok`,
        file: "public/data/geo-landings-en.json",
        fix: "npm run i18n:geo veya build-geo-landings-en.mjs",
        meta: { sample: trOnlyProfiles.slice(0, 6) },
      }),
    );
  }

  if (trOnlySlugs.includes("dunya-mutfak-kurulumu") || trOnlySlugs.includes("italyan-restoran-kurulumu")) {
    issues.push(
      makeIssue({
        id: "geo:known_tr_only_slugs",
        area: "geo",
        severity: "medium",
        type: "missing_page",
        message: "dunya-mutfak-kurulumu / italyan-restoran-kurulumu için EN slug yok",
        fix: "GEO_EN_SLUGS + geo-landings-en.json ekleyin",
      }),
    );
  }

  const enSlugCount = GEO_EN_SLUGS.length;
  const trSlugCount = GEO_TR_SLUGS.filter((s) => s !== "blog").length;

  return {
    check: {
      status: trOnlyProfiles.length > 3 ? "warn" : "ok",
      tr_slugs: trSlugCount,
      en_slugs: enSlugCount,
      tr_only_profiles: trOnlyProfiles.length,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./en-agent-types.mjs').EnIssue[] }}
 */
export function auditSitemapEn() {
  const issues = [];
  const sitemapPages = fileExists("public/sitemap-pages.xml")
    ? readText("public/sitemap-pages.xml")
    : "";

  const enInPages = (sitemapPages.match(/equsto\.com\/en\//g) || []).length;

  const missingFromPages = GEO_EN_SLUGS.filter(
    (slug) => !sitemapPages.includes(`/en/${slug}`),
  );

  if (missingFromPages.length > 5) {
    issues.push(
      makeIssue({
        id: "sitemap:geo_en_missing",
        area: "sitemap",
        severity: "high",
        type: "seo",
        message: `sitemap-pages.xml içinde ${missingFromPages.length}/${GEO_EN_SLUGS.length} EN GEO slug eksik`,
        file: "public/sitemap-pages.xml",
        fix: "npm run sitemap:build — GEO_EN_SLUGS ekle",
        meta: { sample: missingFromPages.slice(0, 8) },
      }),
    );
  }

  const vitrinMissing = VITRIN_EN_ROUTES.filter(
    (route) => route !== "/en" && !sitemapPages.includes(`equsto.com${route}`),
  );
  if (vitrinMissing.length > 2) {
    issues.push(
      makeIssue({
        id: "sitemap:vitrin_en_missing",
        area: "sitemap",
        severity: "medium",
        type: "seo",
        message: `Vitrin EN sayfaları sitemap-pages'te eksik: ${vitrinMissing.join(", ")}`,
        fix: "build-sitemap.mjs genişlet",
        meta: { missing: vitrinMissing },
      }),
    );
  }

  let productEnCount = 0;
  const sitemapIndex = fileExists("public/sitemap.xml") ? readText("public/sitemap.xml") : "";
  if (sitemapIndex.includes("sitemap-shop-products-en")) {
    productEnCount = 9808; // approximate from known chunks
  }

  return {
    check: {
      status: missingFromPages.length > 5 ? "warn" : "ok",
      sitemap_pages_en_urls: enInPages,
      geo_en_missing: missingFromPages.length,
      product_sitemap_en: productEnCount > 0,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./en-agent-types.mjs').EnIssue[] }}
 */
export function auditLlmsEn() {
  const issues = [];
  const llms = fileExists("public/llms.txt") ? readText("public/llms.txt") : "";
  const enUrls = [...llms.matchAll(/equsto\.com\/en\/[a-z0-9./-]+/gi)].map((m) => m[0]);
  const uniqueEn = [...new Set(enUrls)];

  if (uniqueEn.length < 8) {
    issues.push(
      makeIssue({
        id: "llms:sparse_en_links",
        area: "discovery",
        severity: "medium",
        type: "content_gap",
        message: `llms.txt yalnızca ${uniqueEn.length} EN URL içeriyor — shop/guides/projects eksik`,
        file: "public/llms.txt",
        fix: "/en/shop/*, /en/about, /en/guides/* URL'lerini ekleyin",
        meta: { urls: uniqueEn },
      }),
    );
  }

  if (/tam vitrin EN geliştirme/i.test(llms)) {
    issues.push(
      makeIssue({
        id: "llms:outdated_en_note",
        area: "discovery",
        severity: "low",
        type: "stale_content",
        message: "llms.txt 'EN geliştirme aşamasında' notu güncel değil (9k+ EN ürün sitemap'te)",
        file: "public/llms.txt",
        fix: "EN bölümünü güncelleyin",
      }),
    );
  }

  return {
    check: {
      status: uniqueEn.length < 8 ? "warn" : "ok",
      en_url_count: uniqueEn.length,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./en-agent-types.mjs').EnIssue[] }}
 */
export function auditEnSeoCode() {
  const issues = [];
  const pdp = fileExists("lib/shop/pdp-server.ts") ? readText("lib/shop/pdp-server.ts") : "";

  if (pdp.includes('canonical = `${origin}/shop/') && !pdp.includes("/en/shop") && !pdp.includes("prefix}/shop/")) {
    issues.push(
      makeIssue({
        id: "seo:pdp_canonical_tr_only",
        area: "seo",
        severity: "high",
        type: "canonical",
        message: "PDP canonical her zaman TR URL — /en/shop sayfalarında yanlış canonical",
        file: "lib/shop/pdp-server.ts",
        fix: "buildProductMetadata'a langPrefix parametresi ekleyin",
      }),
    );
  }

  const eqI18n = fileExists("public/eq-i18n.js") ? readText("public/eq-i18n.js") : "";
  if (eqI18n.includes('upsert("en", build("/en"))') && !eqI18n.includes("hakkimizda")) {
    issues.push(
      makeIssue({
        id: "seo:hreflang_alias_gap",
        area: "seo",
        severity: "medium",
        type: "hreflang",
        message: "eq-i18n.js hreflang /en prefix kullanıyor — slug alias (hakkimizda→about) yok",
        file: "public/eq-i18n.js",
        fix: "PATH_ALIASES map ile ensureHreflang güncelleyin",
      }),
    );
  }

  const geoMeta = fileExists("lib/geo/metadata.ts") ? readText("lib/geo/metadata.ts") : "";
  const shopLangBlob = [
    fileExists("app/(shop)/en/shop/[dept]/page.tsx")
      ? readText("app/(shop)/en/shop/[dept]/page.tsx")
      : "",
    fileExists("lib/shop/pdp-server.ts") ? readText("lib/shop/pdp-server.ts") : "",
  ].join("\n");
  if (
    geoMeta.includes("tr-TR") &&
    /\blanguages:\s*\{[\s\S]*?\btr:/.test(shopLangBlob) &&
    !shopLangBlob.includes("tr-TR")
  ) {
    issues.push(
      makeIssue({
        id: "seo:hreflang_locale_inconsistent",
        area: "seo",
        severity: "low",
        type: "hreflang",
        message: "hreflang kodları tutarsız: GEO tr-TR/en-US, shop tr/en",
        fix: "tr-TR / en-US + x-default standartlaştırın",
      }),
    );
  }

  const enPdpReexport = fileExists("app/(shop)/en/shop/[dept]/[slug]/page.tsx")
    ? readText("app/(shop)/en/shop/[dept]/[slug]/page.tsx")
    : "";
  const sharedPdp = fileExists("app/(shop)/shop/[dept]/[slug]/page.tsx")
    ? readText("app/(shop)/shop/[dept]/[slug]/page.tsx")
    : "";
  const sharedHandlesEn =
    sharedPdp.includes("shopLangPrefix") &&
    (sharedPdp.includes('locale === "en"') || sharedPdp.includes('langPrefix: locale === "en"'));
  if (
    enPdpReexport.includes('from "../../../../shop/[dept]/[slug]/page"') &&
    !sharedHandlesEn
  ) {
    issues.push(
      makeIssue({
        id: "seo:en_pdp_reexports_tr",
        area: "seo",
        severity: "medium",
        type: "ssr_gap",
        message: "EN PDP TR sayfasını re-export ediyor — SSR'da TR title/description",
        file: "app/(shop)/en/shop/[dept]/[slug]/page.tsx",
        fix: "EN metadata + SSR metin için ayrı generateMetadata",
      }),
    );
  }

  return {
    check: {
      status: issues.some((i) => i.severity === "high") ? "warn" : "ok",
      issues_found: issues.length,
    },
    issues,
  };
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : "";
}

/**
 * @param {string} [baseUrl]
 * @returns {Promise<{ check: object, issues: import('./en-agent-types.mjs').EnIssue[] }>}
 */
export async function auditLiveEnPages(baseUrl) {
  const issues = [];
  const base = (baseUrl || process.env.EN_AGENT_BASE_URL || "https://equsto.com").replace(/\/$/, "");

  if (process.env.EN_AGENT_SKIP_LIVE === "1") {
    return { check: { status: "skipped", reason: "EN_AGENT_SKIP_LIVE=1" }, issues };
  }

  const paths = [
    "/en",
    "/en/about",
    "/en/industrial-kitchen-supplier-turkey",
    "/en/shop/pisirme",
    "/en/pfos",
  ];
  const results = [];

  for (const p of paths) {
    const url = `${base}${p}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "EqustoEnAgent/1.0", "Accept-Language": "en" },
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      const title = extractTitle(html);
      const hasEnPath = html.includes('"/en/') || html.includes("'/en/");
      const turkishInTitle = TR_TURKISH_CHARS.test(title);

      results.push({ path: p, status: res.status, title: title.slice(0, 80), hasEnPath });

      if (res.status !== 200) {
        issues.push(
          makeIssue({
            id: `live:http_${res.status}:${p}`,
            area: "live",
            severity: "high",
            type: "http_error",
            message: `Canlı EN ${p} → HTTP ${res.status}`,
            meta: { url },
          }),
        );
        continue;
      }

      if (turkishInTitle && p.startsWith("/en/")) {
        issues.push(
          makeIssue({
            id: `live:turkish_title:${p}`,
            area: "live",
            severity: p.includes("/shop/") ? "high" : "medium",
            type: "translation_quality",
            message: `Canlı EN sayfa title Türkçe karakter içeriyor: "${title.slice(0, 60)}"`,
            meta: { url },
          }),
        );
      }

      const canonicalM = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      if (canonicalM && p.startsWith("/en/") && !canonicalM[1].includes("/en/")) {
        issues.push(
          makeIssue({
            id: `live:canonical_not_en:${p}`,
            area: "live",
            severity: "high",
            type: "canonical",
            message: `Canlı ${p} canonical TR'ye işaret ediyor: ${canonicalM[1]}`,
            meta: { url },
          }),
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      issues.push(
        makeIssue({
          id: `live:fetch_fail:${p}`,
          area: "live",
          severity: "medium",
          type: "fetch_error",
          message: `Canlı EN ${p} alınamadı: ${msg}`,
          meta: { url },
        }),
      );
      results.push({ path: p, error: msg });
    }
  }

  return {
    check: {
      status: results.every((r) => r.error) ? "skipped" : issues.length ? "warn" : "ok",
      base_url: base,
      paths: results,
    },
    issues,
  };
}

/**
 * @param {object} ctx
 * @returns {import('./en-agent-types.mjs').EnImprovementPlan}
 */
export function buildImprovementPlan(ctx) {
  const actions = [];
  const issueIds = new Set((ctx.issues || []).map((i) => i.id));

  if (ctx.productStats?.missingInEn > 0) {
    actions.push({
      priority: "critical",
      action: "npm run i18n:products",
      reason: `${ctx.productStats.missingInEn} ürün EN çevirisi eksik`,
    });
  } else if (issueIds.has("products:en_stale_generated") || issueIds.has("products:turkish_residue")) {
    actions.push({
      priority: "medium",
      action: "npm run i18n:products",
      reason: "Katalog rebuild sonrası EN JSON yenile / çeviri kalitesi",
    });
  }

  if (issueIds.has("seo:pdp_canonical_tr_only") || issueIds.has("seo:en_pdp_reexports_tr")) {
    actions.push({
      priority: "high",
      action: "PDP canonical + EN SSR metadata düzelt",
      reason: "/en/shop/* sayfalarında TR canonical ve Türkçe title",
      files: ["lib/shop/pdp-server.ts", "app/(shop)/en/shop/[dept]/[slug]/page.tsx"],
    });
  }

  if (issueIds.has("sitemap:geo_en_missing") || issueIds.has("sitemap:vitrin_en_missing")) {
    actions.push({
      priority: "high",
      action: "sitemap-pages.xml — tüm GEO_EN_SLUGS + vitrin EN",
      reason: "EN GEO / vitrin URL'leri sitemap'te eksik",
      files: ["scripts/build-sitemap.mjs"],
    });
  }

  if (issueIds.has("geo:tr_profiles_without_en") || issueIds.has("geo:known_tr_only_slugs")) {
    actions.push({
      priority: "medium",
      action: "geo-landings-en.json — eksik EN GEO profilleri",
      reason: "TR-only GEO konseptleri",
    });
  }

  if (issueIds.has("llms:sparse_en_links") || issueIds.has("llms:outdated_en_note")) {
    actions.push({
      priority: "low",
      action: "public/llms.txt EN bölümü genişlet",
      reason: "AI keşfi için /en/shop ve guides URL'leri",
    });
  }

  if (!actions.length) {
    actions.push({
      priority: "low",
      action: "EN coverage izlemeyi sürdürün",
      reason: "Kritik EN boşlukları kapatıldı — canlı head + çeviri kalitesi cron ile izlenir",
    });
  }

  return {
    locale: "en",
    urlPrefix: "/en",
    productCoverage: ctx.productStats || {},
    uiParity: ctx.uiCheck || {},
    recommendedCommands: [
      "npm run i18n:check",
      "npm run i18n:products",
      "npm run sitemap:build",
      "npm run en:agent:run",
    ],
    actions,
    priorityPages: [
      { path: "/en/industrial-kitchen-supplier-turkey", role: "SEO pillar" },
      { path: "/en/commercial-kitchen-quotation", role: "Lead / quote" },
      { path: "/en/about", role: "Trust / E-E-A-T" },
      { path: "/en/pfos", role: "Conversion wizard" },
      { path: "/en/shop/pisirme", role: "Catalog PLP EN" },
    ],
  };
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function sortIssues(issues) {
  return [...issues].sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 9;
    const sb = SEVERITY_ORDER[b.severity] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.area.localeCompare(b.area);
  });
}

export function summarizeIssues(issues) {
  const byArea = {};
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const i of issues) {
    byArea[i.area] = (byArea[i.area] || 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
  }
  return { totalIssues: issues.length, ...bySeverity, byArea };
}

/**
 * @param {{ skipLive?: boolean, baseUrl?: string }} [opts]
 */
export async function runEnAgentChecks(opts = {}) {
  const started = Date.now();

  const ui = auditUiI18nParity();
  const products = auditProductEnCoverage();
  const quality = auditProductEnQuality();
  const geo = auditGeoEnPairing();
  const sitemap = auditSitemapEn();
  const llms = auditLlmsEn();
  const seo = auditEnSeoCode();
  const live = opts.skipLive
    ? { check: { status: "skipped" }, issues: [] }
    : await auditLiveEnPages(opts.baseUrl);

  const allIssues = sortIssues([
    ...ui.issues,
    ...products.issues,
    ...quality.issues,
    ...geo.issues,
    ...sitemap.issues,
    ...llms.issues,
    ...seo.issues,
    ...live.issues,
  ]);

  const checks = {
    ui_i18n: ui.check,
    product_coverage: products.check,
    product_quality: quality.check,
    geo_pairing: geo.check,
    sitemap_en: sitemap.check,
    llms_en: llms.check,
    seo_code: seo.check,
    live_en: live.check,
  };

  const actionable = allIssues.filter((i) => i.severity !== "info");
  const status = Object.values(checks).some((c) => c.status === "error")
    ? "error"
    : actionable.some((i) => i.severity === "critical" || i.severity === "high")
      ? "warn"
      : actionable.length > 0
        ? "info"
        : "ok";

  const improvementPlan = buildImprovementPlan({
    productStats: products.stats,
    uiCheck: ui.check,
    issues: allIssues,
  });

  return {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    status,
    summary: summarizeIssues(allIssues),
    checks,
    improvementPlan,
    issues: allIssues.slice(0, 200),
    issueCount: allIssues.length,
    aiSummary: null,
  };
}
