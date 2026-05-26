import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/eq-home-mutbex.js');
let c = fs.readFileSync(p, 'utf8');
const D = 'd' + 'iv';
const needle =
  "var cartRow =\n        '<" +
  D +
  " class=\"eq-mx-prod-actions\"><button ' + cartAttrs + '>Sepete ekle</button></" +
  D +
  ">';";
const repl =
  "var cartRow =\n        '<" +
  D +
  " class=\"eq-mx-prod-actions\"><button type=\"button\" class=\"eq-mx-act\" data-eq-compare>Karşılaştır</button><button ' +\n        cartAttrs +\n        '>Sepete ekle</button></" +
  D +
  ">';";
if (!c.includes('data-eq-compare')) {
  c = c.replace(needle, repl);
  fs.writeFileSync(p, c);
  console.log('patched compare');
} else {
  console.log('already has compare');
}
