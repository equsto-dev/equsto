import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopStyles from "@/components/shop/ShopStyles";
import type { ShopDeptSlug } from "@/lib/shop/depts";

type VitrinShellProps = {
  bodyClass: string;
  activeDept?: ShopDeptSlug | null;
  styleVariant?: "plp" | "product" | "cart" | "search" | "pfos";
  children: React.ReactNode;
  extraCss?: string;
};

/** Vitrin içerik sayfaları — ortak header/topnav/CSS */
export default function VitrinShell({
  bodyClass,
  activeDept = null,
  styleVariant = "plp",
  children,
  extraCss,
}: VitrinShellProps) {
  return (
    <>
      <ShopStyles variant={styleVariant} />
      {extraCss ? (
        <style id="eq-vitrin-page-css" dangerouslySetInnerHTML={{ __html: extraCss }} />
      ) : null}
      <ShopBodyClass className={bodyClass} />
      <ShopEqustoChrome activeDept={activeDept} />
      {children}
      <footer className="footer" id="eq-shop-footer" />
    </>
  );
}
