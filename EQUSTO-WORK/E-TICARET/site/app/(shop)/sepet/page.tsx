import type { Metadata } from "next";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopCartMain from "@/components/shop/ShopCartMain";
import ShopCartScripts from "@/components/shop/ShopCartScripts";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopStyles from "@/components/shop/ShopStyles";

export const metadata: Metadata = {
  title: "Sepet · Equsto",
  description: "Equsto alışveriş sepetiniz — ürün listesi, WhatsApp ile talep ve sipariş oluşturma.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://equsto.com/sepet",
    languages: { tr: "https://equsto.com/sepet", en: "https://equsto.com/en/cart" },
  },
};

export default function SepetPage() {
  return (
    <>
      <ShopStyles variant="cart" />
      <ShopBodyClass className="eq-shop eq-cart-page" />
      <ShopEqustoChrome activeDept={null} />
      <ShopCartMain />
      <ShopCartScripts />
    </>
  );
}
