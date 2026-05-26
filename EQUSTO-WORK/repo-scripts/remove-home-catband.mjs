import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = join(root, 'public', 'index.html');
let h = readFileSync(p, 'utf8');

const start = h.indexOf('<section class="eq-home-band eq-mx-o-5" id="eq-home-catband"');
if (start < 0) {
  console.error('catband section not found');
  process.exit(1);
}
const end = h.indexOf('</section>', start) + '</section>'.length;
h = h.slice(0, start) + h.slice(end);

h = h.replace(
  'body.eq-home #eq-home-catband,.eq-home-cm-mutbex>#eq-home-catband.eq-mx-o-5{display:block!important;visibility:visible!important}',
  ''
);
h = h.replace(
  "nav.topnav,header+nav.topnav,#eq-home-catband'",
  "nav.topnav,header+nav.topnav'"
);

writeFileSync(p, h, 'utf8');
console.log('OK: removed eq-home-catband from index.html');
