# -*- coding: utf-8 -*-
import re
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

old_const = """const MESLEKLER = ['Yatırımcı','Şef / Aşçı','Satınalmacı','Mimar','Franchise Sahibi'];
const KONSEPTLER = ['Restaurant','Steakhouse','Şarküteri','Kafe-Kafeterya','Bulut Mutfak','Hotel','Bar','Catering','Kasap'];

const DUKKAN = {
  Restaurant:[
    'Fine Dining',
    'Dünya Mutfağı',
    'All Dining Cafe (TheHouse Cafe, Happymoons vb)',
    'Balık Restaurant',
    'Steakhouse',
    'Meyhane',
    'Kebapçı',
    'Esnaf Lokantası',
    'Fast Food',
    'Pastane & Patisserie',
  ],
  'Kafe-Kafeterya':['Cafe','Coffee Shop','Kafe (Genel)'],
  'Bulut Mutfak':['Döner','Pizza','Burger','Ev Yemekleri','Kebap & Türk Mutfağı','Pide & Lahmacun'],
  Hotel:['Şehir Oteli (Business)','Resort Otel','Dağ-Kayak Oteli','Tatil Oteli'],
  Bar:['Kokteyl Bar','Wine Bar','Beer Pub','Irish Pub','Mixology Bar','Lounge Bar'],
  Catering:['Üretim Fabrikası','Yerinde Üretim','Taşıma Yemek (Servis & Yıkama)'],
  Kasap:null,
  Franchise:['Fine Dining','Dünya Mutfağı','All Dining Cafe (TheHouse Cafe, Happymoons vb)','Balık Restaurant','Steakhouse','Meyhane','Kebapçı','Esnaf Lokantası','Fast Food','Pastane & Patisserie'],
};

const ALT = {
  'Dünya Mutfağı':['İtalyan','Uzakdoğu','Ortadoğu','Latin'],
  'Balık Restaurant':['Mahalle Balıkçısı / Balık Lokantası','Balık Restaurantı','Seafood Bistro'],
  'Esnaf Lokantası':['Self Servis','Masaya Servis'],
  'Fast Food':['Burger','Pizza','Fried Chicken','Dönerci','Pide & Lahmacun'],
  'Pastane & Patisserie':['Pastane (klasik)','Artisan Bakery','Industrial Bakery'],
};"""

new_const = """const MESLEKLER = ['Yatırımcı','Şef / Aşçı','Satınalmacı','Mimar','Franchise Sahibi','Söylemek İstemiyorum'];
const KONSEPTLER = ['Restaurant','Pastane & Patisserie','Cafe','Bulut Mutfak','Hotel','Bar','Catering'];

const DUKKAN = {
  Restaurant:['Fine Dining','Dünya Mutfağı','All Dining Cafe (TheHouse Cafe, Happymoons vb)','Balık Restaurant','Steakhouse','Gurme Şarküteri','Meyhane','Kebapçı','Kafe-Kafeterya','Esnaf Lokantası','Fastfood'],
  'Pastane & Patisserie':['Artisan Bakery','Industrial Bakery'],
  Cafe:['Coffee Shop'],
  'Bulut Mutfak':['Döner','Pizza','Pide & Lahmacun','Burger','Ev Yemekleri','Kebap & Türk Mutfağı'],
  Hotel:['Şehir Oteli (Business)','Resort Otel','Dağ-Kayak Oteli','Tatil Oteli'],
  Bar:['Kokteyl Bar','Wine Bar','Beer Pub','Irish Pub','Mixology Bar','Lounge Bar'],
  Catering:['Üretim Fabrikası','Yerinde Üretim','Taşıma Yemek (Servis & Yıkama)'],
  Franchise:['Fine Dining','Dünya Mutfağı','All Dining Cafe (TheHouse Cafe, Happymoons vb)','Balık Restaurant','Steakhouse','Meyhane','Kebapçı','Esnaf Lokantası','Fastfood'],
};

const ALT = {
  'Dünya Mutfağı':['İtalyan','Uzakdoğu','Ortadoğu','Latin'],
  'Balık Restaurant':['Mahalle Balıkçısı / Balık Lokantası','Balık Restaurantı','Seafood Bistro'],
  'Esnaf Lokantası':['Self Servis','Masaya Servis'],
  Fastfood:['Burger','Pizza','Fried Chicken','Dönerci','Pide & Lahmacun'],
};

const NE_PISIR_V3=['Kahvaltı','Izgara','Kebap','Döner','Pizza','Pide / Lahmacun','Burger','Fried Chicken','Balık / Deniz Ürünleri','Ev Yemekleri / Sulu Yemek','Makarna','Tatlı / Pastane','Kahve / İçecek','Açık Büfe','Diğer','Bilmiyorum'];"""

if old_const in t:
    t = t.replace(old_const, new_const, 1)

old_pisir = """const PISIR_OPTS = {
  Restaurant:['Izgara / Ocakbaşı','Pizza / Fırın ürünleri','Kızartma','Türk mutfağı (kebap, börek, pide)','Pasta / Tatlı','Soğuk mutfak (salata, meze)','Deniz ürünleri','Kahvaltı / Brunch','Dünya mutfağı'],
  Steakhouse:['Izgara / Ocakbaşı','Kızartma','Türk mutfağı (kebap, börek, pide)','Pasta / Tatlı','Soğuk mutfak (salata, meze)','Kahvaltı / Brunch'],
  Şarküteri:['Soğuk mutfak (salata, meze)','Et dilimleme / şarküteri teşhir','Peynir & kahvaltılık reyonu','İçecek ağırlıklı'],
  'Kafe-Kafeterya':['İçecek ağırlıklı','Kahvaltı / Brunch','Pasta / Tatlı','Soğuk mutfak (salata, meze)'],
  'Bulut Mutfak':['Izgara / Ocakbaşı','Pizza / Fırın ürünleri','Kızartma','Türk mutfağı (kebap, börek, pide)','Deniz ürünleri'],
  Hotel:['Izgara / Ocakbaşı','Pizza / Fırın ürünleri','Kızartma','Türk mutfağı (kebap, börek, pide)','Soğuk mutfak (salata, meze)','Kahvaltı / Brunch','İçecek ağırlıklı','Pasta / Tatlı','Dünya mutfağı'],
  'Pastane & Patisserie':['Pasta / Tatlı','Kahvaltı / Brunch','Kızartma','Soğuk mutfak (salata, meze)','İçecek ağırlıklı','Pizza / Fırın ürünleri'],
  Bar:['İçecek ağırlıklı','Soğuk mutfak (salata, meze)','Kızartma'],
  Catering:['Türk mutfağı (kebap, börek, pide)','Izgara / Ocakbaşı','Soğuk mutfak (salata, meze)','Kahvaltı / Brunch'],
  Kasap:[],
};"""

new_pisir = """const PISIR_OPTS = {
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
};"""

if old_pisir in t:
    t = t.replace(old_pisir, new_pisir, 1)

t = t.replace(
    "  'Kafe-Kafeterya':['Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama'],",
    "  Cafe:['Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama'],\n  'Kafe-Kafeterya':['Hazırlık Mutfağı','Bar','Soğuk Depolama','Depolama'],",
)
if "'Gurme Şarküteri':['Teşhir Alanı'" not in t:
    t = t.replace(
        "  Şarküteri:['Teşhir Alanı','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],",
        "  'Gurme Şarküteri':['Teşhir Alanı','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],\n  Şarküteri:['Teşhir Alanı','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],",
    )
t = t.replace(
    "  Kasap:['Teşhir Alanı','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],",
    "  Fastfood:['Ana Mutfak','Hazırlık Mutfağı','Soğuk Depolama','Depolama'],",
)
if "'Gurme Şarküteri':['Soğutmalı" not in t:
    t = t.replace(
        "  Şarküteri:['Soğutmalı teşhir vitrin','Dilimleme makinası','Vakum makinası','Tartı seti','Benmari (sos)','Et kıyma (ilave)'],",
        "  'Gurme Şarküteri':['Soğutmalı teşhir vitrin','Dilimleme makinası','Vakum makinası','Tartı seti','Benmari (sos)','Et kıyma (ilave)'],\n  Şarküteri:['Soğutmalı teşhir vitrin','Dilimleme makinası','Vakum makinası','Tartı seti','Benmari (sos)','Et kıyma (ilave)'],",
    )
if "  Cafe:['Kahve değirmeni" not in t:
    t = t.replace(
        "  'Kafe-Kafeterya':['Kahve değirmeni (reserve)','Su filtresi','Bardak yıkayıcı','Blender seti','Termos seti'],",
        "  Cafe:['Kahve değirmeni (reserve)','Su filtresi','Bardak yıkayıcı','Blender seti','Termos seti','Buz makinası'],\n  'Kafe-Kafeterya':['Kahve değirmeni (reserve)','Su filtresi','Bardak yıkayıcı','Blender seti','Termos seti'],",
    )
t = t.replace(
    "  Kasap:['Kemik testeresi','Et kıyma makinası (ilave)','Tartı (hassas)','Vakum makinası'],",
    "  Fastfood:['Vakum makinası','Fritöz (yedek)','Tartı seti','Mutfak arabası','Salamander','Buz makinası'],",
)
t = t.replace(
    "const ELKGAZ=['Doğalgaz bağlantısı mevcut','Elektrik trifaze 380V mevcut','LPG kullanılacak','Hem doğalgaz hem trifaze mevcut'];",
    "const ELKGAZ=['Doğalgaz bağlantısı mevcut','Elektrik trifaze 380V mevcut','LPG kullanılacak','Hem doğalgaz hem trifaze mevcut','Bilmiyorum'];",
)

old_kr = """const KONSEPT_ROWS=[
  {v:'Restaurant',label:'Restoran / lokanta',desc:'Fine dining, kebap, balık, pastane, fast food vb.'},
  {v:'Steakhouse',label:'Steakhouse',desc:'Et ve ızgara odaklı restoran.'},
  {v:'Şarküteri',label:'Şarküteri',desc:'Soğuk teşhir, peynir, şarküteri reyonu.'},
  {v:'Kafe-Kafeterya',label:'Kafe ve kafeterya',desc:'Kahve, içecek, hafif mutfak.'},
  {v:'Bulut Mutfak',label:'Bulut mutfak / merkez üretim',desc:'Döner, pizza, burger gibi üretim mutfağı.'},
  {v:'Hotel',label:'Otel',desc:'Şehir, resort, kayak veya tatil oteli.'},
  {v:'Bar',label:'Bar',desc:'Kokteyl, şarap, bira veya lounge bar.'},
  {v:'Catering',label:'Catering / yemek üretimi',desc:'Fabrika mutfak, yerinde üretim veya taşıma yemek.'},
  {v:'Kasap',label:'Kasap',desc:'Kasap dükkanı; isteğe bağlı şarküteri sorusu gelir.'},
];"""

new_kr = """const KONSEPT_ROWS=[
  {v:'Restaurant',label:'Restaurant',desc:'Fine dining, steakhouse, balık, kebap, fast food…'},
  {v:'Pastane & Patisserie',label:'Pastane & Patisserie',desc:'Artisan veya endüstriyel fırın, tatlı üretimi.'},
  {v:'Cafe',label:'Cafe',desc:'Kafe, coffee shop, hafif mutfak.'},
  {v:'Bulut Mutfak',label:'Bulut mutfak',desc:'Merkez üretim — döner, pizza, burger…'},
  {v:'Hotel',label:'Hotel',desc:'Şehir, resort, kayak veya tatil oteli.'},
  {v:'Bar',label:'Bar',desc:'Kokteyl, şarap, bira, mixology, lounge.'},
  {v:'Catering',label:'Catering',desc:'Fabrika mutfak, yerinde üretim, taşıma yemek.'},
];"""

if old_kr in t:
    t = t.replace(old_kr, new_kr, 1)

t = re.sub(
    r"  if\(val==='Steakhouse'\|\|val==='Şarküteri'\)\{[\s\S]*?return;\n  \}\n  renderS4\(\)",
    "  renderS4()",
    t,
    count=1,
)

t = re.sub(
    r"  if\(k==='Kasap'\)\{[\s\S]*?return;\n  \}\n  ti\.textContent='İşletme alt türü'",
    "  ti.textContent='Dükkan türü'",
    t,
    count=1,
)

t = re.sub(
    r"function afterDukkan\(\)\{\n  const k=D\.konsept;\n  if\(k==='Hotel'\)",
    "function afterDukkan(){\n  const k=D.konsept;\n  if(D.dukkan==='Gurme Şarküteri'){ reveal('s4e'); done('s4e'); }\n  else hideFrom('s4e');\n  if(k==='Hotel')",
    t,
    count=1,
)

t = t.replace(
    "  const opts=(PISIR_OPTS[D.dukkan]&&PISIR_OPTS[D.dukkan].length)?PISIR_OPTS[D.dukkan]:(PISIR_OPTS[k]||[]);",
    "  const opts=(PISIR_OPTS[D.dukkan]&&PISIR_OPTS[D.dukkan].length)?PISIR_OPTS[D.dukkan]:(PISIR_OPTS[k]&&PISIR_OPTS[k].length)?PISIR_OPTS[k]:(typeof NE_PISIR_V3!=='undefined'?NE_PISIR_V3:[]);",
)

t = t.replace(
    '<button class="dc" onclick="setKarar(\'teklif\',this)"><b>Örnek listeyi göster</b><span>Ekipman tablosu ve gönderim seçenekleri</span></button>',
    '<button class="dc" onclick="setKarar(\'teklif\',this)"><b>Teklifi Oluştur</b><span>Ekipman listesi ve gönderim</span></button>',
)
t = t.replace(
    '<button class="dc" onclick="setKarar(\'detaylandir\',this)"><b>Daha ayrıntılı olsun</b><span>Yardımcı ekipman ve elektrik/gaz soruları</span></button>',
    '<button class="dc" onclick="setKarar(\'detaylandir\',this)"><b>Detaylandır</b><span>6 yardımcı ekipman + elektrik/gaz</span></button>',
)

t = t.replace(
    "  const list=YARDIMCI[key]||YARDIMCI.default;\n  D.yardimci=list.slice();",
    "  const raw=YARDIMCI[key]||YARDIMCI.default;\n  const list=raw.slice(0,6);\n  D.yardimci=list.slice();",
)

old_mul = """  const mul = {
    Restaurant: 14,
    Steakhouse: 15,
    Şarküteri: 10,
    'Kafe-Kafeterya': 7,
    'Bulut Mutfak': 9,
    Hotel: 18,
    Bar: 6,
    Catering: 11,
    Kasap: 8,
    Franchise: 13,
  };
  let m = mul[D.konsept] || 10;
  if (pastaneLike) m = Math.min(m, 11);"""

new_mul = """  const mul = {
    Restaurant: 14,
    'Pastane & Patisserie': 11,
    Cafe: 7,
    'Bulut Mutfak': 9,
    Hotel: 18,
    Bar: 6,
    Catering: 11,
    Franchise: 13,
  };
  let m = mul[D.konsept] || 10;
  if (d === 'Steakhouse') m = 15;
  if (d === 'Gurme Şarküteri') m = 10;
  if (d === 'Fine Dining') m = 16;
  if (pastaneLike) m = Math.min(m, 11);"""

if old_mul in t:
    t = t.replace(old_mul, new_mul, 1)

t = t.replace('<motion class="sec-title">Mesleğiniz</div>', '<div class="sec-title">Mesleğini söylemek ister misin?</div>')
t = t.replace('<motion class="sec-title">Mesleğiniz</motion>', '<div class="sec-title">Mesleğini söylemek ister misin?</div>')
t = t.replace(
    'Mesleğinize göre teknik detayları farklı seviyede gösterebiliriz. Size en yakın rolü seçmeniz yeterli.',
    'İsterseniz rolünüzü seçin; seçmezseniz de devam edebilirsiniz.',
)
t = t.replace(
    'Ne pişireceksin 2 <span style="font-weight:400;color:var(--muted);font-size:13px">(isteğe bağlı)</span>',
    'Ne pişireceksin? <span style="font-weight:400;color:var(--muted);font-size:13px">(m² ile hesaplanır)</span>',
)
t = t.replace(
    'Birden fazla işaretleyebilirsiniz; seçimler ekipman önerisini günceller. Atlamak için <b>Atla</b>, seçmeden devam için <b>Devam et</b>.',
    'Birden fazla seçebilirsiniz; m² ile birlikte ekipman dağılımına yansır. <b>Atla</b> veya <b>Devam et</b>.',
)
t = t.replace(
    '<b>Önemli:</b> Bu sayfadaki liste ve tutarlar bilgisayar tarafından örnek olarak üretilir; hata olabilir.',
    '<b>Equsto yapay zekadan yardım alır; hata yapabilir.</b> Liste ve tutarlar örnektir; kesin teklif için lütfen iletişime geçin.',
)
t = t.replace("const fastFood = d === 'Fast Food';", "const fastFood = d === 'Fastfood' || d === 'Fast Food';")

t = t.replace("<motion", "<div").replace("</motion>", "</div>")

p.write_text(t, encoding="utf-8")
print("ok", "NE_PISIR_V3" in t, "Söylemek" in t)
