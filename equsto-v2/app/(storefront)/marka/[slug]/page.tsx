import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseProductSpecs } from "@/lib/product-specs";
import { loadStorefrontPricing } from "@/lib/storefront-pricing";

export const dynamic = "force-dynamic";

export default async function MarkaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await db.brand.findUnique({ where: { slug } });
  if (!brand) notFound();

  const [products, pricing] = await Promise.all([
    db.product.findMany({
      where: { brandId: brand.id, status: "PUBLISHED" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    loadStorefrontPricing(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">{brand.name}</h1>
      {brand.description ? (
        <p className="text-neutral-600 text-sm mb-6">{brand.description}</p>
      ) : null}
      {products.length === 0 ? (
        <p className="text-sm text-neutral-600">Yayında ürün yok.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg">
          {products.map((p) => {
            const specs = parseProductSpecs(p.specs);
            const tl = pricing.listTl(
              specs,
              p.priceListTl != null ? Number(p.priceListTl) : null
            );
            return (
              <li key={p.id}>
                <Link
                  href={`/urun/${p.slug}`}
                  className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-neutral-50"
                >
                  <span>
                    {p.name}
                    <span className="text-neutral-500 text-sm ml-2">{p.category.name}</span>
                  </span>
                  {tl != null ? (
                    <span className="text-sm font-medium text-neutral-800 shrink-0">
                      {tl.toLocaleString("tr-TR")} TRY
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
