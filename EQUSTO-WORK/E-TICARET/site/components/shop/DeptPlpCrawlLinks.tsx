import Link from "next/link";
import { getDeptCrawlLinks } from "@/lib/shop/pdp-server";
import type { ShopDeptSlug } from "@/lib/shop/depts";

type Props = {
  dept: ShopDeptSlug;
};

/** Arama motorları için departman → ürün iç bağlantıları (JS grid yüklenmeden önce). */
export default async function DeptPlpCrawlLinks({ dept }: Props) {
  const links = await getDeptCrawlLinks(dept, 120);
  if (!links.length) return null;

  return (
    <nav
      className="eq-dept-plp-crawl-links eq-sr-only"
      aria-label="Katalog ürün bağlantıları"
    >
      <h2 className="eq-dept-plp-crawl-links__title">Katalog ürünleri</h2>
      <ul className="eq-dept-plp-crawl-links__list">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
