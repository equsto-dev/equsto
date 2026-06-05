import { readJsonFile } from "@/lib/legacy-data";

export type ShowroomProduct = {
  name: string;
  brand: string;
  sku: string;
  price: string;
  image: string | null;
  href: string;
};

function imgWebPath(raw: string | undefined) {
  if (!raw) return null;
  const s = String(raw).replace(/\\/g, "/");
  if (s.startsWith("/images/")) return s;
  if (s.startsWith("images/catalog/")) return `/${s}`;
  if (s.startsWith("images/")) return `/${s}`;
  return null;
}

function slugify(s: string) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Vitrin örneği — dept/pisirme.json ilk N görseli ürün */
export async function loadShowroomProducts(limit = 12): Promise<ShowroomProduct[]> {
  const rows =
    (await readJsonFile<Array<Record<string, unknown>>>("dept/pisirme.json")) ?? [];
  const out: ShowroomProduct[] = [];
  for (const row of rows) {
    if (out.length >= limit) break;
    const images = row.images as string[] | undefined;
    const img = images?.[0] ? imgWebPath(images[0]) : null;
    if (!img) continue;
    const brand = String(row.brand || "");
    const name = String(row.name || "");
    const dept = String(row.dept || "pisirme");
    const sku = String(row.sku || row.model || "");
    const price = String(row.price || "").split("\n")[0];
    const slug = slugify(brand) + (brand ? "-" : "") + slugify(name);
    out.push({
      name,
      brand,
      sku,
      price,
      image: img,
      href: `/shop/${dept}/${slug}`,
    });
  }
  return out;
}
