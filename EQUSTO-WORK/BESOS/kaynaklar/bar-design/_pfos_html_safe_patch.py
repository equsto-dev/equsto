# -*- coding: utf-8 -*-
"""Targeted pfos.html patches — no destructive regex on script blocks."""
import re
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")
orig_len = len(t.splitlines())

# 1) Step 05: remove area slider (first pfos-area-row in step 5)
m = re.search(
    r'(<div class="pfos-zone-step" id="pfos-zone-step">.*?<p class="pfos-zone-step__sub">.*?</p>)\s*<div class="pfos-area-row">.*?</div>\s*</div>\s*',
    t,
    flags=re.DOTALL,
)
if not m:
    m = re.search(
        r'(<div class="pfos-zone-step" id="pfos-zone-step">.*?<p class="pfos-zone-step__sub">.*?</p>)\s*<div class="pfos-area-row">.*?</div>\s*</div>\s*',
        t,
        flags=re.DOTALL,
    )
if m:
    t = t[: m.start()] + m.group(1) + "\n          " + t[m.end() :]
    print("s5 slider removed")
else:
  m2 = re.search(
      r'(<p class="pfos-zone-step__sub">Toplam mutfak alanını.*?</p>)\s*<div class="pfos-area-row">.*?</div>\s*</div>\s*',
      t,
      flags=re.DOTALL,
  )
  if m2:
      t = t[: m2.start()] + m2.group(1) + "\n          " + t[m2.end() :]
      print("s5 slider removed (alt)")
  else:
      print("s5 slider skip")

t = t.replace(
    '<div class="fl">Metrekare (m²) — hassas giriş</div>',
    '<div class="fl">Toplam alan (m²)</div>',
)

# 2) pfosNormPoolItem
needle = "    equstoPage: raw.equstoPage || x.equstoPage || '',\n    b: raw.brand"
repl = "    equstoPage: raw.equstoPage || x.equstoPage || '',\n    images: raw.images || x.images || [],\n    specs: raw.specs || x.specs || '',\n    b: raw.brand"
if needle in t and "images: raw.images" not in t:
    t = t.replace(needle, repl)
    print("pool images ok")

# 3) debounce + onAlan
t = t.replace(
    "__pfosLiveTimer=setTimeout(function(){ pfosRunLiveRecalc(); },120);",
    "__pfosLiveTimer=setTimeout(function(){ pfosRunLiveRecalc(); },50);",
)

old_onalan = """function onAlan(){
  document.getElementById('alan-warn').style.display='none';
  const v = syncAlanUi(document.getElementById('alan-inp').value);
  if (v >= 20) {
    const grid=document.getElementById('stations-grid');
    if(!grid||!grid.querySelector('.station-inp')) renderStations(v);
    else stationsUpdateTotal(v);
    document.getElementById('stations-wrap').style.display='block';
  }
  schedulePfosLiveRecalc();
}"""

new_onalan = """function onAlan(){
  document.getElementById('alan-warn').style.display='none';
  const v = syncAlanUi(document.getElementById('alan-inp').value);
  if (v >= 20) {
    const grid=document.getElementById('stations-grid');
    if(!grid||!grid.querySelector('.station-inp')) renderStations(v);
    else stationsUpdateTotal(v);
  }
}"""

if old_onalan in t:
    t = t.replace(old_onalan, new_onalan)
    print("onAlan ok")

if 'onblur="schedulePfosLiveRecalcHeavy()"' not in t:
    t = t.replace(
        "onkeydown=\"if(event.key==='Enter')alanIleri()\">",
        "onblur=\"schedulePfosLiveRecalcHeavy()\" onkeydown=\"if(event.key==='Enter'){alanIleri();schedulePfosLiveRecalcHeavy();}\">",
        1,
    )
    print("alan-inp blur ok")

# 4) Replace pfosYieldUi .. pfosRunLiveRecalc block
MARK_START = "function pfosYieldUi() {"
MARK_END = "// ── Sabitler ──────────────────────────────────────────────────────────────────"

NEW_BLOCK = r'''function pfosYieldUi() {
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
  var typingHtml = typing ? '<div class="pfos-chat-typing"><span class="pfos-chat-mini-ava pfos-chat-mini-ava--agent">PF</span><span class="pfos-chat-typing-dots"><span></span><span></span><span></span></span><span>Hesaplanıyor…</span></div>' : '';
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
    <div class="ac-c" onclick="pdfIndir()"><span class="icon">📄</span><div class="lbl">PDF / yazdır</div><div class="sub">Adımları göster</div></div>
    <div class="ac-c" onclick="wpGonder()"><span class="icon">✉️</span><div class="lbl">Özeti gönder</div><div class="sub">E-posta ile (hazır metin)</div></div>
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
    pfosPatchLiveAmount(pfosQuoteTotal(rows),'');
  }catch(_){}
  pfosRefreshOzetIfVisible();
  refreshWizardHint();
}

'''

idx_start = t.find(MARK_START)
idx_end = t.find(MARK_END)
if idx_start >= 0 and idx_end > idx_start and "pfosAgentChatRender" not in t:
    t = t[:idx_start] + NEW_BLOCK + t[idx_end:]
    print("js chat block ok")
elif "pfosAgentChatRender" in t:
    print("js chat block already present")
else:
    print("js chat block skip", idx_start, idx_end)

# 5) ozet slider in renderOzet template
t3, n3 = re.subn(
    r'<div class="pfos-area-row">[\s\S]*?id="ozet-alan-slider"[\s\S]*?</div>\s*</div>\s*',
    '',
    t,
    count=1,
)
if n3:
    t = t3
    t = t.replace('<div class="fl">Metrekare (m²)</div>', '<div class="fl">Toplam alan (m²)</div>', 1)
    print("ozet slider removed")

new_len = len(t.splitlines())
if new_len < orig_len * 0.6:
    raise SystemExit(f"ABORT: file shrunk too much {orig_len} -> {new_len}")

p.write_text(t, encoding="utf-8")
print(f"saved {orig_len} -> {new_len} lines")
