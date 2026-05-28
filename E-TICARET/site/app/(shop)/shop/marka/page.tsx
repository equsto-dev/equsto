import type { Metadata } from "next";
import MarkaHubMount from "@/components/vitrin/MarkaHubMount";
import MarkaHubScripts from "@/components/vitrin/MarkaHubScripts";
import VitrinShell from "@/components/vitrin/VitrinShell";

export const metadata: Metadata = {
  title: "İş ortaklarımız · Equsto",
  description: "Equsto iş ortakları ve marka vitrini — endüstriyel mutfak ekipmanı tedarikçileri.",
  alternates: {
    canonical: "https://equsto.com/shop/marka",
    languages: { tr: "https://equsto.com/shop/marka", en: "https://equsto.com/en/shop/marka" },
  },
};

export default function MarkaHubPage() {
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
