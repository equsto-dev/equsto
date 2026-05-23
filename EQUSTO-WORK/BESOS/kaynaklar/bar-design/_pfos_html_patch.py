# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

# CSS: replace live-log with agent chat + foto
old_css = """.pfos-live-log{padding:14px 16px 10px;border-bottom:.5px solid var(--border);background:linear-gradient(180deg,#fafbfc 0%,var(--card) 100%);font-size:11px;line-height:1.45}
.pfos-live-log-hd{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--hint);margin:0 0 8px}
.pfos-live-line{display:flex;align-items:flex-start;gap:8px;padding:3px 0;color:var(--muted);transition:color .2s ease}
.pfos-live-line--active{color:var(--text);font-weight:500}
.pfos-live-line--done{color:var(--text)}
.pfos-live-ico{flex:0 0 14px;width:14px;text-align:center;font-size:10px;line-height:1.5;color:var(--hint)}
.pfos-live-line--active .pfos-live-ico{color:#1a4fd6}
.pfos-live-line--done .pfos-live-ico{color:#0d7a4a}"""

new_css = """.pfos-agent-chat{display:flex;flex-direction:column;gap:10px;padding:14px 16px 12px;border-bottom:.5px solid var(--border);background:linear-gradient(180deg,#f8fafc 0%,var(--card) 55%);min-height:120px;max-height:280px;overflow-y:auto}
.pfos-agent-chat-hd{display:flex;align-items:center;gap:8px;margin-bottom:2px;padding-bottom:8px;border-bottom:.5px solid var(--border)}
.pfos-agent-chat-ava{flex:0 0 28px;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1a4fd6,#0d3d9e);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
.pfos-agent-chat-name{font-size:12px;font-weight:600;color:var(--black)}
.pfos-agent-chat-sub{font-size:10px;color:var(--hint)}
.pfos-agent-chat-msgs{display:flex;flex-direction:column;gap:8px}
.pfos-chat-row{display:flex;gap:8px;align-items:flex-end;animation:pfosChatIn .28s ease-out}
.pfos-chat-row--user{flex-direction:row-reverse}
.pfos-chat-row--user .pfos-chat-bubble{background:#eef4ff;border-color:#c5d9ff}
.pfos-chat-mini-ava{flex:0 0 22px;width:22px;height:22px;border-radius:50%;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center}
.pfos-chat-mini-ava--agent{background:linear-gradient(135deg,#1a4fd6,#0d3d9e);color:#fff}
.pfos-chat-mini-ava--user{background:var(--bg);color:var(--muted);border:.5px solid var(--border)}
.pfos-chat-bubble{max-width:92%;padding:8px 11px;border-radius:12px 12px 12px 4px;font-size:11.5px;line-height:1.5;border:.5px solid var(--border);background:var(--card)}
.pfos-chat-row--user .pfos-chat-bubble{border-radius:12px 12px 4px 12px}
.pfos-chat-bubble strong{font-weight:600}
.pfos-chat-typing{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--hint)}
.pfos-chat-typing-dots{display:inline-flex;gap:3px;padding:8px 11px;background:var(--card);border:.5px solid var(--border);border-radius:12px}
.pfos-chat-typing-dots span{width:5px;height:5px;border-radius:50%;background:#94a3b8;animation:pfosDot 1s ease-in-out infinite}
.pfos-chat-typing-dots span:nth-child(2){animation-delay:.15s}
.pfos-chat-typing-dots span:nth-child(3){animation-delay:.3s}
@keyframes pfosChatIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes pfosDot{0%,80%,100%{opacity:.35}40%{opacity:1}}
.pfos-v10-tbl td.c-foto{width:72px;min-width:72px;text-align:center;vertical-align:middle;background:#fafafa;padding:4px}
.pfos-v10-foto-img{display:block;width:64px;height:64px;object-fit:contain;margin:0 auto;border-radius:4px;background:#fff;border:.5px solid #e5e7eb}
.pfos-v10-foto-ph{display:inline-block;width:64px;height:64px;line-height:64px;text-align:center;color:#bbb;font-size:11px;background:#f3f4f6;border-radius:4px}
.pfos-v10-tbl td.c-dim{font-size:9px;color:#444;white-space:nowrap}"""

if old_css in t:
    t = t.replace(old_css, new_css)
    print("css ok")
else:
    print("css skip")

# Step 05: remove slider, open stations
old_s5 = """          <motion/div class="pfos-area-row">
            <div class="fl" style="margin:0;min-width:72px">Toplam alan</div>
            <input type="range" id="alan-slider" min="20" max="800" step="5" value="120" oninput="onAlanSlider()">
            <motion/div class="pfos-area-val" id="alan-val">120 m²</div>
          </div>"""

# fix motion typos - use exact from file
old_s5 = """          <motion/div class="pfos-area-row">"""

# read actual
if '<input type="range" id="alan-slider"' in t:
    t = t.replace(
        """          <div class="pfos-area-row">
            <div class="fl" style="margin:0;min-width:72px">Toplam alan</motion/div>
            <input type="range" id="alan-slider" min="20" max="800" step="5" value="120" oninput="onAlanSlider()">
            <div class="pfos-area-val" id="alan-val">120 m²</div>
          </div>""",
        "",
    )
    # try without motion
    t = t.replace(
        """          <div class="pfos-area-row">
            <div class="fl" style="margin:0;min-width:72px">Toplam alan</motion/div>
            <input type="range" id="alan-slider" min="20" max="800" step="5" value="120" oninput="onAlanSlider()">
            <div class="pfos-area-val" id="alan-val">120 m²</div>
          </div>""",
        "",
    )

import re
t = re.sub(
    r'\s*<div class="pfos-area-row">.*?onAlanSlider\(\)[^<]*</div>\s*</div>\s*',
    "\n",
    t,
    count=1,
    flags=re.DOTALL,
)

t = t.replace(
    """        <details id="stations-details" style="margin-top:16px">
          <summary style="cursor:pointer;font-size:13px;color:var(--muted);margin-bottom:8px">Bölüm bazlı m² (isteğe bağlı)</summary>
        <div id="stations-wrap" style="margin-top:8px">""",
    """        <motion/div id="stations-wrap" style="margin-top:16px">""",
)
t = t.replace("""        </div>
        </details>
        <div class="ar" style="margin-top:16px"><button type="button" class="btn gold" onclick="alanIleri()">Devam</button></div>""",
    """        </div>
        <div class="ar" style="margin-top:16px"><button type="button" class="btn gold" onclick="alanIleri()">Devam</button></div>""",
)
t = t.replace('<motion/div id="stations-wrap"', '<div id="stations-wrap"')

t = t.replace(
    '<div class="fl">Metrekare (m²) — hassas giriş</motion/div>',
    '<div class="fl">Toplam alan (m²)</div>',
)
t = t.replace(
    '<div class="fl">Metrekare (m²) — hassas giriş</div>',
    '<motion/div class="fl">Toplam alan (m²)</div>',
)
t = t.replace('<motion/div class="fl">Toplam alan (m²)</motion/div>', '<div class="fl">Toplam alan (m²)</div>')

# pfosNormPoolItem images
t = t.replace(
    """    equstoPage: raw.equstoPage || x.equstoPage || '',
    b: raw.brand || x.b || '',""",
    """    equstoPage: raw.equstoPage || x.equstoPage || '',
    images: raw.images || x.images || [],
    specs: raw.specs || x.specs || '',
    b: raw.brand || x.b || '',""",
)

# schedule debounce 50ms
t = t.replace(
    "__pfosLiveTimer=setTimeout(function(){ pfosRunLiveRecalc(); },120);",
    "__pfosLiveTimer=setTimeout(function(){ pfosRunLiveRecalc(); },50);",
)

# onAlan: debounce recalc only on blur/change not every keystroke for heavy path
t = t.replace(
    """function onAlan(){
  document.getElementById('alan-warn').style.display='none';
  const v = syncAlanUi(document.getElementById('alan-inp').value);
  if (v >= 20) {
    const grid=document.getElementById('stations-grid');
    if(!grid||!grid.querySelector('.station-inp')) renderStations(v);
    else stationsUpdateTotal(v);
    document.getElementById('stations-wrap').style.display='block';
  }
  schedulePfosLiveRecalc();
}""",
    """function onAlan(){
  document.getElementById('alan-warn').style.display='none';
  const v = syncAlanUi(document.getElementById('alan-inp').value);
  if (v >= 20) {
    const grid=document.getElementById('stations-grid');
    if(!grid||!grid.querySelector('.station-inp')) renderStations(v);
    else stationsUpdateTotal(v);
    document.getElementById('stations-wrap').style.display='block';
  }
}""",
)

# Replace pfosYieldUi through pfosRunLiveRecalc with chat version
old_block_start = "function pfosYieldUi() {"
old_block_end = "// ── Sabitler ──────────────────────────────────────────────────────────────────"

idx_start = t.find(old_block_start)
idx_end = t.find(old_block_end)
if idx_start >= 0 and idx_end > idx_start:
    new_block = r'''function pfosYieldUi() {
  return new Promise(function (resolve) {
    requestAnimationFrame(resolve);
  });
}

function pfosChatFmt(s) {
  var tx = escHtml(String(s || ''));
  return tx.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function pfosAgentSnapshot() {
  pfosSyncDraftFromUi();
  var zones = pfosGetZones();
  var konsept = konseptGoster() || 'Projeniz';
  var dukkan = D.dukkan ? String(D.dukkan) : '';
  var alan = Number(D.alan) || 0;
  var sehir = D.sehir ? String(D.sehir) : '';
  var zoneNames = zones.map(function (z) { return z.label || z.key || ''; }).filter(Boolean).slice(0, 4);
  var zoneExtra = zones.length > 4 ? ' +' + (zones.length - 4) + ' bölge' : '';
  var zoneTxt = zoneNames.length ? zoneNames.join(', ') + zoneExtra : '';
  var pisir = D.pisir && D.pisir.length ? D.pisir.slice(0, 2).join(', ') + (D.pisir.length > 2 ? '…' : '') : '';
  return {
    konsept: konsept,
    userLine: (alan >= 20 ? alan + ' m² · ' : '') + konsept + (dukkan ? ' · ' + dukkan : '') + (sehir ? ' · ' + sehir : ''),
    greet: '**' + konsept + '**' + (dukkan ? ' (' + dukkan + ')' : '') + (alan >= 20 ? ' · **' + alan + ' m²**' : '') + ' için ekipman listesini hazırlıyorum.' + (zoneNames.length ? ' Bölümler: ' + zoneTxt + '.' : ''),
    done: function (rows, amt) {
      var fmt = new Intl.NumberFormat('tr-TR');
      return 'Liste hazır — **' + rows.length + ' kalem**, tahmini **' + fmt.format(Math.round(amt || 0)) + ' ₺** (KDV hariç).' + (pisir ? ' Öne çıkan: ' + pisir + '.' : '');
    },
  };
}

function pfosAgentChatRender(messages, typing) {
  var body = document.getElementById('tablo-body');
  if (!body) return;
  var rows = (messages || []).map(function (m) {
    var isUser = m.role === 'user';
    return '<div class="pfos-chat-row' + (isUser ? ' pfos-chat-row--user' : '') + '">' +
      '<span class="pfos-chat-mini-ava pfos-chat-mini-ava--' + (isUser ? 'user' : 'agent') + '">' + (isUser ? 'Siz' : 'PF') + '</span>' +
      '<div class="pfos-chat-bubble">' + pfosChatFmt(m.text) + '</div></div>';
  }).join('');
  var typingHtml = typing ? '<div class="pfos-chat-typing"><span class="pfos-chat-mini-ava pfos-chat-mini-ava--agent">PF</span><span class="pfos-chat-typing-dots"><span></span><span></span><span></span></span><span>Hesaplanıyor…</span></motion/div>' : '';
  body.innerHTML = '<div class="pfos-agent-chat" id="pfos-agent-chat"><div class="pfos-agent-chat-hd">' +
    '<span class="pfos-agent-chat-ava">PF</span><div><div class="pfos-agent-chat-name">Proje Fabrikası asistanı</div>' +
    '<div class="pfos-agent-chat-sub">Seçimlerinize göre canlı liste</div></div></div><div class="pfos-agent-chat-msgs">' + rows + typingHtml + '</div></div>';
  var sc = document.getElementById('pfos-agent-chat');
  if (sc) sc.scrollTop = sc.scrollHeight;
}

function pfosLiveLogRender(lines, activeIdx) {
  var msgs = (lines || []).map(function (txt, i) {
    return { role: 'agent', text: (i < activeIdx ? '✓ ' : i === activeIdx ? '… ' : '') + txt };
  });
  pfosAgentChatRender(msgs, activeIdx === lines.length - 1 && lines.length > 0);
}

function showTabloGhost(){
  const tp=document.getElementById('tablo-panel');
  if(!tp.classList.contains('vis')) tp.classList.add('vis');
  const badge=document.getElementById('tablo-badge');
  if(badge){ badge.textContent='Hazırlanıyor…'; badge.classList.add('tablo-badge--busy'); }
  const snap = pfosAgentSnapshot();
  document.getElementById('tablo-status').textContent= snap.konsept || 'İşletme türü bekleniyor…';
  pfosAgentChatRender([{ role: 'agent', text: 'Merhaba — **alan (m²)** ve kategorileri seçtiğinizde burada canlı liste oluşturacağım. Bölüm m² paylarını adım 5\'te düzenleyebilirsiniz.' }], false);
}

function showTabloBusy(){
  const tp=document.getElementById('tablo-panel');
  if(!tp.classList.contains('vis')) tp.classList.add('vis');
  const badge=document.getElementById('tablo-badge');
  if(badge){ badge.textContent='Hesaplanıyor…'; badge.classList.add('tablo-badge--busy'); }
}

function renderTabloSag(){
  pfosSyncDraftFromUi();
  const rows=pfosPriceRows(buildEkipmanList());
  const amt=pfosQuoteTotal(rows);
  renderTabloSagFromRows(rows,amt);
}

function buildTabloPreviewHtml(rows,amt){
  const teklifCtx=Object.assign({},D,{pfosZones:pfosGetZones(),currency:'TRY'});
  const ui=window.EqustoPfosTeklifUi;
  const calc=window.EqustoPfosCalc;
  let html='<div class="pfos-result pfos-result--compact">';
  if(ui&&typeof ui.buildPfosKpiStripHtml==='function'){
    html+=ui.buildPfosKpiStripHtml(rows,teklifCtx);
  }
  const zones=calc&&calc.groupByZones?calc.groupByZones(rows,teklifCtx.pfosZones,teklifCtx.alan):[];
  if(ui&&typeof ui.buildPfosCategoryBlocksHtml==='function'){
    html+=ui.buildPfosCategoryBlocksHtml(zones,teklifCtx.currency||'TRY');
  }
  html+='</div>';
  html+=`<div class="ac-cards">
    <div class="ac-c" onclick="pdfIndir()"><span class="icon">📄</span><motion/div class="lbl">PDF / yazdır</div><div class="sub">Adımları göster</div></div>
    <div class="ac-c" onclick="wpGonder()"><span class="icon">✉️</span><div class="lbl">Özeti gönder</div><motion/div class="sub">E-posta ile (hazır metin)</div></div>
    <div class="ac-c" onclick="mailGonder()"><span class="icon">✍️</span><div class="lbl">E-posta şablonu</div><div class="sub">Kendi notunuzu ekleyin</div></div>
  </div>`;
  return html;
}

function renderTabloSagFromRows(rows,amt){
  const fmt=new Intl.NumberFormat('tr-TR');
  document.getElementById('tablo-body').innerHTML=buildTabloPreviewHtml(rows,amt);
  const badge=document.getElementById('tablo-badge');
  if(badge){
    badge.textContent='Hazır · '+fmt.format(Math.round(amt||0))+' ₺';
    badge.classList.remove('tablo-badge--busy');
  }
  const zones=pfosGetZones();
  document.getElementById('tablo-status').textContent=
    (konseptGoster()||'')+(D.dukkan?' · '+D.dukkan:'')+' · '+(D.alan||'—')+' m² · '+(rows?rows.length:0)+' kalem · '+zones.length+' bölge';
}

function pfosRefreshOzetIfVisible(){
  const s6=document.getElementById('s6');
  if(s6&&(s6.classList.contains('vis')||s6.classList.contains('done'))) renderOzet();
}

function schedulePfosLiveRecalc(){
  if(!D.konsept) return;
  if(!pfosCanLivePreview()) return;
  clearTimeout(__pfosLiveTimer);
  __pfosLiveTimer=setTimeout(function(){ pfosRunLiveRecalc(); },50);
}

function schedulePfosLiveRecalcHeavy(){
  schedulePfosLiveRecalc();
}

async function pfosRunLiveRecalc(){
  if(!pfosCanLivePreview()) return;
  const gen=++__pfosLiveGen;
  const chat=[];
  const say=async function(role,text,typing){
    if(gen!==__pfosLiveGen) return false;
    if(text) chat.push({ role: role, text: text });
    pfosAgentChatRender(chat, !!typing);
    if(text){
      document.getElementById('tablo-status').textContent= role==='user'?'Seçimleriniz alındı':String(text).replace(/\*\*/g,'');
      pfosSetLiveStatus(String(text).replace(/\*\*/g,''), !!typing);
    }
    if(typing) await pfosYieldUi();
    return gen===__pfosLiveGen;
  };
  showTabloBusy();
  const snap=pfosAgentSnapshot();
  const catalogP=pfosEnsureCatalogPool();
  if(snap.userLine && !(await say('user', snap.userLine, false))) return;
  if(!(await say('agent', snap.greet, true))) return;
  await catalogP;
  if(gen!==__pfosLiveGen) return;
  const list=buildEkipmanList();
  const rows=pfosPriceRows(list);
  const amt=pfosQuoteTotal(rows);
  if(gen!==__pfosLiveGen) return;
  if(!(await say('agent', snap.done(rows, amt), false))) return;
  renderTabloSagFromRows(rows,amt);
  pfosSetLiveStatus('Güncellendi · '+rows.length+' kalem',false);
  try{
    const rows2=pfosPriceRows(list);
    pfosPatchLiveAmount(pfosQuoteTotal(rows2),'');
  }catch(_){}
  pfosRefreshOzetIfVisible();
  refreshWizardHint();
}

'''
    new_block = new_block.replace('</motion/div>', '</motion/div>').replace('<motion/div', '<div').replace('</motion/div>', '</div>')
    # fix typos I introduced
    new_block = new_block.replace('</motion/div>', '</div>')
    while '<motion/div' in new_block:
        new_block = new_block.replace('<motion/div', '<div', 1)
    t = t[:idx_start] + new_block + t[idx_end:]
    print("js block ok")
else:
    print("js block skip", idx_start, idx_end)

# ozet: remove slider row
t = re.sub(
    r'<div class="pfos-area-row">[\s\S]*?id="ozet-alan-slider"[\s\S]*?</motion/div>\s*</motion/div>\s*',
    '',
    t,
    count=1,
)
t = re.sub(
    r'<div class="pfos-area-row">[\s\S]*?id="ozet-alan-slider"[\s\S]*?</div>\s*</div>\s*',
    '',
    t,
    count=1,
)

# alanIleri triggers recalc
if "onblur=\"schedulePfosLiveRecalcHeavy()\"" not in t:
    t = t.replace(
        'onkeydown="if(event.key===\'Enter\')alanIleri()">',
        'onblur="schedulePfosLiveRecalcHeavy()" onkeydown="if(event.key===\'Enter\'){alanIleri();schedulePfosLiveRecalcHeavy();}">',
    )

p.write_text(t, encoding="utf-8")
print("pfos.html saved")
