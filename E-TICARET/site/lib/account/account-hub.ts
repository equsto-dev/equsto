/** Amazon tarzı hesap merkezi — Equsto kart ve link tanımları */

export type AccountCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  /** whatsapp = Mr. Equsto modal */
  action?: "whatsapp";
  icon: "orders" | "pfos" | "security" | "address" | "payments" | "whatsapp" | "cart" | "contact";
};

export type AccountLinkColumn = {
  title: string;
  links: { label: string; href: string; action?: "logout" }[];
};

export const ACCOUNT_CARDS: AccountCard[] = [
  {
    id: "orders",
    title: "Siparişlerim",
    description:
      "Sepetinizi görüntüleyin, WhatsApp ile talep gönderin ve sipariş durumunuzu takip edin.",
    href: "/sepet",
    icon: "orders",
  },
  {
    id: "pfos",
    title: "Proje Fabrikası (PFOS)",
    description:
      "Endüstriyel mutfak teklifinizi oluşturun; PDF'i e-posta veya WhatsApp ile alın.",
    href: "/pfos",
    icon: "pfos",
  },
  {
    id: "security",
    title: "Giriş ve güvenlik",
    description:
      "E-posta, telefon ve oturum bilgilerinizi görüntüleyin; cep telefonunuzu ekleyin veya güncelleyin.",
    href: "#guvenlik",
    icon: "security",
  },
  {
    id: "address",
    title: "Teslimat adresi",
    description:
      "Proje teslimatı ve nakliye tahmini için şehir ve adres bilgilerinizi yönetin.",
    href: "#adres-ekle",
    icon: "address",
  },
  {
    id: "payments",
    title: "Ödeme ve teklif",
    description:
      "Kurumsal B2B akış: teklif onayı sonrası sipariş ve fatura süreci satış mühendisliği ile yürütülür.",
    href: "/contact",
    icon: "payments",
  },
  {
    id: "whatsapp",
    title: "Mr. Equsto",
    description:
      "WhatsApp sohbet geçmişiniz ve PFOS teklif gönderim kayıtlarınız.",
    href: "#",
    action: "whatsapp",
    icon: "whatsapp",
  },
  {
    id: "cart",
    title: "Alışveriş sepeti",
    description: "Katalog ürünlerinizi görüntüleyin, düzenleyin veya tekrar talep edin.",
    href: "/sepet",
    icon: "cart",
  },
  {
    id: "contact",
    title: "Bize ulaşın",
    description:
      "Satış mühendisliği, montaj ve teknik destek için iletişim kanalları.",
    href: "/contact",
    icon: "contact",
  },
];

export const ACCOUNT_LINK_COLUMNS: AccountLinkColumn[] = [
  {
    title: "PFOS ve projeler",
    links: [
      { label: "Proje Fabrikası", href: "/pfos" },
      { label: "Bar Design Studio", href: "/besos" },
      { label: "İletişim ve teklif", href: "/contact" },
    ],
  },
  {
    title: "Alışveriş",
    links: [
      { label: "Sepetim", href: "/sepet" },
      { label: "Katalog / Shop", href: "/shop" },
      { label: "Arama", href: "/arama" },
    ],
  },
  {
    title: "Hesap",
    links: [
      { label: "Giriş ve güvenlik", href: "#guvenlik" },
      { label: "Hesabım", href: "/hesabim" },
      { label: "Çıkış yap", href: "#", action: "logout" },
      { label: "Üye girişi", href: "/login" },
      { label: "Kayıt ol", href: "/login?mode=register" },
    ],
  },
  {
    title: "Yasal ve gizlilik",
    links: [
      { label: "İade politikası", href: "/iade-politikasi" },
      { label: "SSS", href: "/sss" },
      { label: "Hakkımızda", href: "/hakkimizda" },
    ],
  },
];
