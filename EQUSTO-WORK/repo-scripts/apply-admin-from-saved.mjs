import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const saved = path.join(root, 'admin.saved-from-downloads.html');
const out = path.join(root, 'admin.html');

let h = fs.readFileSync(saved, 'utf8');

const fileGuard = `<script>
/** file:// ile acilinca CSS/JS yuklenmez */
(function () {
  if (typeof location === "undefined" || location.protocol !== "file:") return;
  var u = "http://127.0.0.1:5173/admin.html";
  document.open();
  document.write(
    '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Equsto — yerel sunucu gerekli</title>' +
    '<style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:2.5rem auto;padding:0 1.25rem;line-height:1.55;color:#1a1d2b}' +
    'code{background:#eef1f8;padding:.12em .35em;border-radius:4px}ol{padding-left:1.2rem}a{color:#001e50;font-weight:600}</style></head><body>' +
    "<h1>Bu sayfa dosyadan acilamaz</h1>" +
    "<p><code>file://</code> ile acinca logo, CSS ve veri yuklenmez.</p>" +
    "<ol><li><code>npm run dev</code> veya <code>Site-Ac.bat</code></li>" +
    '<li><a href="' + u + '">' + u + "</a></li></ol></body></html>"
  );
  document.close();
})();
</script>
`;

if (!h.includes('file:// ile acilinca')) {
  h = h.replace('<head>\n', '<head>\n' + fileGuard);
}

h = h
  .replace(/href="theme\.css"/g, 'href="/theme.css"')
  .replace(/href="contact\.css"/g, 'href="/contact.css"')
  .replace(/src="(theme|equsto-logo|eq-site-urls|nav|equsto-member|contact|ecom-data|equsto-adres-national)\.js"/g, 'src="/$1.js"')
  .replace(/href="index\.html"/g, 'href="/index.html"');

h = h.replace(/<nav class="topnav"[\s\S]*?<\/nav>\s*/m, '');

if (!h.includes('body.admin-app .topnav')) {
  h = h.replace(
    '/* TABS — vitrin topnav ile aynı Electrolux şeridi (body.eq-shop) */',
    '/* Admin: vitrin kategori şeridi yok */\nbody.admin-app .topnav{display:none!important;}\n\n/* TABS — admin alt sekmeler */'
  );
}

fs.writeFileSync(out, h);
fs.writeFileSync(saved, h);
console.log({
  out: out,
  topnav: h.includes('topnav-item') ? 'WARN' : 'removed',
  paths: h.includes('href="/theme.css"') ? 'ok' : 'check',
});
