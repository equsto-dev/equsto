import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductImage } from "@/components/catalog/product-image";
import { loadStorefrontPricing } from "@/lib/storefront-pricing";
import {
  formatSpecsRows,
  parseProductSpecs,
  resolveProductImageUrl,
} from "@/lib/product-specs";

export const dynamic = "force-dynamic";

export default async function UrunPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, pricing] = await Promise.all([
    db.product.findUnique({
      where: { slug },
      include: { brand: true, category: true, images: { orderBy: { order: "asc" } } },
    }),
    loadStorefrontPricing(),
  ]);
  if (!product || product.status !== "PUBLISHED") notFound();

  const specs = parseProductSpecs(product.specs);
  const { kur, listTl } = pricing;
  const priceTl = listTl(
    specs,
    product.priceListTl != null ? Number(product.priceListTl) : null
  );
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const imgUrl = resolveProductImageUrl(primary?.url, specs);
  const specRows = formatSpecsRows(specs, product.modelCode);

  return (
    <article className="max-w-3xl">
      <nav className="text-sm text-neutral-500 mb-4">
        <Link href="/" className="hover:text-neutral-800">
          Ana sayfa
        </Link>
        {" · "}
        <Link
          href={`/kategori/${product.category.slug}`}
          className="hover:text-neutral-800"
        >
          {product.category.name}
        </Link>
      </nav>

      <p className="text-sm text-neutral-500 mb-1">
        {product.brand.name} · {product.category.name}
      </p>
      <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>

      {priceTl != null ? (
        <p className="mt-4 text-2xl font-semibold text-neutral-900">
          {priceTl.toLocaleString("tr-TR")}{" "}
          <span className="text-base font-normal text-neutral-600">TRY</span>
          <span className="block text-xs font-normal text-neutral-500 mt-1">
            Anlık: site EUR × TCMB efektif satış
          </span>
        </p>
      ) : null}

      {specs.fiyat_euro_katalog != null ? (
        <p className="mt-1 text-sm text-neutral-500">
          Liste {specs.fiyat_euro_katalog.toLocaleString("tr-TR")} EUR
          {specs.fiyat_euro_site != null
            ? ` · Site (≈%40 iskonto): ${specs.fiyat_euro_site.toLocaleString("tr-TR")} EUR`
            : null}
          {kur.tcmbDate ? (
            <>
              {" "}
              · Kur: TCMB efektif satış{" "}
              {kur.rate.toLocaleString("tr-TR", {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4,
              })}{" "}
              ({kur.tcmbDate})
            </>
          ) : null}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col sm:flex-row gap-8">
        <ProductImage
          src={imgUrl}
          alt={primary?.alt || product.name}
          modelCode={product.modelCode}
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-neutral-800 uppercase tracking-wide mb-3">
            Teknik özellikler
          </h2>
          <table className="w-full text-sm border border-neutral-200 rounded-lg overflow-hidden">
            <tbody>
              {specRows.map((row) => (
                <tr key={row.label} className="border-b border-neutral-100 last:border-0">
                  <th className="text-left font-medium text-neutral-600 bg-neutral-50 px-3 py-2 w-40">
                    {row.label}
                  </th>
                  <td className="px-3 py-2 text-neutral-900">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {product.description ? (
        <p className="mt-8 text-neutral-600 text-sm leading-relaxed">{product.description}</p>
      ) : null}
    </article>
  );
}
