import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseProductSpecs } from "@/lib/product-specs";
import { loadStorefrontPricing } from "@/lib/storefront-pricing";

export const dynamic = "force-dynamic";

export default async function KategoriPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await db.category.findUnique({ where: { slug } });
  if (!cat) notFound();

  const [products, pricing] = await Promise.all([
    db.product.findMany({
      where: { categoryId: cat.id, status: "PUBLISHED" },
      include: { brand: true },
      orderBy: { name: "asc" },
    }),
    loadStorefrontPricing(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">{cat.name}</h1>
      {cat.description ? (
        <p className="text-neutral-600 text-sm mb-6">{cat.description}</p>
      ) : null}
      {products.length === 0 ? (
        <p className="text-sm text-neutral-600">Bu kategoride yayında ürün yok.</p>
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
                    <span className="text-neutral-500 text-sm ml-2">{p.brand.name}</span>
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
