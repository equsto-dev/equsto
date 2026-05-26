import fs from 'fs';
const p = new URL('../public/admin-vitrin.js', import.meta.url);
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  'Görünürlük (Mutbex / Equsto)</span></motion></motion><motion class="card-bd"',
  'Görünürlük (Mutbex / Equsto)</span></motion><motion class="card-bd"',
);
c = c.replace(
  'Görünürlük (Mutbex / Equsto)</span></motion></motion><motion ',
  'Görünürlük (Mutbex / Equsto)</span></motion><motion ',
);
c = c.replace(
  'Görünürlük (Mutbex / Equsto)</span></motion></motion><motion ',
  'Görünürlük (Mutbex / Equsto)</span></motion><motion ',
);
const D = 'd' + 'iv';
c = c.replace(
  `Görünürlük (Mutbex / Equsto)</span></${D}></${D}><${D} class="card-bd"`,
  `Görünürlük (Mutbex / Equsto)</span></${D}><${D} class="card-bd"`,
);
fs.writeFileSync(p, c);
console.log('card structure fixed');
