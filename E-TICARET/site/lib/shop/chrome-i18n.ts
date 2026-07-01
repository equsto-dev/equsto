/** Üst şerit (hdr-right) — React hydration ile uyumlu TR/EN metinler */

export type ChromeLang = "tr" | "en";

export function chromeLangFromPath(pathname: string | null | undefined): ChromeLang {
  return pathname?.startsWith("/en") ? "en" : "tr";
}

export const CHROME_HDR = {
  tr: {
    delivery_label: "Teslimat Adresi",
    delivery_city: "İstanbul, Türkiye",
    all_categories: "☰ Tüm Kategoriler",
    all_categories_lower: "☰ Tüm kategoriler",
    search_placeholder: "Ürün, marka veya kategori ara…",
    search_aria: "Ara",
    theme_label: "Sistem · Açık · Koyu",
    theme_title: "Tema",
    my_account: "Hesabım",
    account_projects: "Projeler ve Listeler ▾",
    returns: "İadeler",
    and_orders: "ve Siparişler",
    cart: "Alışveriş Sepeti",
    cart_title: "Sepeti aç",
    login_title: "Üye girişi",
    departments_aria: "Departmanlar",
    nav_pfos: "Proje Fabrikası",
    nav_bar_design: "Bar Design",
    nav_pisirme: "Pişirme Ekipmanları",
    nav_sogutma: "Soğutma Ekipmanları",
    nav_kahve: "Kahve Ekipmanları",
    nav_yikama: "Yıkama Ekipmanları",
    nav_hazirlik: "Hazırlık Ekipmanları",
    nav_icecek: "İçecek Ekipmanları",
  },
  en: {
    delivery_label: "Deliver to",
    delivery_city: "Istanbul, Turkey",
    all_categories: "☰ All Categories",
    all_categories_lower: "☰ All categories",
    search_placeholder: "Search products, brands or categories…",
    search_aria: "Search",
    theme_label: "System · Light · Dark",
    theme_title: "Theme",
    my_account: "My Account",
    account_projects: "Projects & Lists ▾",
    returns: "Returns",
    and_orders: "& Orders",
    cart: "Shopping Cart",
    cart_title: "Open cart",
    login_title: "Sign in",
    departments_aria: "Departments",
    nav_pfos: "Project Factory",
    nav_bar_design: "Bar Design",
    nav_pisirme: "Cooking Equipment",
    nav_sogutma: "Refrigeration Equipment",
    nav_kahve: "Coffee Equipment",
    nav_yikama: "Warewashing Equipment",
    nav_hazirlik: "Prep Equipment",
    nav_icecek: "Beverage Equipment",
  },
} as const;
