from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

ins = """
<div class="pf-m-locbar" id="pf-m-locbar">
  <button type="button" class="pf-m-locbar__btn" id="pf-m-locbar-btn" aria-label="Teslimat adresini düzenle">
    <span class="pf-m-locbar__pin" aria-hidden="true"></span>
    <span class="pf-m-locbar__main" id="pf-m-locbar-txt">Teslimat adresi seçin</span>
    <span class="pf-m-locbar__chev" aria-hidden="true">›</span>
  </button>
</div>

<nav class="pf-m-tabbar" id="pf-m-tabbar" aria-label="Mobil menü">
  <button type="button" class="pf-m-tabbar__item" data-pf-goto="home" aria-label="Ana sayfa">
    <span class="pf-m-tabbar__ico" aria-hidden="true">⌂</span>
    <span>Ana sayfa</span>
  </button>
  <button type="button" class="pf-m-tabbar__item" data-pf-goto="wizard" aria-label="Adımlar">
    <span class="pf-m-tabbar__ico" aria-hidden="true">☰</span>
    <span>Adımlar</span>
  </button>
  <button type="button" class="pf-m-tabbar__item pf-m-tabbar__item--cta" id="pf-m-cta">Devam</button>
  <button type="button" class="pf-m-tabbar__item" data-pf-goto="ref" aria-label="Referanslar">
    <span class="pf-m-tabbar__ico" aria-hidden="true">◫</span>
    <span>Referans</span>
  </button>
</nav>

"""

marker = '</nav>\n\n<div class="pg">'
if 'id="pf-m-locbar"' not in t and marker in t:
    t = t.replace(marker, "</nav>\n" + ins + '<div class="pg">', 1)
    p.write_text(t, encoding="utf-8")
    print("html ok")
else:
    print("skip html", 'id="pf-m-locbar"' in t)
