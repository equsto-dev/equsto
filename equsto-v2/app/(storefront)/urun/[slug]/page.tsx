import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function UrunPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: { brand: true, category: true, images: { orderBy: { order: "asc" } } },
  });
  if (!product || product.status !== "PUBLISHED") notFound();

  const img = product.images.find((i) => i.isPrimary) ?? product.images[0];

  return (
    <article>
      <p className="text-sm text-neutral-500 mb-1">
        {product.brand.name} · {product.category.name}
      </p>
      <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
      <p className="text-sm text-neutral-600 mt-1">Model: {product.modelCode}</p>
      {product.priceListTl != null ? (
        <p className="mt-4 text-lg font-medium">
          {Number(product.priceListTl).toLocaleString("tr-TR")} {product.priceCurrency}
        </p>
      ) : null}
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img.url}
          alt={img.alt || product.name}
          className="mt-6 max-h-64 border border-neutral-200 rounded"
        />
      ) : null}
      {product.description ? (
        <p className="mt-6 text-neutral-700 whitespace-pre-wrap">{product.description}</p>
      ) : null}
    </article>
  );
}
