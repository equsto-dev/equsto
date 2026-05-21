import Link from "next/link";
import { getMeiliAdmin, PRODUCTS_INDEX } from "@/lib/meilisearch";

type SearchParams = { q?: string };

export default async function AramaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();

  let hits: { id: string; slug: string; name: string; brand?: string }[] = [];
  let meiliOk = true;
  let meiliMsg = "";

  if (query) {
    const client = getMeiliAdmin();
    if (!client) {
      meiliOk = false;
      meiliMsg = "MEILISEARCH_HOST / MEILISEARCH_MASTER_KEY tanımlı değil.";
    } else {
      try {
        const index = client.index(PRODUCTS_INDEX);
        const res = await index.search(query, { limit: 24 });
        hits = (res.hits || []) as typeof hits;
      } catch (e) {
        meiliOk = false;
        meiliMsg = e instanceof Error ? e.message : "Arama hatası";
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Arama</h1>
      <form method="get" className="flex gap-2 mb-6">
        <input
          name="q"
          defaultValue={query}
          placeholder="Tüm sitede ara…"
          className="flex-1 border border-neutral-300 rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 border border-neutral-800 rounded text-sm bg-neutral-900 text-white"
        >
          Ara
        </button>
      </form>

      {!query ? (
        <p className="text-sm text-neutral-600">Anahtar kelime girin.</p>
      ) : !meiliOk ? (
        <p className="text-sm text-amber-800 border border-amber-200 bg-amber-50 rounded p-3">
          {meiliMsg || "Meilisearch kullanılamıyor."}
        </p>
      ) : hits.length === 0 ? (
        <p className="text-sm text-neutral-600">Sonuç yok: «{query}»</p>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg">
          {hits.map((h) => (
            <li key={h.id || h.slug}>
              <Link
                href={`/urun/${h.slug}`}
                className="block px-4 py-3 hover:bg-neutral-50"
              >
                <span className="font-medium">{h.name}</span>
                {h.brand ? (
                  <span className="text-neutral-500 text-sm ml-2">{h.brand}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
