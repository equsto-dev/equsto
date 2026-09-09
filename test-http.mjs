import https from 'https';

const testUrls = [
  'https://equsto.com/shop/pisirme/eaei-360',
  'https://equsto.com/shop/pisirme/9890-icproxs-00',
  'https://equsto.com/shop/sogutma/710050',
  'https://equsto.com/shop/araba/adk-10-2',
  'https://equsto.com/shop/marka/rational',
  'https://equsto.com/shop/marka/atalay',
  'https://equsto.com/shop/marka/electrolux',
  'https://equsto.com/',
  'https://equsto.com/shop',
  'https://equsto.com/pfos',
];

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      let status = res.statusCode;
      let redirectChain = [];
      let finalUrl = url;
      let currentUrl = url;
      
      if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
        const loc = res.headers.location;
        redirectChain.push(loc);
        try {
          currentUrl = new URL(loc, currentUrl).toString();
        } catch {
          currentUrl = loc;
        }
        finalUrl = currentUrl;
      }
      
      const getReq = https.request(finalUrl, { method: 'GET', timeout: 15000 }, (getRes) => {
        let html = '';
        getRes.on('data', chunk => html += chunk);
        getRes.on('end', () => {
          let canonical = '';
          const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
          if (canonicalMatch) canonical = canonicalMatch[1];
          let metaRobots = '';
          const metaMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
          if (metaMatch) metaRobots = metaMatch[1].toLowerCase();
          resolve({ url, status, finalUrl, redirectChain: redirectChain.join(' -> '), canonical, metaRobots, contentType: getRes.headers['content-type'] });
        });
      });
      getReq.on('error', (e) => resolve({ url, status: 'ERROR', error: e.message }));
      getReq.on('timeout', () => { getReq.destroy(); resolve({ url, status: 'TIMEOUT' }); });
      getReq.end();
    });
    req.on('error', (e) => resolve({ url, status: 'ERROR', error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 'TIMEOUT' }); });
    req.end();
  });
}

async function main() {
  for (const u of testUrls) {
    const r = await checkUrl(u);
    console.log('STATUS:', r.status, '| URL:', r.url, '| FINAL:', r.finalUrl, '| CANONICAL:', r.canonical ? 'YES' : 'NO', '| META:', r.metaRobots || 'none');
    if (r.canonical) console.log('  Canonical:', r.canonical);
  }
}

main();