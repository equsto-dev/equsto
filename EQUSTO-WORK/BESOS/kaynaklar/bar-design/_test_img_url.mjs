const paths = [
  'images\\öztiryakiler-gn-1200-lmv-çift-kapılı-dik-tip-derin-dondurucu-k-tip-79k412lmv00_1.jpg',
  'images\\coldera-177-l-blok-kapaklı-derin-dondurucu-cl-200-dsl-a_1.png',
  'images\\csa-tezgah-tipi-derin-dondurucu-2-kapılı-251-l-141x60x85-cm-cstek2d600_1.png',
  './data/images/öztiryakiler-gn-600-nmv-tek-kapılı-dik-tip-buzdolabı-k-tip-79k406nmv00_1.jpg',
];

function encodeDataRelPath(rel) {
  return String(rel || '')
    .split('/')
    .map((seg) => (seg ? encodeURIComponent(seg) : ''))
    .join('/');
}

function equstoDataAssetHref(p) {
  if (p == null || p === '') return '';
  const s = String(p).replace(/\\/g, '/').replace(/^\.\//, '');
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === '/') return s;
  const rel = encodeDataRelPath(s.replace(/^data\//, ''));
  return '/data/' + rel;
}

function eqAttrPath(p) {
  if (p == null || p === '') return '';
  const s = String(p).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === '/') return s;
  if (s.indexOf('./') === 0 || s.indexOf('../') === 0) return s;
  return '/' + s;
}

const base = 'http://127.0.0.1:5174';
for (const p of paths) {
  const href = equstoDataAssetHref(p);
  const bad = eqAttrPath(p);
  const url = base + href;
  try {
    const r = await fetch(url, { method: 'HEAD' });
    console.log(r.status, 'OK', href.slice(0, 80) + '...');
  } catch (e) {
    console.log('ERR', e.message, href.slice(0, 80));
  }
  console.log('  eqAttrPath(bad):', bad.slice(0, 60));
}
