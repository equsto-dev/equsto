import https from 'https';

const testUrls = [
  'https://equsto.com/shop/pisirme/eaei-360',
  'https://equsto.com/en/shop/pisirme/eaei-360',
];

function check(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET', timeout: 15000 }, (res) => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        // Extract all JSON-LD scripts
        const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
        const jsonLds = jsonLdMatches ? jsonLdMatches.map(m => {
          const content = m.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          try {
            return JSON.parse(content);
          } catch {
            return null;
          }
        }).filter(Boolean) : [];
        
        resolve({
          url,
          jsonLds: jsonLds.map(j => JSON.stringify(j, null, 2))
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
    console.log('JSON-LD count:', r.jsonLds.length);
    r.jsonLds.forEach((j, i) => {
      console.log(`--- JSON-LD ${i+1} ---`);
      console.log(j);
    });
    console.log('');
  }
}

main();