import https from 'https';

const testUrls = [
  'https://equsto.com/shop/pisirme',
  'https://equsto.com/en/shop/pisirme',
  'https://equsto.com/shop/marka/rational',
  'https://equsto.com/en/shop/marka/rational',
  'https://equsto.com/shop/marka/brema',
  'https://equsto.com/en/shop/marka/brema',
];

async function checkContent(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET', timeout: 15000 }, (res) => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        const canonMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
        resolve({
          url,
          status: 200,
          hasJsonLd: html.includes('application/ld+json'),
          hasHreflang: html.includes('hreflang'),
          canonical: canonMatch ? canonMatch[1] : 'NOT FOUND'
        });
      });
    });
    req.on('error', e => resolve({url, status:'ERROR', error:e.message}));
    req.on('timeout', () => { req.destroy(); resolve({url, status:'TIMEOUT'}); });
    req.end();
  });
}

async function main() {
  const testUrls = [
    'https://equsto.com/shop/pisirme',
    'https://equsto.com/en/shop/pisirme',
    'https://equsto.com/shop/marka/rational',
    'https://equsto.com/en/shop/marka/rational',
    'https://equsto.com/shop/marka/brema',
    'https://equsto.com/en/shop/marka/brema',
  ];
  
  for (const u of testUrls) {
    const r = await checkContent(u);
    console.log('URL:', r.url);
    console.log('  Status:', r.status);
    console.log('  Canonical:', r.canonical);
    console.log('  Has JSON-LD:', r.hasJsonLd);
    console.log('  Has Hreflang:', r.hasHreflang);
    console.log('');
  }
}

main();