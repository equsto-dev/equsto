/**
 * Ana sayfa AEO: UTF-8 meta/schema, Service + FAQ JSON-LD, görünür answer capsule.
 *   node scripts/patch-index-aeo.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  path.join(ROOT, "public/index.html"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/index.html"),
];

const REPL = [
  ["ï»¿", ""],
  ["Equsto â€”", "Equsto —"],
  ["Equsto Â·", "Equsto ·"],
  ["EndÃ¼striyel", "Endüstriyel"],
  ["Ã‡Ã¶zÃ¼mleri", "Çözümleri"],
  ["Ã§Ã¶zÃ¼mleri", "çözümleri"],
  ["iÃ§in", "için"],
  ["iÃ§ecek", "içecek"],
  ["ekipmanlarÄ±", "ekipmanları"],
  ["ekipmanÄ±", "ekipmanı"],
  ["piÅŸirme", "pişirme"],
  ["soÄŸutma", "soğutma"],
  ["yÄ±kama", "yıkama"],
  ["MÃ¼hendisliÄŸi", "Mühendisliği"],
  ["mÃ¼hendisliÄŸi", "mühendisliği"],
  ["Ã–ztiryakiler", "Öztiryakiler"],
  ["FabrikasÄ±", "Fabrikası"],
  ["anÄ±nda", "anında"],
  ["anlÄ±k", "anlık"],
  ["tasarÄ±mÄ±", "tasarımı"],
  ["tedariÄŸi", "tedariki"],
  ["SatÄ±ÅŸ", "Satış"],
  ["DÃœNYADA BÄ°R Ä°LK", "DÜNYADA BİR İLK"],
  ["modÃ¼l", "modül"],
  ["seÃ§imi", "seçimi"],
  ["TÃ¼rkiye", "Türkiye"],
  ["bÃ¶lgeleri", "bölgeleri"],
  ["planÄ±", "planı"],
  ["BeÅŸ", "Beş"],
  ["yapÄ±lÄ±r", "yapılır"],
  ["AdÄ±m", "Adım"],
  ["baÅŸlat", "başlat"],
  ["Ã‡Ã¶zÃ¼mleri", "Çözümleri"],
  ["Proje Ã‡Ã¶zÃ¼mleri", "Proje Çözümleri"],
  ["aÃ§Ä±k", "açık"],
  ["bÃ¼fe", "büfe"],
  ["dÃ¼zeni", "düzeni"],
  ["hatlarÄ±", "hatları"],
  ["Ã§ok yakÄ±nda", "çok yakında"],
  ["SofrasÄ±", "Sofrası"],
  ["reklamlarÄ±", "reklamları"],
  ["Ã¶rnek", "örnek"],
  ["â€”", "—"],
  ["â†'", "→"],
  ["Â·", "·"],
  ["seÃ§imi", "seçimi"],
  ["seÃ§im", "seçim"],
  ["hazÄ±rlanÄ±r", "hazırlanır"],
  ["iÃ§inde", "içinde"],
];

const META_TITLE = "Equsto — Endüstriyel Mutfak ve Gastronomi Çözümleri";
const META_DESC =
  "Restoran, hotel, cafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanları: pişirme, soğutma, yıkama, hazırlık, kahve ve içecek. Proje Fabrikası ile anında teklif; Bar Design Studio · Besos.";

const CAPSULE = `        <p class="hero-lead eq-aeo-capsule" data-i18n="home.aeo_capsule">Equsto, restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanı seçimi, kapasite ve marka danışmanlığı sunar. Proje Fabrikası ile ekipman listenizi oluşturur, teklifinizi 24 saat içinde hazırlarız.</p>`;

const SERVICE_FAQ = [
  {
    "@type": "Service",
    "@id": "https://equsto.com/#industrial-kitchen-planning-service",
    "name": "Profesyonel Mutfak Planlama Hizmeti",
    "description":
      "Equsto, restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanları seçimi, kapasite belirleme ve marka seçimi dahil profesyonel mutfak planlama hizmetleri sunar. Teklifler 24 saat içinde hazırlanır.",
    "provider": { "@id": "https://equsto.com/#organization" },
    "serviceType": "Endüstriyel Mutfak Tasarımı ve Danışmanlığı",
    "areaServed": ["TR", "AE", "QA", "SA", "AZ", "KZ", "UZ", "AL", "RO", "BG"],
    "url": "https://equsto.com/pfos.html",
  },
  {
    "@type": "FAQPage",
    "@id": "https://equsto.com/#faq",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Equsto nedir?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Equsto, Türkiye merkezli endüstriyel mutfak ve gastronomi platformudur; pişirme, soğutma, yıkama, hazırlık, kahve ve içecek ekipmanları ile Proje Fabrikası üzerinden hızlı teklif sunar.",
        },
      },
      {
        "@type": "Question",
        "name": "Mutfak projesi teklifi ne kadar sürede hazırlanır?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Proje Fabrikası ile oluşturulan ekipman listeleri için teklifler genellikle 24 saat içinde hazırlanır.",
        },
      },
      {
        "@type": "Question",
        "name": "Hangi markaların ürünleri satılıyor?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Katalogda Öztiryakiler, Atalay ve seçili endüstriyel mutfak markaları yer alır; departman bazlı profesyonel fiyatlandırma uygulanır.",
        },
      },
    ],
  },
];

const ORG_DESC =
  "Endüstriyel mutfak ve gastronomi platformu. Restoran, hotel, cafe ve bulut mutfak projeleri için pişirme, soğutma, yıkama, hazırlık, kahve ve içecek ekipmanları; Proje Fabrikası ile anında teklif; Bar Design Studio · Besos ile sahaya inen bar hatları.";

function patchJsonLd(html) {
  return html.replace(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
    (full, json) => {
      try {
        const data = JSON.parse(json);
        const graph = data["@graph"] || [];
        const org = graph.find((n) => n["@type"] === "Organization");
        if (org) {
          org.description = ORG_DESC;
          org.knowsAbout = [
            "Endüstriyel mutfak tasarımı",
            "Gastronomi tasarımı",
            "Satış mühendisliği",
            "Bulut mutfak kurulumu",
            "Bar design studio",
            "Restoran mutfak projesi",
            "Catering ekipman tedariki",
            "Hijyen ve gıda güvenliği",
            "Enerji verimliliği çözümleri",
          ];
        }
        const site = graph.find((n) => n["@type"] === "WebSite");
        if (site) site.description = "Endüstriyel Mutfak ve Gastronomi Çözümleri";
        const wp = graph.find((n) => n["@type"] === "WebPage");
        if (wp) {
          wp.name = "Equsto — Endüstriyel Mutfak ve Gastronomi Çözümleri";
          wp.dateModified = "2026-05-26";
        }
        const have = new Set(graph.map((n) => n["@id"]));
        for (const node of SERVICE_FAQ) {
          if (!have.has(node["@id"])) graph.push(node);
        }
        data["@graph"] = graph;
        return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
      } catch {
        return full;
      }
    },
  );
}

function patchFile(fp) {
  if (!fs.existsSync(fp)) {
    console.log("[skip]", fp);
    return;
  }
  let html = fs.readFileSync(fp, "utf8");
  for (const [a, b] of REPL) html = html.split(a).join(b);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${META_TITLE}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${META_DESC}">`,
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${META_TITLE}">`,
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${META_DESC}">`,
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${META_TITLE}">`,
  );
  html = patchJsonLd(html);
  if (!html.includes("eq-aeo-capsule")) {
    html = html.replace(
      /<p class="eq-sr-only">[\s\S]*?<\/p>\s*<\/div>\s*<section class="hero eq-home-hero-ads"/,
      (m) => m.replace("</div>\n      <section", `${CAPSULE}\n      </div>\n      <section`),
    );
  }
  // hero-lead mobilde gizli — masaüstünde göster
  html = html.replace(
    /\.hero-lead\{display:none;\}/,
    ".hero-lead.eq-aeo-capsule{display:block;}",
  );
  fs.writeFileSync(fp, html, "utf8");
  console.log("[ok]", fp);
}

const ROBOTS = `User-agent: *
Allow: /

Sitemap: https://equsto.com/sitemap.xml
`;

const HAKKIMIZDA = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hakkımızda — Equsto</title>
<meta name="description" content="Equsto Teknoloji: Türkiye merkezli endüstriyel mutfak ve gastronomi platformu. Proje Fabrikası, satış mühendisliği ve marka tedariki.">
<link rel="canonical" href="https://equsto.com/hakkimizda.html">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"AboutPage","name":"Hakkımızda","url":"https://equsto.com/hakkimizda.html","mainEntity":{"@id":"https://equsto.com/#organization"}}
</script>
<link rel="stylesheet" href="/theme.css">
</head>
<body class="eq-shop">
<script src="/nav.js"></script>
<main class="pg" style="max-width:48rem;margin:2rem auto;padding:0 1rem;line-height:1.6">
<h1>Hakkımızda</h1>
<p>Equsto, restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanı tedariki ve proje danışmanlığı sunan Türkiye merkezli bir platformdur.</p>
<p><strong>Proje Fabrikası (PFOS)</strong> ile kapasite, marka ve ekipman listesi oluşturulur; teklifler 24 saat içinde hazırlanır. <strong>Bar Design Studio · Besos</strong> modüler bar ve buz çözümleri sunar.</p>
<h2>Uzmanlık alanlarımız</h2>
<ul>
<li>Endüstriyel mutfak ekipmanı tedariki (pişirme, soğutma, yıkama, hazırlık)</li>
<li>Mutfak proje yönetimi ve satış mühendisliği</li>
<li>Soğuk oda ve derin dondurma çözümleri</li>
<li>Kahve ve içecek ekipmanları</li>
</ul>
<p><a href="/contact.html">İletişim</a> · <a href="/pfos.html">Proje Fabrikası</a></p>
</main>
</body>
</html>
`;

for (const f of TARGETS) patchFile(f);

for (const pub of [
  path.join(ROOT, "public"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public"),
]) {
  if (!fs.existsSync(pub)) continue;
  fs.writeFileSync(path.join(pub, "robots.txt"), ROBOTS, "utf8");
  fs.writeFileSync(path.join(pub, "hakkimizda.html"), HAKKIMIZDA, "utf8");
  console.log("[ok] robots + hakkimizda", pub);
}
