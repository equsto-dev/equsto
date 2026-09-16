import type { Metadata } from "next";
import Link from "next/link";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { SHOP_DEPTS, SHOP_DEPT_SLUGS, type ShopDeptSlug } from "@/lib/shop/depts";

const DEPT_TITLE_EN: Partial<Record<ShopDeptSlug, string>> = {
  pisirme: "Cooking Equipment",
  sogutma: "Refrigeration",
  kahve: "Coffee Equipment",
  yikama: "Warewashing",
  hazirlik: "Food Prep",
  icecek: "Beverage",
  tezgah: "Worktables",
  dolap: "Cabinets",
  davlumbaz: "Hoods & Ventilation",
  tasima: "Transport",
  araba: "Trolleys",
  istif: "Storage & Racking",
  "set-ustu-mutfak": "Countertop Kitchen",
  kuvetler: "Sinks & Bowls",
  "market-reyonlari": "Retail Display",
};

type Props = { lang?: "tr" | "en" };

export function buildShopHubMetadata(lang: "tr" | "en"): Metadata {
  const isEn = lang === "en";
  const path = isEn ? "/en/shop" : "/shop";
  return {
    title: isEn
      ? "Commercial Kitchen Equipment Catalog · Equsto"
      : "Endüstriyel Mutfak Ekipman Kataloğu · Equsto",
    description: isEn
      ? "Browse Equsto departments: cooking, refrigeration, coffee, warewashing, prep and more. Live prices and PFOS project quotes."
      : "Equsto departmanları: pişirme, soğutma, kahve, yıkama, hazırlık ve daha fazlası. Canlı fiyat ve PFOS proje teklifi.",
    alternates: {
      canonical: `https://equsto.com${path}`,
      languages: {
        tr: "https://equsto.com/shop",
        en: "https://equsto.com/en/shop",
      },
    },
  };
}

export function ShopHubPage({ lang = "tr" }: Props) {
  const isEn = lang === "en";
  const base = isEn ? "/en/shop" : "/shop";
  const marka = isEn ? "/en/shop/marka" : "/shop/marka";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEn ? "Commercial Kitchen Equipment Catalog" : "Endüstriyel Mutfak Ekipman Kataloğu",
    url: `https://equsto.com${base}`,
    isPartOf: { "@type": "WebSite", url: "https://equsto.com" },
    about: "Commercial kitchen equipment",
  };

  return (
    <VitrinShell bodyClass="eq-shop eq-shop-hub">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pg" style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 48px" }}>
        <h1 style={{ fontSize: "1.75rem", margin: "0 0 8px", fontWeight: 700 }}>
          {isEn ? "Equipment catalog" : "Ekipman kataloğu"}
        </h1>
        <p style={{ margin: "0 0 24px", opacity: 0.85, lineHeight: 1.5, maxWidth: 640 }}>
          {isEn
            ? "Choose a department or browse brands. Prices and technical specs on each product page; use Project Factory (PFOS) for a kitchen quote."
            : "Departman veya marka seçin. Ürün sayfalarında canlı fiyat ve teknik özellik; mutfak teklifi için Proje Fabrikası (PFOS)."}
        </p>

        <p style={{ margin: "0 0 12px", fontWeight: 600 }}>
          <Link href={marka}>{isEn ? "All brands →" : "Tüm markalar →"}</Link>
          {" · "}
          <Link href={isEn ? "/en/pfos" : "/pfos"}>
            {isEn ? "Project Factory (PFOS)" : "Proje Fabrikası (PFOS)"}
          </Link>
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {SHOP_DEPT_SLUGS.map((slug) => {
            const meta = SHOP_DEPTS[slug];
            const title = isEn ? DEPT_TITLE_EN[slug] || meta.title : meta.title;
            const lead = isEn ? meta.metaDescriptionEn || meta.lead : meta.lead;
            return (
              <li key={slug}>
                <Link
                  href={`${base}/${slug}`}
                  style={{
                    display: "block",
                    padding: "14px 14px 16px",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "inherit",
                    height: "100%",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: 6 }}>{title}</strong>
                  <span style={{ fontSize: "0.88rem", opacity: 0.8, lineHeight: 1.4 }}>
                    {lead.length > 110 ? `${lead.slice(0, 107)}…` : lead}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </VitrinShell>
  );
}
