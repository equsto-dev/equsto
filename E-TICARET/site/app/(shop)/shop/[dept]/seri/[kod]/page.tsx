import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopEqustoFiyatSeriPlp from "@/components/shop/ShopEqustoFiyatSeriPlp";
import ShopStyles from "@/components/shop/ShopStyles";
import { SHOP_DEPTS, isShopDeptSlug } from "@/lib/shop/depts";
import { loadEqustoFiyatSeriProducts } from "@/lib/shop/equsto-fiyat-seri";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dept: string; kod: string }>;
}): Promise<Metadata> {
  const { dept, kod } = await params;
  if (!isShopDeptSlug(dept)) return {};
  const loaded = await loadEqustoFiyatSeriProducts(kod, dept);
  if (!loaded) return {};
  return {
    title: `${loaded.meta.title} · Equsto`,
    description: loaded.meta.lead,
    robots: { index: false, follow: false },
  };
}

export default async function EqustoFiyatSeriPage({
  params,
}: {
  params: Promise<{ dept: string; kod: string }>;
}) {
  const { dept, kod } = await params;
  if (!isShopDeptSlug(dept)) notFound();

  const loaded = await loadEqustoFiyatSeriProducts(kod, dept);
  if (!loaded || !loaded.products.length) notFound();

  const deptMeta = SHOP_DEPTS[dept];

  return (
    <>
      <ShopStyles variant="plp" />
      <ShopBodyClass className="eq-shop eq-dept eq-dept-plp" dataDept={dept} />
      <ShopEqustoChrome activeDept={dept} />
      <ShopEqustoFiyatSeriPlp
        title={loaded.meta.title}
        lead={loaded.meta.lead}
        deptTitle={deptMeta.title}
        deptHref={`/shop/${dept}`}
        products={loaded.products}
        heroImage={loaded.meta.gorsel}
      />
    </>
  );
}
