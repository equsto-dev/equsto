import https from 'https';

const skus = [
  '9890-icproxs-00', '9890-icpro61-e0', '9890-icpro61-0g', '9890-icpro62-e0', '9890-icpro62-g0',
  '9890-icpro10-1e', '9890-icpro10-1g', '9890-icpro10-2e', '9890-icpro10-2g',
  '9890-icpro20-1e', '9890-icpro20-1g', '9890-icpro20-2e', '9890-icpro20-2g',
  '9890-icclsxs-00', '9890-iccls61-e0', '9890-iccls61-0g', '9890-iccls62-e0', '9890-iccls62-g0',
  '9890-iccls10-1e', '9890-iccls10-1g', '9890-iccls10-2e', '9890-iccls10-2g',
  '9890-iccls20-1e', '9890-iccls20-1g', '9890-iccls20-2e', '9890-iccls20-2g',
  '9890-ivario2xs-00', '9890-ivario2s-00', '9890-ivario2sp-00', '9890-ivariol-00',
  '9890-ivariolp-00', '9890-ivarioxl-00', '9890-ivarioxlp-00'
];

async function checkUrl(sku) {
  return new Promise((resolve) => {
    https.get(`https://equsto.com/shop/pisirme/${sku}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ sku, status: res.statusCode, hasRational: data.includes('RATIONAL') });
      });
    }).on('error', e => resolve({ sku, status: 'error', error: e.message }));
  });
}

async function main() {
  let found = 0;
  for (const sku of skus) {
    const result = await checkUrl(sku);
    if (result.status === 200 && result.hasRational) {
      console.log(`✓ ${sku}`);
      found++;
    } else {
      console.log(`✗ ${sku} (status: ${result.status})`);
    }
  }
  console.log(`\nTotal found: ${found}/${skus.length}`);
}

main();