import type { NextConfig } from "next";
import path from "path";

/** Departman PLP — /shop/{slug} → {slug}.html (public/) */
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
  "market-reyonlari": "/market-reyonlari.html",
};

function deptRewrites() {
  return Object.entries(DEPT_HTML).map(([slug, file]) => ({
    source: `/shop/${slug}`,
    destination: file,
  }));
}

function deptRedirects() {
  return Object.entries(DEPT_HTML).map(([slug, file]) => ({
    source: file,
    destination: `/shop/${slug}`,
    permanent: true,
  }));
}

/** SEO rehber / proje sayfaları — geo-landing.html + eq-geo-landing.js */
const GEO_SLUGS = [
  "steakhouse-kurulumu",
  "bulut-mutfak-kurulumu",
  "cafe-kurulumu",
  "catering-mutfagi",
  "fine-dining-kurulumu",
  "all-day-dining-kurulumu",
  "fast-food-kurulumu",
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

function geoRewrites() {
  const base = GEO_SLUGS.map((slug) => ({
    source: `/${slug}`,
    destination: "/geo-landing.html",
  }));
  return [
    ...base,
    { source: "/projeler", destination: "/geo-landing.html" },
    { source: "/projeler/:slug", destination: "/geo-landing.html" },
    { source: "/rehber/:slug", destination: "/geo-landing.html" },
    { source: "/en/industrial-kitchen-supplier-turkey", destination: "/geo-landing.html" },
    { source: "/en/commercial-kitchen-quotation", destination: "/geo-landing.html" },
  ];
}

/** Vercel lambda 250MB — public görseller/katalog trace dışı (runtime CDN/fs fetch) */
const traceExcludes = [
  "./public/images/**",
  "./public/assets/**",
  "./public/**/*.html",
  "./public/data/dept/**",
  "./public/data/vitrum-drawings/**",
  "./public/data/advanced-cuisine-clear-ice/**",
  "./public/data/ekipmanlar.json",
  "./public/data/ekipmanlar-full-archive.json",
  "./public/data/*.json",
  "./scripts/**",
  "./**/*.md",
  "./**/*.pdf",
  "./**/*.py",
];

const nextConfig: NextConfig = {
  /* Monorepo kökü (EQUSTO-WORK) — ../../.. disk üstüne çıkar, build kırılır */
  outputFileTracingRoot: path.join(__dirname, "../.."),
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "meilisearch",
  ],
  outputFileTracingExcludes: {
    "*": traceExcludes,
    "/api/*": traceExcludes,
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
      { source: "/:path*.html", headers: [utf8Html] },
      { source: "/", headers: [utf8Html] },
      { source: "/pfos", headers: [utf8Html] },
      { source: "/pfos/:path*", headers: [utf8Html] },
      { source: "/besos", headers: [utf8Html] },
      { source: "/besos/:path*", headers: [utf8Html] },
      { source: "/bar-design", headers: [utf8Html] },
      { source: "/admin", headers: [utf8Html] },
      { source: "/contact", headers: [utf8Html] },
      { source: "/besos/imt300", headers: [utf8Html] },
      { source: "/besos/imt300/:path*", headers: [utf8Html] },
      { source: "/login", headers: [utf8Html] },
      { source: "/marka", headers: [utf8Html] },
      { source: "/arama", headers: [utf8Html] },
      { source: "/shop/:dept", headers: [utf8Html] },
      { source: "/i18n/:file.json", headers: [utf8Json] },
      {
        source: "/data/:path*",
        headers: [
          utf8Json,
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/shop/index.html", destination: "/", permanent: true },
      { source: "/shop", destination: "/", permanent: true },
      { source: "/shop/:dept.html", destination: "/shop/:dept", permanent: true },
      ...deptRedirects(),
      { source: "/urunler", destination: "/shop", permanent: true },
      { source: "/urunler/:path*", destination: "/shop/:path*", permanent: true },
      { source: "/proje-fabrikasi", destination: "/pfos", permanent: true },
      { source: "/proje-fabrikasi/:path*", destination: "/pfos", permanent: true },
      { source: "/bar-design", destination: "/besos", permanent: true },
      { source: "/bar-design/", destination: "/besos", permanent: true },
      { source: "/bar-design.html", destination: "/besos", permanent: true },
      { source: "/imt300", destination: "/besos/imt300", permanent: true },
      { source: "/imt300/", destination: "/besos/imt300", permanent: true },
      { source: "/market-reyonlari.html", destination: "/shop/market-reyonlari", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/arama", destination: "/arama.html" },
        { source: "/arama/", destination: "/arama.html" },
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
        { source: "/besos/imt300", destination: "/imt300.html" },
        { source: "/besos/imt300/", destination: "/imt300.html" },
      ],
      afterFiles: [
      { source: "/", destination: "/index.html" },
      ...deptRewrites(),
      { source: "/shop/:dept/:slug", destination: "/product.html" },
      { source: "/pfos", destination: "/pfos.html" },
      { source: "/pfos/", destination: "/pfos.html" },
      { source: "/besos/modul/:slug", destination: "/bar-module.html" },
      { source: "/besos/modul/:slug/", destination: "/bar-module.html" },
      { source: "/admin", destination: "/admin.html" },
      { source: "/admin/", destination: "/admin.html" },
      /* /yonetim → Next.js App Router (Ant Design Pro) */
      { source: "/contact", destination: "/contact.html" },
      { source: "/contact/", destination: "/contact.html" },
      { source: "/buradan-basladi", destination: "/buradan-basladi.html" },
      { source: "/buradan-basladi/", destination: "/buradan-basladi.html" },
      { source: "/hakkimizda", destination: "/hakkimizda.html" },
      { source: "/hakkimizda/", destination: "/hakkimizda.html" },
      { source: "/login", destination: "/login.html" },
      { source: "/login/", destination: "/login.html" },
      { source: "/marka", destination: "/marka.html" },
      { source: "/marka/", destination: "/marka.html" },
      ...geoRewrites(),
      ],
    };
  },
};

export default nextConfig;
