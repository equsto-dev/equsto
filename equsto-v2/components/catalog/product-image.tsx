import { DONER_PLACEHOLDER } from "@/lib/product-specs";
import { AtalayDonerPlaceholder } from "./atalay-doner-placeholder";

export function ProductImage({
  src,
  alt,
  modelCode,
}: {
  src: string;
  alt: string;
  modelCode: string;
}) {
  const useInlinePlaceholder =
    src.includes("_placeholder") || src.endsWith(".jpg");

  if (useInlinePlaceholder) {
    return <AtalayDonerPlaceholder modelCode={modelCode} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={400}
      height={300}
      className="w-full sm:w-80 h-auto object-contain border border-neutral-200 rounded-lg bg-neutral-50 p-4"
    />
  );
}

export { DONER_PLACEHOLDER };
