import fs from 'fs';
const p = new URL('../public/eq-shop-vitrin.js', import.meta.url);
const t = 'd' + 'iv';
let c = fs.readFileSync(p, 'utf8');
c = c.split('<motion ').join('<' + t + ' ').split('</motion>').join('</' + t + '>');
c = c.replace(
  /      return base\.replace\([\s\S]*?\n      \}\);/,
  `      var idx = base.lastIndexOf('</${t}></a>');\n      if (idx < 0) return base;\n      return base.slice(0, idx) + extra + base.slice(idx);`,
);
fs.writeFileSync(p, c);
console.log('shop vitrin ok');
