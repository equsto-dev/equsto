import fs from 'fs';

const p = new URL('../public/pfos.html', import.meta.url);
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('pfos-teklif-ui.js')) {
  c = c.replace(
    '<script src="/pfos-pricing.js"></script>',
    '<script src="/pfos-pricing.js"></script>\n<script src="/pfos-teklif-ui.js"></script>'
  );
}

const tabloStart = c.indexOf('function renderTabloSag(){');
const tabloEnd = c.indexOf('// ── Sabitler', tabloStart);
if (tabloStart < 0 || tabloEnd < 0) throw new Error('renderTabloSag markers missing');

const tabloNew = `function renderTabloSag(){
  const rows=pfosPriceRows(buildEkipmanList());
  const amt=pfosQuoteTotal(rows);
  let html='';
  if(window.EqustoPfosTeklifUi&&typeof EqustoPfosTeklifUi.buildPfosTeklifHtml==='function'){
    html=EqustoPfosTeklifUi.buildPfosTeklifHtml(rows,amt,{compact:true,sartlarStyle:'margin:0 16px 16px'},D);
  }
  html+=\`<div class="ac-cards">
    <div class="ac-c" onclick="pdfIndir()"><span class="icon">📄</span><div class="lbl">PDF / yazdır</div><div class="sub">Adımları göster</div></div>
    <div class="ac-c" onclick="wpGonder()"><span class="icon">✉️</span><div class="lbl">Özeti gönder</div><div class="sub">E-posta ile (hazır metin)</div></div>
    <div class="ac-c" onclick="mailGonder()"><span class="icon">✍️</span><div class="lbl">E-posta şablonu</div><div class="sub">Kendi notunuzu ekleyin</div></div>
  </div>\`;

  document.getElementById('tablo-body').innerHTML=html;
  document.getElementById('tablo-badge').textContent='Hazır';
  document.getElementById('tablo-status').textContent=\`\${konseptGoster()}\${D.dukkan?' · '+D.dukkan:''} · \${D.alan} m²\`;
}

`;

c = c.slice(0, tabloStart) + tabloNew + c.slice(tabloEnd);

const hook = `function renderTeklifTablo(){
  const rows=pfosPriceRows(buildEkipmanList());
  const amt=pfosQuoteTotal(rows);
  if(window.EqustoPfosTeklifUi&&typeof EqustoPfosTeklifUi.buildPfosTeklifHtml==='function'){
    document.getElementById('teklif-tbl-wrap').innerHTML=EqustoPfosTeklifUi.buildPfosTeklifHtml(rows,amt,{},D);
    renderTabloSag();
    return;
  }`;

if (!c.includes('EqustoPfosTeklifUi.buildPfosTeklifHtml')) {
  c = c.replace(
    `function renderTeklifTablo(){
  const rows=pfosPriceRows(buildEkipmanList());
  const amt=pfosQuoteTotal(rows);
  const totalElk`,
    hook + `\n  const totalElk`
  );
}

fs.writeFileSync(p, c);
console.log('patched pfos.html');
