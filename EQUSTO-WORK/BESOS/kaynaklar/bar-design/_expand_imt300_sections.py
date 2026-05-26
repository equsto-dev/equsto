# -*- coding: utf-8 -*-
"""Expand IMT300 body sections (kurulum, kimler, galeri, FAQ, final)."""
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\imt300.html")
html = p.read_text(encoding="utf-8")

KIMLER = """
<section class="imt-sec" id="kimler"><motion class="imt-inner">
  <motion class="imt-sec-k">Kimler için?</motion>
  <h2>Bar, otel ve premium içecek hatları</h2>
  <p class="imt-sec-lead">IMT300; yüksek hacimli kokteyl barı, otel lounge, fine dining, steakhouse içecek köşesi ve etkinlik catering operasyonlarında yerinde berrak buz üretimi için tasarlanmıştır. Equsto Satış Mühendisliği tesisat, nakliye ve bar hattı yerleşimini proje bazında planlar.</p>
  <motion class="imt-audience">
    <span>Kokteyl barı</span><span>Otel &amp; resort</span><span>Fine dining</span><span>Steakhouse</span><span>Gece kulübü</span><span>Etkinlik catering</span><span>Premium kahve &amp; soğuk içecek</span>
  </motion>
</motion></section>
""".replace("motion", "div")

KURULUM_GALERI_FAQ = """
<section class="imt-sec" id="kurulum"><motion class="imt-inner imt-cols">
  <motion>
    <motion class="imt-sec-k">Kurulum</motion>
    <h2>Su, yerleşim ve havalandırma</h2>
    <p class="imt-sec-lead">Dış ölçü yaklaşık 870×755×856 mm. Duvar ve cisimlere en az 100 mm boşluk; üstten açılan kapak nedeniyle üst yüzey boş bırakılmalıdır.</p>
    <motion class="imt-steps">
      <motion class="imt-step"><h3>Yer seçimi</h3><p>Düz, sağlam zemin; makine dengeli durmalı. Çalışma ortamı 5–32 °C, nem %85 altında.</p></motion>
      <motion class="imt-step"><h3>Su girişi</h3><p>BSP 1/2″ bağlantı; basınç 0,2–8 bar (0,02–0,8 MPa). Giriş suyu sıcaklığı 35 °C altında. Döngü başına yaklaşık 30 L. Mineral veya filtreli su berraklık için önerilir.</p></motion>
      <motion class="imt-step"><h3>Atık su</h3><p>Çıkış borusu makinenin altında; hortum eğimi atık akışını engellemeyecek şekilde olmalıdır.</p></motion>
      <motion class="imt-step"><h3>Elektrik</h3><p>Etiket üzerindeki gerilime uygun priz; topraklı hat ve kaçak akım koruması. Üretim 650 W, ayırma 1400 W (220–240 V 50 Hz).</p></motion>
      <motion class="imt-step"><h3>Taşıma</h3><p>Ağırlık 110–117 kg (kalıba göre). Palet veya forklift ile taşınmalı; iki ünite üst üste istiflenmemelidir.</p></motion>
    </motion>
  </motion>
  <motion>
    <motion class="imt-sec-k">İşletim</motion>
    <h2>Panel ve üretim döngüsü</h2>
    <p class="imt-sec-lead">Tek dokunuşla dolum, dondurma, ayırma ve depolama. Program 1 yaklaşık 23 saat; sıcak iklimde Program 2 yaklaşık 28,5 saat.</p>
    <motion class="imt-step"><h3>Buz</h3><p>Seçilen kalıp setine göre parti üretimi başlatır.</p></motion>
    <motion class="imt-step"><h3>Ayır</h3><p>Buz tepsiden ayrılır; yüzeyde hafif çatlak görülürse sıvıya batırarak giderilebilir.</p></motion>
    <motion class="imt-step"><h3>Dondur / saklama</h3><p>−1 °C buz saklama modu; −15 °C dondurma modu uzun süreli stok için.</p></motion>
    <motion class="imt-step"><h3>Durdur / boşalt · kilit</h3><p>Acil durdurma ve boşaltma; çocuk kilidi operasyon güvenliği için.</p></motion>
    <p class="imt-sec-lead" style="margin-top:20px;font-size:13px;">Ses basıncı &lt;70 dB(A). Bakım ve soğutma sistemine müdahale eğitimli personel tarafından yapılmalıdır.</p>
  </motion>
</motion></section>

<section class="imt-sec alt" id="galeri"><motion class="imt-inner">
  <motion class="imt-sec-k">Görseller</motion>
  <h2>IMT300 ürün galerisi</h2>
  <motion class="imt-gallery">
    <figure><img src="/images/imt300/imt300-1.jpg" alt="IMT300 ön görünüm" loading="lazy"><figcaption>Ön görünüm</figcaption></figure>
    <figure><img src="/images/imt300/imt300-2.png" alt="IMT300 kontrol paneli" loading="lazy"><figcaption>Kontrol paneli</figcaption></figure>
    <figure><img src="/images/imt300/imt300-3.jpg" alt="IMT300 buz kalıbı" loading="lazy"><figcaption>Buz kalıbı</figcaption></figure>
    <figure><img src="/images/imt300/imt300-4.jpg" alt="IMT300 küp buz" loading="lazy"><figcaption>Küp buz</figcaption></figure>
    <figure><img src="/images/imt300/imt300-5.png" alt="IMT300 küre buz" loading="lazy"><figcaption>Küre buz</figcaption></figure>
    <figure><img src="/images/imt300/imt300-6.png" alt="IMT300 çubuk buz" loading="lazy"><figcaption>Çubuk buz</figcaption></figure>
    <figure><img src="/images/imt300/imt300-7.png" alt="IMT300 elmas buz" loading="lazy"><figcaption>Elmas buz</figcaption></figure>
    <figure><img src="/images/imt300/imt300-8.jpg" alt="IMT300 bar kurulumu" loading="lazy"><figcaption>Bar kurulumu</figcaption></figure>
  </motion>
</motion></section>

<section class="imt-sec alt" id="sss"><motion class="imt-inner">
  <h2>Sık sorulan sorular</h2>
  <motion class="imt-faq">
    <details><summary>IMT300 ile hangi buz formları üretilir?</summary><p>60 adet küp (55 mm), 32 büyük küre (75 mm), 50 küçük küre (60 mm), 48 buz çubuğu veya 60 elmas form — kalıp setine göre tek partide berrak buz. Kesim veya elle şekillendirme gerekmez.</p></details>
    <details><summary>Berrak buz ile normal buz arasındaki fark nedir?</summary><p>Berrak buz donma sırasında hava kabarcıklarının minimize edilmesiyle daha yoğun ve yavaş eriyen bir yapıya sahiptir. Kokteyl ve premium içecek sunumunda sulandırma azalır.</p></details>
    <details><summary>Su bağlantısı ve basınç gereksinimleri nelerdir?</summary><p>Giriş basıncı 0,2–8 bar; BSP 1/2″. Döngü başına yaklaşık 30 litre. Giriş suyu 35 °C altında; mineral veya filtreli su önerilir.</p></details>
    <details><summary>Kurulum için ne kadar alan gerekir?</summary><p>Dış ölçüler yaklaşık 870×755×856 mm. Çevrede en az 100 mm boşluk; üstten açılan kapak için üst yüzey boş. Ortam 5–32 °C, nem %85 altında.</p></details>
    <details><summary>Equsto üzerinden IMT300 nasıl sipariş edilir?</summary><p>Equsto Satış Mühendisliği bar ve içecek hattı projeleriniz için teklif, nakliye ve montaj planını hazırlar. İletişim formu, Proje Fabrikası veya Bar Design Studio üzerinden talep iletebilirsiniz.</p></details>
  </motion>
</motion></section>

<section class="imt-final">
  <h2>IMT300 için teklif ve proje planı</h2>
  <p>Bar ölçüsü, su basıncı ve elektrik hattınızı paylaşın; Equsto ekibi yerleşim, nakliye ve devreye alma adımlarını planlasın.</p>
  <motion class="imt-ctas" style="justify-content:center">
    <a class="imt-cta-p" href="contact.html?konu=IMT300%20berrak%20buz%20teklif">Teklif iste →</a>
    <a class="imt-cta-s" href="pfos.html?konsept=Bar" style="border-color:rgba(255,255,255,.35);color:#fff">Proje Fabrikası</a>
    <a class="imt-cta-s" href="besos" style="border-color:rgba(255,255,255,.35);color:#fff">Bar Design Studio</a>
  </motion>
</section>
"""
KURULUM_GALERI_FAQ = KURULUM_GALERI_FAQ.replace("motion", "div")

start_kur = html.find('<section class="imt-sec" id="kurulum">')
end_main = html.find("</main>")
if start_kur < 0 or end_main < 0:
    raise SystemExit("markers not found")

start_kim = html.find('<section class="imt-sec alt" id="teknik">')
if start_kim < 0:
    raise SystemExit("teknik section not found")

html = html[:start_kim] + KIMLER + "\n" + html[start_kim:start_kur] + KURULUM_GALERI_FAQ + "\n" + html[end_main:]

p.write_text(html, encoding="utf-8")
assert "<motion" not in html and "motion>" not in html
print("ok", len(html))
