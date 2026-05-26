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

function legacySlug(row) {
  const lc = (s) => String(s || '').toLocaleLowerCase('tr');
  const name = lc(row.name || row.n).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const brand = lc(row.brand || row.b).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return (brand ? brand + '-' : '') + name;
}

const pathSlug =
  'ztiryakiler-end-striyel-mutfak-ztiryakiler-set-st-yar-oluklu-zgara-gazl-80x90x30-900-seri-krom-kapl-7864-n1-80903-19c';
const items = await fetch('https://equsto.com/data/dept/pisirme.json').then((r) => r.json());
let leg = 0,
  neu = 0;
for (const it of items) {
  if (legacySlug(it) === pathSlug) leg++;
  if (eqProductSlug(it) === pathSlug) neu++;
}
console.log({ legacyMatch: leg, newMatch: neu, pathSlug });
