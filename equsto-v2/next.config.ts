import type { NextConfig } from "next";

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
  ];
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/shop/index.html", destination: "/", permanent: true },
      { source: "/shop", destination: "/", permanent: true },
      ...deptRedirects(),
      { source: "/urunler", destination: "/shop", permanent: true },
      { source: "/urunler/:path*", destination: "/shop/:path*", permanent: true },
      { source: "/proje-fabrikasi", destination: "/pfos", permanent: true },
      { source: "/proje-fabrikasi/:path*", destination: "/pfos", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/index.html" },
      ...deptRewrites(),
      { source: "/shop/:dept/:slug", destination: "/product.html" },
      { source: "/pfos", destination: "/pfos.html" },
      { source: "/pfos/", destination: "/pfos.html" },
      { source: "/besos", destination: "/besos/index.html" },
      { source: "/besos/", destination: "/besos/index.html" },
      { source: "/bar-design", destination: "/bar-design.html" },
      { source: "/bar-design/", destination: "/bar-design.html" },
      { source: "/admin", destination: "/admin.html" },
      { source: "/admin/", destination: "/admin.html" },
      { source: "/contact", destination: "/contact.html" },
      { source: "/contact/", destination: "/contact.html" },
      { source: "/login", destination: "/login.html" },
      { source: "/login/", destination: "/login.html" },
      { source: "/marka", destination: "/marka.html" },
      { source: "/marka/", destination: "/marka.html" },
      { source: "/arama", destination: "/arama.html" },
      { source: "/arama/", destination: "/arama.html" },
      ...geoRewrites(),
    ];
  },
};

export default nextConfig;
