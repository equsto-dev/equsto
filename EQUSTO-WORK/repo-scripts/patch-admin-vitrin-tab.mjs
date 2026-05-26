import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');
const D = 'd' + 'iv';

if (!html.includes('et-vitrin')) {
  html = html.replace(
    `Kampanyalar</${D}>\n  <${D} class="etab" onclick="showEtab(this,'et-icerik')">`,
    `Kampanyalar</${D}>\n  <${D} class="etab" data-et-vitrin onclick="showEtab(this,'et-vitrin')">Ana Sayfa Vitrin</${D}>\n  <${D} class="etab" onclick="showEtab(this,'et-icerik')">`,
  );
}

if (!html.includes('id="et-vitrin"')) {
  const insert = `
<!-- ANA SAYFA VİTRİN (Mutbex) -->
<${D} class="etpane" id="et-vitrin">
  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.5">Ana sayfa sırası, slider, story ve ürün rayları. Kayıt: <code>/api/vitrin-homepage</code> + <code>public/data/homepage-vitrin.json</code>. 4'lü platform hero HTML'de kilitli kalır.</p>
  <${D} id="et-vitrin-root"></${D}>
</${D}>

`;
  html = html.replace('<!-- KAMPANYALAR -->', insert + '<!-- KAMPANYALAR -->');
}

if (!html.includes('admin-vitrin.js')) {
  html = html.replace(
    '<script src="equsto-adres-national.js"></script>',
    '<script src="equsto-adres-national.js"></script>\n<script src="/admin-vitrin.js"></script>',
  );
}

fs.writeFileSync(adminPath, html);
console.log('admin.html vitrin tab patched');
