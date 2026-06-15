import GeoLandingEquipmentTable from "@/components/vitrin/GeoLandingEquipmentTable";
import type { GeoRouteKind } from "@/lib/geo/load-landing";
import { getGeoLandingTable } from "@/lib/geo/geo-landing-table";
import {
  geoCanonicalPath,
  getGeoLanding,
} from "@/lib/geo/load-landing";

type Props = {
  slug: string;
  lang: "tr" | "en";
  kind?: GeoRouteKind;
};

const UI = {
  tr: {
    home: "Anasayfa",
    faqH2: "Sık sorulan sorular",
    pfos: "Proje Fabrikası",
    contact: "İletişim ve teklif",
    besos: "Bar Design Studio",
    about:
      "Equsto Teknolojisi · Gastronomi Tasarımı · Satış Mühendisliği — Öztiryakiler yetkili bayii; Bar Design Studio (Besos) Vitrum Türkiye.",
  },
  en: {
    home: "Home",
    faqH2: "Frequently asked questions",
    pfos: "Project Factory",
    contact: "Contact & quote",
    besos: "Bar Design Studio",
    about:
      "Equsto Technology · Gastronomy Design · Sales Engineering — Authorised Öztiryakiler dealer; Bar Design Studio (Besos), Vitrum Turkey.",
  },
} as const;

export default function GeoLandingSsrContent({
  slug,
  lang,
  kind = "root",
}: Props) {
  const page = getGeoLanding(slug, lang, kind);
  if (!page?.h1) return null;

  const table = getGeoLandingTable(page.tableRef);
  const u = UI[lang];
  const homeHref = lang === "en" ? "/en" : "/";
  const pfosHref = lang === "en" ? "/en/pfos" : "/pfos";
  const contactHref = lang === "en" ? "/en/iletisim" : "/iletisim";
  const besosHref = lang === "en" ? "/en/besos" : "/besos";
  const path = geoCanonicalPath(slug, lang, kind);

  return (
    <>
      <nav className="eq-geo-bc" aria-label="Konum">
        <a href={homeHref}>{u.home}</a> › <span>{page.h1}</span>
      </nav>
      <article className="eq-geo-article">
        <h1>{page.h1}</h1>
        {page.lead ? <p className="eq-geo-lead">{page.lead}</p> : null}
        {page.body ? (
          <div
            className="eq-geo-body"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        ) : null}
        {table ? <GeoLandingEquipmentTable table={table} lang={lang} /> : null}
        {page.faq?.length ? (
          <section className="eq-geo-faq" aria-label={u.faqH2}>
            <h2>{u.faqH2}</h2>
            {page.faq.map(([q, a]) => (
              <details key={q} className="eq-geo-faq-item" open>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        ) : null}
        <div className="eq-geo-actions">
          <a className="eq-geo-btn eq-geo-btn--primary" href={pfosHref}>
            {u.pfos}
          </a>
          <a className="eq-geo-btn" href={contactHref}>
            {u.contact}
          </a>
          <a className="eq-geo-btn" href={besosHref}>
            {u.besos}
          </a>
        </div>
        <p className="eq-geo-about">{u.about}</p>
      </article>
      {/* Crawlers: explicit entity sentence even if CSS hidden */}
      <p className="eq-sr-only" data-geo-canonical={path}>
        Equsto — {page.title}. {page.description}
      </p>
    </>
  );
}
