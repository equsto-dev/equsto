import https from 'https';

const urls = [
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

function check(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      let status = res.statusCode;
      let finalUrl = url;
      if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
        try { finalUrl = new URL(res.headers.location, url).toString(); } catch { finalUrl = res.headers.location; }
      }
      const getReq = https.request(finalUrl, { method: 'GET', timeout: 15000 }, (getRes) => {
        let html = '';
        getRes.on('data', c => html += c);
        getRes.on('end', () => {
          let canon = '';
          const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
          if (m) canon = m[1];
          let meta = '';
          const mr = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
          if (mr) meta = mr[1].toLowerCase();
          resolve({url, status, finalUrl, canonical: canon, metaRobots: meta, contentType: getRes.headers['content-type']});
        });
      });
      getReq.on('error', e => resolve({url, status:'ERROR', error:e.message}));
      getReq.on('timeout', () => { getReq.destroy(); resolve({url, status:'TIMEOUT'}); });
      getReq.end();
    });
    req.on('error', e => resolve({url, status:'ERROR', error:e.message}));
    req.on('timeout', () => { req.destroy(); resolve({url, status:'TIMEOUT'}); });
    req.end();
  });
}

async function main() {
  for (const u of urls) {
    const r = await check(u);
    console.log(r.status, r.url, '->', r.finalUrl, '| canon:', r.canonical || 'none', '| meta:', r.metaRobots || 'none');
  }
}

main();