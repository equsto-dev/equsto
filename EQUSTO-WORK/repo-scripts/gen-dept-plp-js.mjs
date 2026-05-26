import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

let plp = readFileSync(join(pub, 'eq-pisirme-plp.js'), 'utf8');
plp = plp.replace(
  /var DEPT = 'pisirme';/,
  "var DEPT = (document.body && document.body.getAttribute('data-eq-dept')) || 'pisirme';"
);
plp = plp.replace(/EqPisirmeCmFacets/g, 'EqDeptCmFacets');
plp = plp.replace(/pisirme-plp/g, 'eq-dept-plp');
plp = plp.replace(/pisirme-filter/g, 'eq-dept-filter');
plp = plp.replace(/pisirme-cm-/g, 'eq-dept-cm-');
plp = plp.replace(/__pisirmePlpSetSort/g, '__eqDeptPlpSetSort');
plp = plp.replace(/\|\| 'pisirme'/g, '|| DEPT');
plp = plp.replace(
  "fetch('/data/dept/pisirme.json'",
  "fetch('/data/dept/' + DEPT + '.json'"
);
plp = plp.replace(
  "'Katalog yüklenemedi. npm run dev:fresh ile açın; adres: /shop/pisirme — '",
  "'Katalog yüklenemedi. npm run dev:fresh ile açın; adres: /shop/' + DEPT + ' — '"
);
plp = plp.replace(/eq-pisirme-plp/g, 'eq-dept-plp');
plp = plp.replace(
  'Departman kategori PLP',
  'Departman kategori PLP — Cafemarkt tarzı (tüm dept sayfaları)'
);
writeFileSync(join(pub, 'eq-dept-plp.js'), plp);

let facets = readFileSync(join(pub, 'eq-pisirme-cm-facets.js'), 'utf8');
facets = facets.replace(/EqPisirmeCmFacets/g, 'EqDeptCmFacets');
facets = facets.replace(/pisirme-cm-/g, 'eq-dept-cm-');
facets = facets.replace(
  'Cafemarkt pisirme-ekipmanlari tarzı',
  'Cafemarkt tarzı departman filtreleri'
);
facets = facets.replace(
  'function mount(host, opts) {\n    if (!host) return;\n    opts = opts || {};',
  `function mount(host, opts) {
    if (!host) return;
    opts = opts || {};
    var showEnergy = opts.showEnergy === true || opts.dept === 'pisirme';`
);
facets = facets.replace(
  'if (energyRows.length) {',
  'if (showEnergy && energyRows.length) {'
);
writeFileSync(join(pub, 'eq-dept-cm-facets.js'), facets);

let css = readFileSync(join(pub, 'eq-pisirme-plp.css'), 'utf8');
css = css.replace(/body\.eq-pisirme-plp/g, 'body.eq-dept-plp');
css = css.replace(/pisirme-plp/g, 'eq-dept-plp');
css = css.replace(/pisirme-filter/g, 'eq-dept-filter');
writeFileSync(join(pub, 'eq-dept-plp.css'), css);

console.log('Generated eq-dept-plp.js, eq-dept-cm-facets.js, eq-dept-plp.css');
