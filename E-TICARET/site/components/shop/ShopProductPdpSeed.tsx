import Script from "next/script";

type Props = {
  seed: Record<string, unknown>;
};

/** Ürün satırı — beforeInteractive boot (katalog fetch beklemeden E-PDP). */
export default function ShopProductPdpSeed({ seed }: Props) {
  const json = JSON.stringify(seed).replace(/</g, "\\u003c");
  return (
    <Script
      id="eq-pdp-seed-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `window.__EQ_PDP_SEED=${json};`,
      }}
    />
  );
}
