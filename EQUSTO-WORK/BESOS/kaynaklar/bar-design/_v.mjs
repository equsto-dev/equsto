import https from 'https';
const get = (u) => new Promise((r) => https.get(u, { rejectUnauthorized: false }, (x) => { let d = ''; x.on('data', (c) => (d += c)); x.on('end', () => r(d)); }));
const html = await get('https://equsto.com/bar-design.html');
console.log('offers', (html.match(/"offers":/g) || []).length);
console.log('products', (html.match(/"@type": "Product"/g) || []).length);
