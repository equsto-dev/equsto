import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const all = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', 'ekipmanlar.json'), 'utf8')
);
const lc = (s) => String(s || '').toLocaleLowerCase('tr');

const filters = {
  dolap: (x) => {
    const n = lc(x.name);
    if (/buzdolab|dondurucu|soğutucu|sogutucu|davlumbaz|hood/.test(n)) return false;
    if (/\barab|tepsi arab|banket|servis arab|çöp arab/.test(n)) return false;
    if (/istif raf|portashelf|duvar raf/.test(n) && !/dolap/.test(n)) return false;
    if (/tezgah|work table/.test(n) && !/dolap/.test(n)) return false;
    return /dolap|depolama dolab|malzeme dolab|sürgü kapıl|surge kapil|gardrop/.test(n);
  },
  davlumbaz: (x) => /davlumbaz|hood|aspirat|eksoz|extractor|camlı davlumbaz|camli davlumbaz/.test(lc(x.name)),
  tasima: (x) => {
    const n = lc(x.name);
    return (
      (/palet|transpalet|forklift|kaldırıcı|lift taban|taşıma ekipman|tasima ekipman/.test(n) ||
        /un taşıma|şeker arabası|seker arabasi/.test(n)) &&
      !/\barab/.test(n)
    );
  },
  araba: (x) =>
    /\barab|arabası|arabasi|tepsi arab|banket arab|servis arab|çöp arab|gn taşıma|mobil bar|tekerlekli/.test(
      lc(x.name)
    ),
  istif: (x) => {
    const n = lc(x.name);
    return (
      (/istif raf|portashelf|duvar raf|malzeme raf|stok raf|raf sistemi/.test(n) || /\braf\b/.test(n)) &&
      !/tezgah|work table|dolap|buzdolab/.test(n)
    );
  },
};

for (const [k, f] of Object.entries(filters)) {
  console.log(k, all.filter(f).length);
}
