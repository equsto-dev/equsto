import fs from 'node:fs';

const files = [
  'public/pisirme.html',
  'public/sogutma.html',
  'public/kahve.html',
  'public/yikama.html',
  'public/hazirlik.html',
  'public/icecek.html',
];

for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("eqGo('tezgah')")) {
      if (out.length && out[out.length - 1].trim() === '<span class="topnav-sep">|</span>') {
        out.pop();
      }
      continue;
    }
    out.push(lines[i]);
  }
  fs.writeFileSync(f, out.join('\n'));
  console.log(f, out.join('\n').includes("eqGo('tezgah')") ? 'STILL HAS' : 'OK');
}
