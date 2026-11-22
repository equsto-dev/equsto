import type { Metadata } from "next";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopCartScripts from "@/components/shop/ShopCartScripts";
import ShopCheckoutMain from "@/components/shop/ShopCheckoutMain";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopStyles from "@/components/shop/ShopStyles";

export const metadata: Metadata = {
  title: "Ödeme · Equsto",
  description: "Teslimat, fatura ve ödeme adımı.",
  robots: { index: false, follow: false },
};

export default function OdemePage() {
  return (
    <>
      <ShopStyles variant="cart" />
      <ShopBodyClass className="eq-shop eq-cart-page eq-checkout-page" />
      <ShopEqustoChrome activeDept={null} />
      <ShopCheckoutMain />
      <ShopCartScripts />
    </>
  );
}
