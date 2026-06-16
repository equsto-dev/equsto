/** Auto-generated — scripts/extract-pfos-wizard.mjs */
function escHtml(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/** product.html ile aynı slug kuralı — vitrin PDP eşlemesi için */
function pfSlugifyEq(s){
  const tr={ğ:'g',ü:'u',ş:'s',ı:'i',ö:'o',ç:'c',â:'a',î:'i',û:'u',Ğ:'g',Ü:'u',Ş:'s',İ:'i',Ö:'o',Ç:'c',Â:'a',Î:'i',Û:'u'};
  return String(s||'').toLowerCase()
    .replace(/[ğüşıöçâîûĞÜŞİÖÇÂÎÛ]/g,c=>tr[c]||c)
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .substring(0,100);
}
function pfProductSlug(brand,name){
  const b=pfSlugifyEq(brand), n=pfSlugifyEq(name);
  return (b?b+'-':'')+n;
}
function pfLangPrefix(){
  try{return (typeof window!=='undefined'&&window.eqLang==='en')?'/en':'';}catch(_){return '';}
}
function pfUrunlerDeptPath(dept){
  return pfLangPrefix()+'/shop/'+encodeURIComponent(dept);
}
function pfUrunlerProductPath(dept,slug){
  return pfUrunlerDeptPath(dept)+'/'+encodeURIComponent(slug);
}
function pfosKonseptSeg(){
  if(D.franchise){
    const s=pfSlugifyEq(D.franchise);
    return s?String(s).slice(0,48):'franchise';
  }
  const map={
    Restaurant:'restoran',Steakhouse:'steakhouse',Şarküteri:'sarkuteri',
    'Kafe-Kafeterya':'kafe-kafeterya','Bulut Mutfak':'bulut-mutfak',Hotel:'otel',
    Bar:'bar',Catering:'catering',Kasap:'kasap',Franchise:'franchise'
  };
  if(D.konsept&&map[D.konsept]) return map[D.konsept];
  const f=pfSlugifyEq(D.konsept||'');
  return f?f.slice(0,48):'genel';
}
function pfPfosCtxQs(kod){
  const p=new URLSearchParams();
  p.set('pfos_k',pfosKonseptSeg());
  p.set('pfos_kod',String(kod||''));
  if(D.dukkan){
    const d=pfSlugifyEq(D.dukkan);
    if(d) p.set('pfos_d',String(d).slice(0,80));
  }
  if(D.alt){
    const a=pfSlugifyEq(D.alt);
    if(a) p.set('pfos_a',String(a).slice(0,80));
  }
  return p.toString();
}
function pfEqItemHref(row){
  const q=pfPfosCtxQs(row.kod);
  if(row.pfEqustoPage){
    const base=(typeof window.eqAttrPath==='function')?window.eqAttrPath(row.pfEqustoPage):row.pfEqustoPage;
    return base+(base.indexOf('?')>=0?'&':'?')+q;
  }
  if(row.pfB&&row.pfN&&row.pfDept){
    const slug=pfProductSlug(row.pfB,row.pfN);
    if(slug) return pfUrunlerProductPath(row.pfDept,slug)+'?'+q;
  }
  if(row.pfDept) return pfUrunlerDeptPath(row.pfDept)+'?'+q;
  const shop=(typeof window.equstoUrl==='function')?window.equstoUrl('shop'):'/shop';
  return shop+(shop.indexOf('?')>=0?'&':'?')+q;
}
function pfEqNameCellHtml(row){
  const href=pfEqItemHref(row);
  return '<a href="'+escHtml(href)+'" target="_blank" rel="noopener noreferrer" class="pf-prod-link">'+escHtml(row.ad)+'</a>';
}

/** Konsepte göre sağ üstte gösterilecek kısa “yazar” notları (örnek içerik). */
const KONSEPT_YAZILARI={
  Restaurant:[
    {avatar:'🍽️',isim:'Ece T.',unvan:'Restoran işletmecisi — Antalya',yazi:'Açılış öncesi mutfak hattını kağıt üzerinde netleştirmek, keşif gününde sürprizleri azaltıyor. Konseptle uyumlu örnek liste, yatırımı konuşmayı kolaylaştırdı.'},
    {avatar:'📋',isim:'Caner V.',unvan:'Operasyon danışmanı — İzmir',yazi:'Fine dining ile fast food aynı başlıkta değil; ekipman yoğunluğu ve servis akışı tamamen ayrılıyor. Doğru segmenti seçmek ilk teklifin isabetini artırıyor.'},
  ],
  Steakhouse:[
    {avatar:'🔥',isim:'Oğuz R.',unvan:'Et mutfağı şefi — Ankara',yazi:'Izgara hattı, dinlendirme ve kesim istasyonu birbirine kilitleniyor. Konsept seçildiğinde güç ve aspirasyon ihtiyacı aynı masada toplanıyor.'},
  ],
  Şarküteri:[
    {avatar:'🧀',isim:'Pelin S.',unvan:'Soğuk zincir sorumlusu — İstanbul',yazi:'Teşhir dolapları ve HACCP hatları için doğru sıcaklık bandı kritik. Şarküteri hattında eksik bir modül, tüm reyon akışını bozuyor.'},
  ],
  'Kafe-Kafeterya':[
    {avatar:'☕',isim:'Deniz L.',unvan:'Kafe ortağı — Bursa',yazi:'Espresso barı ile brunch mutfağının ekipman listesi aynı değil. Konsept netleşince tezgâh derinliği ve buhar ihtiyacı kendini gösteriyor.'},
    {avatar:'🥐',isim:'Melis K.',unvan:'Pastane & kafe — Eskişehir',yazi:'Hafif mutfak + fırın kombinasyonunda elektrik yükü erken hesaplanmalı; örnek liste bunu görünür kılıyor.'},
  ],
  'Bulut Mutfak':[
    {avatar:'📦',isim:'Baran Y.',unvan:'Merkez üretim müdürü — İstanbul',yazi:'Paket yoğunluğu arttıkça soğuk zincir ve hazırlık istasyonları öne çıkıyor. Bulut modelde her m²’nin verimi farklı ölçülüyor.'},
  ],
  Hotel:[
    {avatar:'🏨',isim:'Selim A.',unvan:'F&B koordinatörü — Muğla',yazi:'Oda sayısı ve menü tipi mutfak kapasitesini belirliyor. Konsept seçimi sonrası gelen ek sorular, teklifin gerçekçiliğini artırıyor.'},
  ],
  Bar:[
    {avatar:'🍸',isim:'Kıvanç T.',unvan:'Bar müdürü — İstanbul',yazi:'Buz üretimi, draft hatları ve kokteyl tezgâhı aynı anda planlanmalı. Bar konseptinde “eksik modül” genelde soğutma tarafında çıkıyor.'},
  ],
  Catering:[
    {avatar:'🚚',isim:'Aslı N.',unvan:'Catering operasyon — Kocaeli',yazi:'Taşıma yemek ile fabrika üretimi farklı ekipman kümeleri istiyor. Günlük kapasite seçimi, doğru fırın ve şoklama dengesini getiriyor.'},
  ],
  Kasap:[
    {avatar:'🥩',isim:'Hakan B.',unvan:'Kasap işletmecisi — Gaziantep',yazi:'Kıyma, dolap ve teşhir reyonu üçlüsü düzgün kurgulanmazsa hem hijyen hem hız kaybediliyor. Şarküteri opsiyonu netleşince liste genişliyor.'},
  ],
  Franchise:[
    {avatar:'🔗',isim:'Tarık M.',unvan:'Franchise işletmecisi — Bursa',yazi:'Marka standartları sabit olsa da lokal tedarik ve mekân kısıtları değişiyor. Şablon + yerel ayırımı birlikte görmek yatırımcıyı rahatlatıyor.'},
  ],
};

let PFOS_PROJECTS=[];
async function loadPfosProjects(){
    try{
    const r=await fetch('data/pfos-projects.json');
      const j=await r.json();
    PFOS_PROJECTS=Array.isArray(j.projects)?j.projects:[];
  }catch(e){ PFOS_PROJECTS=[]; }
}

/* ── PFL Döner Akış ── */
const PFL_SAMPLE=[
  {no:'2025-116',baslik:'Pizzacı · Avcılar',konsept:'Restoran',sehir:'İstanbul',alan:85,kalem:18,toplam:78920,cur:'EUR',ago:3},
  {no:'2025-118',baslik:'Bulut Mutfak · Kadıköy',konsept:'Bulut Mutfak',sehir:'İstanbul',alan:120,kalem:24,toplam:112400,cur:'TRY',ago:7},
  {no:'2025-121',baslik:'Steakhouse · Çankaya',konsept:'Steakhouse',sehir:'Ankara',alan:200,kalem:31,toplam:198750,cur:'TRY',ago:12},
  {no:'2025-124',baslik:'Kafe & Brunch · Konak',konsept:'Kafe-Kafeterya',sehir:'İzmir',alan:95,kalem:15,toplam:64200,cur:'TRY',ago:18},
  {no:'2025-129',baslik:'Hotel Mutfağı · Muğla',konsept:'Hotel',sehir:'Muğla',alan:350,kalem:42,toplam:341000,cur:'EUR',ago:25},
  {no:'2025-133',baslik:'Catering Merkezi · Kocaeli',konsept:'Catering',sehir:'Kocaeli',alan:280,kalem:37,toplam:265300,cur:'TRY',ago:31},
  {no:'2025-135',baslik:'Kasap · Gaziantep',konsept:'Kasap',sehir:'Gaziantep',alan:60,kalem:12,toplam:48900,cur:'TRY',ago:38},
  {no:'2025-140',baslik:'Bar & Lounge · Beşiktaş',konsept:'Bar',sehir:'İstanbul',alan:140,kalem:22,toplam:155600,cur:'EUR',ago:45},
  {no:'2026-002',baslik:'Fast Food · Bornova',konsept:'Franchise',sehir:'İzmir',alan:110,kalem:19,toplam:89400,cur:'TRY',ago:52},
  {no:'2026-007',baslik:'Şarküteri · Nişantaşı',konsept:'Şarküteri',sehir:'İstanbul',alan:75,kalem:14,toplam:72100,cur:'TRY',ago:60},
];

/* Her PFL için 3 örnek kalem göster — gerçek lines yoksa placeholder */
const PFL_LINE_POOL={
  'Restoran':['Gazlı endüstriyel ocağı','Depo tipi buzdolabı','Bulaşık makinesi'],
  'Steakhouse':['Mangal / ızgara hattı','Et dinlendirme dolabı','Hazırlık tezgahı'],
  'Bulut Mutfak':['Kombine fırın','Soğuk oda sistemi','Hazırlık tezgahı'],
  'Kafe-Kafeterya':['Espresso makinesi','Vitrin / soğutmalı teşhir','Brunch tezgahı'],
  'Hotel':['Kombine fırın','Bulaşık konveyör hat','Soğuk oda sistemi'],
  'Catering':['Konvektömat fırın','Şoklama dolabı','Taşıma kasaları'],
  'Kasap':['Teşhir buzdolabı','Kıyma makinesi','Nötr tezgah'],
  'Bar':['Buz üretici','Draft hat sistemi','Bar tezgahı modülü'],
  'Franchise':['Fritöz (çift sepet)','Kombine fırın','Soğutmalı çalışma tezgahı'],
  'Şarküteri':['Teşhir dolabı (soğutmalı)','Dilimleme makinesi','Soğuk depo kapısı'],
};

(function(){
  function shuffle(arr){
    var a=arr.slice();
    for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}
    return a;
  }

  var items=shuffle(PFL_SAMPLE);
  var cur=0;
  var timer=null;
  var INTERVAL=4500;

  function fmt(n,cur){
    if(!n) return '';
    var s=Number(n).toLocaleString('tr-TR',{maximumFractionDigits:0});
    return s+' '+(cur==='EUR'?'€':'₺');
  }
  function agoStr(mins){
    if(mins<60) return mins+' dk önce';
    var h=Math.floor(mins/60);
    if(h<24) return h+' saat önce';
    return Math.floor(h/24)+' gün önce';
  }
  function tagColor(konsept){
    var blues=['Hotel','Franchise','Catering'];
    var greens=['Bulut Mutfak','Şarküteri','Kasap'];
    if(blues.indexOf(konsept)!==-1) return 'blue';
    if(greens.indexOf(konsept)!==-1) return 'green';
    return '';
  }

  function buildCards(){
    var track=document.getElementById('pfl-track');
    if(!track) return;
    track.innerHTML='';
    items.forEach(function(p,i){
      var lines=(PFL_LINE_POOL[p.konsept]||['Endüstriyel ekipman','Tezgah sistemi','Soğutma ünitesi']);
      var linesHtml=lines.map(function(l){
        return '<div class="pfl-line-row"><span class="pfl-line-ad">'+escHtml(l)+'</span><span class="pfl-line-adet">1 ad.</span></div>';
      }).join('');
      var tag=tagColor(p.konsept);
      var div=document.createElement('div');
      div.className='pfl-card'+(i===0?' pfl-active':'');
      div.setAttribute('data-idx',i);
      div.innerHTML=
        '<div class="pfl-card-top">'+
          '<div class="pfl-card-title">'+escHtml(p.baslik)+'</div>'+
          '<div class="pfl-card-no">'+escHtml(p.no)+'</div>'+
        '</div>'+
        '<div class="pfl-card-meta">'+
          '<span class="pfl-tag'+(tag?' '+tag:'')+'">'+escHtml(p.konsept)+'</span>'+
          '<span class="pfl-tag">'+escHtml(p.sehir)+'</span>'+
          '<span class="pfl-tag">'+p.alan+' m²</span>'+
        '</div>'+
        '<div class="pfl-card-lines">'+linesHtml+'</div>'+
        '<div class="pfl-card-foot">'+
          '<div class="pfl-total">'+fmt(p.toplam,p.cur)+'<small>KDV hariç · '+p.kalem+' kalem</small></div>'+
          '<div class="pfl-ago">'+agoStr(p.ago)+'</div>'+
        '</div>';
      track.appendChild(div);
    });
  }

  function buildDots(){
    var c=document.getElementById('pfl-dots');
    var cnt=document.getElementById('pfl-count');
    if(!c) return;
    c.innerHTML=items.map(function(_,i){
      return '<button class="pfl-dot'+(i===0?' on':'')+'" onclick="pflGoTo('+i+')" aria-label="'+(i+1)+'. proje"></button>';
    }).join('');
    if(cnt) cnt.textContent=items.length+' proje';
  }

  function goTo(idx,skipTimer){
    var cards=document.querySelectorAll('#pfl-track .pfl-card');
    if(!cards.length) return;
    var prev=cur;
    cur=((idx%items.length)+items.length)%items.length;
    cards[prev].classList.remove('pfl-active');
    cards[prev].classList.add('pfl-exit');
    setTimeout(function(){if(cards[prev]) cards[prev].classList.remove('pfl-exit');},480);
    cards[cur].classList.add('pfl-active');
    var dots=document.querySelectorAll('#pfl-dots .pfl-dot');
    dots.forEach(function(d,i){d.classList.toggle('on',i===cur);});
    if(!skipTimer) resetTimer();
  }

  function resetTimer(){
    clearInterval(timer);
    timer=setInterval(function(){goTo(cur+1,true);},INTERVAL);
  }

  window.pflGo=function(dir){ goTo(cur+dir); };
  window.pflGoTo=function(i){ goTo(i); };

  function init(){
    buildCards();
    buildDots();
    resetTimer();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
})();

function matchProjectsForRail(){
  const k=D.konsept;
  if(!k) return [];
  const alan=D.alan;
  return PFOS_PROJECTS.filter(function(p){
    const m=p&&p.match;
    if(!m||m.konsept!==k) return false;
    if(m.dukkan!=null&&String(m.dukkan).trim()&&D.dukkan&&String(D.dukkan).trim()&&m.dukkan!==D.dukkan) return false;
    if(alan!=null&&Number.isFinite(alan)){
      if(m.alanMin!=null&&alan<m.alanMin) return false;
      if(m.alanMax!=null&&alan>m.alanMax) return false;
    }
    return true;
  });
}

function renderPfWriters(konsept){
  const ph=document.getElementById('pf-ph-quotes');
  const list=document.getElementById('pf-writers-list');
  const rows=konsept?KONSEPT_YAZILARI[konsept]:null;
  if(!konsept||!rows||!rows.length){
    if(ph){
      ph.style.display='block';
      ph.innerHTML='<b>Henüz konsept seçilmedi.</b> Soldaki soru akışında işletme konseptinizi seçtiğinizde, bu bölümde aynı segmente yakın kısa profesyonel notlar listelenir.';
    }
    if(list){ list.style.display='none'; list.innerHTML=''; }
    return;
  }
  if(ph) ph.style.display='none';
  list.style.display='flex';
  list.innerHTML=rows.map(function(w){
    return '<article class="pf-writer-card">'+
      '<div class="pf-writer-hd">'+
        '<div class="pf-writer-av">'+(w.avatar?escHtml(w.avatar):'✍️')+'</div>'+
        '<div><div class="pf-writer-name">'+escHtml(w.isim)+'</div>'+
        '<div class="pf-writer-role">'+escHtml(w.unvan)+'</div></div>'+
      '</div>'+
      '<blockquote class="pf-writer-quote">'+escHtml(w.yazi)+'</blockquote>'+
    '</article>';
  }).join('');
}

function renderPfPdfs(){
  const ph=document.getElementById('pf-ph-pdf');
  const list=document.getElementById('pf-pdf-list');
  const konsept=D.konsept;
  if(!konsept){
    if(ph){
      ph.style.display='block';
      ph.innerHTML='<b>Henüz konsept seçilmedi.</b> Konsept (ve varsa alan aralığı) eşleştiğinde, veri tabanındaki örnek proforma ve plan PDF bağlantıları burada kart olarak görünür.';
    }
    if(list){ list.style.display='none'; list.innerHTML=''; }
      return;
  }
  const rows=matchProjectsForRail();
  if(!rows.length){
    if(ph){
      ph.style.display='block';
      ph.innerHTML='<b>Bu konsept ve filtreler için kayıtlı PDF yok.</b> <code>public/data/pfos-projects.json</code> dosyasına yeni proje ekledikçe eşleşen kartlar burada listelenir.';
    }
    if(list){ list.style.display='none'; list.innerHTML=''; }
    return;
  }
  if(ph) ph.style.display='none';
  list.style.display='grid';
  list.innerHTML=rows.map(function(p){
    const a=p.assets||{};
    const pro=a.proformaPdfUrl;
    const pln=a.planPdfUrl;
    const links=[];
    if(pro) links.push('<a href="/'+escHtml(pro)+'" target="_blank" rel="noopener">Proforma PDF</a>');
    if(pln) links.push('<a href="/'+escHtml(pln)+'" target="_blank" rel="noopener">Plan PDF</a>');
    const lm=links.length?('<div class="pf-pdf-links">'+links.join('')+'</div>'):'';
    return '<div class="pf-pdf-card">'+
      '<div class="pf-pdf-tit">'+escHtml(p.baslik||p.id||'Proje')+'</div>'+
      '<div class="pf-pdf-meta">'+(p.proformaNo?escHtml(p.proformaNo)+' · ':'')+escHtml(p.tarih||'')+'</div>'+
      lm+
    '</div>';
  }).join('');
}

const PFOS_REF_PHOTOS = {
  'Fine Dining': {
    src: '/images/pfos/suvla-kanyon-avm.png',
    title: 'Suvla Restaurant',
    caption: 'Kanyon AVM — fine dining açık mutfak ve servis hattı referansı',
  },
  Pizzacı: {
    src: '/images/pfos/suvla-kanyon-avm.png',
    title: 'Suvla Restaurant',
    caption: 'Kanyon AVM — taş fırın, hamur hazırlık ve pizza servisi referansı',
  },
};

function renderPfRefPhoto() {
  const sec = document.getElementById('pf-rail-ref');
  const card = document.getElementById('pf-ref-card');
  if (!sec || !card) return;
  const cfg = PFOS_REF_PHOTOS[D.dukkan];
  if (!cfg) {
    sec.classList.remove('vis');
    sec.hidden = true;
    card.innerHTML = '';
    return;
  }
  sec.classList.add('vis');
  sec.hidden = false;
  card.innerHTML =
    '<img src="' +
    escHtml(cfg.src) +
    '" alt="' +
    escHtml(cfg.title + ' — ' + cfg.caption) +
    '" loading="lazy" decoding="async" width="1200" height="675">' +
    '<div class="pf-ref-cap"><b>' +
    escHtml(cfg.title) +
    '</b>' +
    escHtml(cfg.caption) +
    '</div>';
}

function refreshKonseptRail(){
  renderPfRefPhoto();
  renderPfWriters(D.konsept);
  renderPfPdfs();
}

let __pfosLiveTimer = null;
let __pfosLiveGen = 0;

function pfosCanLivePreview() {
  if (!D.konsept) return false;
  const tp = document.getElementById('tablo-panel');
  const s5 = document.getElementById('s5');
  const s5c = document.getElementById('s5c');
  const s6 = document.getElementById('s6');
  if (tp && tp.classList.contains('vis')) return true;
  if (s5 && (s5.classList.contains('vis') || s5.classList.contains('done'))) return true;
  if (s5c && (s5c.classList.contains('vis') || s5c.classList.contains('done'))) return true;
  if (s6 && (s6.classList.contains('vis') || s6.classList.contains('done'))) return true;
  return false;
}

function pfosTeklifLoadingHtml(label) {
  var txt = escHtml(String(label || 'Teklif hesaplanıyor…'));
  return (
    '<div class="pfos-teklif-loading pfos-teklif-loading--card" role="status" aria-live="polite">' +
    '<div class="pfos-teklif-loading__graphic" aria-hidden="true">' +
    '<span class="pfos-teklif-loading__bar"></span>' +
    '<span class="pfos-teklif-loading__bar pfos-teklif-loading__bar--mid"></span>' +
    '<span class="pfos-teklif-loading__bar pfos-teklif-loading__bar--short"></span>' +
    '</div>' +
    '<span class="pfos-teklif-loading__label">' + txt + '</span></div>'
  );
}

function pfosSetLiveStatus(msg, busy) {
  const bar = document.getElementById('pfos-live-status');
  if (bar) {
    if (busy) {
      bar.innerHTML = pfosTeklifLoadingHtml(msg || 'Teklif hesaplanıyor…');
      bar.classList.add('pfos-live-status--busy');
    } else {
      bar.textContent = msg || '';
      bar.classList.remove('pfos-live-status--busy');
    }
  }
}

function pfosPatchLiveAmount(amt, msg) {
  const fmt = new Intl.NumberFormat('tr-TR');
  const el = document.querySelector('#s6-bd .rs-amt');
  if (el) el.textContent = fmt.format(Math.round(amt || 0)) + ' ₺';
  if (msg) pfosSetLiveStatus(msg, true);
}

function pfosSyncDraftFromUi() {
  const s6 = document.getElementById('s6');
  const useOzet =
    s6 &&
    (s6.classList.contains('vis') || s6.classList.contains('done')) &&
    document.getElementById('ozet-alan-inp');
  pfosApplyAlanFromUi(useOzet ? 'ozet' : 's5');
  D.pfosZones = pfosGetZones();
  if (document.querySelector('#stations-grid .station-inp')) {
    D.stationsM2 = pfosReadStationsM2();
  }
  return D;
}

function pfosYieldUi() {
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
  pfosPatchNakliyeUi(pfosEstimateNakliye(rows,amt));
  pfosQueueInsight('liste_guncellendi');
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
  __pfosLiveTimer=setTimeout(function(){ pfosRunLiveRecalc(); },420);
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
      if (typing) {
        pfosSetLiveStatus('Teklif hesaplanıyor…', true);
      } else {
        pfosSetLiveStatus(String(text).replace(/\*\*/g,''), false);
      }
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

// ── Sabitler ──────────────────────────────────────────────────────────────────
const MESLEKLER = ['Yatırımcı','Şef / Aşçı','Satınalmacı','Mimar','Franchise Sahibi','Söylemek İstemiyorum'];
const KONSEPTLER = ['Restaurant','Pastane & Patisserie','Cafe','Bulut Mutfak','Hotel','Bar','Catering'];

const DUKKAN = {
  Restaurant:['Fine Dining','Dünya Mutfağı','All Dining Cafe (TheHouse Cafe, Happymoons vb)','Balık Restaurant','Steakhouse','Gurme Şarküteri','Meyhane','Kebapçı','Pizzacı','Dönerci','Kafe-Kafeterya','Esnaf Lokantası','Fastfood'],
  'Pastane & Patisserie':['Artisan Bakery','Industrial Bakery'],
  Cafe:['Coffee Shop'],
  'Bulut Mutfak':['Döner','Pizza','Pide & Lahmacun','Burger','Ev Yemekleri','Kebap & Türk Mutfağı'],
  Hotel:['Şehir Oteli (Business)','Resort Otel','Dağ-Kayak Oteli','Tatil Oteli'],
  Bar:['Kokteyl Bar','Wine Bar','Beer Pub','Irish Pub','Mixology Bar','Lounge Bar'],
  Catering:['Üretim Fabrikası','Yerinde Üretim','Taşıma Yemek (Servis & Yıkama)'],
  Franchise:['Fine Dining','Dünya Mutfağı','All Dining Cafe (TheHouse Cafe, Happymoons vb)','Balık Restaurant','Steakhouse','Meyhane','Kebapçı','Pizzacı','Dönerci','Esnaf Lokantası','Fastfood'],
};

const ALT = {
  'Dünya Mutfağı':['İtalyan','Uzakdoğu','Ortadoğu','Latin'],
  'Balık Restaurant':['Mahalle Balıkçısı / Balık Lokantası','Balık Restaurantı','Seafood Bistro'],
  'Esnaf Lokantası':['Self Servis','Masaya Servis'],
  Fastfood:['Burger','Pizza','Fried Chicken','Dönerci','Pide & Lahmacun'],
  Pizzacı:['Taş Fırın','Konveyör Fırın','Hamur Hazırlık','Paket Servis'],
  Dönerci:['Dikey Kesim','Paket / Servis','Salon Servis'],
};

const NE_PISIR_V3=['Kahvaltı','Izgara','Kebap','Döner','Pizza','Pide / Lahmacun','Burger','Fried Chicken','Balık / Deniz Ürünleri','Ev Yemekleri / Sulu Yemek','Makarna','Tatlı / Pastane','Kahve / İçecek','Açık Büfe','Diğer','Bilmiyorum'];

const PISIR_OPTS = {
  Restaurant:['Izgara / Ocakbaşı','Pizza / Fırın ürünleri','Kızartma','Türk mutfağı (kebap, börek, pide)','Pasta / Tatlı','Soğuk mutfak (salata, meze)','Deniz ürünleri','Kahvaltı / Brunch','Dünya mutfağı'],
  Steakhouse:['Izgara / Ocakbaşı','Kızartma','Türk mutfağı (kebap, börek, pide)','Pasta / Tatlı','Soğuk mutfak (salata, meze)','Kahvaltı / Brunch'],
  'Gurme Şarküteri':['Soğuk mutfak (salata, meze)','Et dilimleme / şarküteri teşhir','Peynir & kahvaltılık reyonu','İçecek ağırlıklı'],
  'Kafe-Kafeterya':['İçecek ağırlıklı','Kahvaltı / Brunch','Pasta / Tatlı','Soğuk mutfak (salata, meze)'],
  Cafe:['Kahve / İçecek','Kahvaltı / Brunch','Pasta / Tatlı','Soğuk mutfak (salata, meze)'],
  'Bulut Mutfak':['Izgara / Ocakbaşı','Pizza / Fırın ürünleri','Kızartma','Türk mutfağı (kebap, börek, pide)','Deniz ürünleri','Ev Yemekleri / Sulu Yemek'],
  Hotel:['Izgara / Ocakbaşı','Pizza / Fırın ürünleri','Kızartma','Türk mutfağı (kebap, börek, pide)','Soğuk mutfak (salata, meze)','Kahvaltı / Brunch','İçecek ağırlıklı','Pasta / Tatlı','Açık Büfe'],
  'Pastane & Patisserie':['Pasta / Tatlı','Kahvaltı / Brunch','Kızartma','Soğuk mutfak (salata, meze)','Pizza / Fırın ürünleri'],
  Bar:['İçecek ağırlıklı','Soğuk mutfak (salata, meze)','Kızartma'],
  Catering:['Türk mutfağı (kebap, börek, pide)','Izgara / Ocakbaşı','Soğuk mutfak (salata, meze)','Kahvaltı / Brunch','Ev Yemekleri / Sulu Yemek'],
  Fastfood:['Burger','Pizza','Fried Chicken','Döner','Kızartma'],
  Pizzacı:['Pizza / Fırın ürünleri','Kızartma','Pasta / Tatlı','Soğuk mutfak (salata, meze)'],
  Dönerci:['Izgara / Ocakbaşı','Türk mutfağı (kebap, börek, pide)','Kızartma','Soğuk mutfak (salata, meze)'],
};

/* Adım 05 — tüm konseptlerde mutfak bölümü ızgarasında gösterilir (pfosStationLabels ile birleştirilir) */
const STATIONS_EXTRA = ['Bulaşık Yıkama', 'Bar', 'Açık Büfe'];

const STATIONS_MAP = {
  Restaurant:['Ana Mutfak','Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama','Bulaşık Yıkama','Açık Büfe'],
  Franchise:['Ana Mutfak','Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama','Bulaşık Yıkama','Açık Büfe'],
  'Fine Dining':['Ana Mutfak','Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama','Bulaşık Yıkama','Teşhir Alanı','Açık Büfe'],
  Steakhouse:['Ana Mutfak','Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama','Bulaşık Yıkama','Açık Büfe'],
  'Gurme Şarküteri':['Teşhir Alanı','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],
  Şarküteri:['Teşhir Alanı','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],
  Cafe:['Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama'],
  'Kafe-Kafeterya':['Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama'],
  'Bulut Mutfak':['Ana Mutfak','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],
  Hotel:['Ana Mutfak','Hazırlık Mutfağı','Bar','Açık Pizza','Soğuk Depolama','Depolama','Bulaşık Yıkama','Teşhir Alanı','Açık Büfe'],
  Bar:['Bar','Hazırlık Mutfağı','Soğuk Depolama','Bulaşık Yıkama'],
  Catering:['Ana Mutfak','Hazırlık Mutfağı','Bulaşık Yıkama','Soğuk Depolama','Depolama','Açık Büfe'],
  'Pastane & Patisserie':['Ana Mutfak','Hazırlık Mutfağı','Teşhir Alanı','Soğuk Depolama','Depolama'],
  Fastfood:['Ana Mutfak','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],
  Pizzacı:['Ana Mutfak','Hamur & Hazırlık','Soğuk Depolama','Depolama','Paket / Teslim'],
  Dönerci:['Ana Mutfak','Et Hazırlık','Soğuk Depolama','Depolama','Teşhir / Servis'],
  Kebapçı:['Ana Mutfak','Hazırlık Mutfağı','Soğuk Depolama','Depolama','Bulaşık Yıkama','Bar','Açık Büfe'],
  default:['Ana Mutfak','Hazırlık Mutfağı','Soğuk Depolama','Depolama','Bulaşık Yıkama','Bar','Açık Büfe'],
};

function pfosStationLabels() {
  const k =
    D.dukkan && STATIONS_MAP[D.dukkan]
      ? D.dukkan
      : STATIONS_MAP[D.konsept]
        ? D.konsept
        : 'default';
  const base = (STATIONS_MAP[k] || STATIONS_MAP.default).slice();
  STATIONS_EXTRA.forEach(function (s) {
    if (base.indexOf(s) < 0) base.push(s);
  });
  return base;
}

const ODA=['25–50 oda','50–100 oda','100–200 oda','200+ oda'];
const MENU=['Oda & Kahvaltı','A la Carte','Açık Büfe','Banket','Lounge Bar','Havuz Bar','Bar'];
const KAP_URETIM=['500–2.000 birim/gün','2.000–5.000 birim/gün','5.000–10.000 birim/gün','15–30 bin kap.'];
const KAP_YERINDE=['0–500 birim/gün','500–1.500 birim/gün','1.500–4.000 birim/gün'];
const SERV=['300 kişi','400 kişi','800 kişi','2.000+ kişi'];
const ELKGAZ=['Doğalgaz bağlantısı mevcut','Elektrik trifaze 380V mevcut','LPG kullanılacak','Hem doğalgaz hem trifaze mevcut','Bilmiyorum'];

const YARDIMCI = {
  'Fine Dining':['Gıda dilimleme makinası','Vakum makinası','Şarap dolabı','Benmari (sos)','Tartı (hassas)','Salamander'],
  Steakhouse:['Dry-aged dolabı','Et dilimleme makinası','Vakum makinası','Tartı seti','Mutfak arabası'],
  'Gurme Şarküteri':['Soğutmalı teşhir vitrin','Dilimleme makinası','Vakum makinası','Tartı seti','Benmari (sos)','Et kıyma (ilave)'],
  Şarküteri:['Soğutmalı teşhir vitrin','Dilimleme makinası','Vakum makinası','Tartı seti','Benmari (sos)','Et kıyma (ilave)'],
  'Balık Restaurant':['Balık teşhir tezgahı','Buz makinası (ilave)','Vakum makinası','Dilimleme makinası','Tartı seti'],
  Cafe:['Kahve değirmeni (reserve)','Su filtresi','Bardak yıkayıcı','Blender seti','Termos seti','Buz makinası'],
  'Kafe-Kafeterya':['Kahve değirmeni (reserve)','Su filtresi','Bardak yıkayıcı','Blender seti','Termos seti'],
  'Bulut Mutfak':['Vakum makinası','Termal çanta seti','Gıda folyo makinası','Tartı seti','Mutfak arabası'],
  Hotel:['Isıtıcı arabalar (banket)','Salata bar ekipmanları','Tabak ısıtıcı','Chafing dish seti','Termos dispenserler'],
  Bar:['Buz kırıcı (ilave)','Meyve sıkacağı','Bardak yıkayıcı','Speed rail','Kokteyl seti'],
  'Pastane & Patisserie':['Hamur yoğurma (ilave)','Dilimleme makinası','Vakum makinası','Tartı (hassas)','Teşhir vitrin','Buz makinası'],
  Meyhane:['Buz makinası (ilave)','Meze hazırlık tezgahı','Vakum makinası','Benmari seti','Tartı seti','Servis arabası'],
  'Kebapçı':['Döner motoru (yedek)','Tartı seti','Vakum makinası','Mutfak arabası','Salamander','Izgara yedek seti'],
  Catering:['Taşıma arabaları','Thermobox seti','Sarf malzeme rafı','İstif rafı seti','Çöp arabaları'],
  Fastfood:['Vakum makinası','Fritöz (yedek)','Tartı seti','Mutfak arabası','Salamander','Buz makinası'],
  Pizzacı:['Spiral hamur yoğurma','Hamur açma makinesi','Pizza tepsisi & kürek seti','Vakum makinası','Tartı seti','Buz makinası'],
  Dönerci:['Döner kesme makinesi','Et dilimleme makinesi','Vakum makinası','Tartı seti','Mutfak arabası','Salamander'],
  default:['Gıda dilimleme makinası','Vakum makinası','Tartı seti','Mutfak arabası','Bıçak sterilizatörü'],
};



// ── Ekipman Kataloğu ──────────────────────────────────────────────────────────
// Her item: {kod, ad, marka, adet, elk, gaz, pct, davlumbaz?, pfDept, pfB?, pfN? } — pf*: katalog PDP slug’ı; yoksa yalnızca departman + ?pfos_k=…
const EQ_ITEMS = {
  // Pişirme
  KNV:        {kod:'EQ-PIS-001', ad:'Kombili Konveksiyon Fırın',           marka:'Rational iCombi Pro 6-1/1', adet:1, elk:11.4, gaz:0,  pct:.22, pfDept:'pisirme'},
  IND_OCAK_6: {kod:'EQ-PIS-002', ad:'Endüstriyel Ocak (6 Gözlü)',          marka:'Öztiryakiler',              adet:1, elk:0,    gaz:36, pct:.10, pfDept:'pisirme', pfB:'ARİSCO', pfN:'Arisco 6 Gözlü Gazlı Ocak Alt Açık Dolaplı Ce Belgeli 127,5x90x90 Profesyonel Seri GR931'},
  IND_OCAK_4: {kod:'EQ-PIS-003', ad:'Endüstriyel Ocak (4 Gözlü)',          marka:'Öztiryakiler',              adet:1, elk:0,    gaz:24, pct:.08, pfDept:'pisirme', pfB:'ARİSCO', pfN:'Arisco 4 Gözlü Gazlı Ocak Alt Açık Dolaplı Ce Belgeli 85x90x90 GR921'},
  FRITOR:     {kod:'EQ-PIS-010', ad:'Fritöz (Çift Hazneli)',                marka:'Kayalar',                   adet:1, elk:18.5, gaz:0,  pct:.07, pfDept:'pisirme', pfB:'Kayalar', pfN:'Kayalar 24 Litre Fritöz Elektrikli Alt Dolaplı 80x90x85 cm KFE4090'},
  IZGARA:     {kod:'EQ-PIS-011', ad:'Izgara / Char-Broiler',                marka:'Öztiryakiler',              adet:1, elk:0,    gaz:18, pct:.06, pfDept:'pisirme', pfB:'ARİSCO', pfN:'Arisco Lavataşlı 90 lık Gazlı Profesyonel Izgara Ce Belgeli Alt Açık Dolaplı GGL921 / Lava Char Grill / Gas'},
  PIZZA_FIR:  {kod:'EQ-PIS-012', ad:'Pizza Fırını (Deck, 2 Katlı)',         marka:'Cuppone',                   adet:1, elk:9.6,  gaz:0,  pct:.09, pfDept:'pisirme'},
  PIDE_FIR:   {kod:'EQ-PIS-013', ad:'Pide / Lahmacun Fırını',              marka:'Öztiryakiler',              adet:1, elk:0,    gaz:24, pct:.08, pfDept:'pisirme'},
  PASTA_FIR:  {kod:'EQ-PIS-014', ad:'Pasta Fırını (Elektrikli, 4 Raflı)',   marka:'Unox XEBC',                 adet:1, elk:8.1,  gaz:0,  pct:.08, pfDept:'pisirme', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'Öztiryakiler Elektrikli Set Altı Fırın 60x55x61 600 Seri 7890.N1.60605.11'},
  WOK:        {kod:'EQ-PIS-015', ad:'Wok Ocak (Yüksek Devirli)',            marka:'Öztiryakiler',              adet:1, elk:0,    gaz:30, pct:.07, pfDept:'pisirme', pfB:'TURHAN ÇELİK', pfN:'Turhan Çelik Tekli Wok Ocak Gazlı 40x70x30 cm TC.7WG400'},
  BENMARI:    {kod:'EQ-PIS-016', ad:'Benmari Set (4 Bölmeli)',              marka:'Öztiryakiler',              adet:1, elk:3.6,  gaz:0,  pct:.04, pfDept:'pisirme', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'Öztiryakiler Set Üstü Benmari Elektrikli 40x90x30 GN Kaplar Hariç 900 Seri 7854.N1.40903.11'},
  SALAMANDER: {kod:'EQ-PIS-020', ad:'Salamander Izgara',                    marka:'Rational',                  adet:1, elk:3.6,  gaz:0,  pct:.04, pfDept:'pisirme', pfB:'EMPERO', pfN:'Empero Elektrikli Salamander Izgara 65x50x51 cm EMP.PSE020'},
  CHAR_BROIL: {kod:'EQ-PIS-021', ad:'Char-Broiler / Ocakbaşı Izgara',       marka:'Öztiryakiler',              adet:1, elk:0,    gaz:20, pct:.07, pfDept:'pisirme', pfB:'ARİSCO', pfN:'Arisco Lavataşlı 90 lık Gazlı Profesyonel Izgara Ce Belgeli Alt Açık Dolaplı GGL921 / Lava Char Grill / Gas'},
  SPIRAL:     {kod:'EQ-BKR-001', ad:'Spiral Hamur Yoğurma Makinası',        marka:'Papin',                     adet:1, elk:5.5,  gaz:0,  pct:.09, pfDept:'hazirlik', pfZone:'sebze_hazirlik', pfB:'BOĞAZİÇİ MAKİNE', pfN:'Boğaziçi 35 Kg Spiral Hamur Yoğurma Makinesi BSH.35'},
  HAMUR_AC:   {kod:'EQ-BKR-002', ad:'Hamur Açma Makinası',                  marka:'Papin',                     adet:1, elk:0.75, gaz:0,  pct:.04, pfDept:'hazirlik', pfZone:'sebze_hazirlik', pfB:'BOĞAZİÇİ MAKİNE', pfN:'Boğaziçi Hamur Açma Makinası Pide Lavaş Lahmacun Açma Makinesi 30 Luk BHA.30'},
  RAF_FIR:    {kod:'EQ-BKR-003', ad:'Raf Fırın (Pastry, 4 Katlı)',          marka:'Unox XVC305',               adet:1, elk:16.0, gaz:0,  pct:.12, pfDept:'pisirme', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'Öztiryakiler Elektrikli Set Altı Fırın 60x55x61 600 Seri 7890.N1.60605.11'},
  DEVIR_TEN:  {kod:'EQ-CAT-001', ad:'Devrilir Tencere (150L)',               marka:'Öztiryakiler',              adet:2, elk:0,    gaz:30, pct:.10, pfDept:'pisirme'},
  DRY_AGE:    {kod:'EQ-STK-001', ad:'Dry-Age Dolabı',                       marka:'Steak Locker',              adet:1, elk:0.4,  gaz:0,  pct:.08, pfDept:'sogutma', pfB:'ICEINOX', pfN:'Iceinox Dry Aged Buzdolabı 1 Kapılı 60x64x83 cm DAG 140'},
  // Kahve & Bar
  ESPRESSO:   {kod:'EQ-KAF-001', ad:'Espresso Makinası (2 Gruplu)',         marka:'La Marzocco Linea PB',      adet:1, elk:3.5,  gaz:0,  pct:.18, pfDept:'kahve', pfB:'ASTORİA', pfN:'Astoria Tanya R 2 Gruplu Espresso Kahve Makinesi Tam Otomatik Yüksek Şase'},
  KAH_DEG:    {kod:'EQ-KAF-002', ad:'Kahve Değirmeni',                      marka:'Mahlkönig EK43',            adet:2, elk:1.2,  gaz:0,  pct:.06, pfDept:'kahve', pfB:'FIORENZATO', pfN:'Fiorenzato Kahve Değirmeni On Demand F64E'},
  BUZ_MAK:    {kod:'EQ-ICE-001', ad:'Buz Makinası',                         marka:'Scotsman',                  adet:1, elk:1.2,  gaz:0,  pct:.04, pfDept:'sogutma', pfB:'KASTEL', pfN:'Kastel Küp Buz Makinesi 45 Kg Kapasiteli KP 45/15'},
  BLENDER:    {kod:'EQ-BAR-001', ad:'Blender / Bar Mikseri Seti',           marka:'Waring',                    adet:1, elk:1.5,  gaz:0,  pct:.03, pfDept:'kahve', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'Öztiryakiler Gürültü Önleyici Kapaklı Bar Blender CB699-D'},
  // Soğutma
  BZDL_600:   {kod:'EQ-SOG-001', ad:'Buzdolabı (Dikey, 600L)',              marka:'True TSD-1W',               adet:2, elk:0.6,  gaz:0,  pct:.08, pfDept:'sogutma', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'Öztiryakiler TAG 270 NMV Çift Kapılı Tezgah Tip Buzdolabı 79E4.27NMV.00'},
  BZDL_400:   {kod:'EQ-SOG-002', ad:'Buzdolabı (Dikey, 400L)',              marka:'True TSD-1W',               adet:1, elk:0.5,  gaz:0,  pct:.06, pfDept:'sogutma', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'Öztiryakiler TAG 270 NMV Çift Kapılı Tezgah Tip Buzdolabı 79E4.27NMV.00'},
  ET_DLBI:    {kod:'EQ-SOG-003', ad:'Et Teşhir Dolabı',                     marka:'Arneg',                     adet:2, elk:0.8,  gaz:0,  pct:.10, pfDept:'sogutma', pfB:'SAYL', pfN:'Sayl Shark Line Sushi Soğuk Teşhir Dolabı Tepsisiz  143x39x27 Cm SK6SP'},
  SARAP_DL:   {kod:'EQ-SOG-004', ad:'Şarap Dolabı',                         marka:'Liebherr',                  adet:1, elk:0.3,  gaz:0,  pct:.05, pfDept:'sogutma', pfB:'ELECTROLUX', pfN:'Electrolux Şarap Dolabı 1 Cam Kapılı 170 Şişe Kapasiteli 720011'},
  BAR_BZDL:   {kod:'EQ-SOG-005', ad:'Bar Altı Buzdolabı',                   marka:'True TBB-24-48',            adet:2, elk:0.4,  gaz:0,  pct:.05, pfDept:'sogutma', pfB:'ICEINOX', pfN:'Iceinox Tezgah Tipi Buzdolabı 2 Kapılı 150x70x85 CTS 330 CR'},
  SOG_TEZ:    {kod:'EQ-SOG-010', ad:'Soğutmalı Hazırlık Tezgahı',           marka:'True TPP-27',               adet:1, elk:0.5,  gaz:0,  pct:.05, pfDept:'sogutma', pfB:'ICEINOX', pfN:'Iceinox 2 Kapılı Hazırlık Buzdolabı 150x70x130 cm FTS 330 CR'},
  VAKUM:      {kod:'EQ-YRD-001', ad:'Vakum Makinası',                       marka:'Henkelman',                 adet:1, elk:0.9,  gaz:0,  pct:.03, pfDept:'hazirlik', pfZone:'sebze_hazirlik', pfB:'EMPERO', pfN:'Empero Vakum Makinesi Profesyonel Vakum Paketleme Makinesi EMP.VCM.01'},
  // Yıkama
  BULASIK_T:  {kod:'EQ-YIK-001', ad:'Bulaşık Makinası (Tünel Tipi)',        marka:'Winterhalter PT Series',    adet:1, elk:8.7,  gaz:0,  pct:.09, pfDept:'yikama', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'Öztiryakiler Bulaşık Makinesi Dijital Programlı OBY500DETR Profesyonel oby500detr'},
  BULASIK_K:  {kod:'EQ-YIK-002', ad:'Bulaşık Makinası (Sepet Tipi)',        marka:'Winterhalter UC Series',    adet:1, elk:4.5,  gaz:0,  pct:.06, pfDept:'yikama', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'Öztiryakiler Bulaşık Makinesi Dijital Programlı OBY500DETR Profesyonel oby500detr'},
  BARDAK_YIK: {kod:'EQ-YIK-003', ad:'Bardak Yıkayıcı (Undercounter)',       marka:'Winterhalter GS315',        adet:1, elk:2.1,  gaz:0,  pct:.04, pfDept:'yikama', pfB:'Öztiryakiler Endüstriyel Mutfak', pfN:'BARDAK YIKAMA MAKINASI MEKANIK, (35x35 cm) OBY 500 B Plus PDT 073M.11010.AD'},
  // Davlumbaz
  DAV_B:      {kod:'EQ-DAV-001', ad:'Davlumbaz (Egzoz + Kompanzasyon)',     marka:'Öztiryakiler',              adet:1, elk:2.2,  gaz:0,  pct:.06, davlumbaz:true, pfDept:'pisirme'},
  DAV_K:      {kod:'EQ-DAV-002', ad:'Davlumbaz (Küçük, Egzoz)',             marka:'Öztiryakiler',              adet:1, elk:0.75, gaz:0,  pct:.03, davlumbaz:true, pfDept:'pisirme'},
  // Tezgah & Hazırlık
  TEZ_2:      {kod:'EQ-TEZ-001', ad:'Çalışma Tezgahı (Paslanmaz)',          marka:'İmalatçı',                  adet:2, elk:0,    gaz:0,  pct:.04, pfDept:'hazirlik', pfZone:'sebze_hazirlik'},
  TEZ_4:      {kod:'EQ-TEZ-002', ad:'Çalışma Tezgahı (Paslanmaz)',          marka:'İmalatçı',                  adet:4, elk:0,    gaz:0,  pct:.05, pfDept:'hazirlik', pfZone:'sebze_hazirlik'},
  // Kasap
  KEM_TES:    {kod:'EQ-KSP-001', ad:'Kemik Testeresi',                      marka:'Biro',                      adet:1, elk:0.75, gaz:0,  pct:.06, pfDept:'hazirlik', pfZone:'et_hazirlik', pfB:'BOĞAZİÇİ MAKİNE', pfN:'Boğaziçi Et Kemik Testeresi BKT.1840'},
  ET_KIYMA:   {kod:'EQ-KSP-002', ad:'Et Kıyma Makinası',                   marka:'Tre Spade',                 adet:1, elk:1.5,  gaz:0,  pct:.07, pfDept:'hazirlik', pfZone:'et_hazirlik', pfB:'BOĞAZİÇİ MAKİNE', pfN:'Boğaziçi 22 No Paslanmaz Kıyma Makinası BKM.22'},
};

/** Pişirme seçenekleri — boşluk / Unicode birleşimi farkında eşleşme */
function pisirEq(p, label){
  const t = String(label).trim();
  const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ').normalize('NFKC');
  const nt = norm(t);
  return p.some((v) => norm(v) === nt);
}


// ── PFOS v2: katalog fiyat çözümleyici ───────────────────────────────────────
window.__PFOS_CATALOG_POOL__ = [];
window.__PFOS_CATALOG_READY__ = false;

function pfosNormPoolItem(x) {
  if (!x) return null;
  const raw = x.raw || x;
  return {
    brand: raw.brand || x.b || '',
    name: raw.name || x.n || '',
    category: raw.category || x.c || '',
    price: raw.price || x.p || '',
    equstoPage: raw.equstoPage || x.equstoPage || '',
    images: raw.images || x.images || [],
    specs: raw.specs || x.specs || '',
    b: raw.brand || x.b || '',
    n: raw.name || x.n || '',
    c: raw.category || x.c || '',
    p: raw.price || x.p || '',
    raw: raw,
  };
}

function pfosLoadTipShopLinks() {
  if (window.__PFOS_TIP_SHOP_LINKS__) return Promise.resolve();
  return fetch('/data/pfos-tip-shop-links.json', { cache: 'default' })
    .then(function (r) {
      if (!r.ok) return {};
      return r.json();
    })
    .then(function (j) {
      window.__PFOS_TIP_SHOP_LINKS__ = (j && j.links) || {};
    })
    .catch(function () {
      window.__PFOS_TIP_SHOP_LINKS__ = {};
    });
}

function pfosEnsureCatalogPool() {
  if (window.__PFOS_CATALOG_READY__) return Promise.resolve();
  function applyList(all) {
    const list = Array.isArray(all) ? all : [];
    window.__PFOS_CATALOG_POOL__ = list.map(pfosNormPoolItem).filter(Boolean);
    if (window.EqustoPfosCalc && typeof EqustoPfosCalc.rebuildShopIndex === 'function') {
      EqustoPfosCalc.rebuildShopIndex(window.__PFOS_CATALOG_POOL__);
    }
    window.__PFOS_CATALOG_READY__ = true;
  }
  function loadAll() {
    if (window.EqustoShopCatalog && typeof EqustoShopCatalog.loadMergedCatalog === 'function') {
      return EqustoShopCatalog.loadMergedCatalog();
    }
    if (window.EqustoShopCatalog && typeof EqustoShopCatalog.load === 'function') {
      return EqustoShopCatalog.load();
    }
    if (window.EqustoEcomData && typeof EqustoEcomData.loadEkipmanlar === 'function') {
      return EqustoEcomData.loadEkipmanlar();
    }
    return Promise.reject(new Error('katalog yükleyici yok'));
  }
  return Promise.all([loadAll(), pfosLoadTipShopLinks()])
    .then(function (results) { applyList(results[0]); })
    .catch(function () {
      window.__PFOS_CATALOG_POOL__ = [];
      window.__PFOS_CATALOG_READY__ = true;
    });
}

function pfosEnrichRows(rows) {
  const pool = window.__PFOS_CATALOG_POOL__ || [];
  if (window.EqustoPfosCalc && typeof EqustoPfosCalc.enrichRowsShopLinks === 'function') {
    return EqustoPfosCalc.enrichRowsShopLinks(rows, pool);
  }
  return rows || [];
}

function pfosNorm(s) {
  return String(s == null ? '' : s).trim().toLocaleLowerCase('tr');
}

function pfosFindCatalogProduct(row) {
  if (window.EqustoPfosCalc && typeof EqustoPfosCalc.findShopMatch === 'function') {
    return EqustoPfosCalc.findShopMatch(row, window.__PFOS_CATALOG_POOL__ || []);
  }
  return null;
}

function pfosParsePriceTL(raw) {
  if (window.EqustoEngine && typeof EqustoEngine.parsePriceTL === 'function') {
    return EqustoEngine.parsePriceTL(raw);
  }
  const s = String(raw || '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3})/g, '')
    .replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function pfosPriceRows(rows) {
  if (
    window.EqustoPfosPricing &&
    EqustoPfosPricing.allRowsNetPriced &&
    EqustoPfosPricing.allRowsNetPriced(rows)
  ) {
    return EqustoPfosPricing.priceRowsNet(rows);
  }
  const target = tahmini();
  if (window.EqustoPfosPricing && typeof EqustoPfosPricing.priceRows === 'function') {
    return EqustoPfosPricing.priceRows(rows, target);
  }
  return rows || [];
}

function pfosQuoteTotal(rows) {
  const sum = (rows || []).reduce(
    (a, r) => a + (Number(r.birim) || 0) * (Number(r.adet) || 1),
    0
  );
  if (
    sum > 0 &&
    window.EqustoPfosPricing &&
    EqustoPfosPricing.allRowsNetPriced &&
    EqustoPfosPricing.allRowsNetPriced(rows)
  ) {
    return sum;
  }
  if (window.EqustoPfosPricing && typeof EqustoPfosPricing.quoteTotal === 'function') {
    return EqustoPfosPricing.quoteTotal(rows, tahmini());
  }
  return sum > 0 ? sum : tahmini();
}

function pfosCapacityBand(alan) {
  const a = Number(alan) || 0;
  if (a >= 220) return 'XL';
  if (a >= 150) return 'L';
  if (a >= 90) return 'M';
  return 'S';
}

function pfosIsSteakhouseCtx() {
  return D.konsept === 'Steakhouse' || D.dukkan === 'Steakhouse';
}

function pfosIsPizzaciCtx() {
  return D.dukkan === 'Pizzacı';
}

function pfosIsDonerciCtx() {
  return D.dukkan === 'Dönerci';
}

function pfosStripKods(list, kods) {
  const drop = new Set(kods || []);
  return list.filter((r) => !drop.has(r.kod));
}

function pfosCloneEqItem(key) {
  const it = EQ_ITEMS[key];
  if (!it) return null;
  return Object.assign({}, it);
}

function pfosEnsureEqKey(list, key) {
  const it = pfosCloneEqItem(key);
  if (!it) return list;
  if (list.some((r) => r.kod === it.kod)) return list;
  return list.concat([it]);
}

function pfosSetAdetByKod(list, kod, adet) {
  const n = Math.max(1, Math.round(Number(adet) || 1));
  return list.map((r) => (r.kod === kod ? Object.assign({}, r, { adet: n }) : r));
}

function pfosPostProcessItems(rows) {
  let list = (rows || []).map((r) => Object.assign({}, r));
  const band = pfosCapacityBand(D.alan);
  const steak = pfosIsSteakhouseCtx();

  if (list.some((r) => r.kod === 'EQ-DAV-001')) {
    list = list.filter((r) => r.kod !== 'EQ-DAV-002');
  }

  if (pfosIsPizzaciCtx() || pfosIsDonerciCtx()) {
    list = pfosStripKods(list, ['EQ-PIS-001', 'EQ-PIS-002', 'EQ-YIK-001']);
  }

  if (pfosIsPizzaciCtx()) {
    list = pfosEnsureEqKey(list, 'PIZZA_FIR');
    list = pfosEnsureEqKey(list, 'SPIRAL');
    list = pfosEnsureEqKey(list, 'HAMUR_AC');
    list = pfosEnsureEqKey(list, 'BULASIK_K');
    if (band === 'S') {
      list = pfosStripKods(list, ['EQ-SOG-001']);
      list = pfosEnsureEqKey(list, 'BZDL_400');
      list = pfosSetAdetByKod(list, 'EQ-TEZ-002', 3);
    } else if (band === 'M') {
      list = pfosSetAdetByKod(list, 'EQ-SOG-001', 2);
      list = pfosSetAdetByKod(list, 'EQ-TEZ-002', 4);
    } else if (band === 'L' || band === 'XL') {
      list = pfosStripKods(list, ['EQ-YIK-002']);
      list = pfosEnsureEqKey(list, 'BULASIK_T');
      list = pfosSetAdetByKod(list, 'EQ-SOG-001', band === 'XL' ? 3 : 2);
      list = pfosSetAdetByKod(list, 'EQ-TEZ-002', band === 'XL' ? 6 : 5);
      if (band === 'XL') list = pfosSetAdetByKod(list, 'EQ-PIS-012', 2);
    }
  }

  if (pfosIsDonerciCtx()) {
    list = pfosEnsureEqKey(list, 'IZGARA');
    list = pfosEnsureEqKey(list, 'PIDE_FIR');
    if (band === 'L' || band === 'XL') {
      list = pfosSetAdetByKod(list, 'EQ-SOG-001', 2);
    }
  }

  if (steak) {
    list = pfosEnsureEqKey(list, 'KEM_TES');
    list = pfosEnsureEqKey(list, 'VAKUM');
    if (band === 'M') {
      list = pfosSetAdetByKod(list, 'EQ-STK-001', 2);
      list = pfosSetAdetByKod(list, 'EQ-SOG-001', 3);
      list = pfosSetAdetByKod(list, 'EQ-PIS-021', 2);
    }
    if (band === 'L') {
      list = pfosEnsureEqKey(list, 'ET_DLBI');
      list = pfosEnsureEqKey(list, 'SALAMANDER');
      list = pfosReplaceTezKey(list, 'TEZ_4');
      list = pfosSetAdetByKod(list, 'EQ-STK-001', 2);
      list = pfosSetAdetByKod(list, 'EQ-SOG-001', 4);
      list = pfosSetAdetByKod(list, 'EQ-PIS-021', 2);
      list = pfosSetAdetByKod(list, 'EQ-PIS-001', 2);
      list = pfosSetAdetByKod(list, 'EQ-PIS-002', 2);
      list = pfosSetAdetByKod(list, 'EQ-SOG-010', 2);
    }
    if (band === 'XL') {
      list = pfosEnsureEqKey(list, 'ET_DLBI');
      list = pfosEnsureEqKey(list, 'SALAMANDER');
      list = pfosReplaceTezKey(list, 'TEZ_4');
      list = pfosSetAdetByKod(list, 'EQ-STK-001', 3);
      list = pfosSetAdetByKod(list, 'EQ-SOG-001', 6);
      list = pfosSetAdetByKod(list, 'EQ-PIS-021', 3);
      list = pfosSetAdetByKod(list, 'EQ-PIS-001', 2);
      list = pfosSetAdetByKod(list, 'EQ-PIS-002', 2);
      list = pfosSetAdetByKod(list, 'EQ-SOG-010', 3);
      list = pfosSetAdetByKod(list, 'EQ-SOG-003', 2);
      list = pfosSetAdetByKod(list, 'EQ-DAV-001', 2);
    }
  }

  return list;
}

function pfosReplaceTezKey(list, key) {
  const tez = pfosCloneEqItem(key);
  if (!tez) return list;
  list = list.filter((r) => r.kod !== 'EQ-TEZ-001' && r.kod !== 'EQ-TEZ-002');
  return list.concat([tez]);
}

// ── Ekipman listesi: pfos-rule-engine.js + EQ_ITEMS (admin kurallarıyla senkron) ─
function buildEkipmanList() {
  const zones = typeof pfosGetZones === 'function' ? pfosGetZones() : [];
  const alan = Number(D.alan) || 0;
  if (
    window.EqustoPfosCalc &&
    EqustoPfosCalc.isCatalogReady &&
    EqustoPfosCalc.isCatalogReady() &&
    typeof EqustoPfosCalc.generateQuote === 'function'
  ) {
    const quote = EqustoPfosCalc.generateQuote(alan, zones);
    let list = EqustoPfosCalc.quoteToRows(quote);
    list = pfosEnrichRows(list);
    return pfosPostProcessCatalogItems(list);
  }
  const ctx = {
    konsept: typeof pfosKonseptLegacy==='function' ? pfosKonseptLegacy(D.konsept) : D.konsept,
    dukkan: D.dukkan || '',
    alt: D.alt || '',
    pisir: D.pisir || [],
    alan: D.alan,
  };
  let rows = [];
  if (window.EqustoPfosRuleEngine && typeof EqustoPfosRuleEngine.buildList === 'function') {
    rows = EqustoPfosRuleEngine.buildList(ctx, EQ_ITEMS);
  }
  let list = pfosPostProcessItems(rows);
  if (window.EqustoPfosCalc && typeof EqustoPfosCalc.applyM2ToRows === 'function') {
    list = EqustoPfosCalc.applyM2ToRows(list, D.alan);
  }
  return pfosEnrichRows(list);
}

/** Katalog modunda konsept/dükkan filtreleri (Pizzacı vb.) */
function pfosPostProcessCatalogItems(list) {
  let out = (list || []).slice();
  if (pfosIsPizzaciCtx()) {
    const drop = new Set([
      'Kombi fırın (Rational)',
      'Dört alevli ocak',
      'Giyotin bulaşık makinesi',
    ]);
    out = out.filter((r) => !drop.has(r.ad));
  }
  if (pfosIsDonerciCtx()) {
    out = out.filter((r) => r.ad !== 'Kombi fırın (Rational)');
  }
  return out;
}

/** tr-adres yüklenmezse yedek; 81 il, nüfusa göre büyükten küçüğe */
const SEHIRLER=[
  'İstanbul',
  'Ankara',
  'İzmir',
  'Bursa',
  'Antalya',
  'Konya',
  'Adana',
  'Şanlıurfa',
  'Gaziantep',
  'Kocaeli',
  'Mersin',
  'Diyarbakır',
  'Hatay',
  'Manisa',
  'Kayseri',
  'Samsun',
  'Balıkesir',
  'Tekirdağ',
  'Aydın',
  'Van',
  'Kahramanmaraş',
  'Sakarya',
  'Muğla',
  'Denizli',
  'Eskişehir',
  'Mardin',
  'Trabzon',
  'Ordu',
  'Afyonkarahisar',
  'Erzurum',
  'Malatya',
  'Sivas',
  'Batman',
  'Tokat',
  'Adıyaman',
  'Elazığ',
  'Zonguldak',
  'Kütahya',
  'Şırnak',
  'Çanakkale',
  'Osmaniye',
  'Çorum',
  'Ağrı',
  'Giresun',
  'Isparta',
  'Aksaray',
  'Yozgat',
  'Edirne',
  'Düzce',
  'Muş',
  'Kastamonu',
  'Kırklareli',
  'Niğde',
  'Uşak',
  'Bitlis',
  'Rize',
  'Siirt',
  'Amasya',
  'Bolu',
  'Nevşehir',
  'Yalova',
  'Hakkari',
  'Kırıkkale',
  'Bingöl',
  'Kars',
  'Burdur',
  'Karaman',
  'Karabük',
  'Kırşehir',
  'Erzincan',
  'Sinop',
  'Bilecik',
  'Iğdır',
  'Bartın',
  'Çankırı',
  'Artvin',
  'Kilis',
  'Gümüşhane',
  'Ardahan',
  'Tunceli',
  'Bayburt'
];

const FRANCHISE_DB = {
  "McDonald's":true,"Starbucks":true,"Burger King":true,"KFC":true,"Domino's":true,
  "Pizza Hut":true,"Subway":true,"Popeyes":true,"Sbarro":true,"Tim Hortons":true,
  "Arby's":true,"Five Guys":true,"Shake Shack":true,"Häagen-Dazs":true,
  "Caribou Coffee":true,"Gloria Jean's":true,"Kahve Dünyası":true,
  "Simit Sarayı":true,"Köfteci Yusuf":true,"Lahmacun Evi":true,
};

const SEC_ORDER=['s1','s2','s5','s3','sfr','s4','s4b','s4c','s4d','s4e','s5c','s6','s6a','s6b','s6c','s6d'];
const PFOS_ALAN_PRESETS=[60,80,100,120,150,200,300,450];

// ── State ─────────────────────────────────────────────────────────────────────
const D={pisir:[],menu:[],elkgaz:[],yardimci:[],provinceId:null,districtId:null,pfosZones:null,lokasyon:null,nakliye:null};
let __pfosInsightTimer=null;
function pfosGetLokasyon(){
  if(window.EqustoPfosLocation&&typeof EqustoPfosLocation.readFromDom==='function'){
    return EqustoPfosLocation.readFromDom(D);
  }
  return { sehir:D.sehir||'', ilce:'', bolge:'marmara', bolge_katsayi:1 };
}
function pfosEstimateNakliye(rows,ekipmanToplam){
  var lok=pfosGetLokasyon();
  if(window.EqustoPfosLocation&&typeof EqustoPfosLocation.estimateNakliye==='function'){
    return EqustoPfosLocation.estimateNakliye({
      lokasyon:lok,
      rows:rows||[],
      alan_m2:D.alan,
      ekipman_toplam_tl:ekipmanToplam!=null?ekipmanToplam:pfosQuoteTotal(rows||[]),
    });
  }
  return { tutar:0, gecerli:false, not:'' };
}
function pfosPatchNakliyeUi(nak){
  var el=document.getElementById('pfos-nakliye-est');
  if(!el) return;
  if(!nak||!nak.gecerli){
    el.style.display='none';
    el.innerHTML='';
    return;
  }
  var fmt=new Intl.NumberFormat('tr-TR');
  el.style.display='block';
  el.innerHTML='Tahmini nakliye + montaj: <b>'+fmt.format(nak.tutar)+' ₺</b> (KDV hariç) · '+escHtml(nak.not||'');
}
function pfosQueueInsight(event){
  if(!D.sehir) return;
  clearTimeout(__pfosInsightTimer);
  __pfosInsightTimer=setTimeout(function(){ pfosSendInsight(event); }, 1400);
}
function pfosSendInsight(event){
  if(!D.sehir||!window.EqustoPfosLocation) return;
  pfosSyncDraftFromUi();
  var rows=pfosPriceRows(buildEkipmanList());
  var amt=pfosQuoteTotal(rows);
  var lok=pfosGetLokasyon();
  var nak=pfosEstimateNakliye(rows,amt);
  D.lokasyon=lok;
  D.nakliye=nak;
  var payload=EqustoPfosLocation.buildInsightPayload({
    event:event||'proje_anlik',
    D:D,
    lokasyon:lok,
    rows:rows,
    nakliye:nak,
    bolgeler:typeof pfosGetZones==='function'?pfosGetZones():[],
    ekipman_toplam_tl:amt,
  });
  fetch(__pfApiBase()+'/pfos-insights',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload),
    keepalive:true,
  }).catch(function(){});
  pfosPatchNakliyeUi(nak);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/\\/g,'\\\\')
    .replace(/'/g,"\\'")
    .replace(/"/g,'&quot;');
}

function pfMobileMq(){return window.matchMedia('(max-width:767px)');}
function pfMobileSyncLoc(){
  const seh=(D.sehir||'').trim()||(document.getElementById('sehir-inp')||{}).value.trim();
  const ilce=(document.getElementById('adres-ilce')||{}).value.trim();
  const mah=(document.getElementById('adres-mahalle')||{}).value.trim();
  const cad=(document.getElementById('adres-cadde')||{}).value.trim();
  var loc='İstanbul, Türkiye';
  if(seh&&ilce&&mah&&cad) loc=ilce+' · '+seh;
  else if(seh&&ilce&&mah) loc=ilce+' · '+seh;
  else if(seh&&ilce) loc=ilce+', '+seh;
  else if(seh) loc=seh+', Türkiye';
  else loc='Teslimat adresi seçin';
  var hdrVal=document.getElementById('pf-hdr-loc-val');
  if(hdrVal) hdrVal.textContent=loc;
  var barTxt=document.getElementById('pf-m-locbar-txt');
  if(barTxt) barTxt.textContent=loc;
  if(typeof window.equstoRefreshDeliveryHeader==='function') window.equstoRefreshDeliveryHeader();
}
function pfMobileScrollTo(id){
  const el=document.getElementById(id);
  if(!el) return;
  const off=pfMobileMq().matches?112:0;
  const y=el.getBoundingClientRect().top+window.scrollY-off;
  window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
}
function pfMobilePrimary(){
  const active=document.querySelector('.sec.active')||document.querySelector('.sec.vis');
  if(!active){ pfMobileScrollTo('s1'); return; }
  const btn=active.querySelector('.btn.gold');
  if(btn) btn.click();
  else if(active.id==='s2') void sehirOnayla();
  else pfMobileScrollTo(active.id);
}
function pfMobileSyncCta(){
  const cta=document.getElementById('pf-m-cta');
  if(!cta) return;
  const s6=document.getElementById('s6');
  if(s6&&s6.classList.contains('vis')&&!s6.classList.contains('done')){ cta.textContent='Özet'; return; }
  const act=document.querySelector('.sec.active');
  if(act&&act.id==='s5c'){ cta.textContent='Özete geç'; return; }
  cta.textContent='Devam';
}
function pfMobileOpenLoc(){
  if(!document.getElementById('s2').classList.contains('vis')){ reveal('s2'); activate('s2'); }
  pfMobileScrollTo('s2');
  setTimeout(function(){ const inp=document.getElementById('sehir-inp'); if(inp) inp.focus(); },320);
}
function pfMobileInit(){
  const locBtn=document.getElementById('pf-m-locbar-btn');
  if(locBtn) locBtn.addEventListener('click',pfMobileOpenLoc);
  const hdrLoc=document.getElementById('pf-hdr-loc');
  if(hdrLoc) hdrLoc.addEventListener('click',pfMobileOpenLoc);
  const cta=document.getElementById('pf-m-cta');
  if(cta) cta.addEventListener('click',pfMobilePrimary);
  document.querySelectorAll('[data-pf-goto]').forEach(function(btn){
    btn.addEventListener('click',function(){
      const g=btn.getAttribute('data-pf-goto');
      if(g==='home'){ if(typeof eqGo==='function') eqGo('home'); else location.href='/'; }
      else if(g==='wizard') pfMobileScrollTo('pf-progress-wrap');
      else if(g==='ref') pfMobileScrollTo('pfl-feed');
    });
  });
  pfMobileSyncLoc();
  pfMobileSyncCta();
}

function reveal(id){
  const el=document.getElementById(id);
  if(!el||el.classList.contains('vis')) return;
  el.classList.add('vis');
  setTimeout(function(){
    if(pfMobileMq().matches) pfMobileScrollTo(id);
    else el.scrollIntoView({behavior:'smooth',block:'start'});
  },120);
  document.getElementById('warn-box').style.display='block';
  refreshWizardHint();
  pfMobileSyncCta();
}

function done(id){const el=document.getElementById(id);if(el){el.classList.remove('active');el.classList.add('done');}refreshWizardHint();pfMobileSyncCta();}
function activate(id){const el=document.getElementById(id);if(el)el.classList.add('active');pfMobileSyncCta();}

function hideFrom(id){
  const idx=SEC_ORDER.indexOf(id);
  if(idx<0)return;
  SEC_ORDER.slice(idx).forEach(sid=>{
    const el=document.getElementById(sid);
    if(el)el.classList.remove('vis','active','done');
  });
}

function selOpts(cid,val){
  document.querySelectorAll(`#${cid} .opt`).forEach(b=>{
    const dv=b.getAttribute('data-v');
    const match=dv!=null&&dv!==''?dv===val:b.textContent.trim()===val;
    b.classList.toggle('sel',match);
  });
}

function mkOpts(list,fn,selVal,extra=''){
  return `<div class="og${extra}">${(list||[]).map(v=>
    `<button type="button" class="opt${v===selVal?' sel':''}" data-v="${esc(v)}" onclick="${fn}('${esc(v)}')">${v}</button>`
  ).join('')}</div>`;
}

function pfosFillOpts(hostId,list,fn,selVal,extra){
  var host=document.getElementById(hostId);
  if(!host) return;
  host.innerHTML=mkOpts(list,fn,selVal,extra);
}

// ── Türkiye adres (yerel tr-adres.json — TurkiyeAPI yok) ─────────────────────
let TR_PROVINCES=[];
let TR_ADRES_OK=false;
const DISTRICTS_CACHE={};
const NEIGHBORHOODS_CACHE={};

function eqAdres(){
  return window.EqustoAdresNational||null;
}
function pfosLoadAddressPatches(){
  if(window.__PFOS_ADDR_PATCHES__) return Promise.resolve();
  return fetch('/data/pfos-address-patches.json',{cache:'default'})
    .then(function(r){return r.ok?r.json():{};})
    .then(function(j){
      window.__PFOS_ADDR_PATCHES__=true;
      if(j&&j.CADDELER_BY_ILCE) Object.assign(CADDELER_BY_ILCE,j.CADDELER_BY_ILCE);
      if(j&&j.CADDELER) Object.assign(CADDELER,j.CADDELER);
      if(j&&j.SOKAKLAR_BY_ILCE) Object.assign(SOKAKLAR_BY_ILCE,j.SOKAKLAR_BY_ILCE);
      if(j&&j.SOKAKLAR) Object.assign(SOKAKLAR,j.SOKAKLAR);
    })
    .catch(function(){window.__PFOS_ADDR_PATCHES__=true;});
}
async function initTrAdres(){
  const E=eqAdres();
  if(!E||typeof E.init!=='function'){ TR_PROVINCES=[]; TR_ADRES_OK=false; return pfosLoadAddressPatches(); }
  await Promise.all([E.init(),pfosLoadAddressPatches()]);
  TR_PROVINCES=E.getProvinces();
  TR_PROVINCES.sort((a,b)=>(Number(b.population)||0)-(Number(a.population)||0));
  TR_ADRES_OK=TR_PROVINCES.length>0;
}

function loadDistrictsForProvince(pid){
  if(DISTRICTS_CACHE[pid]) return Promise.resolve(DISTRICTS_CACHE[pid]);
  const E=eqAdres();
  const rows=E&&pid?E.getDistricts(pid):[];
  DISTRICTS_CACHE[pid]=rows;
  return Promise.resolve(rows);
}

function loadNeighborhoodsForDistrict(did){
  if(NEIGHBORHOODS_CACHE[did]) return Promise.resolve(NEIGHBORHOODS_CACHE[did]);
  const E=eqAdres();
  const names=E&&did?E.getNeighborhoodNames(did):[];
  const rows=names.map(n=>({id:did+'-'+n,name:n}));
  NEIGHBORHOODS_CACHE[did]=rows;
  return Promise.resolve(rows);
}

function findProvinceFromSehirName(name){
  const E=eqAdres();
  if(E&&typeof E.findProvinceByName==='function') return E.findProvinceByName(name);
  if(!name||!TR_PROVINCES.length) return null;
  const t=String(name).trim();
  const tl=t.toLocaleLowerCase('tr-TR');
  return TR_PROVINCES.find(x=>x.name===t||x.name.toLocaleLowerCase('tr-TR')===tl)||null;
}

async function applyProvinceFromSehir(){
  const p=findProvinceFromSehirName(D.sehir);
  D.provinceId=p?p.id:null;
  D.districtId=null;
  if(D.provinceId) await loadDistrictsForProvince(D.provinceId);
}

// ── Adım rehberi + modal ───────────────────────────────────────────────────────
function refreshWizardHint(){
  const box=document.getElementById('pf-step-hint');
  const bar=document.getElementById('pf-progress-fill');
  if(!box) return;
  let pct=12,title='<b>Başlayalım</b>',sub='Soldaki <b>ilk kutuya</b> dokunun — kısa bir rol sorusu.';
  const g=id=>document.getElementById(id);
  if(g('s6')&&g('s6').classList.contains('done')){
    pct=100;
    title='<b>Tebrikler</b>';
    sub='Özetiniz hazır. Aşağıdan listeyi yazdırabilir veya tek tıkla ekibimize e-posta gönderebilirsiniz.';
  }else if(g('s6')&&g('s6').classList.contains('vis')&&!g('s6').classList.contains('done')){
    pct=82;
    title='<b>Tahmini tutar</b>';
    sub='<b>Teklifi Oluştur</b> veya <b>Detaylandır</b> ile listeyi görün; isterseniz özette m² değerini tekrar düzenleyebilirsiniz.';
  }else if(g('s5c')&&g('s5c').classList.contains('vis')&&!g('s5c').classList.contains('done')){
    pct=74;
    title='<b>Mutfak kategorileri</b>';
    sub='İşletme türü tamam. Listede yer alacak bölümleri işaretleyin; <b>Devam</b> ile özete geçilir.';
  }else if(g('s4')&&g('s4').classList.contains('vis')&&!g('s4').classList.contains('done')){
    pct=58;
    title='<b>Dükkan türü</b>';
    sub='Konseptinize uygun işletme alt tipini seçin; ardından mutfak kategorileri gelir.';
  }else if(g('s3')&&g('s3').classList.contains('done')){
    pct=62;
    title='<b>İşletme detayı</b>';
    sub='Dükkan türü ve varsa ek soruları tamamlayın; ardından mutfak kategorileri ve özet gelir.';
  }else if(g('s3')&&g('s3').classList.contains('vis')&&!g('s3').classList.contains('done')){
    pct=42;
    title='<b>İşletme türü</b>';
    sub='Ne açacağınızı seçin; birkaç ek soru çıkabilir — hepsi listeden. Emin olmadığınız yerde en yakın seçenek yeterli.';
  }else if(g('s5')&&g('s5').classList.contains('vis')&&!g('s5').classList.contains('done')){
    pct=34;
    title='<b>Toplam alan</b>';
    sub='Metrekare yazın; <b>Devam</b> veya Enter ile işletme türüne geçilir. İsterseniz bölüm m² paylarını da dağıtabilirsiniz.';
  }else if(g('s2')&&g('s2').classList.contains('done')){
    pct=26;
    title='<b>Toplam alan</b>';
    sub='Adres tamam. Şimdi mutfak veya işletmenin <b>toplam m²</b> tahminini yazın.';
  }else if(g('s1')&&g('s1').classList.contains('done')){
    pct=18;
    title='<b>Şehir ve adres</b>';
    sub='İl yazıp listeden seçin. İlçe, mahalle ve cadde tamamlanınca <b>otomatik olarak sonraki soruya geçilir</b>.';
  }
  box.innerHTML=title+'<small>'+sub+'</small>';
  if(bar) bar.style.width=pct+'%';
}

function pfModalKapat(){ document.getElementById('pf-modal').classList.remove('vis'); }
function pfModalAc(tit,body,showPrint){
  document.getElementById('pf-modal-title').textContent=tit;
  document.getElementById('pf-modal-body').textContent=body;
  document.getElementById('pf-modal-primary').style.display=showPrint?'inline-block':'none';
  document.getElementById('pf-modal').classList.add('vis');
}

const KONSEPT_ROWS=[
  {v:'Restaurant',label:'Restaurant',desc:'Fine dining, steakhouse, balık, kebap, fast food…'},
  {v:'Pastane & Patisserie',label:'Pastane & Patisserie',desc:'Artisan veya endüstriyel fırın, tatlı üretimi.'},
  {v:'Cafe',label:'Cafe',desc:'Kafe, coffee shop, hafif mutfak.'},
  {v:'Bulut Mutfak',label:'Bulut mutfak',desc:'Merkez üretim — döner, pizza, burger…'},
  {v:'Hotel',label:'Hotel',desc:'Şehir, resort, kayak veya tatil oteli.'},
  {v:'Bar',label:'Bar',desc:'Kokteyl, şarap, bira, mixology, lounge.'},
  {v:'Catering',label:'Catering',desc:'Fabrika mutfak, yerinde üretim, taşıma yemek.'},
];

function konseptGoster(){
  if(D.franchise) return D.franchise;
  const row=KONSEPT_ROWS.find(r=>r.v===D.konsept);
  return row?row.label:(D.konsept||'');
}

function renderKonseptButtons(){
  const el=document.getElementById('o3');
  if(!el) return;
  const main=KONSEPT_ROWS.map(r=>
    `<button type="button" class="opt${D.konsept===r.v?' sel':''}" data-v="${esc(r.v)}" onclick="setKonsept('${esc(r.v)}')">`+
    `<span class="opt-konsept__title">${r.label}</span>`+
    `<span class="opt-konsept__desc">${r.desc}</span></button>`
  ).join('');
  const fr=
    `<button type="button" class="opt opt--franchise fr${D.konsept==='Franchise'?' sel':''}" data-v="Franchise" onclick="setKonsept('Franchise')">`+
    `<span class="opt-konsept__title">Zincir / franchise</span>`+
    `<span class="opt-konsept__desc">Hazır marka projesi (ör. fast food zinciri)</span></button>`;
  el.innerHTML=main+fr;
}


// ── Think (devre dışı — animasyon sonra eklenecek) ────────────────────────────
function think(msg, cb){ /* TODO: spinner animasyonu */ if(typeof cb==='function') cb(); }

// ── Init ──────────────────────────────────────────────────────────────────────
function pfosBootWizard(){
  function boot(){
    pfosFillOpts('o1',MESLEKLER,'setMeslek',D.meslek);
    renderKonseptButtons();
    initTrAdres().then(function(){ refreshWizardHint(); });
    refreshWizardHint();
    pfMobileInit();
    loadPfosProjects().then(function(){ refreshKonseptRail(); });
  }
  if(typeof window.pfosLoadWizardSchema==='function'){
    window.pfosLoadWizardSchema().finally(boot);
  }else{
    boot();
  }
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',pfosBootWizard);
}else{
  pfosBootWizard();
}

// ── 01 Meslek ─────────────────────────────────────────────────────────────────
function setMeslek(val){
  D.meslek=val; selOpts('o1',val);
  document.getElementById('a1').textContent=val;
  done('s1');
  reveal('s2'); activate('s2');
  setTimeout(()=>{ document.getElementById('sehir-inp').focus(); acFocus(''); }, 350);
}

// ── 02 Şehir + Adres ──────────────────────────────────────────────────────────
function setSehir(val){
  D.sehir=val;
  document.getElementById('sehir-inp').value=val;
  document.getElementById('acl').classList.remove('open');
  const sf=document.getElementById('adres-sehir');
  if(sf) sf.value=val;
  document.getElementById('adres-warn').style.display='none';
  document.getElementById('a2').textContent=val+' — adresi tamamlayın';
  pfosClearCaddeCache();
  applyProvinceFromSehir().then(()=>{
    document.getElementById('adres-ilce').value='';
    document.getElementById('adres-mahalle').value='';
    document.getElementById('adres-cadde').value='';
    D.districtId=null;
    updateAdres();
    ilceFocus();
  });
  setTimeout(()=>{ document.getElementById('adres-ilce').focus(); },200);
}

// ── Mahalle Verisi ────────────────────────────────────────────────────────────
const MAHALLELER={
  'Şişli':['19 Mayıs','Barbaros','Bozkurt','Cumhuriyet','Duatepe','Esentepe','Ergenekon','Feriköy','Fulya','Gülbahar','Halaskargazi','Harbiye','İzzet Paşa','Kemalpaşa','Kıztaşı','Kuştepe','Mecidiyeköy','Meşrutiyet','Nişantaşı','Paşa','Pınartepe','Poyraz','Sakarya','Teşvikiye'],
  'Kadıköy':['Acıbadem','Bostancı','Caferağa','Caddebostan','Erenköy','Fenerbahçe','Feneryolu','Fikirtepe','Göztepe','Koşuyolu','Kozyatağı','Merdivenköy','Moda','Osmanağa','Rasimpaşa','Sahrayıcedit','Suadiye','Zühtüpaşa'],
  'Beşiktaş':['Abbasağa','Arnavutköy','Akatlar','Bebek','Balmumcu','Dikilitaş','Etiler','Gayrettepe','Konaklar','Kuruçeşme','Levazım','Levent','Muradiye','Nisbetiye','Ortaköy','Sinanpaşa','Türkali','Ulus','Vişnezade','Yıldız'],
  'Beyoğlu':['Asmalımescit','Aydıner','Bülbül','Camekan','Camiikebir','Çukur','Evliya Çelebi','Galata','Hacıahmet','Halıcıoğlu','Hüseyinağa','İstiklal','Kamer Hatun','Kalyoncu Kulluk','Kemankeş','Kılıçali Paşa','Kuloğlu','Okmeydanı','Pir Hüsamettin','Serdar','Soğancı','Şahkulu','Tomtom','Yahyakerim'],
  'Fatih':['Akdeniz','Altıntepe','Atpazarı','Balabanağa','Binbirdirek','Cankurtaran','Çarşamba','Cerrahpaşa','Çukurbostan','Hasan Paşa','Hobyar','Kadırga','Katip Kasım','Kumkapı','Mevlanakepi','Mollafenari','Morali','Nişanca','Rüstempaşa','Saraç İshak','Sarıgüzel','Servi','Suriçi','Tahtakale','Vefa','Yenikapı','Yenikapi'],
  'Ataşehir':['Barbaros','Batı','Cumhuriyet','Esatpaşa','Ferhatpaşa','İçerenköy','İnönü','Kayışdağı','Küçükbakkalköy','Mevlana','Mustafa Kemal','Riva','Turgut Reis','Yenisahra'],
  'Ümraniye':['Altınşehir','Aşağı Dudullu','Atakent','Çakmak','Çamlık','Esenevler','Fatih','Finanskent','Ihlamurkuyu','İstiklal','Mimar Sinan','Namık Kemal','Sarıgazi','Şirintepe','Yukarı Dudullu'],
  'Çankaya':['Ahlatlıbel','Ayrancı','Bahçelievler','Balgat','Birlik','Çukurambar','Emek','Güvenevler','Kavaklıdere','Keklikpınarı','Kızılay','Küçükesat','Mebusevleri','Merasim','Öveçler','Oran','Sokullu','Yukarı Ayrancı'],
  'Keçiören':['Akpınar','Bağlum','Etlik','Fatih','Göksu','Güçlükaya','Güzeltepe','İncirli','Kalaba','Kazan','Kuzey','Ovacık','Pursaklar','Subayevleri','Yayla'],
  'Konak':['Alsancak','Basmane','Çankaya','Çınarlı','Gündoğdu','Hatay','İsmet Kaptan','Kahramanlar','Kemeraltı','Kültür','Liman','Ege','Yenişehir'],
  'Bornova':['Atatürk','Doğanlar','Egekent','Evka','Işıkkent','Kazımdirik','Kışladağ','Manas','Meşelik','Naldöken','Yeşilova'],
  'Nilüfer':['Beşevler','Bademli','Balat','Denizkızı','Fethiye','Görükle','Hasanağa','İhsaniye','Karaman','Kayapa','Özlüce','Santral','Ataevler'],
  'Muratpaşa':['Bahçelibahçe','Balbey','Barınak','Çağlayan','Deniz','Fener','Haşimişcan','Kızılarık','Kızılsaray','Kültür','Küçükparmakkapı','Liman','Memurevleri','Meltem','Örnekköy','Sinan','Soğuksu','Tahılpazarı','Yenigün'],
  'default':['Merkez','Yeni','Eski','Cumhuriyet','Atatürk','Fatih','İstiklal'],
};

const CADDELER={
  'Nişantaşı':['Abdi İpekçi Cad.','Bronz Sok.','Mim Kemal Öke Cad.','Rumeli Cad.','Teşvikiye Cad.','Valikonağı Cad.'],
  'Mecidiyeköy':['Büyükdere Cad.','Hakki Yeten Cad.','Halaskargazi Cad.','Şişli Meydanı'],
  'Esentepe':['Büyükdere Cad.','Harman Sok.','Kore Şehitleri Cad.','Maya Akar Center'],
  'Levent':['Büyükdere Cad.','Eski Büyükdere Cad.','Nispetiye Cad.'],
  'Etiler':['Nisbetiye Cad.','Ulus Cad.','Akatlar Cad.'],
  'Bebek':['Cevdet Paşa Cad.','Bebek Cad.'],
  'Bağdat Cad.':['Bağdat Cad.','Moda Cad.','Söğütlüçeşme Cad.'],
  'Alsancak':['Atatürk Cad.','Cumhuriyet Bul.','Kıbrıs Şehitleri Cad.','Piri Reis Cad.'],
  'Kızılay':['Atatürk Bul.','Celal Bayar Bul.','Kızılay Mey.','Meşrutiyet Cad.','Ziya Gökalp Cad.'],
  'default':['Atatürk Cad.','Cumhuriyet Cad.','İstiklal Cad.','Hürriyet Cad.','Yeni Cad.','Meydan Cad.','Gazi Cad.'],
};

/** API’den gelen mahalle adı listede yoksa bile ilçedeki ana caddeler eklensin (ör. Avcılar / Ambarlı → Acıbadem Cad.) */
const CADDELER_BY_ILCE={
  'Avcılar':['Acıbadem Cad.','Firuzköy Bul.','Mustafa Kemal Paşa Bul.','Tahtakale Cad.','Denizköşkler Cad.','Ambarlı Liman Cad.','Üniversite Cad.','Gümüşpala Cad.','Yeşilkent Cad.','E-5 Karayolu'],
};

/** İlçe adı API / kullanıcı yazımında küçük farklar olsa da eşleşsin (ör. Avcılar). */
function pickDictByIlce(ilce, dict){
  if(!ilce||!dict) return null;
  const t=String(ilce).trim().normalize('NFKC');
  if(dict[t]) return dict[t];
  const tl=t.toLocaleLowerCase('tr-TR');
  for(const k of Object.keys(dict)){
    if(String(k).trim().toLocaleLowerCase('tr-TR')===tl) return dict[k];
  }
  return null;
}

function mergeAdresSatirlari(mahalle,ilce,byMah,byIlce,fallback){
  const seen=new Set();
  const out=[];
  function add(arr){
    if(!arr||!arr.length)return;
    arr.forEach(function(s){
      const k=String(s).toLocaleLowerCase('tr-TR');
      if(s&&s.length>1&&!seen.has(k)){seen.add(k);out.push(s);}
    });
  }
  add(pickDictByMahalle(mahalle, byMah));
  add(pickDictByIlce(ilce,byIlce));
  if(!out.length) return fallback?fallback.slice():[];
  return out;
}

function pickDictByMahalle(mahalle, dict){
  if(!mahalle||!dict) return null;
  const t=String(mahalle).trim().normalize('NFKC');
  if(dict[t]) return dict[t];
  const tl=t.toLocaleLowerCase('tr-TR');
  for(const k of Object.keys(dict)){
    if(k==='default') continue;
    if(String(k).trim().toLocaleLowerCase('tr-TR')===tl) return dict[k];
  }
  return null;
}

function getMahalleler(){
  if(D.districtId && NEIGHBORHOODS_CACHE[D.districtId] && NEIGHBORHOODS_CACHE[D.districtId].length)
    return NEIGHBORHOODS_CACHE[D.districtId].map(n=>n.name);
  return MAHALLELER[document.getElementById('adres-ilce').value.trim()]||MAHALLELER.default;
}
function getCaddeler(){
  const mah=document.getElementById('adres-mahalle').value.trim();
  const ilce=document.getElementById('adres-ilce').value.trim();
  return mergeAdresSatirlari(mah,ilce,CADDELER,CADDELER_BY_ILCE,null);
}
function pfosClearCaddeCache(){
  if(window.EqustoAdresNational&&typeof EqustoAdresNational.clearStreetCache==='function'){
    EqustoAdresNational.clearStreetCache();
  }
}

const SOKAKLAR={
  'Nişantaşı':['Teşvikiye Sok. No:12','Bronz Sok. No:5','Abdi İpekçi Yan Sok. No:3'],
  'Mecidiyeköy':['Büyükdere Yan Sok. No:8','Şişli Meydanı Yanı No:1'],
  'Esentepe':['Kore Şehitleri Yan Sok. No:4','Harman Sok. No:2'],
  'Levent':['Nispetiye Yan Sok. No:6','Levent Çıkmazı No:1'],
  'Etiler':['Nisbetiye Yan Sok. No:9'],
  'Bebek':['Bebek Yokuşu No:10','Cevdet Paşa Yan Sok. No:2'],
  'Moda':['Moda İskele Yanı No:4','Nailbey Sok. No:7'],
  'Caferağa':['Moda Cad. Yan Sok. No:3','General Asım Gündüz Cad. No:15'],
  'Alsancak':['Kıbrıs Şehitleri Yan Sok. No:2','Piri Reis Yan Sok. No:5'],
  'Kızılay':['Konur Sok. No:4','Meşrutiyet Yan Sok. No:1'],
  'default':['1. Sok. No:1','Cami Sok. No:2','Okul Sok. No:3','Merkez Sok. No:4'],
};
const SOKAKLAR_BY_ILCE={
  'Avcılar':['Acıbadem Cad. Yan Sok. No:2','Ambarlı Liman Yanı No:1','Gümüşpala Merkez No:5','Üniversite Yan Sok. No:3'],
};
function getSokaklar(){
  const mah=document.getElementById('adres-mahalle').value.trim();
  const ilce=document.getElementById('adres-ilce').value.trim();
  return mergeAdresSatirlari(mah,ilce,SOKAKLAR,SOKAKLAR_BY_ILCE,SOKAKLAR.default);
}

/** Autocomplete / Nominatim için gizli veya görünür şehir alanından tek değer */
function pfAdresSehirBirlesik(){
  const h=(document.getElementById('adres-sehir')||{}).value;
  if(h&&String(h).trim()) return String(h).trim();
  const v=(document.getElementById('sehir-inp')||{}).value;
  return v?String(v).trim():(D.sehir||'').trim();
}

// Mahalle autocomplete
let mahalleHl=-1,mahalleItems=[];
function mahalleFocus(){const q=document.getElementById('adres-mahalle').value.trim();mahalleRender(q?getMahalleler().filter(m=>m.toLowerCase().includes(q.toLowerCase())):getMahalleler());}
function mahalleF(q){mahalleRender(q?getMahalleler().filter(m=>m.toLowerCase().includes(q.toLowerCase())):getMahalleler());}
function mahalleRender(items){
  mahalleItems=items;mahalleHl=-1;
  const dl=document.getElementById('mahalle-acl');if(!dl)return;
  if(!items.length){dl.classList.remove('open');dl.innerHTML='';return;}
  dl.innerHTML=items.map(s=>`<div class="acit" onmousedown="mahallePick('${esc(s)}')">${s}</div>`).join('');
  dl.classList.add('open');
}
function mahalleC(){const dl=document.getElementById('mahalle-acl');if(dl){dl.classList.remove('open');dl.innerHTML='';}}
function mahalleK(e){
  const items=[...document.querySelectorAll('#mahalle-acl .acit')];
  if(e.key==='ArrowDown'){mahalleHl=Math.min(mahalleHl+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('hl',i===mahalleHl));e.preventDefault();}
  else if(e.key==='ArrowUp'){mahalleHl=Math.max(mahalleHl-1,-1);items.forEach((el,i)=>el.classList.toggle('hl',i===mahalleHl));e.preventDefault();}
  else if(e.key==='Enter'&&mahalleHl>=0){mahallePick(mahalleItems[mahalleHl]);}
}
function mahallePick(val){
  document.getElementById('adres-mahalle').value=val;
  document.getElementById('adres-cadde').value='';
  pfosClearCaddeCache();
  mahalleC();updateAdres();clearFieldWarn('adres-mahalle');
  setTimeout(function(){
    const el=document.getElementById('adres-cadde');
    if(el) el.focus();
    caddeFocus();
  },80);
}

// Cadde autocomplete (odakta tam liste: tarayıcı otofill / 1 harf ile filtre yüzünden Acıbadem vb. kaybolmasın)
let caddeHl=-1,caddeItems=[];
function caddeFilterListe(q,liste){
  const qq=String(q||'').trim();
  if(!qq) return liste.slice();
  const ql=qq.toLocaleLowerCase('tr-TR');
  return liste.filter(function(c){return c.toLocaleLowerCase('tr-TR').indexOf(ql)>=0;});
}
function caddeListeCap(q){
  const qq=String(q||'').trim();
  return qq?48:220;
}
function caddeBirlesikListe(osm,statik,q){
  const cap=caddeListeCap(q);
  const fn=(window.EqustoAdresNational&&EqustoAdresNational.mergeStreetSuggestions)||mergeStreetSuggestionsPf;
  const birlesik=fn(statik,osm,cap);
  if(birlesik.length)return birlesik;
  return statik&&statik.length?statik.slice():[];
}
function caddeFetchOsm(q, statik, onDone){
  const seh=pfAdresSehirBirlesik();
  const ilce=document.getElementById('adres-ilce').value.trim();
  const mah=document.getElementById('adres-mahalle').value.trim();
  if(!seh||!ilce){
    onDone(statik||[]);
    return;
  }
  if(!window.EqustoAdresNational||typeof EqustoAdresNational.nominatimStreets!=='function'){
    onDone(statik||[]);
    return;
  }
  EqustoAdresNational.nominatimStreets('pf-os-cadde',q,seh,ilce,mah,'','cadde').then(function(osm){
    onDone(caddeBirlesikListe(osm,statik,q));
  });
}
function caddeFocus(){
  const q=document.getElementById('adres-cadde').value.trim();
  const full=getCaddeler();
  caddeRender(full);
  caddeFetchOsm(q,full,function(items){
    caddeRender(q?caddeFilterListe(q,items):items);
  });
}
function caddeF(q){
  const inp=document.getElementById('adres-cadde');
  var qq=q!=null?q:(inp&&inp.value||'').trim();
  const statik=caddeFilterListe(qq,getCaddeler());
  caddeRender(statik);
  caddeFetchOsm(qq,statik,caddeRender);
}
/** equsto-adres-national yoksa (teorik) yedek birleştirme */
function mergeStreetSuggestionsPf(a,b,max){
  max=max==null?30:max;
  var seen={},out=[];
  function add(arr){
    (arr||[]).forEach(function(s){
      var t=String(s||'').trim();
      if(t.length<2)return;
      var k=t.toLocaleLowerCase('tr-TR');
      if(seen[k])return;
      seen[k]=1;
      out.push(t);
      if(out.length>=max)return false;
    });
  }
  add(a);add(b);
  return out;
}
function caddeRender(items){
  caddeItems=items;caddeHl=-1;
  const dl=document.getElementById('cadde-acl');if(!dl)return;
  dl.innerHTML='';
  if(!items.length){dl.classList.remove('open');return;}
  items.forEach(function(s){
    const div=document.createElement('div');
    div.className='acit';
    div.textContent=s;
    div.addEventListener('mousedown',function(e){e.preventDefault();caddePick(s);});
    dl.appendChild(div);
  });
  dl.classList.add('open');
}
function caddeC(){const dl=document.getElementById('cadde-acl');if(dl){dl.classList.remove('open');dl.innerHTML='';}}
function caddeK(e){
  const items=[...document.querySelectorAll('#cadde-acl .acit')];
  if(e.key==='ArrowDown'){caddeHl=Math.min(caddeHl+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('hl',i===caddeHl));e.preventDefault();}
  else if(e.key==='ArrowUp'){caddeHl=Math.max(caddeHl-1,-1);items.forEach((el,i)=>el.classList.toggle('hl',i===caddeHl));e.preventDefault();}
  else if(e.key==='Enter'&&caddeHl>=0){caddePick(caddeItems[caddeHl]);}
}
function caddePick(val){
  document.getElementById('adres-cadde').value=val;
  caddeC();updateAdres();clearFieldWarn('adres-cadde');
  setTimeout(function(){ void tryAdresOtomatikTamam(); },120);
}

function tryAdresOtomatikTamam(){
  syncSehirFromInput();
  if(!D.sehir)return;
  const ilce=document.getElementById('adres-ilce').value.trim();
  const mah=document.getElementById('adres-mahalle').value.trim();
  const cad=document.getElementById('adres-cadde').value.trim();
  if(!ilce||!mah||cad.length<2)return;
  void sehirOnayla();
}

let sokakHl=-1,sokakItems=[];
function sokakFilterListe(q,liste){
  const qq=String(q||'').trim();
  if(qq.length<2) return liste.slice();
  const ql=qq.toLocaleLowerCase('tr-TR');
  return liste.filter(function(s){return s.toLocaleLowerCase('tr-TR').indexOf(ql)>=0;});
}
function sokakFocus(){
  const q=document.getElementById('adres-sok').value.trim();
  const statik=sokakFilterListe(q,getSokaklar());
  sokakRender(statik);
  const seh=pfAdresSehirBirlesik();
  const ilce=document.getElementById('adres-ilce').value.trim();
  const mah=document.getElementById('adres-mahalle').value.trim();
  const cad=document.getElementById('adres-cadde').value.trim();
  if(!window.EqustoAdresNational||typeof EqustoAdresNational.nominatimStreets!=='function') return;
  EqustoAdresNational.nominatimStreets('pf-os-sokak',q,seh,ilce,mah,cad,'sokak').then(function(osm){
    var birlesik=(EqustoAdresNational.mergeStreetSuggestions||mergeStreetSuggestionsPf)(statik,osm,28);
    sokakRender(birlesik);
  });
}
function sokakF(q){
  const statik=sokakFilterListe(q,getSokaklar());
  sokakRender(statik);
  const inp=document.getElementById('adres-sok');
  var qq=q!=null?q:(inp&&inp.value||'').trim();
  const seh=pfAdresSehirBirlesik();
  const ilce=document.getElementById('adres-ilce').value.trim();
  const mah=document.getElementById('adres-mahalle').value.trim();
  const cad=document.getElementById('adres-cadde').value.trim();
  if(!window.EqustoAdresNational||typeof EqustoAdresNational.nominatimStreets!=='function') return;
  EqustoAdresNational.nominatimStreets('pf-os-sokak',qq,seh,ilce,mah,cad,'sokak').then(function(osm){
    var birlesik=(EqustoAdresNational.mergeStreetSuggestions||mergeStreetSuggestionsPf)(statik,osm,28);
    sokakRender(birlesik);
  });
}
function sokakRender(items){
  sokakItems=items;sokakHl=-1;
  const dl=document.getElementById('sokak-acl');if(!dl)return;
  if(!items.length){dl.classList.remove('open');dl.innerHTML='';return;}
  dl.innerHTML=items.map(s=>`<div class="acit" onmousedown="sokakPick('${esc(s)}')">${s}</div>`).join('');
  dl.classList.add('open');
}
function sokakC(){const dl=document.getElementById('sokak-acl');if(dl){dl.classList.remove('open');dl.innerHTML='';}}
function sokakK(e){
  const items=[...document.querySelectorAll('#sokak-acl .acit')];
  if(e.key==='ArrowDown'){sokakHl=Math.min(sokakHl+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('hl',i===sokakHl));e.preventDefault();}
  else if(e.key==='ArrowUp'){sokakHl=Math.max(sokakHl-1,-1);items.forEach((el,i)=>el.classList.toggle('hl',i===sokakHl));e.preventDefault();}
  else if(e.key==='Enter'&&sokakHl>=0){sokakPick(sokakItems[sokakHl]);}
}
function sokakPick(val){
  document.getElementById('adres-sok').value=val;
  sokakC();updateAdres();clearFieldWarn('adres-sok');
  setTimeout(function(){ void tryAdresOtomatikTamam(); },120);
}

const ILCELER={
  'İstanbul':['Adalar','Arnavutköy','Ataşehir','Avcılar','Bağcılar','Bahçelievler','Bakırköy','Başakşehir','Bayrampaşa','Beşiktaş','Beykoz','Beylikdüzü','Beyoğlu','Büyükçekmece','Çatalca','Çekmeköy','Esenler','Esenyurt','Eyüpsultan','Fatih','Gaziosmanpaşa','Güngören','Kadıköy','Kağıthane','Kartal','Küçükçekmece','Maltepe','Pendik','Sancaktepe','Sarıyer','Şile','Silivri','Şişli','Sultanbeyli','Sultangazi','Tuzla','Ümraniye','Üsküdar','Zeytinburnu'],
  'Ankara':['Altındağ','Ayaş','Balâ','Beypazarı','Çamlıdere','Çankaya','Çubuk','Elmadağ','Etimesgut','Evren','Gölbaşı','Güdül','Haymana','Kalecik','Kahramankazan','Keçiören','Kızılcahamam','Mamak','Nallıhan','Polatlı','Pursaklar','Sincan','Şereflikoçhisar','Yenimahalle'],
  'İzmir':['Aliağa','Balçova','Bayındır','Bayraklı','Bergama','Beydağ','Bornova','Buca','Çeşme','Çiğli','Dikili','Foça','Gaziemir','Güzelbahçe','Karabağlar','Karaburun','Karşıyaka','Kemalpaşa','Kınık','Kiraz','Konak','Menderes','Menemen','Narlıdere','Ödemiş','Seferihisar','Selçuk','Tire','Torbalı','Urla'],
  'Bursa':['Büyükorhan','Gemlik','Gürsu','Harmancık','İnegöl','İznik','Karacabey','Keles','Kestel','Mudanya','Mustafakemalpaşa','Nilüfer','Orhaneli','Orhangazi','Osmangazi','Yenişehir','Yıldırım'],
  'Antalya':['Akseki','Aksu','Alanya','Demre','Döşemealtı','Elmalı','Finike','Gazipaşa','Gündoğmuş','İbradı','Kaş','Kemer','Kepez','Konyaaltı','Korkuteli','Kumluca','Manavgat','Muratpaşa','Serik'],
  'Adana':['Aladağ','Ceyhan','Çukurova','Feke','İmamoğlu','Karaisalı','Karataş','Kozan','Pozantı','Saimbeyli','Sarıçam','Seyhan','Tufanbeyli','Yumurtalık','Yüreğir'],
  'Konya':['Ahırlı','Akören','Akşehir','Altınekin','Beyşehir','Bozkır','Cihanbeyli','Çeltik','Çumra','Derbent','Derebucak','Doğanhisar','Emirgazi','Ereğli','Güneysınır','Hadim','Halkapınar','Hüyük','Ilgın','Kadınhanı','Karapınar','Karatay','Kulu','Meram','Sarayönü','Selçuklu','Seydişehir','Taşkent','Tuzlukçu','Yalıhüyük','Yunak'],
  'Gaziantep':['Araban','İslahiye','Karkamış','Nizip','Nurdağı','Oğuzeli','Şahinbey','Şehitkamil','Yavuzeli'],
  'Kocaeli':['Başiskele','Çayırova','Darıca','Derince','Dilovası','Gebze','Gölcük','İzmit','Kandıra','Karamürsel','Kartepe','Körfez'],
  'Mersin':['Akdeniz','Anamur','Aydıncık','Bozyazı','Çamlıyayla','Erdemli','Gülnar','Mezitli','Mut','Silifke','Tarsus','Toroslar','Yenişehir'],
  'Muğla':['Bodrum','Dalaman','Datça','Fethiye','Kavaklıdere','Köyceğiz','Marmaris','Menteşe','Milas','Ortaca','Seydikemer','Ula','Yatağan'],
  'Trabzon':['Akçaabat','Araklı','Arsin','Beşikdüzü','Çarşıbaşı','Çaykara','Dernekpazarı','Düzköy','Hayrat','Köprübaşı','Maçka','Of','Ortahisar','Sürmene','Şalpazarı','Tonya','Vakfıkebir','Yomra'],
};
const ILCE_DEFAULT=['Merkez'];

let ilceHl=-1,ilceItems=[];
function getIlceler(){
  if(D.provinceId && DISTRICTS_CACHE[D.provinceId] && DISTRICTS_CACHE[D.provinceId].length)
    return DISTRICTS_CACHE[D.provinceId].map(d=>d.name);
  return ILCELER[D.sehir]||ILCE_DEFAULT;
}
function ilceFocus(){
  const q=document.getElementById('adres-ilce').value.trim();
  ilceRender(q?getIlceler().filter(i=>i.toLowerCase().includes(q.toLowerCase())):getIlceler());
}
function ilceF(q){
  const list=getIlceler();
  ilceRender(q?list.filter(i=>i.toLowerCase().includes(q.toLowerCase())):list);
}
function ilceRender(items){
  ilceItems=items;ilceHl=-1;
  const dl=document.getElementById('ilce-acl');if(!dl)return;
  if(!items.length){dl.classList.remove('open');dl.innerHTML='';return;}
  dl.innerHTML=items.map(s=>`<div class="acit" onmousedown="ilcePick('${esc(s)}')">${s}</div>`).join('');
  dl.classList.add('open');
}
function ilceC(){const dl=document.getElementById('ilce-acl');if(dl){dl.classList.remove('open');dl.innerHTML='';}}
function ilceK(e){
  const items=[...document.querySelectorAll('#ilce-acl .acit')];
  if(e.key==='ArrowDown'){ilceHl=Math.min(ilceHl+1,items.length-1);items.forEach((el,i)=>el.classList.toggle('hl',i===ilceHl));e.preventDefault();}
  else if(e.key==='ArrowUp'){ilceHl=Math.max(ilceHl-1,-1);items.forEach((el,i)=>el.classList.toggle('hl',i===ilceHl));e.preventDefault();}
  else if(e.key==='Enter'&&ilceHl>=0){ilcePick(ilceItems[ilceHl]);}
}
function ilcePick(val){
  document.getElementById('adres-ilce').value=val;
  document.getElementById('adres-mahalle').value='';
  document.getElementById('adres-cadde').value='';
  pfosClearCaddeCache();
  ilceC(); updateAdres(); clearFieldWarn('adres-ilce');
  D.districtId=null;
  const E=eqAdres();
  if(E&&D.provinceId&&typeof E.findDistrictByName==='function'){
    const fd=E.findDistrictByName(D.provinceId,val);
    if(fd) D.districtId=fd.id;
  }
  if(!D.districtId&&D.provinceId&&DISTRICTS_CACHE[D.provinceId]){
    const d=DISTRICTS_CACHE[D.provinceId].find(x=>x.name===val);
    if(d) D.districtId=d.id;
  }
  if(D.districtId){
    const mh=document.getElementById('adres-mahalle');
    mh.placeholder='Mahalleler yükleniyor…';
    loadNeighborhoodsForDistrict(D.districtId).then(()=>{
      mh.placeholder='Listeden seçin veya yazın';
      mh.value='';
      mh.focus();
    });
  }else{
  setTimeout(()=>document.getElementById('adres-mahalle').focus(),100);
  }
}

function syncSehirFromInput(){
  const v=document.getElementById('sehir-inp').value.trim();
  if(!v) return;
  D.sehir=v;
  const sf=document.getElementById('adres-sehir');
  if(sf) sf.value=v;
  void applyProvinceFromSehir();
}

async function sehirOnayla(){
  syncSehirFromInput();
  if(!D.sehir){
    document.getElementById('adres-warn').textContent='Önce il (şehir) kutusuna bir şehir yazın. Ardından ilçe, mahalle ve cadde alanlarını doldurun.';
    document.getElementById('adres-warn').style.display='block';
    document.getElementById('sehir-inp').focus();
    return;
  }
  await applyProvinceFromSehir();
  updateAdres();
  const ilce=document.getElementById('adres-ilce').value.trim();
  const mah=document.getElementById('adres-mahalle').value.trim();
  const cad=document.getElementById('adres-cadde').value.trim();
  const missing=[];
  if(!ilce){missing.push('adres-ilce');}
  if(!mah){missing.push('adres-mahalle');}
  if(!cad||cad.length<2){missing.push('adres-cadde');}
  if(missing.length){
    document.getElementById('adres-warn').textContent='Lütfen yıldızlı tüm alanları doldurun (cadde en az 2 harf).';
    document.getElementById('adres-warn').style.display='block';
    missing.forEach(id=>markFieldWarn(id));
    return;
  }
  document.getElementById('adres-warn').style.display='none';
  document.getElementById('a2').textContent=D.sehir+' · '+ilce;
  D.lokasyon=pfosGetLokasyon();
  D.nakliye=pfosEstimateNakliye([]);
  pfosSendInsight('adres_tamam');
  done('s2');
  goAlan();
}

function updateAdres(){
  const s=document.getElementById('adres-sehir').value.trim();
  const i=document.getElementById('adres-ilce').value.trim();
  const m=document.getElementById('adres-mahalle').value.trim();
  const c=document.getElementById('adres-cadde').value.trim();
  D.adres=[s,i,m,c].filter(Boolean).join(', ');
  D.lokasyon=pfosGetLokasyon();
  if(D.lokasyon&&D.lokasyon.sehir&&D.lokasyon.ilce){
    D.nakliye=pfosEstimateNakliye(buildEkipmanList());
    pfosPatchNakliyeUi(D.nakliye);
    pfosQueueInsight('adres_guncellendi');
  }
  pfMobileSyncLoc();
}
function clearFieldWarn(id){
  const el=document.getElementById(id);
  if(el) el.style.borderColor='';
}
function markFieldWarn(id){
  const el=document.getElementById(id);
  if(el){ el.style.borderColor='var(--red)'; el.focus(); }
}

let acHl=-1;
function buildAcList(items,isTop5){
  return items.map(s=>`<div class="acit${isTop5?' top5':''}" onclick="setSehir('${esc(s)}')">${s}</div>`).join('');
}
function acFocus(q){
  if(!q.trim()){
    const list=document.getElementById('acl');
    let names=[];
    if(TR_PROVINCES.length){
      names=TR_PROVINCES.slice(0,16).map(p=>p.name);
    }else{
      names=SEHIRLER.slice(0,16);
    }
    list.innerHTML=buildAcList(names.slice(0,5),true)+buildAcList(names.slice(5),false);
    list.classList.add('open'); acHl=-1;
  } else acF(q);
}
function acF(q){
  const list=document.getElementById('acl');
  if(!q.trim()){list.classList.remove('open');return;}
  const lower=q.toLocaleLowerCase('tr-TR');
  let res=[];
  if(TR_PROVINCES.length){
    res=TR_PROVINCES.filter(p=>p.name.toLocaleLowerCase('tr-TR').includes(lower)).map(p=>p.name).slice(0,16);
  }else{
    res=SEHIRLER.filter(s=>s.toLocaleLowerCase('tr-TR').includes(lower)).slice(0,16);
  }
  if(!res.length){list.classList.remove('open');return;}
  list.innerHTML=buildAcList(res.slice(0,5),true)+buildAcList(res.slice(5),false);
  list.classList.add('open'); acHl=-1;
}
function acC(){document.getElementById('acl').classList.remove('open');}
function acK(e){
  const items=[...document.querySelectorAll('#acl .acit')];
  if(e.key==='ArrowDown'){acHl=Math.min(acHl+1,items.length-1);acHL(items);e.preventDefault();}
  else if(e.key==='ArrowUp'){acHl=Math.max(acHl-1,-1);acHL(items);e.preventDefault();}
  else if(e.key==='Enter'){
    if(acHl>=0) items[acHl].click();
    else{const v=document.getElementById('sehir-inp').value.trim();if(v)setSehir(v);}
  }
}
function acHL(items){items.forEach((el,i)=>el.classList.toggle('hl',i===acHl));if(acHl>=0)items[acHl].scrollIntoView({block:'nearest'});}

// ── 03 Konsept ────────────────────────────────────────────────────────────────
function setKonsept(val){
  D.konsept=val; D.dukkan=null; D.alt=null; D.pisir=[]; D.oda=null; D.menu=[]; D.kap=null; D.serv=null; D.sark=null;
  selOpts('o3',val);
  document.querySelectorAll('#o3 .opt.fr').forEach(b=>b.classList.toggle('sel',val==='Franchise'));
  document.getElementById('a3').textContent=val==='Franchise'?'Zincir / franchise':konseptGoster();
  done('s3'); hideFrom('sfr');
  showTabloGhost();
  refreshKonseptRail();
  if(val==='Franchise'){
    reveal('sfr'); activate('sfr');
    setTimeout(()=>document.getElementById('fr-inp').focus(),200);
    return;
  }
  renderS4(); reveal('s4'); activate('s4');
}

// ── Franchise ─────────────────────────────────────────────────────────────────
let frTimer=null;
function frSearch(q){
  clearTimeout(frTimer);
  const acl=document.getElementById('fr-acl');
  document.getElementById('fr-result').innerHTML='';
  if(!q.trim()){acl.classList.remove('open');return;}
  const lower=q.toLowerCase();
  const res=Object.keys(FRANCHISE_DB).filter(k=>k.toLowerCase().includes(lower)).slice(0,5);
  if(!res.length){acl.classList.remove('open');return;}
  acl.innerHTML=res.map(s=>`<div class="acit" onclick="frSelect('${esc(s)}')">${s}</div>`).join('');
  acl.classList.add('open');
}
function frSelect(val){
  document.getElementById('fr-inp').value=val;
  document.getElementById('fr-acl').classList.remove('open');
  frConfirm();
}
function frConfirm(){
  const val=document.getElementById('fr-inp').value.trim();
  if(!val)return;
  D.franchise=val;
  document.getElementById('afr').textContent=val;
  const found=FRANCHISE_DB[val]||Object.keys(FRANCHISE_DB).some(k=>k.toLowerCase()===val.toLowerCase());
  const res=document.getElementById('fr-result');
  if(found){
    res.innerHTML=`<div class="hb"><b>${val}</b> veri bankamızda. Şablonu güçlendirmek için aşağıdaki işletme sorularını tamamlayın; ardından özete geçilir.</div>`;
    setTimeout(()=>{ done('sfr'); renderS4(); reveal('s4'); activate('s4'); },1500);
  } else {
    res.innerHTML=`<div class="hb">Bu marka henüz veri bankamızda yok. Standart akışla devam edelim.</div>`;
    setTimeout(()=>{ done('sfr'); renderS4(); reveal('s4'); activate('s4'); },1500);
  }
}

// ── 04 Dükkan Türü ───────────────────────────────────────────────────────────
function pfosFilterDukkanByM2(list) {
  const m2 = Number(D.alan) || 0;
  const bands = window.PFOS_M2_BY_DUKKAN || {};
  if (!m2) return list;
  return list.filter(function (d) {
    if (d === "Bilmiyorum") return true;
    const hit = bands[d] || (d === "Restoran" ? bands["Büyük Restoran"] : null);
    if (!hit) return true;
    return m2 >= hit.min && m2 <= hit.max;
  });
}

function renderS4(){
  const k=D.konsept;
  const ti=document.getElementById('s4-title');
  const su=document.getElementById('s4-sub');
  const bd=document.getElementById('s4-bd');
  ti.textContent='Dükkan türü'; su.textContent='Listeden size en yakın seçeneği işaretleyin.';
  const list=pfosFilterDukkanByM2(DUKKAN[k]||[]);
  bd.innerHTML=`<div class="og tall">${list.map(d=>
    `<button class="opt${D.dukkan===d?' sel':''}" data-v="${esc(d)}" onclick="setDukkan('${esc(d)}')">${d}</button>`
  ).join('')}</div>`;
}

function pfosDefaultPisirForDukkan(dukkan) {
  const presets = {
    Pizzacı: ['Pizza / Fırın ürünleri', 'Kızartma'],
    Dönerci: ['Izgara / Ocakbaşı', 'Türk mutfağı (kebap, börek, pide)'],
    Kebapçı: ['Izgara / Ocakbaşı', 'Türk mutfağı (kebap, börek, pide)'],
    Fastfood: ['Kızartma'],
  };
  if (presets[dukkan]) return presets[dukkan].slice();
  if (PISIR_OPTS[dukkan]) return PISIR_OPTS[dukkan].slice(0, 4);
  return [];
}

function setDukkan(val){
  D.dukkan=val; D.alt=null; D.pisir=pfosDefaultPisirForDukkan(val);
  if(typeof pfosSuggestM2ForDukkan==='function'){
    const m2h=pfosSuggestM2ForDukkan(val);
    if(m2h&&m2h.ref){
      D.alan=m2h.ref;
      const inp=document.getElementById('alan-inp');
      const sl=document.getElementById('alan-slider');
      if(inp) inp.value=m2h.ref;
      if(sl){ sl.min=Math.max(20,m2h.min); sl.max=Math.min(1000,m2h.max); sl.value=m2h.ref; }
      if(typeof onAlan==='function') onAlan();
    }
  }
  document.querySelectorAll('#s4-bd .opt').forEach(b=>b.classList.toggle('sel',b.dataset.v===val));
  document.getElementById('a4').textContent=val;
  done('s4'); hideFrom('s4b');

  if(ALT[val]){
    renderS4b(val); reveal('s4b'); activate('s4b');
  } else {
    hideFrom('s4b');
    afterDukkan();
  }
  refreshKonseptRail();
  if(document.getElementById('tablo-panel')?.classList.contains('vis')) schedulePfosLiveRecalc();
}

function setSark(val){
  D.sark=val;
  document.querySelectorAll('#s4-bd .opt').forEach(b=>
    b.classList.toggle('sel',(val==='Evet'&&b.textContent.includes('şarküteri'))||(val==='Hayır'&&b.textContent.includes('yalnızca'))));
  document.getElementById('a4').textContent=val==='Evet'?'Şarküteri dahil':'Yalnızca kasap';
  done('s4'); hideFrom('s4b');
  if(val==='Evet') {
    reveal('s4e');
    done('s4e');
  }
    goKategoriler();
  if(D.konsept) renderPfPdfs();
}

// ── 04b Alt Tip ───────────────────────────────────────────────────────────────
function renderS4b(dukkan){
  document.getElementById('s4b-title').textContent=dukkan+' türü';
  pfosFillOpts('s4b-bd',ALT[dukkan],'setAlt',D.alt);
}
function setAlt(val){
  D.alt=val; selOpts('s4b-bd',val);
  document.getElementById('a4b').textContent=val;
  done('s4b'); hideFrom('s4c');
  afterDukkan();
  if(D.konsept) renderPfPdfs();
}

// ── Konsepte göre sonraki adım ────────────────────────────────────────────────
function afterDukkan(){
  const k=D.konsept;
  if(D.dukkan==='Şarküteri Restoran'||D.dukkan==='Gurme Şarküteri'){ reveal('s4e'); done('s4e'); }
  else hideFrom('s4e');
  if(k==='Hotel'){renderS4c_hotel();reveal('s4c');activate('s4c');}
  else if(k==='Catering'){renderS4c_catering();reveal('s4c');activate('s4c');}
  else goKategoriler();
}

// ── Hotel ─────────────────────────────────────────────────────────────────────
function renderS4c_hotel(){
  document.getElementById('s4c-title').textContent='Oda sayısı';
  document.getElementById('s4c-bd').innerHTML=mkOpts(ODA,'setOda',D.oda,' row');
}
function setOda(val){
  D.oda=val; selOpts('s4c-bd',val);
  document.getElementById('a4c').textContent=val;
  done('s4c'); hideFrom('s4d');
  renderS4d_menu(); reveal('s4d'); activate('s4d');
}
function renderS4d_menu(){
  D.menu=D.menu||[];
  document.getElementById('s4d-title').textContent='Menü tipi';
  const bd=document.getElementById('s4d-bd');
  bd.innerHTML=`
    <div class="fl">Birden fazla seçebilirsiniz</div>
    <div class="cg" id="s4d-menu-opts">${MENU.map((m,i)=>`
      <label class="co${D.menu.includes(m)?' sel':''}" data-menu-idx="${i}">
        <input type="checkbox" ${D.menu.includes(m)?'checked':''} tabindex="-1"> ${m}
      </label>`).join('')}</div>
    <div class="ar"><button type="button" class="btn gold" onclick="menuBitti()">Devam et →</button></div>`;
  bd.querySelector('#s4d-menu-opts').addEventListener('click',function(e){
    const lab=e.target.closest('label[data-menu-idx]');
    if(!lab) return;
    e.preventDefault();
    toggleMenu(MENU[+lab.getAttribute('data-menu-idx')],lab);
  });
}
function toggleMenu(val,el){
  const i=D.menu.indexOf(val);
  if(i>-1) D.menu.splice(i,1); else D.menu.push(val);
  el.classList.toggle('sel',D.menu.includes(val));
  el.querySelector('input').checked=D.menu.includes(val);
}
function menuBitti(){
  if(!D.menu||!D.menu.length){
    pfModalAc('Menü tipi','Devam etmek için listeden en az bir seçenek işaretleyin.',false);
    return;
  }
  document.getElementById('a4d').textContent=D.menu.join(' · ');
  done('s4d'); goKategoriler();
}

// ── Catering ──────────────────────────────────────────────────────────────────
function renderS4c_catering(){
  const d=D.dukkan;
  if(d==='Taşıma Yemek (Servis & Yıkama)'){
    document.getElementById('s4c-title').textContent='Servis & taşıma kapasitesi (günlük)';
    document.getElementById('s4c-bd').innerHTML=mkOpts(SERV,'setCateringTek',D.kap,' row');
    return;
  }
  if(d==='Üretim Fabrikası'){
    document.getElementById('s4c-title').textContent='Üretim hacmi (günlük)';
    document.getElementById('s4c-bd').innerHTML=mkOpts(KAP_URETIM,'setCateringTek',D.kap,' row');
    return;
  }
  document.getElementById('s4c-title').textContent='Yerinde üretim hacmi (günlük)';
  document.getElementById('s4c-bd').innerHTML=mkOpts(KAP_YERINDE,'setCateringTek',D.kap,' row');
}
function setCateringTek(val){
  D.kap=val;
  D.serv=null;
  if(val==='15–30 bin kap.'&&D.dukkan==='Üretim Fabrikası'&&(!D.alan||D.alan<1500)){
    D.alan=2000;
    const a5=document.getElementById('a5');
    if(a5) a5.textContent='2000 m²';
  }
  selOpts('s4c-bd',val);
  document.getElementById('a4c').textContent=D.dukkan==='Taşıma Yemek (Servis & Yıkama)'?('Taşıma: '+val):val;
  document.getElementById('a4d').textContent='';
  done('s4c'); hideFrom('s4d');
  goKategoriler();
}

const PFOS_STATION_TO_ZONE = {
  'Ana Mutfak': 'ana_mutfak',
  'Hazırlık Mutfağı': 'sebze_hazirlik',
  'Sebze Hazırlık': 'sebze_hazirlik',
  'Et Hazırlık': 'et_hazirlik',
  'Bar': 'bar',
  'Kuru Depo': 'kuru_depo',
  'Soğuk Depolama': 'soguk_oda',
  'Soğuk Oda': 'soguk_oda',
  'Derin Dondurucu': 'derin_dondurucu',
  'Derin Dondurucu Oda': 'derin_dondurucu',
  'Depolama': 'kuru_depo',
  'Bulaşık Yıkama': 'bulasikhane',
  'Açık Büfe': 'acik_bufe',
  'Teşhir Alanı': 'show_mutfagi',
  'Açık Pizza': 'ana_mutfak',
  'Teşhir / Servis': 'show_mutfagi',
};

function pfosSuggestZones() {
  const d = D.dukkan || '';
  const base = window.EqustoPfosCalc && EqustoPfosCalc.defaultZoneKeys
    ? EqustoPfosCalc.defaultZoneKeys()
    : ['ana_mutfak', 'sebze_hazirlik', 'et_hazirlik', 'kuru_depo', 'soguk_oda', 'derin_dondurucu', 'bulasikhane'];
  if (d === 'Pizzacı') return ['ana_mutfak', 'pastane', 'sebze_hazirlik', 'bulasikhane', 'soguk_oda', 'derin_dondurucu'];
  if (d === 'Dönerci') return ['ana_mutfak', 'izgara_meze', 'et_hazirlik', 'bulasikhane', 'soguk_oda'];
  if (d === 'Steakhouse' || D.konsept === 'Steakhouse') {
    return ['ana_mutfak', 'et_hazirlik', 'izgara_meze', 'sebze_hazirlik', 'kuru_depo', 'soguk_oda', 'derin_dondurucu', 'bulasikhane'];
  }
  if (D.konsept === 'Bar') return ['bar', 'sebze_hazirlik', 'soguk_oda', 'kuru_depo', 'bulasikhane'];
  if (D.konsept === 'Pastane & Patisserie') return ['pastane', 'ana_mutfak', 'sebze_hazirlik', 'soguk_oda', 'derin_dondurucu'];
  return base;
}

function pfosInferZonesFromStations() {
  const sm = D.stationsM2 || {};
  const keys = new Set();
  Object.keys(sm).forEach(function (label) {
    if (!sm[label] || sm[label] <= 0) return;
    const zk = PFOS_STATION_TO_ZONE[label];
    if (zk) keys.add(zk);
  });
  return keys.size ? Array.from(keys) : null;
}

function pfosGetZones() {
  if (D.pfosZones && D.pfosZones.length) return D.pfosZones.slice();
  const inferred = pfosInferZonesFromStations();
  if (inferred && inferred.length) return inferred;
  return pfosSuggestZones();
}

function pfosRenderAlanPresets(containerId){
  const box=document.getElementById(containerId||'alan-presets');
  if(!box) return;
  box.innerHTML=PFOS_ALAN_PRESETS.map(function(m){
    return '<button type="button" class="pfos-m2-pill" data-m2="'+m+'" onclick="pfosSetAlanPreset('+m+')">'+m+' m²</button>';
  }).join('');
  pfosHighlightAlanPreset(D.alan);
}
function pfosHighlightAlanPreset(m2){
  const n=parseInt(m2,10);
  document.querySelectorAll('.pfos-m2-pill[data-m2]').forEach(function(btn){
    btn.classList.toggle('sel',parseInt(btn.getAttribute('data-m2'),10)===n);
  });
}
function pfosSetAlan(m2,opts){
  opts=opts||{};
  let n=parseInt(m2,10);
  if(!Number.isFinite(n)) return;
  n=Math.max(20,Math.min(10000,n));
  D.alan=n;
  const slider=document.getElementById('alan-slider');
  const inp=document.getElementById('alan-inp');
  const ozetSl=document.getElementById('ozet-alan-slider');
  const ozetInp=document.getElementById('ozet-alan-inp');
  const ozetVal=document.getElementById('ozet-alan-val');
  const a5=document.getElementById('a5');
  if(slider){
    if(n>parseInt(slider.max,10)) slider.max=String(Math.min(10000,Math.ceil(n/50)*50));
    slider.value=String(Math.max(20,Math.min(parseInt(slider.max,10)||1000,n)));
  }
  if(inp) inp.value=String(n);
  if(ozetInp) ozetInp.value=String(n);
  if(ozetSl) ozetSl.value=String(n);
  if(ozetVal) ozetVal.textContent=String(n);
  if(a5) a5.textContent=n+' m²';
  pfosHighlightAlanPreset(n);
  pfosUpdateOzetMetaAlan();
  if(opts.stations!==false&&n>=20){
    const grid=document.getElementById('stations-grid');
    if(!grid||!grid.querySelector('.station-inp')) renderStations(n);
    else stationsUpdateTotal(n);
  }
}
function pfosSetAlanPreset(m2){
  const w=document.getElementById('alan-warn');
  if(w) w.style.display='none';
  const ow=document.getElementById('ozet-alan-warn');
  if(ow) ow.style.display='none';
  pfosSetAlan(m2);
  schedulePfosLiveRecalc();
}
function pfosReadAlanFromUi(){
  const inp=document.getElementById('alan-inp');
  if(inp&&inp.value!==''){
    const n=parseInt(inp.value,10);
    if(Number.isFinite(n)&&n>0) return n;
  }
  const sl=document.getElementById('alan-slider');
  if(sl&&sl.value) return parseInt(sl.value,10)||0;
  return Number(D.alan)||0;
}

function parseAlanRaw(v) {
  const s = String(v == null ? '' : v).trim();
  if (s === '') return { empty: true, n: null };
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return { empty: true, n: null };
  return { empty: false, n: Math.min(10000, n) };
}

/** soft: yazarken 20'ye zorlamaz (300 gibi çok haneli değer yazılabilir) */
function syncAlanUi(v, opts) {
  opts = opts || {};
  const soft = !!opts.soft;
  const parsed = parseAlanRaw(v);
  const n = parsed.empty ? null : parsed.n;
  const committed =
    soft && opts.commitMin !== true
      ? n
      : parsed.empty
        ? 0
        : Math.max(20, Math.min(10000, n));
  const inp = document.getElementById('alan-inp');
  const slider = document.getElementById('alan-slider');
  const ozetInp = document.getElementById('ozet-alan-inp');
  const ozetSlider = document.getElementById('ozet-alan-slider');
  const ozetVal = document.getElementById('ozet-alan-val');
  function syncSlider(sl, maxDefault, target) {
    if (!sl || target == null || target < 20) return;
    const max = parseInt(sl.max, 10) || maxDefault || 800;
    sl.value = String(Math.min(target, max));
    if (target > max) sl.max = String(Math.min(10000, Math.ceil(target / 50) * 50));
  }
  function writeInp(el, raw, num) {
    if (!el) return;
    if (soft) {
      el.value = raw.empty ? '' : String(num);
    } else if (committed >= 20) {
      el.value = String(committed);
    }
  }
  writeInp(inp, parsed, n);
  writeInp(ozetInp, parsed, n);
  const sliderN = soft ? (n != null && n >= 20 ? n : null) : committed >= 20 ? committed : null;
  syncSlider(slider, 800, sliderN);
  syncSlider(ozetSlider, 800, sliderN);
  if (inp && !soft && committed >= 20) inp.value = String(committed);
  if (ozetInp && !soft && committed >= 20) ozetInp.value = String(committed);
  if (ozetVal && n != null && !parsed.empty) ozetVal.textContent = String(n);
  document.querySelectorAll('.pfos-m2-pill').forEach(function (btn) {
    const m = parseInt(btn.getAttribute('data-m2'), 10);
    btn.classList.toggle('sel', n != null && m === n);
  });
  return soft ? (parsed.empty ? 0 : n) : committed;
}

function pfosUpdateOzetMetaAlan() {
  const el = document.getElementById('ozet-meta-alan');
  if (el) el.textContent = D.alan != null ? String(D.alan) : '—';
}

function pfosApplyAlanFromUi(source, opts) {
  opts = opts || {};
  if (source === 'ozet') {
    const ozInp = document.getElementById('ozet-alan-inp');
    const ozetSl = document.getElementById('ozet-alan-slider');
    if (ozInp && ozInp.value !== '') {
      pfosSetAlan(parseInt(ozInp.value, 10) || D.alan, { stations: false });
    } else if (ozetSl) {
      pfosSetAlan(parseInt(ozetSl.value, 10) || D.alan, { stations: false });
    }
  } else {
    const n = pfosReadAlanFromUi();
    if (n > 0) D.alan = n;
  }
  const a5 = document.getElementById('a5');
  if (a5 && D.alan) a5.textContent = D.alan + ' m²';
  pfosUpdateOzetMetaAlan();
  return D.alan || 0;
}

function onOzetAlanSlider() {
  const warn = document.getElementById('ozet-alan-warn');
  if (warn) warn.style.display = 'none';
  const sl = document.getElementById('ozet-alan-slider');
  if (!sl) return;
  pfosSetAlan(parseInt(sl.value, 10) || 80, { stations: false });
  schedulePfosLiveRecalc();
}

function onOzetAlanInput() {
  const warn = document.getElementById('ozet-alan-warn');
  if (warn) warn.style.display = 'none';
  const inp = document.getElementById('ozet-alan-inp');
  if (!inp) return;
  syncAlanUi(inp.value, { soft: true });
  const n = parseInt(inp.value, 10);
  if (Number.isFinite(n) && n > 0) D.alan = n;
  schedulePfosLiveRecalc();
}

function onOzetAlanBlur() {
  const inp = document.getElementById('ozet-alan-inp');
  const v = syncAlanUi(inp ? inp.value : '', { commitMin: true });
  const warn = document.getElementById('ozet-alan-warn');
  if (v < 20) {
    if (warn) warn.style.display = 'block';
    return;
  }
  if (warn) warn.style.display = 'none';
  D.alan = v;
  pfosUpdateOzetMetaAlan();
  schedulePfosLiveRecalc();
}

function setOzetAlanPreset(m2) {
  pfosSetAlanPreset(m2);
}

function onAlanSlider() {
  const slider = document.getElementById('alan-slider');
  if (!slider) return;
  document.getElementById('alan-warn').style.display = 'none';
  pfosSetAlan(parseInt(slider.value, 10) || 80, { stations: true });
  schedulePfosLiveRecalc();
}

function onAlan() {
  document.getElementById('alan-warn').style.display = 'none';
  const raw = document.getElementById('alan-inp').value;
  const v = syncAlanUi(raw, { soft: true });
  const parsed = parseAlanRaw(raw);
  if (!parsed.empty && parsed.n != null) D.alan = parsed.n;
  else if (v >= 20) D.alan = v;
  if (D.alan >= 20) {
    const grid = document.getElementById('stations-grid');
    if (!grid || !grid.querySelector('.station-inp')) renderStations(D.alan);
    else stationsUpdateTotal(D.alan);
  }
  schedulePfosLiveRecalc();
}

function renderPfosZonePills() {
  const grid = document.getElementById('pfos-zone-grid');
  if (!grid) return;
  const defs =
    window.EqustoPfosCalc && EqustoPfosCalc.PFOS_ZONE_DEFS ? EqustoPfosCalc.PFOS_ZONE_DEFS : [];
  const selected = new Set(pfosGetZones());
  if (!D.pfosZones || !D.pfosZones.length) D.pfosZones = Array.from(selected);
  grid.innerHTML = defs
    .map(function (z) {
      const on = selected.has(z.key) ? ' on' : '';
      return (
        '<button type="button" class="pfos-zone-pill' +
        on +
        '" data-zone="' +
        esc(z.key) +
        '" style="--pfos-pill-color:' +
        esc(z.color) +
        '" aria-pressed="' +
        (on ? 'true' : 'false') +
        '"><span class="ico" aria-hidden="true">' +
        z.icon +
        '</span><span>' +
        esc(z.name) +
        '</span></button>'
      );
    })
    .join('');
  if (!grid._pfosZoneBound) {
    grid._pfosZoneBound = true;
    grid.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-zone]');
      if (!btn) return;
      togglePfosZone(btn.getAttribute('data-zone'), btn);
    });
  }
}

function togglePfosZone(key, el) {
  const set = new Set(pfosGetZones());
  if (set.has(key)) {
    if (set.size <= 1) return;
    set.delete(key);
  } else set.add(key);
  D.pfosZones = Array.from(set);
  if (el) {
    el.classList.toggle('on', set.has(key));
    el.setAttribute('aria-pressed', set.has(key) ? 'true' : 'false');
  } else renderPfosZonePills();
  pfosUpdateA5cLabel();
  schedulePfosLiveRecalc();
}

// ── 03 Toplam Alan (m²) — lokasyondan hemen sonra ─────────────────────────────
function goAlan(){
  hideFrom('s5'); reveal('s5'); activate('s5');
  const start = (D.alan && D.alan >= 20) ? D.alan : 80;
  pfosRenderAlanPresets('alan-presets');
  pfosSetAlan(start, { stations: start >= 20 });
  if (start < 20) {
    const grid = document.getElementById('stations-grid');
    if (grid) grid.innerHTML = '';
  }
  setTimeout(function(){
    const sl = document.getElementById('alan-slider');
    if (sl) sl.focus();
  }, 200);
  refreshWizardHint();
  schedulePfosLiveRecalc();
}

function goKategoriler(){
  hideFrom('s5c'); reveal('s5c'); activate('s5c');
  D.pfosZones = pfosSuggestZones();
  renderPfosZonePills();
  pfosUpdateA5cLabel();
  refreshWizardHint();
  schedulePfosLiveRecalc();
}

function pfosUpdateA5cLabel(){
  const el=document.getElementById('a5c');
  const defs=window.EqustoPfosCalc&&EqustoPfosCalc.PFOS_ZONE_DEFS?EqustoPfosCalc.PFOS_ZONE_DEFS:[];
  const keys=pfosGetZones();
  if(!el||!defs.length) return;
  const names=keys.map(k=>{const z=defs.find(d=>d.key===k);return z?z.name:k;}).filter(Boolean);
  el.textContent=names.length?names.join(' · '):'';
}

function kategoriIleri(){
  D.pfosZones=pfosGetZones();
  if(!D.pfosZones||!D.pfosZones.length){
    pfModalAc('Kategoriler','En az bir mutfak kategorisi seçin.',false);
    return;
  }
  pfosUpdateA5cLabel();
  done('s5c');
  goOzet();
}

function goKonsept(){
  hideFrom('s3');
  reveal('s3');
  activate('s3');
  refreshWizardHint();
  schedulePfosLiveRecalc();
}

function goOzet(){
  hideFrom('s6');
  if (!D.pfosZones || !D.pfosZones.length) D.pfosZones = pfosSuggestZones();
  const v = D.alan >= 20 ? D.alan : 0;
  if (v >= 20) {
    const grid = document.getElementById('stations-grid');
    if (!grid || !grid.querySelector('.station-inp')) renderStations(v);
    else stationsUpdateTotal(v);
  }
  if (D.konsept) renderPfPdfs();
  renderOzet();
  reveal('s6');
  activate('s6');
  refreshWizardHint();
  schedulePfosLiveRecalc();
  pfosUpdateOzetMetaAlan();
}

function onAlanBlur(){
  const inp = document.getElementById('alan-inp');
  const v = syncAlanUi(inp ? inp.value : '', { commitMin: true });
  const warn = document.getElementById('alan-warn');
  if (v < 20) {
    if (warn) warn.style.display = 'block';
    return;
  }
  if (warn) warn.style.display = 'none';
  D.alan = v;
  document.getElementById('a5').textContent = v + ' m²';
}
function pfosReadStationsM2(){
  const rows = document.querySelectorAll('#stations-grid .station-row');
  const out = {};
  rows.forEach(function (row) {
    const lbl = row.querySelector('.station-lbl');
    const inp = row.querySelector('.station-inp');
    if (!lbl || !inp) return;
    const n = parseInt(inp.value, 10);
    if (Number.isFinite(n) && n > 0) out[lbl.textContent.trim()] = n;
  });
  return out;
}

function alanIleri(){
  const v = pfosReadAlanFromUi();
  if (!v || v < 20) {
    document.getElementById('alan-warn').style.display = 'block';
    return;
  }
  pfosSetAlan(v);
  D.stationsM2 = pfosReadStationsM2();
  document.getElementById('a5').textContent=v+' m²';
  // Bölüm listesi yoksa veya konsept değiştiyse yeniden çiz; aksi halde mevcut değerleri koru
  const grid=document.getElementById('stations-grid');
  if(!grid||!grid.querySelector('.station-inp')) renderStations(v);
  else stationsUpdateTotal(v);
  document.getElementById('stations-wrap').style.display='block';
  done('s5');
  goKonsept();
}

function stationsUpdateTotal(totalM2){
  document.querySelectorAll('#stations-grid .station-inp').forEach(i=>{
    i.setAttribute('oninput','checkStationTotal('+totalM2+')');
  });
  checkStationTotal(totalM2);
}
function renderStations(totalM2){
  const list=pfosStationLabels();
  document.getElementById('stations-grid').innerHTML=list.map(s=>`
    <div class="station-row">
      <div class="station-lbl">${s}</div>
      <input class="station-inp" type="number" placeholder="0" min="0"
        oninput="checkStationTotal(${totalM2})">
      <div class="station-unit">m²</div>
    </div>`).join('');
}
function checkStationTotal(total){
  const inputs=[...document.querySelectorAll('.station-inp')];
  const sum=inputs.reduce((a,i)=>a+(parseInt(i.value)||0),0);
  const warn=document.getElementById('station-warn');
  // Toplam henüz girilmediyse (0) uyarı gösterme
  warn.style.display=(total>0 && sum>total)?'block':'none';
}

// ── 06 Teklif Özeti ───────────────────────────────────────────────────────────
function renderOzet(){
  pfosSyncDraftFromUi();
  const alanStart = D.alan >= 20 ? D.alan : '';
  if (D.alan >= 20) {
    /* mevcut */
  } else {
    D.alan = null;
  }
  const rows=pfosPriceRows(buildEkipmanList());
  const amt=pfosQuoteTotal(rows);
  const fmt=new Intl.NumberFormat('tr-TR').format(amt);
  const lbl=[D.franchise||konseptGoster(),D.dukkan,D.alt].filter(Boolean).join(' · ');
  const presetHtml=PFOS_ALAN_PRESETS.map(function(m){
    return '<button type="button" class="pfos-m2-pill'+(Number(D.alan)===m?' sel':'')+'" data-m2="'+m+'" onclick="setOzetAlanPreset('+m+')">'+m+' m²</button>';
  }).join('');
  document.getElementById('s6-bd').innerHTML=`
    <div class="rs">
      <h3>Proje özeti</h3>
      <div class="rs-meta">
        <b>İşletme:</b> ${lbl}<br>
        <b>Şehir:</b> ${D.sehir||'—'}&nbsp;&nbsp;<b>Alan:</b> <span id="ozet-meta-alan">${D.alan}</span> m²
        ${D.pisir&&D.pisir.length?`<br><b>Mutfakta öne çıkanlar:</b> ${D.pisir.join(', ')}`:''}
        ${D.adres?`<br><b>Adres:</b> ${D.adres}`:''}
      </div>
      <div class="rs-amt">${fmt} ₺</div>
      <div id="pfos-live-status" class="pfos-live-status" aria-live="polite"></div>
      <div id="pfos-nakliye-est" class="pfos-nakliye-est" style="display:none" aria-live="polite"></div>
      <div class="rs-note">Ekipman listesi seçimlerinize göre otomatik üretilir; tipik projelerde yaklaşık doğruluk hedeflenir, yine de yerinde keşif ve onay şarttır. Tutar örnektir (KDV hariç). Nakliye ve montaj adresinize göre tahmin edilir.</div>
    </div>
    <div class="pfos-m2-step">
      <h4 class="pfos-m2-step__title">Toplam alan (m²)</h4>
      <p class="pfos-m2-step__sub">Sayı yazın, kaydırıcı veya hazır değerlerle seçin.</p>
      <div class="pfos-m2-presets">${presetHtml}</div>
      <div class="pfos-alan-hero" aria-live="polite" style="margin-top:8px">
        <input type="number" class="pfos-alan-val-inp" id="ozet-alan-inp" min="1" max="10000" step="1" value="${alanStart || 80}"
          inputmode="numeric" aria-label="Özet toplam alan"
          oninput="onOzetAlanInput()" onblur="onOzetAlanBlur()">
        <span class="pfos-alan-unit">m²</span>
      </div>
      <input type="range" class="pfos-alan-range" id="ozet-alan-slider" min="20" max="1000" step="1" value="${alanStart || 80}"
        aria-label="Özet alan kaydırıcı" oninput="onOzetAlanSlider()" onchange="onOzetAlanSlider()">
      <div class="fw" id="ozet-alan-warn" style="display:none">Lütfen en az 20 m² seçin.</div>
    </div>
    <div style="font-size:13.5px;color:var(--text);margin-top:18px;margin-bottom:8px;font-weight:500">
      Bu yeterli mi, yoksa senin için projeyi detaylandırayım mı?
    </div>
    <div class="dr">
      <button class="dc" onclick="setKarar('teklif',this)"><b>Teklifi Oluştur</b><span>Ekipman listesi ve gönderim</span></button>
      <button class="dc" onclick="setKarar('detaylandir',this)"><b>Detaylandır</b><span>6 yardımcı ekipman + elektrik/gaz</span></button>
    </div>`;
  pfosSetAlan(alanStart >= 20 ? alanStart : 80, { stations: false });
  var __nak=pfosEstimateNakliye(rows,amt);
  D.nakliye=__nak;
  pfosPatchNakliyeUi(__nak);
  pfosQueueInsight('proje_ozet');
}

function tahmini(){
  const d = D.dukkan || '', a = D.alt || '';
  const alan = Number(D.alan) || 0;
  const pastaneLike =
    d === 'Pastane & Patisserie' ||
    a === 'Artisan Bakery' ||
    a === 'Industrial Bakery' ||
    a === 'Pastane (klasik)';
  /* TL/m² — örnek proje rail ile uyumlu (200 m² steakhouse ≈ 200k bandı) */
  const perM2 = {
    Steakhouse: 1000,
    Restaurant: 900,
    'Pastane & Patisserie': 650,
    Cafe: 450,
    'Kafe-Kafeterya': 500,
    'Bulut Mutfak': 750,
    Hotel: 1100,
    Bar: 550,
    Catering: 850,
    Franchise: 800,
    Şarküteri: 750,
    Kasap: 700,
  };
  let m = perM2[D.konsept] || 750;
  if (d === 'Steakhouse' || D.konsept === 'Steakhouse') m = Math.max(m, 1000);
  if (d === 'Fine Dining') m = Math.max(m, 1050);
  if (d === 'Şarküteri Restoran' || d === 'Gurme Şarküteri') m = Math.max(m, 800);
  if (d === 'Pizzacı') m = Math.max(m, 720);
  if (d === 'Dönerci') m = Math.max(m, 680);
  if (pastaneLike) m = Math.min(m, 650);
  if (alan >= 220) m = Math.round(m * 1.12);
  else if (alan >= 150) m = Math.round(m * 1.06);
  return Math.round((m * alan) / 100) * 100;
}

function setKarar(val,el){
  const v = pfosApplyAlanFromUi(document.getElementById('ozet-alan-inp') ? 'ozet' : 's5');
  if (!v || v < 20) {
    const warn = document.getElementById('ozet-alan-warn');
    if (warn) warn.style.display = 'block';
    pfModalAc(
      'Toplam alan (m²)',
      'Teklif oluşturmak için önce toplam mutfak alanını seçin veya yazın (en az 20 m²).',
      false
    );
    return;
  }
  D.karar=val;
  document.querySelectorAll('.dc').forEach(b=>b.classList.remove('sel'));
  el.classList.add('sel');
  done('s6'); hideFrom('s6a');
  if(val==='teklif'){ reveal('s6a'); renderTeklifTablo(); }
  else { renderEkipman(); reveal('s6b'); activate('s6b'); }
}

// ── Teklif Tablosu (dinamik — konsept + dükkan + pişirme bazlı) ──────────────
function renderTeklifTablo(){
  pfosEnsureCatalogPool().then(function(){
    renderTeklifTabloInner();
  });
}
function renderTeklifTabloInner(){
  const rows=pfosPriceRows(buildEkipmanList());
  const amt=pfosQuoteTotal(rows);
  if(window.EqustoPfosTeklifUi&&typeof EqustoPfosTeklifUi.buildPfosTeklifHtml==='function'){
    const teklifCtx=Object.assign({},D,{pfosZones:pfosGetZones()});
    const wrap=document.getElementById('teklif-tbl-wrap');
    wrap.innerHTML=EqustoPfosTeklifUi.buildPfosTeklifHtml(rows,amt,{},teklifCtx);
    wrap.dataset.pfosTeklifBound='';
    if(typeof EqustoPfosTeklifUi.installTeklifInteractivity==='function'){
      EqustoPfosTeklifUi.installTeklifInteractivity(wrap);
    }
    renderTabloSag();
    return;
  }
  const totalElk=rows.reduce((a,r)=>a+r.elk*r.adet,0);
  const totalGaz=rows.reduce((a,r)=>a+r.gaz*r.adet,0);
  const totalTl=rows.reduce((a,r)=>a+r.birim*r.adet,0);
  const fmt=n=>new Intl.NumberFormat('tr-TR').format(n);

  let html=`<div class="tbl-wrap"><table class="tbl">
    <thead><tr>
      <th>No</th><th>Equsto Kodu</th><th>Ürün Adı</th><th>Marka / Model</th>
      <th class="r">Adet</th><th class="r">Elk. kW</th><th class="r">Gaz kW</th>
      <th class="r">Birim Fiyat ₺</th><th class="r">Toplam ₺</th>
    </tr></thead><tbody>`;

  rows.forEach((r,i)=>{
    html+=`<tr>
      <td>${i+1}</td>
      <td class="kod">${r.kod}</td>
      <td>${pfEqNameCellHtml(r)}</td>
      <td style="color:var(--muted);font-size:12px">${r.marka}</td>
      <td class="r">${r.adet}</td>
      <td class="r">${r.elk>0?r.elk.toFixed(1):'—'}</td>
      <td class="r">${r.gaz>0?r.gaz.toFixed(0):'—'}</td>
      <td class="r">${fmt(r.birim)}</td>
      <td class="r">${fmt(r.birim*r.adet)}</td>
    </tr>`;
    if(r.davlumbaz){
      html+=`<tr class="note-row"><td colspan="9">⚠ Yangın söndürme sistemi zorunludur. Lütfen yetkili firma ile görüşün.</td></tr>`;
    }
  });

  html+=`</tbody>
    <tfoot>
      <tr class="sum-row">
        <td colspan="5" style="text-align:right;font-size:12px;color:var(--muted)">Sütun Toplamları →</td>
        <td class="r">${totalElk.toFixed(1)} kW</td>
        <td class="r">${totalGaz.toFixed(0)} kW</td>
        <td colspan="2"></td>
      </tr>
      <tr class="total-row">
        <td colspan="8"><b>GENEL TOPLAM (KDV Hariç)</b></td>
        <td class="r"><b>${fmt(totalTl)} ₺</b></td>
      </tr>
    </tfoot>
  </table></div>
  <div class="sartlar">
    <div class="sartlar-title">Şartlarımız</div>
    <ul>
      <li>Nakliye ve montaj bedeli projeye ve teslimat adresine göre ayrıca hesaplanır.</li>
      <li>Bu teklif <b>30 gün</b> geçerlidir.</li>
      <li>Fiyatlar döviz kuruna bağlı olarak değişkenlik gösterebilir.</li>
      <li>Katalogda bulunmayan kalemler için fiyat yerine "hariç" yazılır.</li>
      <li>Ödeme planı satış ekibimizle görüşülür.</li>
    </ul>
  </div>`;

  document.getElementById('teklif-tbl-wrap').innerHTML=html;
  renderTabloSag();
}

// ── 06a Eylemler ──────────────────────────────────────────────────────────────

function pfosSepeteKatalog(){
  pfosEnsureCatalogPool().then(function(){
    if(!window.EqustoCart||typeof EqustoCart.addPfosRows!=='function'){
      pfModalAc('Sepet yüklenemedi','Sayfayı yenileyip tekrar deneyin.',true);
      return;
    }
    var rows=pfosPriceRows(buildEkipmanList());
    if(!rows||!rows.length){
      pfModalAc('Liste boş','Önce teklif listesine ürün ekleyin.',true);
      return;
    }
    EqustoCart.addPfosRows(rows,{replace:false}).then(function(){
      EqustoCart.openPanel();
    });
  });
}

function excelIndir(){
  pfosEnsureCatalogPool().then(function(){
    const rows=pfosPriceRows(buildEkipmanList());
    const teklifCtx=Object.assign({},D,{pfosZones:pfosGetZones()});
    if(window.EqustoPfosTeklifUi&&typeof EqustoPfosTeklifUi.downloadProformaExcel==='function'){
      EqustoPfosTeklifUi.downloadProformaExcel(rows,teklifCtx);
    } else {
      pfModalAc('Excel indirilemedi','Teklif modülü yüklenemedi. Sayfayı yenileyip tekrar deneyin.',true);
    }
  });
}

function pdfIndir(){
  pfModalKapat();
  pfosEnsureCatalogPool().then(function(){
    var rows=pfosPriceRows(buildEkipmanList());
    var teklifCtx=Object.assign({},D,{pfosZones:pfosGetZones()});
    var ui=window.EqustoPfosTeklifUi;
    if(ui&&typeof ui.printTeklifV10==='function'){
      ui.printTeklifV10(rows,teklifCtx);
      return;
    }
    pfModalAc('PDF olu\u015fturulamad\u0131','Teklif mod\u00fcl\u00fc y\u00fcklenemedi. Sayfay\u0131 yenileyip tekrar deneyin.',false);
  });
}
function projeOzetMetni(){
  const par=[];
  par.push('— Equsto Proje Fabrikası özeti —');
  par.push('Şehir: '+(D.sehir||'—'));
  par.push('Adres: '+(D.adres||'—'));
  const isl=(D.franchise||konseptGoster()||'')+(D.dukkan?' / '+D.dukkan:'')+(D.alt?' / '+D.alt:'');
  par.push('İşletme: '+isl);
  par.push('Alan: '+(D.alan?D.alan+' m²':'—'));
  if(D.pisir&&D.pisir.length) par.push('Mutfakta öne çıkanlar: '+D.pisir.join(', '));
  if(D.meslek) par.push('Ben: '+D.meslek);
  return par.join('\n');
}
function wpGonder(){
  const body=encodeURIComponent(projeOzetMetni());
  window.location.href='mailto:info@equsto.com?subject='+encodeURIComponent('Proje Fabrikası — özet')+'&body='+body;
}
function mailGonder(){
  window.location.href='mailto:info@equsto.com?subject='+encodeURIComponent('Proje Fabrikası — hızlı soru')+'&body='+encodeURIComponent('Merhaba,\n\n'+projeOzetMetni()+'\n\nMesajım:\n\n');
}

// ── 06b Yardımcı Ekipmanlar ───────────────────────────────────────────────────
function renderEkipman(){
  const key=YARDIMCI[D.dukkan]?D.dukkan:(YARDIMCI[D.konsept]?D.konsept:'default');
  const raw=YARDIMCI[key]||YARDIMCI.default;
  const list=raw.slice(0,6);
  D.yardimci=list.slice();
  document.getElementById('ekip-g').innerHTML=list.map(e=>`
    <div class="ei sel" onclick="toggleEkip(this,'${esc(e)}')">
      <div class="eic">✓</div><span>${e}</span>
    </div>`).join('');
}
function toggleEkip(el,val){
  const i=D.yardimci.indexOf(val);
  if(i>-1){D.yardimci.splice(i,1);el.classList.remove('sel');el.querySelector('.eic').textContent='';}
  else{D.yardimci.push(val);el.classList.add('sel');el.querySelector('.eic').textContent='✓';}
}
function ekipTamamla(){ renderElkGaz(); reveal('s6c'); activate('s6c'); }

// ── 06c Elk / Gaz ─────────────────────────────────────────────────────────────
function renderElkGaz(){
  D.elkgaz=D.elkgaz||[];
  document.getElementById('eg-grid').innerHTML=ELKGAZ.map(o=>`
    <label class="co${D.elkgaz.includes(o)?' sel':''}" onclick="toggleEG('${esc(o)}',this)">
      <input type="checkbox" ${D.elkgaz.includes(o)?'checked':''}> ${o}
    </label>`).join('');
}
function toggleEG(val,el){
  const i=D.elkgaz.indexOf(val);
  if(i>-1) D.elkgaz.splice(i,1); else D.elkgaz.push(val);
  el.classList.toggle('sel',D.elkgaz.includes(val));
  el.querySelector('input').checked=D.elkgaz.includes(val);
}
function elkgazTamamla(){
  document.getElementById('a6c').textContent=D.elkgaz.length?D.elkgaz.join(' · '):'Belirtilmedi';
  done('s6c');
  const amt=Math.round(tahmini()*1.08/100)*100;
  document.getElementById('s6d-sub').textContent=`${new Intl.NumberFormat('tr-TR').format(amt)} ₺ · yardımcı ekipman dahil · KDV hariç · Nakliye ayrıca`;
  reveal('s6d');
}

function __pfApiBase(){
  if (typeof window.EQUSTO_API_BASE === 'string') return window.EQUSTO_API_BASE.replace(/\/$/,'');
  const h=(location.hostname||'').toLowerCase();
  if (h==='127.0.0.1'||h==='localhost') return 'http://127.0.0.1:3001/api';
  return '/api';
}
function teklifGonder(){
  if(typeof window.equstoIsMemberLoggedIn!=='function'||!window.equstoIsMemberLoggedIn()){
    pfModalAc('Üye girişi gerekli','Teklif göndermek için giriş yapın.',true);
    var lh=typeof window.equstoUrl==='function'?window.equstoUrl('login'):'/login';
    if(window.confirm('Giriş sayfasına gitmek ister misiniz?')){ location.href=lh; }
    return;
  }
  const ad=(window.prompt('Ad Soyad:')||'').trim();
  if (!ad){ pfModalAc('Teklif iptal','Ad gerekli.',true); return; }
  const tel=(window.prompt('Telefon (ör. 0532…):')||'').trim();
  if (!tel){ pfModalAc('Teklif iptal','Telefon gerekli.',true); return; }
  const eposta=(window.prompt('E-posta (opsiyonel):')||'').trim();
  const not=(window.prompt('Not (opsiyonel):')||'').trim();
  const btn=document.getElementById('pf-teklif-ac');
  const lblEl=btn?btn.querySelector('.lbl'):null;
  const oldLbl=lblEl?lblEl.textContent:'';
  if (lblEl) lblEl.textContent='Gönderiliyor…';
  if (btn) btn.style.pointerEvents='none';
  const amt=Math.round(tahmini()*1.08/100)*100;
  pfosSyncDraftFromUi();
  const rows=pfosPriceRows(buildEkipmanList());
  const lok=pfosGetLokasyon();
  const nak=pfosEstimateNakliye(rows,amt);
  D.lokasyon=lok;
  D.nakliye=nak;
  const veriBankasi=window.EqustoPfosLocation?EqustoPfosLocation.buildInsightPayload({
    event:'teklif_gonder', D:D, lokasyon:lok, rows:rows, nakliye:nak,
    bolgeler:typeof pfosGetZones==='function'?pfosGetZones():[], ekipman_toplam_tl:amt,
  }):null;
  const payload={
    musteri:{ ad:ad, telefon:tel, eposta:eposta },
    not:not,
    proje:{
      sehir:D.sehir||'', adres:D.adres||'', alan_m2:D.alan||0,
      meslek:D.meslek||'', konsept:D.konsept||'', franchise:D.franchise||'',
      dukkan:D.dukkan||'', alt:D.alt||''
    },
    lokasyon:lok,
    nakliye_tahmin_tl:nak.gecerli?nak.tutar:0,
    nakliye:nak,
    mutfak_bolgeleri:typeof pfosGetZones==='function'?pfosGetZones():[],
    ekipman_satirlari:window.EqustoPfosLocation?EqustoPfosLocation.rowsToProducts(rows):[],
    mutfak_one_cikan:D.pisir||[],
    menu:D.menu||[],
    yardimci_ekipman:D.yardimci||[],
    elk_gaz:D.elkgaz||[],
    tahmini_toplam_tl:amt,
    ozet_metin:projeOzetMetni(),
    veri_bankasi:veriBankasi,
    kaynak:'pfos'
  };
  fetch(__pfApiBase()+'/teklifler',{
    method:'POST',
    headers:(function(){
      var h={'Content-Type':'application/json'};
      var tok=typeof window.equstoGetMemberToken==='function'?window.equstoGetMemberToken():'';
      if(tok){
        h.Authorization='Bearer '+tok;
        h['X-Equsto-Authorization']=tok;
      }
      return h;
    })(),
    body:JSON.stringify(payload)
  }).then(function(r){ return r.json().then(function(j){ return {ok:r.ok,j:j}; }); })
    .then(function(res){
      if (lblEl) lblEl.textContent=oldLbl||'Teklifi Equsto\u2019ya gönder';
      if (btn) btn.style.pointerEvents='';
      if (!res.ok || !(res.j && res.j.success)){
        const msg=(res.j && (res.j.error||res.j.message))||'HTTP hata';
        pfModalAc('Teklif gönderilemedi','Hata: '+msg+'. Lütfen daha sonra tekrar deneyin.',true);
        return;
      }
      const no=(res.j.data && (res.j.data.ref_no||res.j.data.id))||'';
      try {
        if (typeof window.equstoTrackConversion === 'function') {
          window.equstoTrackConversion('quote', { kaynak: 'pfos', ref_no: no });
        }
      } catch (_) {}
      pfModalAc('Teklifiniz alındı','Referans: '+(no||'-')+'. Ekibimiz en kısa sürede sizinle iletişime geçecek.',true);
    })
    .catch(function(e){
      if (lblEl) lblEl.textContent=oldLbl||'Teklifi Equsto\u2019ya gönder';
      if (btn) btn.style.pointerEvents='';
      const em=e&&e.message?e.message:String(e);
      pfModalAc('Teklif gönderilemedi','Sunucuya ulaşılamadı: '+em,true);
    });
}
