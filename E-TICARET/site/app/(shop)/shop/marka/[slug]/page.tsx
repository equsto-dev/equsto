import type { Metadata } from "next";
import BrandHubJsonLd from "@/components/seo/BrandHubJsonLd";
import MarkaHubScripts from "@/components/vitrin/MarkaHubScripts";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { getSiteOrigin } from "@/lib/site-origin";
import { brandHubLabel, getBrandHubMeta } from "@/lib/shop/brand-hub";

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
  return buildMarkaMetadata(await params, "tr");
}

export function buildMarkaMetadata(
  params: { slug: string },
  lang: "tr" | "en",
): Metadata {
  const { slug } = params;
  const hub = getBrandHubMeta(slug);
  const label = brandHubLabel(slug);
  const origin = getSiteOrigin();
  const path = lang === "en" ? `/en/shop/marka/${slug}` : `/shop/marka/${slug}`;
  const url = `${origin}${path}`;
  const title = hub ? `${hub.displayName} · Equsto` : `${label} · Equsto`;
  const description =
    hub?.description ??
    `${label} endüstriyel mutfak ekipmanları — Equsto katalog, canlı fiyat ve PFOS proje teklifi.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: lang === "en" ? "en_US" : "tr_TR",
      siteName: "Equsto",
    },
  };
}

export default async function MarkaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MarkaSlugPageInner slug={slug} lang="tr" />;
}

export async function MarkaSlugPageInner({
  slug,
  lang,
}: {
  slug: string;
  lang: "tr" | "en";
}) {
  const label = brandHubLabel(slug);
  const homeHref = lang === "en" ? "/en" : "/";
  return (
    <>
      <BrandHubJsonLd slug={slug} lang={lang} />
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
                <a href={homeHref}>Ana Sayfa</a> › <span id="eq-brand-crumb">{label}</span>
              </div>
              <div id="eq-cat-shell" data-cat="marka" data-slug={slug} data-label={label} />
            </div>
          </div>
        </div>
      </VitrinShell>
      <MarkaHubScripts />
    </>
  );
}
