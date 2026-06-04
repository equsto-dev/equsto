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
  leadKey: string;
  navKey: string;
  metaDescription: string;
  metaDescriptionEn: string;
};

export const SHOP_DEPTS: Record<ShopDeptSlug, ShopDeptMeta> = {
  pisirme: {
    title: "Pişirme Ekipmanları",
    lead: "Ocaklar, ızgaralar, kuzineler, fritözler, döner ve tost ekipmanları",
    leadKey: "dept.pisirme_lead",
    navKey: "nav.pisirme",
    metaDescription:
      "Endüstriyel pişirme ekipmanları: ocak, fırın, fritöz, salamander, döner. Restoran, otel ve catering için Equsto.",
    metaDescriptionEn:
      "Commercial cooking equipment — ranges, ovens, fryers, salamanders and doner. For restaurants, hotels and catering.",
  },
  sogutma: {
    title: "Soğutma Ekipmanları",
    lead: "Buzdolabı, derin dondurucu, şok soğutma, teşhir ve soğuk oda çözümleri",
    leadKey: "dept.sogutma_lead",
    navKey: "nav.sogutma",
    metaDescription: "Endüstriyel soğutma ekipmanları — buzdolabı, derin dondurucu, teşhir dolabı, soğuk oda.",
    metaDescriptionEn: "Commercial refrigeration — fridges, freezers, display cases and cold-room solutions.",
  },
  kahve: {
    title: "Kahve Ekipmanları",
    lead: "Espresso, öğütücü, filtre kahve ve barista ekipmanları",
    leadKey: "dept.kahve_lead",
    navKey: "nav.kahve",
    metaDescription: "Kahve ekipmanları — espresso makinesi, değirmen, filtre kahve, barista aksesuarları.",
    metaDescriptionEn: "Coffee equipment — espresso machines, grinders, filter brewers and barista accessories.",
  },
  yikama: {
    title: "Yıkama Ekipmanları",
    lead: "Bulaşık makineleri, setaltı ve konveyörlü yıkama sistemleri",
    leadKey: "dept.yikama_lead",
    navKey: "nav.yikama",
    metaDescription: "Endüstriyel bulaşık yıkama makineleri — setaltı, giyotin, konveyörlü sistemler.",
    metaDescriptionEn: "Commercial dishwashers — undercounter, hood-type and conveyor systems.",
  },
  hazirlik: {
    title: "Hazırlık Ekipmanları",
    lead: "Et ve sebze hazırlık, hamur yoğurma, vakum ve mutfak robotları",
    leadKey: "dept.hazirlik_lead",
    navKey: "nav.hazirlik",
    metaDescription: "Mutfak hazırlık ekipmanları — doğrama, mikser, vakum, kıyma makineleri.",
    metaDescriptionEn: "Food prep equipment — slicers, mixers, vacuum packers and processors.",
  },
  icecek: {
    title: "İçecek Ekipmanları",
    lead: "Çay, meyve suyu, bar blender ve sıcak içecek ekipmanları",
    leadKey: "dept.icecek_lead",
    navKey: "nav.icecek",
    metaDescription: "İçecek ekipmanları — çay makinesi, meyve suyu, dispenser, bar blender.",
    metaDescriptionEn: "Beverage equipment — tea brewers, juice dispensers and bar blenders.",
  },
  tezgah: {
    title: "Tezgahları",
    lead: "Taban raflı, taban ve ara raflı ile dolaplı paslanmaz çalışma tezgahları ve ara tezgahlar",
    leadKey: "dept.tezgah_lead",
    navKey: "nav.tezgah",
    metaDescription: "Endüstriyel çalışma tezgahları — taban raflı, ara raflı ve dolaplı modeller.",
    metaDescriptionEn: "Commercial work tables — base shelf, mid shelf and cabinet models.",
  },
  dolap: {
    title: "Dolaplar",
    lead: "Paslanmaz depolama dolapları, malzeme dolapları ve sürgülü kapalı üniteler",
    leadKey: "dept.dolap_lead",
    navKey: "nav.dolap",
    metaDescription: "Endüstriyel mutfak dolapları — paslanmaz depolama ve malzeme dolapları.",
    metaDescriptionEn: "Commercial kitchen cabinets — stainless storage and cupboard units.",
  },
  davlumbaz: {
    title: "Davlumbazlar",
    lead: "Duvar tipi, ada tipi ve filtreli endüstriyel davlumbaz sistemleri",
    leadKey: "dept.davlumbaz_lead",
    navKey: "nav.davlumbaz",
    metaDescription: "Endüstriyel davlumbaz sistemleri — duvar tipi, ada tipi, filtreli modeller.",
    metaDescriptionEn: "Commercial hood systems — wall, island and filtered models.",
  },
  tasima: {
    title: "Taşıma Ekipmanları",
    lead: "Palet, transpalet ve mutfak içi taşıma çözümleri",
    leadKey: "dept.tasima_lead",
    navKey: "nav.tasima",
    metaDescription: "Mutfak taşıma ekipmanları — servis arabası, transpalet, taşıma rafları.",
    metaDescriptionEn: "Kitchen transport — service trolleys, pallet trucks and mobile racks.",
  },
  araba: {
    title: "Arabalar",
    lead: "Servis arabaları, tepsi toplama, GN taşıma ve mobil bar üniteleri",
    leadKey: "dept.araba_lead",
    navKey: "nav.araba",
    metaDescription: "Servis arabaları ve GN taşıma üniteleri.",
    metaDescriptionEn: "Service trolleys and GN transport units.",
  },
  istif: {
    title: "İstif Rafları",
    lead: "İstif rafları, duvar rafları ve malzeme raf sistemleri",
    leadKey: "dept.istif_lead",
    navKey: "nav.istif",
    metaDescription: "Endüstriyel istif rafları ve depolama raf sistemleri.",
    metaDescriptionEn: "Commercial shelving and storage rack systems.",
  },
  "set-ustu-mutfak": {
    title: "Set Üstü Mutfak Ekipmanları",
    lead: "Öztiryakiler — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları",
    leadKey: "dept.set_ustu_mutfak_lead",
    navKey: "nav.set_ustu",
    metaDescription: "Set üstü mutfak ekipmanları ve servis gereçleri.",
    metaDescriptionEn: "Countertop kitchen equipment and service ware.",
  },
  kuvetler: {
    title: "Küvetler",
    lead: "Gastronorm küvetler, GN kapaklar, polipropilen ve polikarbonat küvetler · Öztiryakiler",
    leadKey: "dept.kuvetler_lead",
    navKey: "nav.kuvetler",
    metaDescription: "Gastronorm küvetler, GN kapaklar ve polipropilen küvetler.",
    metaDescriptionEn: "Gastronorm pans, GN lids and polypropylene containers.",
  },
  "market-reyonlari": {
    title: "Market Reyonları",
    lead: "Proso ve Çağlayan market reyonları — sütlük, şarküteri, dikey dondurucu, ada tipi teşhir ve soğuk hava depoları",
    leadKey: "dept.market_reyonlari_lead",
    navKey: "nav.market_reyon",
    metaDescription: "Market reyonları — sütlük, şarküteri, self-servis ve teşhir dolapları.",
    metaDescriptionEn: "Retail departments — dairy, deli, self-service and display cases.",
  },
};

export const SHOP_DEPT_SLUGS = Object.keys(SHOP_DEPTS) as ShopDeptSlug[];

export function isShopDeptSlug(slug: string): slug is ShopDeptSlug {
  return slug in SHOP_DEPTS;
}
