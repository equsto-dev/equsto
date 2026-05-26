const urls = [
  'https://equsto.com/eq-category-catalog.js',
  'https://equsto.com/eq-category-shell.js',
  'https://equsto.com/data/caglayan-market-reyon-catalogue.json',
];
for (const u of urls) {
  const r = await fetch(u + '?t=' + Date.now());
  console.log(r.status, u.replace('https://equsto.com', ''), (r.headers.get('content-length') || '?') + ' B');
}
