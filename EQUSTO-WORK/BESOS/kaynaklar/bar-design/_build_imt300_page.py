# -*- coding: utf-8 -*-
from pathlib import Path

D = "motion"  # will replace
D = "div"

head = Path(r"c:\D Disk\EQUSTO-CURSOR\public\imt300.html").read_text(encoding="utf-8").split("</head>")[0] + "</head>\n"

body = f"""<body class="eq-shop">
<span style="display:none">EQ-SK-IMT300-2026-001</span>

<header class="hdr">
  <a class="logo" href="index.html" aria-label="Equsto"></a>
  <{D} class="pg-inner hdr-pg-inner" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:10px 20px 10px 0;">
    <{D} class="hdr-alici">
      <{D} style="font-size:9px;color:var(--eq-text-subtle);">Teslimat Adresi</{D}>
      <{D} style="font-size:11px;font-weight:600;">İstanbul, Türkiye</{D}>
    </{D}>
    <{D} class="srch">
      <{D} class="srch-cat" onclick="toggleDrawer()">☰ Tüm Kategoriler</{D}>
      <input class="srch-input" type="text" placeholder="Ürün, marka veya kategori ara...">
      <button type="button" class="srch-btn" aria-label="Ara">Ara</button>
    </{D}>
    <{D} class="hdr-right">
      <button type="button" class="theme-toggle" id="theme-toggle" onclick="equstoCycleTheme()" title="Tema">◐</button>
      <a href="login.html" class="eq-hdr-account"><span style="font-size:10px;color:var(--eq-text-muted);">Hesabım</span><span style="font-size:12px;font-weight:600;">Projeler ▾</span></a>
    </{D}>
  </{D}>
</header>

<nav class="topnav" aria-label="Departmanlar">
  <{D} class="pg-inner topnav-inner">
    <{D} class="topnav-item" onclick="toggleDrawer()">☰ Tüm kategoriler</{D}>
    <span class="topnav-sep">|</span>
    <{D} class="topnav-item" onclick="eqGo('pfos')">Proje Fabrikası</{D}>
    <{D} class="topnav-item" onclick="eqGo('pisirme')">Pişirme Ekipmanları</{D}>
    <{D} class="topnav-item" onclick="eqGo('sogutma')">Soğutma Ekipmanları</{D}>
    <{D} class="topnav-item" onclick="eqGo('kahve')">Kahve Ekipmanları</{D}>
    <{D} class="topnav-item" onclick="eqGo('yikama')">Yıkama Ekipmanları</{D}>
    <{D} class="topnav-item" onclick="eqGo('hazirlik')">Hazırlık Ekipmanları</{D}>
    <{D} class="topnav-item" onclick="eqGo('icecek')">İçecek Ekipmanları</{D}>
    <{D} class="topnav-item topnav-besos" onclick="eqGo('besos')">Bar Design</{D}>
  </{D}>
</nav>

<nav class="breadcrumb" aria-label="Konum">
  <a href="index.html">Anasayfa</a> › <a href="icecek.html">İçecek Ekipmanları</a> › <span>IMT300 Berrak Buz Makinesi</span>
</nav>

<main>
<section class="imt-hero" aria-label="IMT300 tanıtım">
  <{D} class="imt-hero-grid">
    <{D}>
      <{D} class="imt-kicker">Equsto · İçecek &amp; Bar · Skyra serisi</{D}>
      <h1>IMT300 <em>Berrak Buz Makinesi</em></h1>
      <p class="imt-lead">Kesim gerektirmeden, standart formlarda <strong>parti halinde berrak buz</strong> üreten ticari ünite. Bar, otel ve restoranlar için yerinde üretim.</p>
      <{D} class="imt-badges">
        <span class="imt-badge">2 tepsi</span><span class="imt-badge">5 buz formu</span><span class="imt-badge">Tek dokunuş</span><span class="imt-badge">Paslanmaz çelik</span>
      </{D}>
      <{D} class="imt-ctas">
        <a class="imt-cta-p" href="contact.html?konu=IMT300%20berrak%20buz%20teklif">Teklif iste →</a>
        <a class="imt-cta-s" href="pfos.html?konsept=Bar">Proje Fabrikası</a>
        <a class="imt-cta-s" href="besos">Bar Design Studio</a>
      </{D}>
    </{D}>
    <{D} class="imt-hero-visual">
      <img id="imt-hero-img" src="/images/imt300/imt300-1.jpg" alt="IMT300 berrak buz makinesi" width="800" height="600">
      <{D} class="imt-hero-thumbs" role="tablist" aria-label="Görseller">
        <button type="button" class="on" data-src="/images/imt300/imt300-1.jpg"><img src="/images/imt300/imt300-1.jpg" alt=""></button>
        <button type="button" data-src="/images/imt300/imt300-2.png"><img src="/images/imt300/imt300-2.png" alt=""></button>
        <button type="button" data-src="/images/imt300/imt300-3.jpg"><img src="/images/imt300/imt300-3.jpg" alt=""></button>
        <button type="button" data-src="/images/imt300/imt300-5.png"><img src="/images/imt300/imt300-5.png" alt=""></button>
        <button type="button" data-src="/images/imt300/imt300-8.jpg"><img src="/images/imt300/imt300-8.jpg" alt=""></button>
      </{D}>
    </{D}>
  </{D}>
</section>

<section class="imt-sec alt" id="neden"><{D} class="imt-inner">
  <{D} class="imt-sec-k">Neden berrak buz?</{D}>
  <h2>Skyra IMT300 avantajları</h2>
  <p class="imt-sec-lead">Parti üretimde form ve şeffaflık standartlaştırılır; kesim ve dış tedarik bağımlılığı azalır.</p>
  <{D} class="imt-benefits">
    <article class="imt-ben"><h3>Yavaş erime</h3><p>Yoğun berrak buz; kokteylde sulandırma yavaşlar.</p></article>
    <article class="imt-ben"><h3>Kesim yok</h3><p>Küp, küre, çubuk, elmas doğrudan kalıpta.</p></article>
    <article class="imt-ben"><h3>Otomasyon</h3><p>Dolum, dondurma, ayırma, depolama tek panelden.</p></article>
    <article class="imt-ben"><h3>Maliyet</h3><p>Yüksek hacimli barlarda lojistik maliyeti düşer.</p></article>
  </{D}>
</{D}></section>

<section class="imt-sec" id="formlar"><{D} class="imt-inner">
  <{D} class="imt-sec-k">Buz formları</{D}>
  <h2>Parti kapasitesi (kalıba göre)</h2>
  <{D} class="imt-formats">
    <{D} class="imt-fmt"><{D} class="imt-fmt-ico">◻</{D}><h3>Küp</h3><{D} class="imt-fmt-cap">60 <span>adet</span></{D}><p class="imt-fmt-size">55 mm</p></{D}>
    <{D} class="imt-fmt"><{D} class="imt-fmt-ico">●</{D}><h3>Büyük küre</h3><{D} class="imt-fmt-cap">32 <span>adet</span></{D}><p class="imt-fmt-size">Ø75 mm</p></{D}>
    <{D} class="imt-fmt"><{D} class="imt-fmt-ico">○</{D}><h3>Küçük küre</h3><{D} class="imt-fmt-cap">50 <span>adet</span></{D}><p class="imt-fmt-size">Ø60 mm</p></{D}>
    <{D} class="imt-fmt"><{D} class="imt-fmt-ico">▬</{D}><h3>Çubuk</h3><{D} class="imt-fmt-cap">48 <span>adet</span></{D}><p class="imt-fmt-size">38×38×102 mm</p></{D}>
    <{D} class="imt-fmt"><{D} class="imt-fmt-ico">◇</{D}><h3>Elmas</h3><{D} class="imt-fmt-cap">60 <span>adet</span></{D}><p class="imt-fmt-size">Ø60×55 mm</p></{D}>
  </{D}>
</{D}></section>

<section class="imt-sec alt" id="teknik"><{D} class="imt-inner">
  <{D} class="imt-sec-k">Teknik</{D}><h2>Özellik tablosu</h2>
  <{D} class="imt-spec-wrap"><table class="imt-spec"><tbody>
    <tr><th>Model</th><td>Skyra IMT300 (çift tepsi)</td></tr>
    <tr><th>Elektrik</th><td>220–240 V 50 Hz · 650 W üretim / 1400 W ayırma</td></tr>
    <tr><th>Ölçü</th><td>870×755×856 mm</td></tr>
    <tr><th>Gövde</th><td>SUS201 dış · SUS304 iç · silikon kalıp</td></tr>
    <tr><th>Ağırlık</th><td>110–117 kg</td></tr>
    <tr><th>Su</th><td>0,2–8 bar · BSP 1/2″ · ~30 L/döngü</td></tr>
    <tr><th>Ortam</th><td>5–32 °C · nem ≤85%</td></tr>
  </tbody></table></{D}>
</{D}></section>

<section class="imt-sec" id="kurulum"><{D} class="imt-inner imt-cols">
  <{D}><{D} class="imt-sec-k">Kurulum</{D}><h2>Su ve yerleşim</h2>
    <{D} class="imt-step"><h3>Havalandırma</h3><p>Çevrede ≥100 mm boşluk; üstten kapak — üstü boş.</p></{D}>
    <{D} class="imt-step"><h3>Bağlantılar</h3><p>Giriş 1/2″ hortum; atık hortumu çıkışın altında.</p></{D}>
  </{D}>
  <{D}><{D} class="imt-sec-k">Panel</{D}><h2>İşletim</h2>
    <p class="imt-sec-lead">Buz · Ayır · Dondur · Durdur/Boşalt · Kilit</p>
  </{D}>
</{D}></section>

<section class="imt-sec alt" id="galeri"><{D} class="imt-inner">
  <h2>Galeri</h2>
  <{D} class="imt-gallery">
    <figure><img src="/images/imt300/imt300-1.jpg" alt="" loading="lazy"></figure>
    <figure><img src="/images/imt300/imt300-3.jpg" alt="" loading="lazy"></figure>
    <figure><img src="/images/imt300/imt300-6.png" alt="" loading="lazy"></figure>
    <figure><img src="/images/imt300/imt300-8.jpg" alt="" loading="lazy"></figure>
  </{D}>
</{D}></section>

<section class="imt-sec alt" id="sss"><{D} class="imt-inner">
  <h2>Sık sorulan sorular</h2>
  <{D} class="imt-faq">
    <details><summary>Hangi formlar?</summary><p>60 küp, 32/50 küre, 48 çubuk, 60 elmas — kalıp setine göre.</p></details>
    <details><summary>Su basıncı?</summary><p>0,2–8 bar; mineral veya filtreli su önerilir.</p></details>
    <details><summary>Teklif?</summary><p>contact.html veya Proje Fabrikası üzerinden Equsto Satış Mühendisliği.</p></details>
  </{D}>
</{D}></section>

<section class="imt-final">
  <h2>IMT300 teklif iste</h2>
  <p>Ölçü ve tesisat planınızı paylaşın.</p>
  <{D} class="imt-ctas" style="justify-content:center">
    <a class="imt-cta-p" href="contact.html?konu=IMT300%20berrak%20buz%20teklif">Teklif iste →</a>
  </{D}>
</section>
</main>

<p class="imt-foot-pad">IMT300 · Equsto · <a href="icecek.html">İçecek</a></p>
<script>
(function(){{
  var m=document.getElementById('imt-hero-img');
  document.querySelectorAll('.imt-hero-thumbs button').forEach(function(b){{
    b.addEventListener('click',function(){{
      var s=b.getAttribute('data-src'); if(!s) return;
      m.src=s;
      document.querySelectorAll('.imt-hero-thumbs button').forEach(function(x){{x.classList.toggle('on',x===b);}});
    }});
  }});
}})();
</script>
</body>
</html>
"""

body = body.replace("motion", "div")
Path(r"c:\D Disk\EQUSTO-CURSOR\public\imt300.html").write_text(head + "\n" + body, encoding="utf-8")
print("written", "motion" in body)
