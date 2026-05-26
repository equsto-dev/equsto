from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

old_s5 = """      <motion/div class="sec-bd">
        <div class="pfos-zone-step" id="pfos-zone-step">
          <h3 class="pfos-zone-step__title">Alan ve kategoriler</h3>
          <p class="pfos-zone-step__sub">Toplam mutfak alanını belirleyin; ekipman listesinde yer alacak bölümleri seçin.</p>
          <div class="fl" style="margin-bottom:8px">Kategoriler</div>
          <motion/div class="pfos-zone-grid" id="pfos-zone-grid" role="group" aria-label="Mutfak kategorileri"></div>
        </div>
        <div class="field" style="margin-top:14px">"""

old_s5 = old_s5.replace("<motion/div", "<motion/div").replace("</motion/div>", "</motion/div>")
old_s5 = """      <div class="sec-bd">
        <motion/div class="pfos-zone-step" id="pfos-zone-step">
          <h3 class="pfos-zone-step__title">Alan ve kategoriler</h3>
          <p class="pfos-zone-step__sub">Toplam mutfak alanını belirleyin; ekipman listesinde yer alacak bölümleri seçin.</p>
          <div class="fl" style="margin-bottom:8px">Kategoriler</div>
          <div class="pfos-zone-grid" id="pfos-zone-grid" role="group" aria-label="Mutfak kategorileri"></div>
        </div>
        <div class="field" style="margin-top:14px">"""

# fix script - use correct div tags only
old_s5 = """      <div class="sec-bd">
        <div class="pfos-zone-step" id="pfos-zone-step">
          <h3 class="pfos-zone-step__title">Alan ve kategoriler</h3>
          <p class="pfos-zone-step__sub">Toplam mutfak alanını belirleyin; ekipman listesinde yer alacak bölümleri seçin.</p>
          <div class="fl" style="margin-bottom:8px">Kategoriler</div>
          <div class="pfos-zone-grid" id="pfos-zone-grid" role="group" aria-label="Mutfak kategorileri"></div>
        </div>
        <div class="field" style="margin-top:14px">"""

new_s5 = """      <div class="sec-bd">
        <div class="field">"""

insert_after_s5 = """    </div>

    <!-- 04 Kategoriler -->
    <div class="sec" id="s5c">
      <div class="sec-hd">
        <div class="sec-num">04</div>
        <div class="sec-info">
          <motion/div class="sec-title">Mutfak kategorileri</div>
          <div class="sec-sub">Ekipman listesinde yer alacak bölümleri seçin (en az bir kategori).</div>
          <div class="sec-ans" id="a5c"></div>
        </div>
      </div>
      <div class="sec-bd">
        <motion/div class="pfos-zone-grid" id="pfos-zone-grid" role="group" aria-label="Mutfak kategorileri"></div>
        <div class="ar" style="margin-top:16px"><button type="button" class="btn gold" onclick="kategoriIleri()">Devam</button></div>
      </div>
    </div>

"""

insert_after_s5 = insert_after_s5.replace("<motion/div", "<div").replace("</motion/div>", "</div>")

if old_s5 not in t:
    raise SystemExit("s5 block not found")

t = t.replace(old_s5, new_s5, 1)

anchor = """        <div class="ar" style="margin-top:16px"><button type="button" class="btn gold" onclick="alanIleri()">Devam</button></div>
      </div>
    </div>

    <!-- 04 Konsept -->"""

new_anchor = """        <div class="ar" style="margin-top:16px"><button type="button" class="btn gold" onclick="alanIleri()">Devam</button></div>
      </div>
    </div>
""" + insert_after_s5 + """
    <!-- 05 Konsept -->"""

if anchor not in t:
    raise SystemExit("anchor not found")

t = t.replace(anchor, new_anchor, 1)

t = t.replace(
    """    <!-- 05 Konsept -->
    <div class="sec" id="s3">
      <div class="sec-hd">
        <div class="sec-num">04</div>""",
    """    <!-- 05 Konsept -->
    <div class="sec" id="s3">
      <div class="sec-hd">
        <div class="sec-num">05</div>""",
    1,
)

t = t.replace("    <!-- 05 Dükkan Türü -->", "    <!-- 06 Dükkan Türü -->", 1)
t = t.replace(
    """    <motion/div class="sec" id="s4">
      <div class="sec-hd">
        <div class="sec-num">05</div>""",
    """    <div class="sec" id="s4">
      <div class="sec-hd">
        <div class="sec-num">06</div>""",
    1,
)
t = t.replace("<motion/div", "<div").replace("</motion/div>", "</div>")

# fix accidental double replace on s4 opening
t = t.replace(
    """    <motion/div class="sec" id="s4">""",
    """    <div class="sec" id="s4">""",
)

t = t.replace(
    """    <!-- 06 Teklif Özeti -->
    <div class="sec" id="s6">
      <div class="sec-hd">
        <div class="sec-num">06</div>""",
    """    <!-- 07 Teklif Özeti -->
    <div class="sec" id="s6">
      <div class="sec-hd">
        <div class="sec-num">07</div>""",
    1,
)

# JS
old_go = """function goAlan(){
  hideFrom('s5'); reveal('s5'); activate('s5');
  if (!D.pfosZones || !D.pfosZones.length) D.pfosZones = pfosSuggestZones();
  syncAlanUi(D.alan || 120);
  renderPfosZonePills();
  renderStations(D.alan || syncAlanUi(120));
  setTimeout(() => document.getElementById('alan-inp').focus(), 200);
  refreshWizardHint();
  schedulePfosLiveRecalc();
}

function goKonsept()"""

new_go = """function goAlan(){
  hideFrom('s5'); reveal('s5'); activate('s5');
  syncAlanUi(D.alan || 120);
  renderStations(D.alan || syncAlanUi(120));
  setTimeout(() => document.getElementById('alan-inp').focus(), 200);
  refreshWizardHint();
  schedulePfosLiveRecalc();
}

function goKategoriler(){
  hideFrom('s5c'); reveal('s5c'); activate('s5c');
  if (!D.pfosZones || !D.pfosZones.length) D.pfosZones = pfosSuggestZones();
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
  goKonsept();
}

function goKonsept()"""

if old_go not in t:
    raise SystemExit("goAlan block not found")
t = t.replace(old_go, new_go, 1)

old_alan = """  document.getElementById('stations-wrap').style.display='block';
  done('s5');
  goKonsept();
}"""

new_alan = """  document.getElementById('stations-wrap').style.display='block';
  done('s5');
  goKategoriler();
}"""

if old_alan not in t:
    raise SystemExit("alanIleri tail not found")
t = t.replace(old_alan, new_alan, 1)

# togglePfosZone - update label when on s5c
old_toggle = """  } else renderPfosZonePills();
  schedulePfosLiveRecalc();
}"""

new_toggle = """  } else renderPfosZonePills();
  pfosUpdateA5cLabel();
  schedulePfosLiveRecalc();
}"""

if old_toggle in t:
    t = t.replace(old_toggle, new_toggle, 1)

# pfosCanLivePreview
t = t.replace(
    """  const s5 = document.getElementById('s5');
  const s6 = document.getElementById('s6');
  if (tp && tp.classList.contains('vis')) return true;
  if (s5 && (s5.classList.contains('vis') || s5.classList.contains('done'))) return true;""",
    """  const s5 = document.getElementById('s5');
  const s5c = document.getElementById('s5c');
  const s6 = document.getElementById('s6');
  if (tp && tp.classList.contains('vis')) return true;
  if (s5 && (s5.classList.contains('vis') || s5.classList.contains('done'))) return true;
  if (s5c && (s5c.classList.contains('vis') || s5c.classList.contains('done'))) return true;""",
    1,
)

# refreshWizardHint - replace the s5/s3 block
old_hint = """  }else if(g('s5')&&g('s5').classList.contains('vis')&&!g('s5').classList.contains('done')){
    pct=34;
    title='<b>Toplam alan</b>';
    sub='Metrekare yazın; <b>Devam</b> veya Enter ile işletme türü sorularına geçilir. İsterseniz bölüm m² paylarını da dağıtabilirsiniz.';
  }else if(g('s5')&&g('s5').classList.contains('done')&&g('s3')&&!g('s3').classList.contains('done')){
    pct=48;
    title='<b>İşletme türü</b>';
    sub='Ne açacağınızı seçin; birkaç ek soru çıkabilir — hepsi listeden. Emin olmadığınız yerde en yakın seçenek yeterli.';
  }else if(g('s3')&&g('s3').classList.contains('done')){"""

new_hint = """  }else if(g('s5c')&&g('s5c').classList.contains('vis')&&!g('s5c').classList.contains('done')){
    pct=42;
    title='<b>Mutfak kategorileri</b>';
    sub='Listede yer alacak bölümleri işaretleyin; <b>Devam</b> ile işletme türüne geçilir.';
  }else if(g('s5')&&g('s5').classList.contains('vis')&&!g('s5').classList.contains('done')){
    pct=34;
    title='<b>Toplam alan</b>';
    sub='Metrekare yazın; <b>Devam</b> veya Enter ile kategori seçimine geçilir. İsterseniz bölüm m² paylarını da dağıtabilirsiniz.';
  }else if(g('s5c')&&g('s5c').classList.contains('done')&&g('s3')&&!g('s3').classList.contains('done')){
    pct=50;
    title='<b>İşletme türü</b>';
    sub='Ne açacağınızı seçin; birkaç ek soru çıkabilir — hepsi listeden. Emin olmadığınız yerde en yakın seçenek yeterli.';
  }else if(g('s3')&&g('s3').classList.contains('done')){"""

if old_hint not in t:
    raise SystemExit("hint block not found")
t = t.replace(old_hint, new_hint, 1)

# alanIleri - remove early pfosZones assign
t = t.replace(
    "  D.stationsM2 = pfosReadStationsM2();\n  D.pfosZones = pfosGetZones();\n  document.getElementById('a5').textContent",
    "  D.stationsM2 = pfosReadStationsM2();\n  document.getElementById('a5').textContent",
    1,
)

p.write_text(t, encoding="utf-8")
print("done")
