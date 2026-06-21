import type { NextConfig } from "next";
import fs from "node:fs";
import path from "path";

/** Departman PLP — eski *.html → /shop/{slug} */
const DEPT_HTML: Record<string, string> = {
  pisirme: "/pisirme.html",
  sogutma: "/sogutma.html",
  kahve: "/kahve.html",
  yikama: "/yikama.html",
  hazirlik: "/hazirlik.html",
  icecek: "/icecek.html",
  tezgah: "/tezgah.html",
  dolap: "/dolap.html",
  davlumbaz: "/davlumbaz.html",
  tasima: "/tasima.html",
  araba: "/araba.html",
  istif: "/istif.html",
  "set-ustu-mutfak": "/set-ustu-mutfak.html",
  kuvetler: "/kuvetler.html",
  "market-reyonlari": "/market-reyonlari.html",
};

function deptRedirects() {
  return Object.entries(DEPT_HTML).map(([slug, file]) => ({
    source: file,
    destination: `/shop/${slug}`,
    permanent: true,
  }));
}

/** Eski vitrin HTML dosyaları → temiz URL (App Router) */
function legacyHtmlRedirects() {
  const pairs: [string, string][] = [
    ["pfos.html", "/pfos"],
    ["sss.html", "/sss"],
    ["contact.html", "/iletisim"],
    ["hakkimizda.html", "/hakkimizda"],
    ["buradan-basladi.html", "/buradan-basladi"],
    ["marka.html", "/shop/marka"],
    ["login.html", "/login"],
    ["hesabim.html", "/hesabim"],
    ["bar-design.html", "/besos"],
    ["imt300.html", "/imt300"],
    ["bar-module.html", "/besos"],
    ["geo-landing.html", "/"],
    ["arama.html", "/arama"],
    ["sepet.html", "/sepet"],
    ["product.html", "/shop"],
    ["iade-politikasi.html", "/iade-politikasi"],
  ];
  return pairs.map(([file, dest]) => ({
    source: `/${file}`,
    destination: dest,
    permanent: true,
  }));
}

/** Vercel lambda 300MB — glob'lar Next proje kökünden (E-TICARET/site). Turbopack'ta excludes atlanır → strip-lambda-public-trace.mjs */
const traceExcludes = [
  "./public/**",
  "./public/images/**",
  "./public/assets/**",
  "./public/data/**",
  "./scripts/**",
  "./prisma/generated/**",
  "./**/*.md",
  "./**/*.pdf",
  "./**/*.py",
];

const apiTraceExcludes = [...traceExcludes];

const urbanBarBesosCatalogInclude = ["./public/data/urbanbar-besos-catalog.json"];

/** Monorepo: node_modules / shared packages repo kökünden trace edilebilir */
const parentRepo = path.join(__dirname, "..", "..");
const tracingRoot = fs.existsSync(
  path.join(parentRepo, "E-TICARET", "site", "package.json"),
)
  ? parentRepo
  : __dirname;

/** Faz B — Vercel'de public/images yok; yerel dosya yoksa CloudFront fallback */
function assetCdnBaseForRewrites(): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim() ||
    process.env.AWS_CLOUDFRONT_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  try {
    const hint = JSON.parse(
      fs.readFileSync(path.join(__dirname, "docs/s3-upload-manifest.json"), "utf8"),
    ).cdnEnvHint;
    if (typeof hint === "string" && /^https?:\/\//i.test(hint)) {
      return hint.trim().replace(/\/$/, "");
    }
  } catch {
    /* manifest yok */
  }
  return "";
}

function cdnAssetFallbackRewrites(base: string) {
  return [
    { source: "/images/:path*", destination: `${base}/images/:path*` },
    { source: "/data/images/:path*", destination: `${base}/images/:path*` },
    { source: "/data/caglayan-market/:path*", destination: `${base}/data/caglayan-market/:path*` },
    {
      source: "/data/prosogutma-market/:path*",
      destination: `${base}/data/prosogutma-market/:path*`,
    },
    { source: "/data/vitrum-drawings/:path*", destination: `${base}/data/vitrum-drawings/:path*` },
    {
      source: "/data/advanced-cuisine-clear-ice/:path*",
      destination: `${base}/data/advanced-cuisine-clear-ice/:path*`,
    },
    {
      source: "/data/electrolux-professional/:path*",
      destination: `${base}/data/electrolux-professional/:path*`,
    },
  ];
}

const cdnBase = assetCdnBaseForRewrites();

const nextConfig: NextConfig = {
  /** Docker/Hetzner — .next/standalone; Vercel kendi paketlemesini kullanır */
  output: "standalone",
  /** Monorepo (git kok = path0); Vercel paketleme icin */
  outputFileTracingRoot: tracingRoot,
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "meilisearch",
    "puppeteer-core",
    "@sparticuz/chromium-min",
    "pdf-parse",
    "exceljs",
  ],
  outputFileTracingExcludes: {
    "/**": apiTraceExcludes,
    "/api/**": apiTraceExcludes,
    "/api/cms": apiTraceExcludes,
  },
  outputFileTracingIncludes: {
    "/besos/bardaklar/[slug]": urbanBarBesosCatalogInclude,
    "/besos/bar-ekipman/[slug]": urbanBarBesosCatalogInclude,
    "/en/besos/bardaklar/[slug]": urbanBarBesosCatalogInclude,
    "/en/besos/bar-ekipman/[slug]": urbanBarBesosCatalogInclude,
  },
  transpilePackages: [
    "antd",
    "@ant-design/icons",
    "@ant-design/pro-components",
    "@ant-design/pro-layout",
  ],
  async headers() {
    const utf8Html = { key: "Content-Type", value: "text/html; charset=utf-8" };
    const utf8Json = { key: "Content-Type", value: "application/json; charset=utf-8" };
    return [
      { source: "/", headers: [utf8Html] },
      { source: "/pfos", headers: [utf8Html] },
      { source: "/pfos/:path*", headers: [utf8Html] },
      { source: "/besos", headers: [utf8Html] },
      { source: "/besos/:path*", headers: [utf8Html] },
      { source: "/admin", headers: [utf8Html] },
      { source: "/iletisim", headers: [utf8Html] },
      { source: "/login", headers: [utf8Html] },
      { source: "/hesabim", headers: [utf8Html] },
      { source: "/marka", headers: [utf8Html] },
      { source: "/marka/:path*", headers: [utf8Html] },
      { source: "/shop/marka", headers: [utf8Html] },
      { source: "/shop/marka/:path*", headers: [utf8Html] },
      { source: "/sss", headers: [utf8Html] },
      { source: "/sss/:path*", headers: [utf8Html] },
      { source: "/arama", headers: [utf8Html] },
      { source: "/shop/:dept", headers: [utf8Html] },
      { source: "/en", headers: [utf8Html] },
      { source: "/en/:path*", headers: [utf8Html] },
      { source: "/i18n/:file.json", headers: [utf8Json] },
      { source: "/locales/:file.json", headers: [utf8Json] },
      {
        source: "/eq-footer.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/data/footer-vitrin.json",
        headers: [
          utf8Json,
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/data/:path*.json",
        headers: [
          utf8Json,
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/data/:path*.pdf",
        headers: [
          { key: "Content-Type", value: "application/pdf" },
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/feeds/google-products.xml",
        headers: [
          { key: "Content-Type", value: "application/xml; charset=utf-8" },
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/contact", destination: "/iletisim", permanent: true },
      { source: "/balik-restorani-kurulumu", destination: "/balik-restorani-mutfak-projesi-kurulumu", permanent: true },
      { source: "/bulut-mutfak-kurulumu", destination: "/rehber/dark-kitchen-bulut-mutfak-2026", permanent: true },
      { source: "/restoran-mutfak-teklif", destination: "/mutfak-teklif-platformu", permanent: true },
      { source: "/balik-restorani-mutfak-projesi-ve-gerekli-ekipmanlar", destination: "/balik-restorani-mutfak-projesi-kurulumu", permanent: true },
      { source: "/en/fish-restaurant-kitchen-setup", destination: "/en/fish-restaurant-kitchen-project-and-equipment", permanent: true },
      { source: "/en/contact", destination: "/en/iletisim", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/admin", destination: "/admin.html", permanent: false },
      { source: "/en/admin", destination: "/admin.html", permanent: false },
      { source: "/shop/index.html", destination: "/", permanent: true },
      { source: "/shop", destination: "/", permanent: true },
      { source: "/shop/:dept.html", destination: "/shop/:dept", permanent: true },
      { source: "/dolap.html", destination: "/shop/tezgah", permanent: true },
      { source: "/shop/dolap", destination: "/shop/tezgah", permanent: true },
      { source: "/shop/dolap/:path*", destination: "/shop/tezgah/:path*", permanent: true },
      ...deptRedirects(),
      ...legacyHtmlRedirects(),
      { source: "/marka", destination: "/shop/marka", permanent: true },
      { source: "/marka/", destination: "/shop/marka", permanent: true },
      { source: "/en/marka", destination: "/en/shop/marka", permanent: true },
      { source: "/en/marka/", destination: "/en/shop/marka", permanent: true },
      { source: "/en/product.html", destination: "/en/shop", permanent: true },
      { source: "/en/sepet.html", destination: "/en/cart", permanent: true },
      { source: "/en/sepet", destination: "/en/cart", permanent: true },
      { source: "/urunler", destination: "/shop", permanent: true },
      { source: "/urunler/:path*", destination: "/shop/:path*", permanent: true },
      { source: "/proje-fabrikasi", destination: "/pfos", permanent: true },
      { source: "/proje-fabrikasi/:path*", destination: "/pfos", permanent: true },
      { source: "/bar-design", destination: "/besos", permanent: true },
      { source: "/bar-design/", destination: "/besos", permanent: true },
      { source: "/bar-design.html", destination: "/besos", permanent: true },
      { source: "/en/project-factory", destination: "/en/pfos", permanent: true },
      { source: "/en/project-factory/", destination: "/en/pfos", permanent: true },
      /* Eski WordPress (GSC 404) */
      { source: "/category/:path*", destination: "/", permanent: true },
      { source: "/wp-content/:path*", destination: "/", permanent: true },
      { source: "/wp-admin/:path*", destination: "/", permanent: true },
      { source: "/wp-includes/:path*", destination: "/", permanent: true },
      { source: "/tag/:path*", destination: "/blog", permanent: true },
      { source: "/author/:path*", destination: "/", permanent: true },
      {
        source: "/endustriyel-mutfak-gastronomi-platformu-2",
        destination: "/",
        permanent: true,
      },
      { source: "/urun/:path*", destination: "/shop", permanent: true },
      { source: "/teklif-geri-bildirim", destination: "/iletisim", permanent: true },
      /* Cafemarkt şablon önizleme — statik HTML yedek (App route ile birlikte deploy) */
      {
        source: "/onizleme/cafemarkt",
        destination: "/cafemarkt-sablon.html",
        permanent: false,
      },
      {
        source: "/cafemarkt-sablon",
        destination: "/cafemarkt-sablon.html",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        /* Yerel geliştirme — CDN yokken /data/images → public/images */
        ...(cdnBase
          ? []
          : [{ source: "/data/images/:path*", destination: "/images/:path*" }]),
        /* /i18n/ bazı tarayıcı eklentilerinde engellenir — /locales/ alias */
        { source: "/locales/:file.json", destination: "/i18n/:file.json" },
        /* API birleştirme — Hobby 12 function limiti (geriye dönük URL) */
        { source: "/api/pfos/concepts", destination: "/api/pfos?action=concepts" },
        { source: "/api/pfos/konseptler", destination: "/api/pfos?action=konseptler" },
        { source: "/api/pfos/quote", destination: "/api/pfos?action=quote" },
        { source: "/api/pfos/calculate", destination: "/api/pfos?action=calculate" },
        { source: "/api/search/health", destination: "/api/search?health=1" },
        { source: "/api/yonetim/bearer-hint", destination: "/api/yonetim/bearer?action=hint" },
        { source: "/api/yonetim/bearer-check", destination: "/api/yonetim/bearer?action=check" },
        { source: "/api/urunler/meta", destination: "/api/urunler?meta=1" },
        { source: "/api/kur", destination: "/api/market?kind=kur" },
        { source: "/api/fiyatlar", destination: "/api/market?kind=fiyatlar" },
        { source: "/api/vitrin-homepage", destination: "/api/cms?kind=vitrin" },
        { source: "/api/proje-akis", destination: "/api/cms?kind=proje-akis" },
        {
          source: "/api/urunler/katalog/:index",
          destination: "/api/urunler?katalogIndex=:index",
        },
        { source: "/api/whatsapp", destination: "/api/musteriler?whatsapp=1" },
      ],
      /* public/images Vercel'de yok — diskte dosya yoksa CloudFront */
      fallback: cdnBase ? cdnAssetFallbackRewrites(cdnBase) : [],
    };
  },
};

export default nextConfig;
