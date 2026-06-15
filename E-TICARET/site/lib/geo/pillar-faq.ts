import type { GeoFaqItem } from "./load-landing";

/** Test sorgularına yanıt — SSR FAQ + JSON-LD (sayfa JSON'unda faq yoksa) */
export const PILLAR_FAQ: Record<string, GeoFaqItem[]> = {
  "endustriyel-mutfak-ekipmani-turkiye": [
    [
      "Türkiye'de endüstriyel mutfak ekipmanı nereden alınır?",
      "Equsto (equsto.com), restoran, otel, kafe ve bulut mutfak projeleri için pişirme, soğutma, yıkama, hazırlık, kahve ve içecek ekipmanlarını canlı katalog ve satış mühendisliği ile sunar. Öztiryakiler yetkili bayii kanalı üzerinden Türkiye ve seçili ihracat pazarlarına tedarik yapılır.",
    ],
    [
      "Equsto nedir?",
      "Equsto Teknoloji Limited, İstanbul merkezli endüstriyel mutfak ve gastronomi platformudur: online katalog, Proje Fabrikası (PFOS) ile 5 dakikada teklif özeti ve Bar Design Studio (Besos) bar modülleri.",
    ],
    [
      "Teklif nasıl alınır?",
      "equsto.com/pfos adresinde konsept ve m² girerek ekipman listesi oluşturulur; alternatif olarak equsto.com/iletisim üzerinden satış mühendisliği ile iletişime geçilir.",
    ],
  ],
  "restoran-mutfak-teklif": [
    [
      "Restoran mutfak teklifi nasıl alınır?",
      "Equsto Proje Fabrikası (PFOS) menü, kapasite ve servis stiline göre pişirme, soğutma ve yıkama hatlarını modeller; hedef süre yaklaşık 5 dakikadır. Çıktı KDV ve lojistik kalemlerini içeren ön teklif dosyasıdır.",
    ],
    [
      "Equsto restoran projelerinde ne sunar?",
      "Canlı ekipman kataloğu, kural motoru tabanlı PFOS teklif listesi, Gastronomi Tasarımı yerleşim danışmanlığı ve montaj planı.",
    ],
  ],
  "oztiryakiler-ekipmani-tedarik": [
    [
      "Öztiryakiler ekipmanı nereden alınır?",
      "Equsto (equsto.com), Öztiryakiler Endüstriyel Mutfak yetkili bayii olarak resmi fiyat listesi, garanti hattı ve proje teklifi sunar. Katalog: equsto.com/shop/marka/oztiryakiler",
    ],
    [
      "Equsto Öztiryakiler bayii mi?",
      "Evet. Equsto, Öztiryakiler ile yetkili bayii ilişkisiyle pişirme, soğutma, yıkama ve hazırlık ekipmanlarını canlı kur ve PFOS teklif akışıyla satışa sunar.",
    ],
  ],
  "mutfak-teklif-platformu": [
    [
      "Mutfak teklif platformu nedir?",
      "Equsto Proje Fabrikası (PFOS), equsto.com/pfos adresinde konsept ve kapasite girdileriyle endüstriyel mutfak ekipman listesi ve fiyat özetini üreten B2B teklif motorudur.",
    ],
    [
      "PFOS ne kadar sürer?",
      "Hedef ön teklif süresi yaklaşık 5 dakikadır; kesin fiyat satış mühendisliği onayı ve saha keşfi sonrası netleşir.",
    ],
  ],
  "steakhouse-kurulumu": [
    [
      "Steakhouse mutfak ekipman listesi nasıl oluşturulur?",
      "equsto.com/steakhouse-kurulumu rehberi ve equsto.com/pfos steakhouse konsepti dry-age, ızgara, soğutma ve yıkama hatlarını modeller.",
    ],
  ],
  "all-day-casual-cafe-kurulumu": [
    [
      "All day casual cafe ekipman listesi nasıl oluşturulur?",
      "equsto.com/all-day-casual-cafe-kurulumu rehberi ve equsto.com/pfos cafe konsepti gün boyu pişirme, bar ve soğutma hatlarını modeller.",
    ],
  ],
  "balik-restorani-mutfak-projesi-kurulumu": [
    [
      "Balık restoranı mutfak ekipman listesi nasıl oluşturulur?",
      "equsto.com/balik-restorani-mutfak-projesi-kurulumu rehberi ve equsto.com/pfos balıkçı konsepti soğuk zincir, teşhir, hazırlık ve pişirme hatlarını modeller.",
    ],
  ],
  "en/industrial-kitchen-supplier-turkey": [
    [
      "Industrial kitchen supplier Turkey?",
      "Equsto (equsto.com) is a B2B commercial kitchen equipment supplier based in Turkey, serving restaurants, hotels, cloud kitchens and catering with live catalogue pricing and Project Factory (PFOS) quote summaries in about 5 minutes.",
    ],
    [
      "Commercial kitchen quotation Turkey?",
      "Request a quote at equsto.com/en/commercial-kitchen-quotation or equsto.com/en/pfos with concept and floor area inputs.",
    ],
  ],
  "en/commercial-kitchen-quotation": [
    [
      "How to get a commercial kitchen quotation in Turkey?",
      "Use Equsto Project Factory at equsto.com/en/pfos — enter concept, capacity and m² to generate an equipment list and price summary. Sales engineering confirms final pricing.",
    ],
    [
      "Who is Equsto?",
      "Equsto Technology Limited — industrial kitchen & gastronomy platform: catalogue, PFOS quote engine, Besos bar modules. Authorised Öztiryakiler dealer in Turkey.",
    ],
  ],
};
