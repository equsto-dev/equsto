/**
 * Google Ads ajanı — endüstriyel mutfak konumlandırması, etiketler, feed, landing
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ROOT = process.env.AGENT_REPO_ROOT?.trim() || APP_ROOT;
const PUBLIC = path.join(ROOT, "public");

const INDUSTRIAL_KEYWORDS_TR = [
  "endüstriyel mutfak",
  "endustriyel mutfak",
  "mutfak ekipmanı",
  "commercial kitchen",
  "öztiryakiler",
  "oztiryakiler",
];

const RECOMMENDED_AD_LANDINGS = [
  {
    path: "/endustriyel-mutfak-ekipmani-turkiye",
    campaign: "Search — Endüstriyel mutfak ekipmanı",
    keywords: ["endüstriyel mutfak ekipmanı", "sanayi tipi mutfak"],
    priority: "high",
  },
  {
    path: "/oztiryakiler-ekipmani-tedarik",
    campaign: "Search — Öztiryakiler bayii",
    keywords: ["öztiryakiler bayii", "öztiryakiler fiyat"],
    priority: "high",
  },
  {
    path: "/pfos",
    campaign: "Search — Mutfak teklifi / lead",
    keywords: ["restoran mutfak teklifi", "mutfak projesi fiyat"],
    priority: "high",
  },
  {
    path: "/mutfak-teklif-platformu",
    campaign: "Search — Teklif platformu",
    keywords: ["mutfak teklif", "endüstriyel mutfak fiyat"],
    priority: "medium",
  },
  {
    path: "/shop/pisirme",
    campaign: "Shopping / DSA — Pişirme",
    keywords: ["sanayi tipi ocak", "endüstriyel fırın"],
    priority: "medium",
  },
  {
    path: "/iletisim",
    campaign: "Remarketing backup — İletişim",
    keywords: [],
    priority: "low",
  },
];

/** @typedef {'critical'|'high'|'medium'|'low'|'info'} AdsIssueSeverity */

/**
 * @param {object} p
 * @returns {import('./google-ads-agent-types.mjs').GoogleAdsIssue}
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

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function envFileHas(key, files = [".env.production.example", ".env.example"]) {
  for (const f of files) {
    if (!fileExists(f)) continue;
    const content = readText(f);
    if (new RegExp(`^#?\\s*${key}=`, "m").test(content)) return { file: f, found: true };
  }
  return { found: false };
}

function countKeywordHits(text, keywords = INDUSTRIAL_KEYWORDS_TR) {
  const lower = String(text || "").toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase())).length;
}

/**
 * @returns {{ check: object, issues: import('./google-ads-agent-types.mjs').GoogleAdsIssue[] }}
 */
export function auditAnalyticsAndTags() {
  const issues = [];
  const analyticsScript = fileExists("components/seo/AnalyticsScripts.tsx")
    ? readText("components/seo/AnalyticsScripts.tsx")
    : "";
  const eqAnalytics = fileExists("public/eq-analytics.js")
    ? readText("public/eq-analytics.js")
    : "";

  if (!analyticsScript.includes("NEXT_PUBLIC_GA4_ID")) {
    issues.push(
      makeIssue({
        id: "tags:analytics_scripts_missing",
        area: "gtag",
        severity: "critical",
        type: "missing_config",
        message: "AnalyticsScripts.tsx veya GA4 env bağlantısı eksik",
        file: "components/seo/AnalyticsScripts.tsx",
      }),
    );
  }

  if (!analyticsScript.includes("NEXT_PUBLIC_GOOGLE_ADS_ID")) {
    issues.push(
      makeIssue({
        id: "tags:google_ads_id_missing",
        area: "gtag",
        severity: "high",
        type: "missing_config",
        message: "NEXT_PUBLIC_GOOGLE_ADS_ID AnalyticsScripts'te tanımlı değil",
        file: "components/seo/AnalyticsScripts.tsx",
        fix: ".env.production içinde AW-XXXXXXXXX ayarlayın",
      }),
    );
  }

  const labelKeys = [
    "NEXT_PUBLIC_GOOGLE_ADS_LABEL_LEAD",
    "NEXT_PUBLIC_GOOGLE_ADS_LABEL_QUOTE",
    "NEXT_PUBLIC_GOOGLE_ADS_LABEL_ORDER",
  ];
  let labelsInExample = 0;
  for (const key of labelKeys) {
    const ex = envFileHas(key);
    if (ex.found) labelsInExample++;
    else {
      issues.push(
        makeIssue({
          id: `tags:${key.toLowerCase()}_undocumented`,
          area: "conversion",
          severity: "medium",
          type: "missing_env",
          message: `${key} .env örnek dosyalarında yok`,
          fix: "Google Ads → Hedefler → Dönüşüm etiketlerini env'e ekleyin",
        }),
      );
    }
  }

  const prodEx = envFileHas("NEXT_PUBLIC_GOOGLE_ADS_ID", [".env.production.example"]);
  if (!prodEx.found) {
    issues.push(
      makeIssue({
        id: "tags:ads_id_not_in_production_example",
        area: "gtag",
        severity: "medium",
        type: "missing_env",
        message: "NEXT_PUBLIC_GOOGLE_ADS_ID .env.production.example içinde yok",
        file: ".env.production.example",
      }),
    );
  }

  if (!eqAnalytics.includes("equstoTrackConversion")) {
    issues.push(
      makeIssue({
        id: "tags:conversion_helper_missing",
        area: "conversion",
        severity: "high",
        type: "missing_code",
        message: "eq-analytics.js içinde equstoTrackConversion yok",
        file: "public/eq-analytics.js",
      }),
    );
  }

  const conversionPoints = [
    { file: "public/contact.js", fn: "equstoTrackConversion", type: "lead" },
    { file: "lib/pfos/track-pfos-analytics.client.ts", fn: "equstoTrackConversion", type: "quote" },
    { file: "public/ecom-cart.js", fn: "equstoTrackConversion", type: "order" },
  ];
  let wired = 0;
  for (const cp of conversionPoints) {
    if (!fileExists(cp.file)) {
      issues.push(
        makeIssue({
          id: `tags:conversion_file_missing:${cp.type}`,
          area: "conversion",
          severity: "high",
          type: "missing_file",
          message: `Dönüşüm dosyası yok: ${cp.file} (${cp.type})`,
          file: cp.file,
        }),
      );
      continue;
    }
    const src = readText(cp.file);
    if (src.includes(cp.fn)) wired++;
    else {
      issues.push(
        makeIssue({
          id: `tags:conversion_not_wired:${cp.type}`,
          area: "conversion",
          severity: "high",
          type: "missing_wiring",
          message: `${cp.type} dönüşümü ${cp.file} içinde bağlı değil`,
          file: cp.file,
          fix: `equstoTrackConversion("${cp.type}") çağrısı ekleyin`,
        }),
      );
    }
  }

  if (!fileExists("app/layout.tsx") || !readText("app/layout.tsx").includes("AnalyticsScripts")) {
    issues.push(
      makeIssue({
        id: "tags:layout_analytics_missing",
        area: "gtag",
        severity: "critical",
        type: "missing_wiring",
        message: "Root layout AnalyticsScripts yüklemiyor",
        file: "app/layout.tsx",
      }),
    );
  }

  return {
    check: {
      status: issues.some((i) => i.severity === "critical" || i.severity === "high")
        ? "warn"
        : "ok",
      conversion_wired: wired,
      conversion_total: conversionPoints.length,
      label_keys_documented: labelsInExample,
    },
    issues,
  };
}

/**
 * @returns {{ check: object, issues: import('./google-ads-agent-types.mjs').GoogleAdsIssue[] }}
 */
export function auditIndustrialPositioning() {
  const issues = [];
  const signals = [];

  const layout = fileExists("app/layout.tsx") ? readText("app/layout.tsx") : "";
  const layoutHits = countKeywordHits(layout);
  signals.push({ source: "app/layout.tsx", hits: layoutHits });
  if (layoutHits < 1) {
    issues.push(
      makeIssue({
        id: "position:layout_keywords_weak",
        area: "positioning",
        severity: "high",
        type: "weak_signal",
        message: "Root layout title/description endüstriyel mutfak anahtar kelimesi içermiyor",
        file: "app/layout.tsx",
        fix: 'metadata title: "Equsto | Endüstriyel Mutfak ..."',
      }),
    );
  }

  const schema = fileExists("components/seo/GlobalSiteJsonLd.tsx")
    ? readText("components/seo/GlobalSiteJsonLd.tsx")
    : "";
  const schemaHits = countKeywordHits(schema);
  signals.push({ source: "GlobalSiteJsonLd", hits: schemaHits });
  if (!schema.includes("Endüstriyel mutfak")) {
    issues.push(
      makeIssue({
        id: "position:schema_knows_about_weak",
        area: "positioning",
        severity: "medium",
        type: "weak_signal",
        message: "Organization schema endüstriyel mutfak sinyali zayıf",
        file: "components/seo/GlobalSiteJsonLd.tsx",
      }),
    );
  }

  const geoPath = path.join(PUBLIC, "data/geo-landings.json");
  let pillarOk = false;
  if (fs.existsSync(geoPath)) {
    const geo = JSON.parse(fs.readFileSync(geoPath, "utf8"));
    const pillar = geo["endustriyel-mutfak-ekipmani-turkiye"];
    if (pillar) {
      const pillarText = [pillar.title, pillar.description, pillar.h1, pillar.body].join(" ");
      const hits = countKeywordHits(pillarText);
      signals.push({ source: "geo:endustriyel-mutfak-ekipmani-turkiye", hits });
      pillarOk = hits >= 2;
      if (!pillarOk) {
        issues.push(
          makeIssue({
            id: "position:pillar_keywords_weak",
            area: "positioning",
            severity: "high",
            type: "weak_signal",
            message: "Ana SEO pillar sayfası endüstriyel mutfak anahtar kelimeleri yetersiz",
            file: "public/data/geo-landings.json",
          }),
        );
      }
    } else {
      issues.push(
        makeIssue({
          id: "position:pillar_missing",
          area: "positioning",
          severity: "critical",
          type: "missing_page",
          message: "geo-landings.json içinde endustriyel-mutfak-ekipmani-turkiye yok",
          file: "public/data/geo-landings.json",
        }),
      );
    }
  }

  const llms = fileExists("public/llms.txt") ? readText("public/llms.txt") : "";
  const llmsHits = countKeywordHits(llms);
  signals.push({ source: "llms.txt", hits: llmsHits });
  if (llmsHits < 3) {
    issues.push(
      makeIssue({
        id: "position:llms_weak",
        area: "positioning",
        severity: "medium",
        type: "weak_signal",
        message: "llms.txt endüstriyel mutfak konumlandırması zayıf",
        file: "public/llms.txt",
      }),
    );
  }

  const feedTs = fileExists("lib/google-merchant-feed.ts")
    ? readText("lib/google-merchant-feed.ts")
    : "";
  if (!feedTs.includes("Endüstriyel Mutfak")) {
    issues.push(
      makeIssue({
        id: "position:merchant_feed_title",
        area: "merchant",
        severity: "medium",
        type: "weak_signal",
        message: "Merchant feed kanal başlığı endüstriyel mutfak içermiyor",
        file: "lib/google-merchant-feed.ts",
      }),
    );
  } else {
    signals.push({ source: "merchant_feed", hits: 1 });
  }

  const home = fileExists("lib/home-content.ts") ? readText("lib/home-content.ts") : "";
  if (!home.toLowerCase().includes("endüstriyel mutfak")) {
    issues.push(
      makeIssue({
        id: "position:home_hero_not_industrial",
        area: "positioning",
        severity: "low",
        type: "message_match",
        message: "Ana sayfa hero H1 doğrudan 'endüstriyel mutfak' demiyor — Search reklamları için pillar landing önerilir",
        file: "lib/home-content.ts",
        fix: "Search kampanyalarında Final URL: /endustriyel-mutfak-ekipmani-turkiye",
      }),
    );
  }

  return {
    check: {
      status: issues.some((i) => i.severity === "critical" || i.severity === "high")
        ? "warn"
        : "ok",
      pillar_ok: pillarOk,
      signals,
    },
    issues,
  };
}

/**
 * @returns {Promise<{ check: object, issues: import('./google-ads-agent-types.mjs').GoogleAdsIssue[], feedStats: object|null }>}
 */
export async function auditMerchantFeed() {
  const issues = [];
  const route = "app/feeds/google-products.xml/route.ts";
  if (!fileExists(route)) {
    issues.push(
      makeIssue({
        id: "merchant:route_missing",
        area: "merchant",
        severity: "critical",
        type: "missing_file",
        message: "Google Merchant feed route yok",
        file: route,
      }),
    );
    return { check: { status: "error" }, issues, feedStats: null };
  }

  const feedSrc = readText("lib/google-merchant-feed.ts");
  if (!feedSrc.includes("google_product_category")) {
    issues.push(
      makeIssue({
        id: "merchant:category_missing",
        area: "merchant",
        severity: "high",
        type: "missing_field",
        message: "Feed google_product_category alanı yok",
        file: "lib/google-merchant-feed.ts",
      }),
    );
  } else if (!feedSrc.includes("135")) {
    issues.push(
      makeIssue({
        id: "merchant:category_not_foodservice",
        area: "merchant",
        severity: "medium",
        type: "config",
        message: "google_product_category 135 (Food Service) bekleniyor",
        file: "lib/google-merchant-feed.ts",
      }),
    );
  }

  let feedStats = null;
  try {
    feedStats = await runFeedStats();
  } catch (e) {
    issues.push(
      makeIssue({
        id: "merchant:feed_stats_failed",
        area: "merchant",
        severity: "medium",
        type: "runtime",
        message: `Feed stats çalıştırılamadı: ${e instanceof Error ? e.message : String(e)}`.slice(
          0,
          200,
        ),
        fix: "npm run feed:google:stats (yerelde) veya AGENT_REPO_ROOT mount",
      }),
    );
  }
  try {
    if (feedStats) {
      if ((feedStats.included || 0) < 100) {
        issues.push(
          makeIssue({
            id: "merchant:low_included_count",
            area: "merchant",
            severity: "high",
            type: "feed_quality",
            message: `Merchant feed yalnızca ${feedStats.included} ürün içeriyor (beklenen: binlerce)`,
            fix: "npm run feed:google:stats ile skipped* nedenlerini inceleyin",
            meta: feedStats,
          }),
        );
      }
      if ((feedStats.skippedNoImage || 0) > 50) {
        issues.push(
          makeIssue({
            id: "merchant:skipped_no_image",
            area: "merchant",
            severity: "medium",
            type: "feed_quality",
            message: `${feedStats.skippedNoImage} ürün görsel eksikliği nedeniyle feed dışı`,
            meta: { skippedNoImage: feedStats.skippedNoImage },
          }),
        );
      }
      if ((feedStats.skippedNoPrice || 0) > 50) {
        issues.push(
          makeIssue({
            id: "merchant:skipped_no_price",
            area: "merchant",
            severity: "medium",
            type: "feed_quality",
            message: `${feedStats.skippedNoPrice} ürün fiyat eksikliği nedeniyle feed dışı`,
            meta: { skippedNoPrice: feedStats.skippedNoPrice },
          }),
        );
      }
    }
  } catch (e) {
    issues.push(
      makeIssue({
        id: "merchant:stats_failed",
        area: "merchant",
        severity: "low",
        type: "runtime",
        message: `Feed istatistikleri alınamadı: ${e instanceof Error ? e.message : String(e)}`,
        fix: "npm run feed:google:stats",
      }),
    );
  }

  if (!fileExists("app/(vitrin)/iade-politikasi/page.tsx") && !fileExists("public/iade-politikasi.html")) {
    issues.push(
      makeIssue({
        id: "merchant:return_policy_missing",
        area: "merchant",
        severity: "high",
        type: "policy",
        message: "İade politikası sayfası bulunamadı — GMC zorunlu",
        fix: "/iade-politikasi sayfasını Merchant Center'a bağlayın",
      }),
    );
  }

  return {
    check: {
      status: issues.some((i) => i.severity === "high" || i.severity === "critical")
        ? "warn"
        : "ok",
      feed_stats: feedStats,
      category: "135",
    },
    issues,
    feedStats,
  };
}

function runFeedStats() {
  return new Promise((resolve, reject) => {
    const script = path.join(ROOT, "scripts/run-google-merchant-feed.ts");
    if (!fs.existsSync(script)) {
      resolve(null);
      return;
    }
    const child = spawn(
      "npx",
      ["tsx", script, "--stats"],
      { cwd: ROOT, env: process.env, stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    let err = "";
    child.stdout?.on("data", (c) => {
      out += String(c);
    });
    child.stderr?.on("data", (c) => {
      err += String(c);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(err || out || `exit ${code}`));
        return;
      }
      try {
        const jsonLine = out
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.startsWith("{"));
        resolve(jsonLine ? JSON.parse(jsonLine) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

/**
 * @returns {{ check: object, issues: import('./google-ads-agent-types.mjs').GoogleAdsIssue[], landings: object[] }}
 */
export function auditAdLandingPages() {
  const issues = [];
  const landings = [];
  const geoPath = path.join(PUBLIC, "data/geo-landings.json");
  const geo = fs.existsSync(geoPath) ? JSON.parse(fs.readFileSync(geoPath, "utf8")) : {};

  /** sitemap-pages + shop-hubs vb. — /pfos hubs sitemap'te olabilir */
  let sitemapCorpus = "";
  if (fs.existsSync(PUBLIC)) {
    for (const f of fs.readdirSync(PUBLIC)) {
      if (!/^sitemap.*\.xml$/i.test(f)) continue;
      try {
        sitemapCorpus += `\n${fs.readFileSync(path.join(PUBLIC, f), "utf8")}`;
      } catch {
        /* ignore */
      }
    }
  }

  for (const rec of RECOMMENDED_AD_LANDINGS) {
    const slug = rec.path.replace(/^\//, "");
    const geoKey = slug.includes("/") ? null : slug;
    const geoEntry = geoKey ? geo[geoKey] : null;
    const inSitemap =
      sitemapCorpus.includes(`equsto.com${rec.path}<`) ||
      sitemapCorpus.includes(`equsto.com${rec.path}</`) ||
      sitemapCorpus.includes(`equsto.com${rec.path}`) ||
      rec.path.startsWith("/shop");

    const title = geoEntry?.title || "";
    const h1 = geoEntry?.h1 || "";
    const desc = geoEntry?.description || "";
    const combined = `${title} ${h1} ${desc}`;
    const kwHits = countKeywordHits(combined, [
      ...INDUSTRIAL_KEYWORDS_TR,
      ...rec.keywords,
    ]);

    const entry = {
      path: rec.path,
      campaign: rec.campaign,
      priority: rec.priority,
      in_sitemap: inSitemap,
      keyword_hits: kwHits,
      title: title || null,
      h1: h1 || null,
      recommended: true,
    };
    landings.push(entry);

    if (rec.priority === "high" && !inSitemap && !rec.path.startsWith("/shop")) {
      issues.push(
        makeIssue({
          id: `landing:not_in_sitemap:${slug}`,
          area: "landing",
          severity: "medium",
          type: "seo",
          message: `Önerilen reklam landing ${rec.path} sitemap*.xml içinde yok`,
          fix: "npm run sitemap:build",
        }),
      );
    }

    if (geoEntry && rec.priority === "high" && kwHits < 1) {
      issues.push(
        makeIssue({
          id: `landing:weak_keywords:${slug}`,
          area: "landing",
          severity: "medium",
          type: "message_match",
          message: `${rec.path} title/H1 endüstriyel mutfak anahtar kelimesi taşımıyor`,
          meta: { title, h1 },
        }),
      );
    }
  }

  return {
    check: {
      status: issues.length > 0 ? "warn" : "ok",
      recommended_count: RECOMMENDED_AD_LANDINGS.length,
      high_priority: RECOMMENDED_AD_LANDINGS.filter((r) => r.priority === "high").length,
    },
    issues,
    landings,
  };
}

/**
 * @returns {{ check: object, issues: import('./google-ads-agent-types.mjs').GoogleAdsIssue[] }}
 */
export function auditConsentAndPolicy() {
  const issues = [];

  const repoScan = [
    fileExists("components/seo/AnalyticsScripts.tsx")
      ? readText("components/seo/AnalyticsScripts.tsx")
      : "",
    fileExists("public/eq-analytics.js") ? readText("public/eq-analytics.js") : "",
    fileExists("public/eq-footer.js") ? readText("public/eq-footer.js") : "",
  ].join("\n");

  const hasConsentMode = /consent["']?\s*,\s*["']default["']|ad_storage|analytics_storage|Consent Mode/i.test(
    repoScan,
  );

  if (!hasConsentMode) {
    issues.push(
      makeIssue({
        id: "consent:google_consent_mode_missing",
        area: "consent",
        severity: "medium",
        type: "compliance",
        message: "Google Consent Mode v2 yapılandırılmamış — AB/EEA hedefli kampanyalar için gerekli",
        fix: "gtag consent default + CMP banner ekleyin",
      }),
    );
  }

  const footer = fileExists("public/eq-footer.js") ? readText("public/eq-footer.js") : "";
  const kvkkExists =
    fileExists("app/(vitrin)/kvkk/page.tsx") || fileExists("public/kvkk.html");
  if (footer.includes("cookie") && !kvkkExists) {
    issues.push(
      makeIssue({
        id: "consent:kvkk_page_missing",
        area: "consent",
        severity: "medium",
        type: "policy",
        message: "Çerez/KVKK yönetimi var ama /kvkk sayfası bulunamadı",
        fix: "KVKK ve çerez politikası sayfası oluşturun",
      }),
    );
  }

  return {
    check: {
      status: issues.length > 0 ? "warn" : "ok",
      consent_mode: hasConsentMode,
      kvkk_page: kvkkExists,
    },
    issues,
  };
}

function extractInlineConfig(html) {
  return {
    hasGtag: /googletagmanager\.com\/gtag\/js/i.test(html),
    hasGa4: /EQUSTO_GA4_ID/i.test(html),
    hasAdsId: /EQUSTO_GOOGLE_ADS_ID/i.test(html),
    hasLabels: /EQUSTO_ADS_CONVERSION_LABELS/i.test(html),
    hasEqAnalytics: /eq-analytics\.js/i.test(html),
  };
}

/**
 * @param {string} [baseUrl]
 * @returns {Promise<{ check: object, issues: import('./google-ads-agent-types.mjs').GoogleAdsIssue[] }>}
 */
export async function auditLiveTags(baseUrl) {
  const issues = [];
  const base = (baseUrl || process.env.GOOGLE_ADS_AGENT_BASE_URL || "https://equsto.com").replace(
    /\/$/,
    "",
  );

  if (process.env.GOOGLE_ADS_AGENT_SKIP_LIVE === "1") {
    return { check: { status: "skipped", reason: "GOOGLE_ADS_AGENT_SKIP_LIVE=1" }, issues };
  }

  const paths = ["/", "/endustriyel-mutfak-ekipmani-turkiye", "/pfos"];
  const results = [];

  for (const p of paths) {
    const url = `${base}${p}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "EqustoGoogleAdsAgent/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      const sig = extractInlineConfig(html);
      results.push({ path: p, status: res.status, ...sig });

      if (res.status !== 200) {
        issues.push(
          makeIssue({
            id: `live:http_${res.status}:${p}`,
            area: "live",
            severity: "high",
            type: "http_error",
            message: `Canlı ${p} → HTTP ${res.status}`,
            meta: { url },
          }),
        );
        continue;
      }

      if (!sig.hasEqAnalytics && !sig.hasGtag) {
        issues.push(
          makeIssue({
            id: `live:no_gtag:${p}`,
            area: "live",
            severity: p === "/" ? "critical" : "high",
            type: "missing_tag",
            message: `Canlı ${p} sayfasında gtag/eq-analytics yüklenmiyor`,
            meta: { url },
            fix: "Hetzner .env.production NEXT_PUBLIC_GA4_ID ve rebuild",
          }),
        );
      }

      if (p === "/" && sig.hasLabels) {
        const labelBlock = html.match(/EQUSTO_ADS_CONVERSION_LABELS\s*=\s*(\{[\s\S]*?\})/);
        if (labelBlock) {
          const emptyLabels =
            /lead:\s*""/.test(labelBlock[1]) &&
            /quote:\s*""/.test(labelBlock[1]) &&
            /order:\s*""/.test(labelBlock[1]);
          if (emptyLabels) {
            issues.push(
              makeIssue({
                id: "live:conversion_labels_empty",
                area: "conversion",
                severity: "high",
                type: "missing_config",
                message: "Canlı sitede Google Ads dönüşüm etiketleri (label) boş",
                fix: "NEXT_PUBLIC_GOOGLE_ADS_LABEL_LEAD/QUOTE/ORDER env + redeploy",
              }),
            );
          }
        }
      }

      if (p === "/endustriyel-mutfak-ekipmani-turkiye") {
        const lower = html.toLowerCase();
        if (!lower.includes("endüstriyel mutfak") && !lower.includes("endustriyel mutfak")) {
          issues.push(
            makeIssue({
              id: "live:pillar_keyword_missing",
              area: "positioning",
              severity: "high",
              type: "message_match",
              message: "Canlı pillar sayfasında 'endüstriyel mutfak' metni görünmüyor",
              meta: { url },
            }),
          );
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      issues.push(
        makeIssue({
          id: `live:fetch_fail:${p}`,
          area: "live",
          severity: "medium",
          type: "fetch_error",
          message: `Canlı ${p} alınamadı: ${msg}`,
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
 * @returns {import('./google-ads-agent-types.mjs').GoogleAdsCampaignConfig}
 */
export function buildCampaignConfig(ctx) {
  return {
    businessCategory: "Endüstriyel mutfak ekipmanı / Commercial kitchen equipment supplier",
    businessType: "B2B — restoran, otel, kafe, catering, bulut mutfak",
    primaryConversion: "quote (PFOS teklif) + lead (iletişim formu)",
    secondaryConversion: "order (sepet/checkout)",
    suggestedCampaigns: [
      {
        name: "Search | Endüstriyel mutfak ekipmanı",
        type: "Search",
        finalUrl: "https://equsto.com/endustriyel-mutfak-ekipmani-turkiye",
        keywords: [
          "endüstriyel mutfak ekipmanı",
          "sanayi tipi mutfak",
          "restoran mutfak ekipmanları",
        ],
      },
      {
        name: "Search | Öztiryakiler bayii",
        type: "Search",
        finalUrl: "https://equsto.com/oztiryakiler-ekipmani-tedarik",
        keywords: ["öztiryakiler bayii", "öztiryakiler fiyat listesi"],
      },
      {
        name: "Search | Mutfak teklifi",
        type: "Search",
        finalUrl: "https://equsto.com/pfos",
        keywords: ["restoran mutfak teklifi", "mutfak projesi fiyat"],
      },
      {
        name: "Performance Max | Katalog",
        type: "Performance Max",
        finalUrl: "https://equsto.com/shop/pisirme",
        feedUrl: "https://equsto.com/feeds/google-products.xml",
        note: "Merchant Center bağlandıktan sonra",
      },
    ],
    merchantCenter: {
      feedUrl: "https://equsto.com/feeds/google-products.xml",
      productCategory: "135 — Business & Industrial > Food Service",
      returnPolicyUrl: "https://equsto.com/iade-politikasi",
    },
    tracking: {
      ga4Property: process.env.NEXT_PUBLIC_GA4_ID || "G-MVRNFQC4PQ (örnek)",
      googleAdsAccount: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-11196463568 (örnek)",
      conversionActions: ["lead", "quote", "order"],
    },
    feedStats: ctx.feedStats || null,
    landings: ctx.landings || [],
  };
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

/**
 * @param {import('./google-ads-agent-types.mjs').GoogleAdsIssue[]} issues
 */
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
export async function runGoogleAdsAgentChecks(opts = {}) {
  const started = Date.now();

  const tags = auditAnalyticsAndTags();
  const positioning = auditIndustrialPositioning();
  const merchant = await auditMerchantFeed();
  const landings = auditAdLandingPages();
  const consent = auditConsentAndPolicy();
  const live = opts.skipLive
    ? { check: { status: "skipped" }, issues: [] }
    : await auditLiveTags(opts.baseUrl);

  const allIssues = sortIssues([
    ...tags.issues,
    ...positioning.issues,
    ...merchant.issues,
    ...landings.issues,
    ...consent.issues,
    ...live.issues,
  ]);

  const checks = {
    analytics_tags: tags.check,
    industrial_positioning: positioning.check,
    merchant_feed: merchant.check,
    ad_landings: landings.check,
    consent_policy: consent.check,
    live_tags: live.check,
  };

  const actionable = allIssues.filter((i) => i.severity !== "info");
  const status = Object.values(checks).some((c) => c.status === "error")
    ? "error"
    : actionable.some((i) => i.severity === "critical" || i.severity === "high")
      ? "warn"
      : actionable.length > 0
        ? "info"
        : "ok";

  const campaignConfig = buildCampaignConfig({
    feedStats: merchant.feedStats,
    landings: landings.landings,
  });

  return {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    status,
    summary: summarizeIssues(allIssues),
    checks,
    campaignConfig,
    issues: allIssues.slice(0, 200),
    issueCount: allIssues.length,
    aiSummary: null,
  };
}
