import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'market-reyonlari.html');
let h = fs.readFileSync(p, 'utf8');

h = h.replace(
  /<div class="topnav-item active" data-i18n="nav\.sogutma">Soğutma Ekipmanları<\/div>\s*<span class="topnav-sep"[^>]*>\|<\/span>/,
  '<motion class="topnav-item" onclick="typeof eqGo===\'function\'?eqGo(\'sogutma\'):location.href=\'/sogutma.html\'" data-i18n="nav.sogutma">Soğutma Ekipmanları</div>\n      <span class="topnav-sep" aria-hidden="true">|</span>\n      <div class="topnav-item active">Market Reyonları</div>\n      <span class="topnav-sep" aria-hidden="true">|</span>'
);

h = h.replace(/<motion /g, '<div ').replace(/<\/motion>/g, '</div>');

fs.writeFileSync(p, h);
console.log('patched', p);
