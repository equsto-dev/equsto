import { parseStringPromise } from 'xml2js';
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://equsto.com/sitemap-pages.xml</loc>
    <lastmod>2026-09-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://equsto.com/sitemap-shop-hubs.xml</loc>
    <lastmod>2026-09-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://equsto.com/sitemap-shop-en-hubs.xml</loc>
    <lastmod>2026-09-01</lastmod>
  </sitemap>
</sitemapindex>`;
parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true }).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(console.error);