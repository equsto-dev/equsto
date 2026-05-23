import https from 'https';
const get = (url) => new Promise((res, rej) => {
  https.get(url, { rejectUnauthorized: false }, (r) => {
    let d = '';
    r.on('data', (c) => (d += c));
    r.on('end', () => res({ status: r.statusCode, d }));
  }).on('error', rej);
});
const home = await get('https://equsto.com/');
const css = await get('https://equsto.com/theme.css');
console.log('home has yer-bufe', home.d.includes('hero-card-img--yer-bufe'));
console.log('home has img path', home.d.includes('hero-yer-sofrasi-bufe'));
console.log('css has yer-bufe rule', css.d.includes('hero-card-img--yer-bufe'));
console.log('css has cover !important', css.d.includes('object-fit: cover !important'));
const m = home.d.match(/theme\.css\?v=([^"']+)/);
console.log('theme cache', m?.[1]);
