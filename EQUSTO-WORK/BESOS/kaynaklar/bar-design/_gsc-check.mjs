import https from 'https';
const get = (url) => new Promise((res, rej) => {
  https.get(url, { rejectUnauthorized: false }, (r) => {
    let d = '';
    r.on('data', (c) => (d += c));
    r.on('end', () => res(d));
  }).on('error', rej);
});
const urls = [
  'https://equsto.com/product.html?slug=oztiryakiler-tag-270-nmv-cift-kapili-tezgah-tipi-buzdolabi',
  'https://equsto.com/urun/oztiryakiler-tag-270-nmv-cift-kapili-tezgah-tipi-buzdolabi.html',
  'https://equsto.com/bar-design.html',
  'https://equsto.com/besos',
];
for (const u of urls) {
  const html = await get(u);
  const hasMerchant = html.includes('eq-merchant-schema');
  const hasReviews = html.includes('eq-product-reviews');
  const ld = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  let products = 0, withOffers = 0, withReview = 0, withAR = 0;
  for (const block of ld) {
    try {
      const j = JSON.parse(block.trim());
      const walk = (o) => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (o['@type'] === 'Product') {
          products++;
          if (o.offers) withOffers++;
          if (o.review) withReview++;
          if (o.aggregateRating) withAR++;
        }
        Object.values(o).forEach(walk);
      };
      walk(j);
    } catch {}
  }
  console.log('\n', u);
  console.log('  merchant-js', hasMerchant, 'reviews-js', hasReviews);
  console.log('  products', products, 'offers', withOffers, 'review', withReview, 'aggregateRating', withAR);
}
