"use client";

type Props = { lang: "tr" | "en" };

export default function HakkimizdaContent({ lang }: Props) {
  const en = lang === "en";

  if (en) {
    return (
      <main className="hk-main" id="hakkimizda">
        <h1>About Equsto</h1>
        <p className="hk-lead">
          <strong>Equsto</strong> is a <strong>Turkey-based industrial kitchen and gastronomy platform</strong> for
          restaurants, hotels, cafés, catering and cloud kitchens. We combine equipment selection, capacity planning and
          brand advice; <strong>Project Factory (PFOS)</strong> builds your equipment list and quote summary in about{" "}
          <strong>five minutes</strong>.
        </p>
        <div className="hk-box">
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>Equsto Technology Limited</strong> — Equsto Technology · Gastronomy Design · Sales Engineering.
            Catalogue: cooking, refrigeration, warewashing, prep, coffee and beverage lines with live project pricing.
          </p>
        </div>
        <h2>What we do</h2>
        <p>
          Equsto unites <strong>industrial kitchen equipment supply</strong> and{" "}
          <strong>kitchen project consultancy</strong> for Turkey and selected export markets under one workflow.
        </p>
        <ul>
          <li>
            <strong>Online catalogue</strong> — thousands of SKUs, department filters, technical dimensions
          </li>
          <li>
            <strong>Project Factory</strong> — equipment lists by concept, capacity and floor area
          </li>
          <li>
            <strong>Bar Design Studio · Besos</strong> — modular bar lines and IMT300 clear-ice solutions
          </li>
          <li>
            <strong>Sales engineering</strong> — MEP, logistics and brand alternatives in one quote file
          </li>
        </ul>
        <h2>Equipment brands</h2>
        <p>
          The catalogue includes <strong>Öztiryakiler</strong> (authorised dealer), <strong>Atalay</strong> and selected
          international brands. Cooking, refrigeration, warewashing, prep, coffee and beverage departments are listed by
          line.
        </p>
        <h2>Project process</h2>
        <ol className="hk-timeline" style={{ listStyle: "decimal" }}>
          <li>
            <strong>Discovery</strong> — concept, menu, capacity and site dimensions
          </li>
          <li>
            <strong>List</strong> — rule-based module counts in Project Factory
          </li>
          <li>
            <strong>Quote</strong> — priced summary with VAT and logistics lines
          </li>
          <li>
            <strong>Supply</strong> — order, installation and commissioning with sales engineering
          </li>
        </ol>
        <h2>Refrigeration & cold rooms</h2>
        <p>
          Modular cold rooms and refrigeration groups are sized to product profile and throughput. Counter and upright
          modules complement dedicated cold-room engineering where required.
        </p>
        <h2>Hygiene & food safety</h2>
        <p>
          Equipment selection follows HACCP-oriented workflows: separation of raw and ready-to-eat zones, wash capacity and
          accessible surfaces for daily cleaning.
        </p>
        <h2>Energy efficiency</h2>
        <p>
          Low-consumption refrigeration and cooking modules are preferred where lifecycle cost matters; final selection is
          validated against site utilities and peak load.
        </p>
        <div className="hk-actions">
          <a className="hk-a-primary" href="/en/pfos">
            Project Factory — start a quote
          </a>
          <a className="hk-a-secondary" href="/en/story">
            Our story
          </a>
          <a className="hk-a-secondary" href="/en/iletisim">
            Contact
          </a>
          <a className="hk-a-secondary" href="/en/shop/marka">
            Brands
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="hk-main" id="hakkimizda">
      <h1>Hakkımızda</h1>
      <p className="hk-lead">
        <strong>Equsto</strong>, Türkiye merkezli bir <strong>endüstriyel mutfak ve gastronomi platformudur</strong>.
        Restoran, otel, kafe, catering ve bulut mutfak projeleri için ekipman seçimi, kapasite planlaması ve marka
        danışmanlığı sunar; <strong>Proje Fabrikası (PFOS)</strong> ile ekipman listenizi ve teklif özetinizi{" "}
        <strong>5 dakika içinde</strong> oluşturur.
      </p>
      <div className="hk-box">
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>Equsto Teknoloji Limited</strong> — Equsto Teknolojisi · Gastronomi Tasarımı · Satış Mühendisliği.
          Katalog: pişirme, soğutma, yıkama, hazırlık, kahve ve içecek ekipmanları.
        </p>
      </div>
      <h2>Ne yapıyoruz?</h2>
      <p>
        Equsto, Türkiye&apos;de ve seçili ihracat pazarlarında <strong>endüstriyel mutfak ekipmanı satışı</strong> ile{" "}
        <strong>mutfak proje danışmanlığını</strong> tek çatı altında birleştirir.
      </p>
      <ul>
        <li>
          <strong>Online katalog</strong> — binlerce SKU, departman filtreleri, teknik ölçüler
        </li>
        <li>
          <strong>Proje Fabrikası</strong> — konsept, kapasite ve m²&apos;ye göre otomatik ekipman listesi
        </li>
        <li>
          <strong>Bar Design Studio · Besos</strong> — modüler bar ve IMT300 berrak buz çözümleri
        </li>
        <li>
          <strong>Satış mühendisliği</strong> — tesisat, lojistik ve marka alternatifleriyle net teklif
        </li>
      </ul>
      <h2>Endüstriyel mutfak ekipmanı markaları</h2>
      <p>
        Katalogda <strong>Öztiryakiler</strong>, <strong>Atalay</strong> ve seçili uluslararası mutfak markaları yer
        alır. Pişirme, soğutma, yıkama, hazırlık, kahve ve içecek hatları departman bazında listelenir.
      </p>
      <h2>Mutfak proje yönetimi süreci</h2>
      <ol className="hk-timeline" style={{ listStyle: "decimal" }}>
        <li>
          <strong>Keşif</strong> — konsept, menü, kapasite ve saha ölçüsü
        </li>
        <li>
          <strong>Liste</strong> — PFOS kural setiyle modül adetleri
        </li>
        <li>
          <strong>Teklif</strong> — KDV ve lojistik kalemleriyle fiyat özeti
        </li>
        <li>
          <strong>Tedarik</strong> — sipariş, montaj ve devreye alma
        </li>
      </ol>
      <h2>Soğutma ve soğuk oda</h2>
      <p>
        Modüler soğuk oda ve soğutma grupları ürün profili ve çıkışa göre boyutlandırılır. Tezgah ve dikey dolaplar,
        ayrı mühendislik gerektiren soğuk oda projelerini tamamlar.
      </p>
      <h2>Hijyen ve gıda güvenliği</h2>
      <p>
        Ekipman seçimi HACCP odaklıdır: çiğ ve hazır ürün zonları, yıkama kapasitesi ve günlük temizlenebilir yüzeyler
        plan aşamasında ayrılır.
      </p>
      <h2>Enerji verimliliği</h2>
      <p>
        Düşük tüketimli soğutma ve pişirme modülleri tercih edilir; nihai seçim tesisat ve pik yük ile doğrulanır.
      </p>
      <div className="hk-actions">
        <a className="hk-a-primary" href="/pfos">
          Proje Fabrikası — teklif başlat
        </a>
        <a className="hk-a-secondary" href="/buradan-basladi">
          Buradan başladık
        </a>
        <a className="hk-a-secondary" href="/iletisim">
          İletişim
        </a>
        <a className="hk-a-secondary" href="/shop/marka">
          Markalar
        </a>
      </div>
    </main>
  );
}
