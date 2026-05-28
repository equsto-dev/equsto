/** Departman PLP — /shop/{slug} (Next.js App Router + legacy eq-dept-plp.js) */
export type ShopDeptSlug =
  | "pisirme"
  | "sogutma"
  | "kahve"
  | "yikama"
  | "hazirlik"
  | "icecek"
  | "tezgah"
  | "dolap"
  | "davlumbaz"
  | "tasima"
  | "araba"
  | "istif"
  | "set-ustu-mutfak"
  | "kuvetler"
  | "market-reyonlari";

export type ShopDeptMeta = {
  title: string;
  lead: string;
  navKey: string;
  metaDescription: string;
};

export const SHOP_DEPTS: Record<ShopDeptSlug, ShopDeptMeta> = {
  pisirme: {
    title: "Pişirme Ekipmanları",
    lead: "Ocaklar, ızgaralar, kuzineler, fritözler, döner ve tost ekipmanları",
    navKey: "nav.pisirme",
    metaDescription:
      "Endüstriyel pişirme ekipmanları: ocak, fırın, fritöz, salamander, döner. Restoran, otel ve catering için Equsto.",
  },
  sogutma: {
    title: "Soğutma Ekipmanları",
    lead: "Buzdolabı, derin dondurucu, şok soğutma, teşhir ve soğuk oda çözümleri",
    navKey: "nav.sogutma",
    metaDescription: "Endüstriyel soğutma ekipmanları — buzdolabı, derin dondurucu, teşhir dolabı, soğuk oda.",
  },
  kahve: {
    title: "Kahve Ekipmanları",
    lead: "Espresso, öğütücü, filtre kahve ve barista ekipmanları",
    navKey: "nav.kahve",
    metaDescription: "Kahve ekipmanları — espresso makinesi, değirmen, filtre kahve, barista aksesuarları.",
  },
  yikama: {
    title: "Yıkama Ekipmanları",
    lead: "Bulaşık makineleri, setaltı ve konveyörlü yıkama sistemleri",
    navKey: "nav.yikama",
    metaDescription: "Endüstriyel bulaşık yıkama makineleri — setaltı, giyotin, konveyörlü sistemler.",
  },
  hazirlik: {
    title: "Hazırlık Ekipmanları",
    lead: "Et ve sebze hazırlık, hamur yoğurma, vakum ve mutfak robotları",
    navKey: "nav.hazirlik",
    metaDescription: "Mutfak hazırlık ekipmanları — doğrama, mikser, vakum, kıyma makineleri.",
  },
  icecek: {
    title: "İçecek Ekipmanları",
    lead: "Çay, meyve suyu, bar blender ve sıcak içecek ekipmanları",
    navKey: "nav.icecek",
    metaDescription: "İçecek ekipmanları — çay makinesi, meyve suyu, dispenser, bar blender.",
  },
  tezgah: {
    title: "Çalışma Tezgahları",
    lead: "Paslanmaz çalışma tezgahları, evyeli modeller ve duvar raf üniteleri",
    navKey: "nav.tezgah",
    metaDescription: "Paslanmaz çalışma tezgahları ve mutfak bankoları.",
  },
  dolap: {
    title: "Dolaplar",
    lead: "Paslanmaz depolama dolapları, malzeme dolapları ve sürgülü kapalı üniteler",
    navKey: "nav.dolap",
    metaDescription: "Endüstriyel mutfak dolapları — paslanmaz depolama ve malzeme dolapları.",
  },
  davlumbaz: {
    title: "Davlumbazlar",
    lead: "Duvar tipi, ada tipi ve filtreli endüstriyel davlumbaz sistemleri",
    navKey: "nav.davlumbaz",
    metaDescription: "Endüstriyel davlumbaz sistemleri — duvar tipi, ada tipi, filtreli modeller.",
  },
  tasima: {
    title: "Taşıma Ekipmanları",
    lead: "Palet, transpalet ve mutfak içi taşıma çözümleri",
    navKey: "nav.tasima",
    metaDescription: "Mutfak taşıma ekipmanları — servis arabası, transpalet, taşıma rafları.",
  },
  araba: {
    title: "Arabalar",
    lead: "Servis arabaları, tepsi toplama, GN taşıma ve mobil bar üniteleri",
    navKey: "nav.araba",
    metaDescription: "Servis arabaları ve GN taşıma üniteleri.",
  },
  istif: {
    title: "İstif Rafları",
    lead: "İstif rafları, duvar rafları ve malzeme raf sistemleri",
    navKey: "nav.istif",
    metaDescription: "Endüstriyel istif rafları ve depolama raf sistemleri.",
  },
  "set-ustu-mutfak": {
    title: "Set Üstü Mutfak Ekipmanları",
    lead: "Öztiryakiler — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları",
    navKey: "nav.set_ustu",
    metaDescription: "Set üstü mutfak ekipmanları ve servis gereçleri.",
  },
  kuvetler: {
    title: "Küvetler",
    lead: "Gastronorm küvetler, GN kapaklar, polipropilen ve polikarbonat küvetler · Öztiryakiler",
    navKey: "nav.kuvetler",
    metaDescription: "Gastronorm küvetler, GN kapaklar ve polipropilen küvetler.",
  },
  "market-reyonlari": {
    title: "Market Reyonları",
    lead: "Proso ve Çağlayan market reyonları — sütlük, şarküteri, dikey dondurucu, ada tipi teşhir ve soğuk hava depoları",
    navKey: "nav.market_reyon",
    metaDescription: "Market reyonları — sütlük, şarküteri, self-servis ve teşhir dolapları.",
  },
};

export const SHOP_DEPT_SLUGS = Object.keys(SHOP_DEPTS) as ShopDeptSlug[];

export function isShopDeptSlug(slug: string): slug is ShopDeptSlug {
  return slug in SHOP_DEPTS;
}
