function eqProductSlug(row) {
  const tr = {
    'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c',
    'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'İ': 'i', 'Ö': 'o', 'Ç': 'c',
  };
  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[ğüşıöçĞÜŞİÖÇ]/g, (c) => tr[c] || c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
  const b = slugify(row.brand || row.b || '');
  const n = slugify(row.name || row.n || '');
  return (b ? b + '-' : '') + n;
}

const pathSlug =
  'ztiryakiler-end-striyel-mutfak-ztiryakiler-set-st-yar-oluklu-zgara-gazl-80x90x30-900-seri-krom-kapl-7864-n1-80903-19c';
const items = await fetch('https://equsto.com/data/dept/pisirme.json').then((r) => r.json());
console.log('items', items.length);
let found = 0;
for (const it of items) {
  if (eqProductSlug(it) === pathSlug) {
    found++;
    console.log('MATCH', it.brand, it.name.slice(0, 80));
  }
}
console.log('found', found);
if (!found) {
  const sample = items.find((it) => (it.brand || '').includes('Tiryak'));
  if (sample) console.log('sample slug', eqProductSlug(sample), sample.name.slice(0, 60));
}
