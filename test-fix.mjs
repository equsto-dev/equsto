import https from 'https';

const testUrls = [
  // TR PDP
  'https://equsto.com/shop/pisirme/eaei-360',
  // EN PDP
  'https://equsto.com/en/shop/pisirme/eaei-360',
  // TR Marka
  'https://equsto.com/shop/marka/rational',
  // EN Marka
  'https://equsto.com/en/shop/marka/rational',
];

function check(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET', timeout: 15000 }, (res) => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        // Check breadcrumb links
        const breadcrumbMatches = html.match(/<div class="breadcrumb"[^>]*>([\s\S]*?)<\/div>/gi);
        // Check JSON-LD
        const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
        // Check hreflang
        const hreflangMatches = html.match(/<link rel="alternate" hreflang=[^>]*>/gi);
        // Check canonical
        const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
        // Check for ?tip= in JSON-LD
        const tipInJsonLd = jsonLdMatches ? JSON.stringify(jsonLdMatches).includes('?tip=') : false;
        
        resolve({
          url,
          status: res.statusCode,
          breadcrumbHtml: breadcrumbMatches ? breadcrumbMatches[0].substring(0, 500) : 'NOT FOUND',
          jsonLdCount: jsonLdMatches ? jsonLdMatches.length : 0,
          hasTipInJsonLd: tipInJsonLd,
          canonical: canonicalMatch ? canonicalMatch[1] : 'NOT FOUND',
          hreflangCount: hreflangMatches ? hreflangMatches.length : 0,
          hreflangSample: hreflangMatches ? hreflangMatches.slice(0, 4) : []
        });
      });
    });
    req.on('error', e => resolve({url, status:'ERROR', error:e.message}));
    req.on('timeout', () => { req.destroy(); resolve({url, status:'TIMEOUT'}); });
    req.end();
  });
}

async function main() {
  for (const u of testUrls) {
    const r = await check(u);
    console.log('========================================');
    console.log('URL:', r.url);
    console.log('Status:', r.status);
    console.log('Canonical:', r.canonical);
    console.log('Hreflang count:', r.hreflangCount);
    console.log('Hreflang sample:', r.hreflangSample);
    console.log('JSON-LD count:', r.jsonLdCount);
    console.log('Has ?tip= in JSON-LD:', r.hasTipInJsonLd);
    console.log('Breadcrumb HTML (sample):', r.breadcrumbHtml);
    console.log('');
  }
}

main();