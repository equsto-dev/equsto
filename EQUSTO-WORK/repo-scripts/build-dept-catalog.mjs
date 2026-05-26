/**
 * Departman PLP için hafif JSON: public/data/dept/{dept}.json
 * Kaynak: public/data/ekipmanlar.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sortCatalogItems } from './dept-plp-rank.mjs';
import { getDeptSlugLists } from './lib/catalog-classify.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public', 'data', 'ekipmanlar.json');
const outDir = join(root, 'public', 'data', 'dept');

const slugLists = getDeptSlugLists();

const DEPTS = {
  pisirme: {
    filter(x) {
      if (!x || x.dept !== 'pisirme') return false;
      const set = new Set(slugLists.pisirme);
      return set.has(x.category);
    },
  },
  sogutma: { slugs: slugLists.sogutma },
  kahve: { slugs: slugLists.kahve },
  yikama: { slugs: slugLists.yikama },
  hazirlik: { slugs: slugLists.hazirlik },
  icecek: { slugs: slugLists.icecek },
  /** paslanmaz-urunler içinden çalışma tezgahı / evye (davlumbaz, araba, raf hariç) */
  tezgah: {
    filter(x) {
      if (!x || x.category !== 'paslanmaz-urunler') return false;
      const n = String(x.name || '').toLocaleLowerCase('tr');
      if (/davlumbaz|hood|aspirat|servis arab|banket|tepsi arab|raf\b|stok|dolap/.test(n)) return false;
      return /tezgah|work table|çalışma tezgah|evye|sink|lavabo/.test(n);
    },
  },
  dolap: {
    filter(x) {
      const n = String(x.name || '').toLocaleLowerCase('tr');
      if (/buzdolab|dondurucu|soğutucu|sogutucu|davlumbaz|hood/.test(n)) return false;
      if (/\barab|tepsi arab|banket|servis arab|çöp arab/.test(n)) return false;
      if (/istif raf|portashelf|duvar raf/.test(n) && !/dolap/.test(n)) return false;
      if (/tezgah|work table/.test(n) && !/dolap/.test(n)) return false;
      return /dolap|depolama dolab|malzeme dolab|sürgü kapıl|surge kapil|gardrop/.test(n);
    },
  },
  davlumbaz: {
    filter(x) {
      const n = String(x.name || '').toLocaleLowerCase('tr');
      return /davlumbaz|hood|aspirat|eksoz|extractor|camlı davlumbaz|camli davlumbaz/.test(n);
    },
  },
  tasima: {
    filter(x) {
      const n = String(x.name || '').toLocaleLowerCase('tr');
      return (
        (/palet|transpalet|forklift|kaldırıcı|lift taban|taşıma ekipman|tasima ekipman/.test(n) ||
          /un taşıma|şeker arabası|seker arabasi/.test(n)) &&
        !/\barab/.test(n)
      );
    },
  },
  araba: {
    filter(x) {
      const n = String(x.name || '').toLocaleLowerCase('tr');
      return /\barab|arabası|arabasi|tepsi arab|banket arab|servis arab|çöp arab|gn taşıma|mobil bar|tekerlekli/.test(
        n
      );
    },
  },
  istif: {
    filter(x) {
      if (x && x.dept === 'istif') return true;
      const n = String(x.name || '').toLocaleLowerCase('tr');
      return (
        (/istif raf|portashelf|katli raf|tel raf|duvar raf|malzeme raf|stok raf|raf sistemi|raflar|perfore/.test(
          n,
        ) ||
          /\braf\b/.test(n)) &&
        !/tezgah|work table|dolap|buzdolab/.test(n)
      );
    },
  },
};

const all = JSON.parse(readFileSync(src, 'utf8'));
if (!Array.isArray(all)) throw new Error('ekipmanlar.json dizi olmalı');

function pickDeptItems(dept, spec) {
  let sub;
  if (spec.filter) {
    sub = all.filter((x) => spec.filter(x));
  } else {
    const set = new Set(spec.slugs || []);
    sub = all.filter((x) => x && set.has(x.category));
  }
  /** enrich sonrası dept alanı varsa yanlış departmana kopyalanmasın */
  if (slugLists[dept]) {
    sub = sub.filter((x) => !x.dept || x.dept === dept);
  }
  return sub;
}

mkdirSync(outDir, { recursive: true });
for (const [dept, spec] of Object.entries(DEPTS)) {
  let sub = pickDeptItems(dept, spec);
  sub = sortCatalogItems(dept, sub);
  const out = join(outDir, `${dept}.json`);
  writeFileSync(out, JSON.stringify(sub));
  console.log(`${dept}: ${sub.length} ürün → ${out}`);
}
