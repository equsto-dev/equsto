/**
 * Ana sayfa metinleri — Vitrum tarzı bölüm akışı, Equsto içeriği.
 * Özelleştirme: bu dosyayı düzenleyin (görseller public/images/home/).
 */

export const homeHero = {
  title: "Vizyondan sahaya,\nkusursuz uygulama",
  subtitle:
    "Restoran, otel, kafe ve perakende için endüstriyel mutfak çözümleri — Proje Fabrikası ile anlık teklif, Bar Design ile sahaya inen bar hatları.",
  ctas: [
    { href: "/pfos", label: "Projem var", primary: true },
    { href: "#hakkimizda", label: "Hakkımızda", primary: false },
  ] as const,
};

/** Kilitli üçlü vitrin — video yok, statik kart */
export const heroPillars = [
  {
    id: "pfos",
    href: "/pfos",
    soon: false,
    tag: "Proje Çözümleri",
    title: "Proje Fabrikası",
    pitch: "Adım adım soru-cevap ile ekipman listeniz ve anlık teklif.",
    cta: "Projeyi başlat →",
    visual: "pfos" as const,
    image: null as string | null,
  },
  {
    id: "yer",
    href: null,
    soon: true,
    tag: "Restoran & Catering",
    title: "Yer Sofrası",
    pitch: "Konsept vitrin, masa düzeni ve servis hatları.",
    cta: null,
    visual: "yer" as const,
    image: "/images/home/hero-yer-sofrasi-bufe.png",
  },
  {
    id: "besos",
    href: "/besos",
    soon: false,
    tag: "Bar & Beverages",
    title: "Bar Design",
    pitch: "Modüler kokteyl istasyonu ve bar ekipman seçimi.",
    cta: "Bar Design →",
    visual: "besos" as const,
    image: "/images/home/hero-bar-cocktailstation.png",
  },
];

export const homeAbout = {
  id: "hakkimizda",
  eyebrow: "Equsto hakkında",
  title: "Endüstriyel mutfak ve gastronomide tek elden partner",
  body:
    "Equsto; pişirme, soğutma, yıkama, hazırlık, kahve ve içecek ekipmanlarında satış mühendisliği, proje tasarımı ve sahaya kurulumu bir arada sunar. PFOS ile dakikalar içinde teklif; Besos ile bar konseptinizi modüler olarak planlayın.",
};

export const homeSolutions = {
  eyebrow: "Çözümler",
  title: "Restoran, bar ve profesyonel mutfak için tek çatı",
  items: [
    {
      slug: "pisirme",
      title: "Pişirme",
      desc: "Fırın, ocak ve pişirme hatları — proje bazlı liste ve teklif.",
      href: "/kategori/pisirme",
    },
    {
      slug: "sogutma",
      title: "Soğutma",
      desc: "Soğutmalı tezgah, dolap ve vitrin çözümleri.",
      href: "/kategori/sogutma",
    },
    {
      slug: "kahve",
      title: "Kahve",
      desc: "Espresso hatları, öğütücü ve barista ekipmanı.",
      href: "/kategori/kahve",
    },
    {
      slug: "yikama",
      title: "Yıkama",
      desc: "Bulaşık ve hijyen hatları, kurutma ve depolama.",
      href: "/kategori/yikama",
    },
    {
      slug: "besos",
      title: "Bar Design",
      desc: "Modüler bar, buz makinesi ve kokteyl istasyonları.",
      href: "/besos",
      external: true,
    },
    {
      slug: "pfos",
      title: "Proje Fabrikası",
      desc: "Soru-cevap ile ekipman listesi ve Excel teklif.",
      href: "/pfos",
      external: true,
    },
  ],
};

export const homeAlsoOffer = {
  title: "Ayrıca sunuyoruz",
  items: [
    { label: "PFOS — anlık proje teklifi", href: "/pfos" },
    { label: "Bar modül kataloğu", href: "/besos" },
    { label: "Marka: Atalay", href: "/marka/atalay" },
    { label: "Tüm kategorilerde ara", href: "/arama" },
  ],
};

export const homeStats = {
  eyebrow: "Neden Equsto",
  title: "Rakamlarla güven",
  items: [
    { value: "360°", label: "proje desteği", sub: "tasarımdan kuruluma" },
    { value: "PFOS", label: "anında teklif", sub: "dakikalar içinde liste" },
    { value: "12+", label: "ürün departmanı", sub: "pişirmeden bara" },
    { value: "TR", label: "Türkiye omurgası", sub: "özelleştirilebilir bölge metni" },
  ],
};

export const homeRegions = {
  title: "Nerede hizmet veriyoruz",
  body: "Türkiye genelinde restoran, otel, catering ve perakende projeleri. Bölge ve lojistik metnini buradan özelleştirebilirsiniz.",
  cta: { href: "/contact.html", label: "İletişim" },
};

export const homeProjects = {
  eyebrow: "Öne çıkan projeler",
  title: "Referanslar vitrini",
  note: "Admin / CMS bağlandığında gerçek proje kartları buraya gelecek.",
  placeholders: [
    { title: "Steakhouse mutfak", tag: "Restoran", year: "2025" },
    { title: "Otel ana mutfak", tag: "Profesyonel mutfak", year: "2024" },
    { title: "Kokteyl bar hattı", tag: "Bar", year: "2025" },
  ],
};

export const homePartners = {
  title: "Markalarımız",
  note: "Logo şeridi — görselleri public/images/partners/ altına ekleyin.",
  names: ["Atalay", "Öztiryakiler", "Vitrum referans", "Marka 4", "Marka 5"],
};

export const homeCta = {
  title: "Vizyonunuzu hayata geçirelim",
  body: "Konseptiniz net olsun veya fikir aşamasında olun — PFOS veya ekibimizle hemen başlayın.",
  primary: { href: "/pfos", label: "Projem var" },
  secondary: { href: "/contact.html", label: "Bilgi almak istiyorum" },
};
