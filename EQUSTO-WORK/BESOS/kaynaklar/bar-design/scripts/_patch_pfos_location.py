# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

old = (
    '      <div id="pfos-live-status" class="pfos-live-status" aria-live="polite"></motion>\n'
    '      <motion class="rs-note">Ekipman listesi seçimlerinize göre otomatik üretilir; tipik projelerde yaklaşık doğruluk hedeflenir, yine de yerinde keşif ve onay şarttır. Tutar örnektir (KDV hariç). Nakliye ve montaj ayrıca hesaplanır.</motion>'
)
old = (
    '      <div id="pfos-live-status" class="pfos-live-status" aria-live="polite"></div>\n'
    '      <div class="rs-note">Ekipman listesi seçimlerinize göre otomatik üretilir; tipik projelerde yaklaşık doğruluk hedeflenir, yine de yerinde keşif ve onay şarttır. Tutar örnektir (KDV hariç). Nakliye ve montaj ayrıca hesaplanır.</div>'
)
new = (
    '      <div id="pfos-live-status" class="pfos-live-status" aria-live="polite"></div>\n'
    '      <div id="pfos-nakliye-est" class="pfos-nakliye-est" style="display:none" aria-live="polite"></div>\n'
    '      <motion class="rs-note">Ekipman listesi seçimlerinize göre otomatik üretilir; tipik projelerde yaklaşık doğruluk hedeflenir, yine de yerinde keşif ve onay şarttır. Tutar örnektir (KDV hariç). Nakliye ve montaj adresinize göre tahmin edilir.</motion>'
)
new = (
    '      <div id="pfos-live-status" class="pfos-live-status" aria-live="polite"></div>\n'
    '      <div id="pfos-nakliye-est" class="pfos-nakliye-est" style="display:none" aria-live="polite"></div>\n'
    '      <div class="rs-note">Ekipman listesi seçimlerinize göre otomatik üretilir; tipik projelerde yaklaşık doğruluk hedeflenir, yine de yerinde keşif ve onay şarttır. Tutar örnektir (KDV hariç). Nakliye ve montaj adresinize göre tahmin edilir.</div>'
)

if old not in t:
    raise SystemExit("renderOzet block not found")
t = t.replace(old, new, 1)

needle = "  syncAlanUi(alanStart);\n}"
if needle in t and "pfosQueueInsight('proje_ozet')" not in t:
    t = t.replace(
        needle,
        "  syncAlanUi(alanStart);\n"
        "  var __nak=pfosEstimateNakliye(rows,amt);\n"
        "  D.nakliye=__nak;\n"
        "  pfosPatchNakliyeUi(__nak);\n"
        "  pfosQueueInsight('proje_ozet');\n}",
        1,
    )

if "pfosQueueInsight('liste_guncellendi')" not in t:
    t = t.replace(
        "function renderTabloSagFromRows(rows,amt){\n  const fmt=new Intl.NumberFormat('tr-TR');\n  document.getElementById('tablo-body').innerHTML=buildTabloPreviewHtml(rows,amt);",
        "function renderTabloSagFromRows(rows,amt){\n  const fmt=new Intl.NumberFormat('tr-TR');\n  document.getElementById('tablo-body').innerHTML=buildTabloPreviewHtml(rows,amt);\n  pfosPatchNakliyeUi(pfosEstimateNakliye(rows,amt));\n  pfosQueueInsight('liste_guncellendi');",
        1,
    )

old3 = """  const payload={
    musteri:{ ad:ad, telefon:tel, eposta:eposta },
    not:not,
    proje:{
      sehir:D.sehir||'', adres:D.adres||'', alan_m2:D.alan||0,
      meslek:D.meslek||'', konsept:D.konsept||'', franchise:D.franchise||'',
      dukkan:D.dukkan||'', alt:D.alt||''
    },
    mutfak_one_cikan:D.pisir||[],
    menu:D.menu||[],
    yardimci_ekipman:D.yardimci||[],
    elk_gaz:D.elkgaz||[],
    tahmini_toplam_tl:amt,
    ozet_metin:projeOzetMetni(),
    kaynak:'pfos'
  };"""

new3 = """  pfosSyncDraftFromUi();
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
  };"""

if old3 in t:
    t = t.replace(old3, new3, 1)
else:
    print("warn: teklif payload block not found")

p.write_text(t, encoding="utf-8")
print("patched pfos.html ok")
