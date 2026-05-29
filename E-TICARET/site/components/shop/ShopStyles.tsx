import { SHOP_ASSET_V } from "@/lib/shop/assets";

/** Legacy vitrin CSS — eq-shop sayfaları */
export default function ShopStyles({ variant = "plp" }: { variant?: "plp" | "product" | "cart" | "search" | "pfos" }) {
  const v = SHOP_ASSET_V;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/theme.css?v=${v}`} />
      {variant !== "pfos" ? (
        /* eslint-disable-next-line @next/next/no-css-tags */
        <link rel="stylesheet" href={`/eq-home-mutbex.css?v=${v}`} />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/contact.css?v=${v}`} />
      {variant === "plp" || variant === "search" ? (
        /* eslint-disable-next-line @next/next/no-css-tags */
        <link rel="stylesheet" href={`/eq-dept-plp.css?v=${v}`} />
      ) : null}
      {variant === "product" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-css-tags */}
          <link rel="stylesheet" href={`/eq-home-mutbex.css?v=${v}`} />
          {/* eslint-disable-next-line @next/next/no-css-tags */}
          <link rel="stylesheet" href={`/eq-product-page.css?v=${v}`} />
        </>
      ) : null}
    </>
  );
}
