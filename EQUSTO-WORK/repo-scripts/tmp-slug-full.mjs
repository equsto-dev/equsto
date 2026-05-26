function legacySlug(row) {
  const lc = (s) => String(s || '').toLocaleLowerCase('tr');
  const name = lc(row.name || row.n)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  const brand = lc(row.brand || row.b)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  return (brand ? brand + '-' : '') + name;
}

const pathSlug =
  'ztiryakiler-end-striyel-mutfak-ztiryakiler-set-st-yar-oluklu-zgara-gazl-80x90x30-900-seri-krom-kapl-7864-n1-80903-19c';
console.log('fetching ekipmanlar (may take)...');
const items = await fetch('https://equsto.com/data/ekipmanlar.json').then((r) => r.json());
const arr = Array.isArray(items) ? items : items.items || [];
let n = 0;
for (const it of arr) {
  if (legacySlug(it) === pathSlug) n++;
}
console.log({ total: arr.length, legacyMatch: n });
