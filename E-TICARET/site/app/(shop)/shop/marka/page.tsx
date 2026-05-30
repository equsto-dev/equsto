import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MarkaHubMount from "@/components/vitrin/MarkaHubMount";
import MarkaHubScripts from "@/components/vitrin/MarkaHubScripts";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { resolveBrandRedirectPath } from "@/lib/brand-shop-redirect";

export const metadata: Metadata = {
  title: "İş ortaklarımız · Equsto",
  description: "Equsto iş ortakları ve marka vitrini — endüstriyel mutfak ekipmanı tedarikçileri.",
  alternates: {
    canonical: "https://equsto.com/shop/marka",
    languages: { tr: "https://equsto.com/shop/marka", en: "https://equsto.com/en/shop/marka" },
  },
};

export default async function MarkaHubPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string; slug?: string }>;
}) {
  const sp = await searchParams;
  const legacyB = (sp.b || sp.slug || "").trim();
  if (legacyB) {
    const dest = resolveBrandRedirectPath(legacyB);
    if (dest) redirect(dest);
  }

  return (
    <>
      <VitrinShell bodyClass="eq-shop eq-marka eq-marka-hub">
        <div className="pg">
          <div className="body">
            <aside className="eq-filter-col eq-refine-amazon" id="eq-filter-col" aria-hidden="true" />
            <div className="right-col">
              <div id="eq-cat-shell" data-cat="marka" />
            </div>
          </div>
        </div>
      </VitrinShell>
      <MarkaHubMount />
      <MarkaHubScripts />
    </>
  );
}
