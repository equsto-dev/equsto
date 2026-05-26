# -*- coding: utf-8 -*-
import re
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

old_spisir = """    <!-- 06 Ne pişireceksin (m² ile hesaplanır — alan sonrası, özet öncesi) -->
    <motion class="sec" id="spisir">"""

# use exact div from file
old_spisir = """    <!-- 06 Ne pişireceksin (m² ile hesaplanır — alan sonrası, özet öncesi) -->
    <div class="sec" id="spisir">
      <div class="sec-hd">
        <motion class="sec-num">06</div>
        <div class="sec-info">
          <div class="sec-title">Ne pişireceksin? <span style="font-weight:400;color:var(--muted);font-size:13px">(m² ile hesaplanır)</span></div>
          <div class="sec-sub">Birden fazla seçebilirsiniz; m² ile birlikte ekipman dağılımına yansır. <b>Atla</b> veya <b>Devam et</b>.</div>
          <div class="sec-ans" id="apisir"></div>
        </motion>
      </div>
      <div class="sec-bd" id="spisir-bd"></div>
    </div>

    <!-- 07 Teklif Özeti -->"""

# FIX - I keep making errors. Let me read file directly in python
lines = t.splitlines(True)
out = []
skip = False
for i, line in enumerate(lines):
    if '<!-- 06 Ne pişireceksin' in line:
        skip = True
        out.append('    <!-- 06 Teklif Özeti -->\n')
        continue
    if skip:
        if '<!-- 07 Teklif Özeti -->' in line:
            skip = False
            continue
        continue
    if '<motion class="sec-num">07</div>' in line or '<div class="sec-num">07</div>' in line and i > 800 and i < 900:
        out.append(line.replace('>07<', '>06<'))
        continue
    out.append(line)

t = ''.join(out)

t = t.replace(
    "const SEC_ORDER=['s1','s2','s3','sfr','s4','s4b','s4c','s4d','s4e','s5','spisir','s6','s6a','s6b','s6c','s6d'];",
    "const SEC_ORDER=['s1','s2','s3','sfr','s4','s4b','s4c','s4d','s4e','s5','s6','s6a','s6b','s6c','s6d'];",
)

t = t.replace(
    "    sub='Metrekare yazın; geçerli değer için alttaki <b>Devam</b> düğmesine basın, Enter kullanın, kutudan çıkın veya kısa süre bekleyin. İsterseniz mutfak bölümlerini m² olarak dağıtabilirsiniz.';",
    "    sub='Metrekare yazın; sonraki adıma geçmek için alttaki <b>Devam</b> düğmesine basın veya Enter kullanın. İsterseniz mutfak bölümlerini m² olarak dağıtabilirsiniz.';",
)

old_hint = """  }else if(g('s5')&&g('s5').classList.contains('done')&&!g('s6').classList.contains('done')){
    if(g('spisir')&&g('spisir').classList.contains('done')){
      pct=72;
      title='<b>Tahmini tutar</b>';
      sub='Bu rakam <b>örnektir</b>. <b>Teklifi Oluştur</b> veya <b>Detaylandır</b> seçeneklerinden birine dokunun.';
    }else{
      pct=66;
      title='<b>Ne pişireceksin?</b> <span style="font-weight:400">(m² ile hesaplanır)</span>';
      sub='Birden fazla seçebilirsiniz; m² ile ekipman dağılımına yansır. <b>Atla</b> veya <b>Devam et</b>.';
    }"""

new_hint = """  }else if(g('s5')&&g('s5').classList.contains('done')&&!g('s6').classList.contains('done')){
    pct=72;
    title='<b>Tahmini tutar</b>';
    sub='Bu rakam <b>örnektir</b>. <b>Teklifi Oluştur</b> veya <b>Detaylandır</b> seçeneklerinden birine dokunun.';"""

if old_hint in t:
    t = t.replace(old_hint, new_hint, 1)

t = re.sub(
    r"let alanT=null;\nfunction onAlan\(\)\{\n  clearTimeout\(alanT\);\n  document\.getElementById\('alan-warn'\)\.style\.display='none';\n  alanT=setTimeout\(alanIleri,1500\);\n\}",
    """function onAlan(){
  document.getElementById('alan-warn').style.display='none';
  const v=parseInt(document.getElementById('alan-inp').value,10);
  if(v>=20){
    const grid=document.getElementById('stations-grid');
    if(!grid||!grid.querySelector('.station-inp')) renderStations(v);
    else stationsUpdateTotal(v);
    document.getElementById('stations-wrap').style.display='block';
  }
}""",
    t,
    count=1,
)

t = t.replace(
    """  done('s5'); hideFrom('s6');
  if(D.konsept) renderPfPdfs();
  renderPisir();
  const sp=document.getElementById('spisir');
  if(sp&&!sp.classList.contains('done')){ reveal('spisir'); activate('spisir'); }
}""",
    """  done('s5'); hideFrom('s6');
  if(D.konsept) renderPfPdfs();
  renderOzet(); reveal('s6'); activate('s6');
  refreshWizardHint();
}""",
    1,
)

t = re.sub(
    r"// ── Ne pişireceksin \(alan sonrası\).*?function pisirAtla\(\)\{[\s\S]*?pisirSpisirTamamVeOzet\(\);\n\}\n\n",
    "\n",
    t,
    count=1,
)

# onblur should already be removed; ensure
t = t.replace(' onblur="alanIleri()"', '')

p.write_text(t, encoding="utf-8")
print("ok", "id=\"spisir\"" not in t, "renderPisir" not in t, "'spisir'" not in t.split("SEC_ORDER")[1].split(";")[0])
