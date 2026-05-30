import type { Metadata } from "next";
import { Suspense } from "react";
import ShopAramaBoot from "@/components/shop/ShopAramaBoot";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopSearchMain from "@/components/shop/ShopSearchMain";
import ShopSearchScripts from "@/components/shop/ShopSearchScripts";
import ShopStyles from "@/components/shop/ShopStyles";

export const metadata: Metadata = {
  title: "Arama · Equsto",
  description: "Equsto ürün araması",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://equsto.com/arama",
    languages: { tr: "https://equsto.com/arama", en: "https://equsto.com/en/search" },
  },
};

export default function AramaPage() {
  return (
    <>
      <ShopStyles variant="search" />
      <ShopBodyClass className="eq-shop eq-arama-page" />
      <ShopEqustoChrome activeDept={null} />
      <ShopSearchMain />
      <Suspense fallback={null}>
        <ShopAramaBoot />
      </Suspense>
      <footer className="footer" id="eq-shop-footer" />
      <ShopSearchScripts />
    </>
  );
}
