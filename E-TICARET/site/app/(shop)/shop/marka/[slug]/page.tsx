import type { Metadata } from "next";
import MarkaHubScripts from "@/components/vitrin/MarkaHubScripts";
import MarkaPlpBoot from "@/components/vitrin/MarkaPlpBoot";
import VitrinShell from "@/components/vitrin/VitrinShell";

const MARKA_PLP_CSS = `
body.eq-marka-plp .pg{width:1500px;max-width:100%;margin:0 auto;font-size:13px;background:var(--eq-surface);}
body.eq-marka-plp .breadcrumb{padding:10px 20px;font-size:11px;color:var(--eq-text-muted);border-bottom:1px solid var(--eq-border);}
body.eq-marka-plp .body{display:flex;background:var(--eq-surface);}
body.eq-marka-plp .right-col{flex:1;min-width:0;display:flex;flex-direction:column;}
`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const label = slug.replace(/-/g, " ");
  return {
    title: `${label} · Equsto`,
    alternates: { canonical: `https://equsto.com/shop/marka/${slug}` },
  };
}

export default async function MarkaSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <VitrinShell bodyClass="eq-shop eq-marka eq-marka-plp" extraCss={MARKA_PLP_CSS}>
        <div className="pg">
          <div className="body">
            <aside className="eq-filter-col eq-refine-amazon" id="eq-filter-col" aria-label="Filtreler">
              <nav className="sidebar" id="eq-sidebar" aria-label="Kategoriler" />
              <div className="eq-filter-sec">
                <div className="eq-filter-sec-lbl eq-filter-sec-lbl--markalarimiz">Markalarımız</div>
                <div id="eq-filter-brands" className="eq-filter-brands" />
              </div>
            </aside>
            <div className="right-col">
              <div className="breadcrumb">
                <a href="/">Ana Sayfa</a> › <span id="eq-brand-crumb">{slug.replace(/-/g, " ")}</span>
              </div>
              <div id="eq-cat-shell" data-cat="marka" />
            </div>
          </div>
        </div>
      </VitrinShell>
      <MarkaPlpBoot slug={slug} />
      <MarkaHubScripts />
    </>
  );
}
