import https from 'https';
const get = (url) => new Promise((res, rej) => {
  https.get(url, { rejectUnauthorized: false }, (r) => {
    let d = '';
    r.on('data', (c) => (d += c));
    r.on('end', () => res(d));
  }).on('error', rej);
});
const home = await get('https://equsto.com/');
const css = await get('https://equsto.com/theme.css?v=20260520yerbufe');
console.log('index theme v', (home.match(/theme\.css\?v=([^"']+)/) || [])[1]);
console.log('css yer-bufe', css.includes('hero-card-img--yer-bufe'));
console.log('css cover important', css.includes('object-fit: cover !important'));
console.log('index inline yer', home.includes('hero-card-img--yer-bufe{position:absolute'));
