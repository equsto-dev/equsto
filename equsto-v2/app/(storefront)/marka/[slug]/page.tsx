import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function MarkaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await db.brand.findUnique({ where: { slug } });
  if (!brand) notFound();

  const products = await db.product.findMany({
    where: { brandId: brand.id, status: "PUBLISHED" },
    include: { category: true },
    orderBy: { name: "asc" },
  });

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
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/urun/${p.slug}`}
                className="block px-4 py-3 hover:bg-neutral-50"
              >
                {p.name}
                <span className="text-neutral-500 text-sm ml-2">{p.category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
