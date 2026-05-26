import https from 'https';
const get = (url) => new Promise((res, rej) => {
  https.get(url, { rejectUnauthorized: false }, (r) => {
    let d = '';
    r.on('data', (c) => (d += c));
    r.on('end', () => res(d));
  }).on('error', rej);
});
const css = await get('https://equsto.com/theme.css');
const idx = css.indexOf('hero-card-img');
console.log('first hero-card-img at', idx);
if (idx >= 0) console.log(css.slice(idx, idx + 1200));
