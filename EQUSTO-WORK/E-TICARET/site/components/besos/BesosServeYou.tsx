import Image from "next/image";
import Link from "next/link";
import { besosAssetPath } from "@/lib/besos/asset-path";
import type { BesosLocale } from "@/lib/besos/locale";
import { localizeServeYou } from "@/lib/besos/locale";
import { besosUi } from "@/lib/besos/ui-strings";
import type { BesosServeYou } from "@/lib/besos/types";

type Props = {
  serve: BesosServeYou;
  locale?: BesosLocale;
};

export default function BesosServeYou({ serve, locale = "tr" }: Props) {
  const s = localizeServeYou(serve, locale);
  const img = serve.image ? besosAssetPath(serve.image) : "";
  const infoHref = locale === "en" ? "/en/contact" : serve.ctaInfoHref;

  return (
    <section className="bes-vitrum-serve" aria-label={besosUi("serveAria", locale)}>
      <div className="bes-vitrum-serve-inner">
        <div className="bes-vitrum-serve-copy">
          <p className="bd-vl-kicker">{s.kicker}</p>
          <h2>{s.title}</h2>
          <p>{s.body}</p>
          <div className="bes-vitrum-serve-actions">
            <Link className="bd-btn bd-btn-primary" href={serve.ctaCatalogHref}>
              {s.ctaCatalog}
            </Link>
            <Link className="bd-btn" href={infoHref}>
              {s.ctaInfo}
            </Link>
          </div>
        </div>
        {img ? (
          <div className="bes-vitrum-serve-media">
            <Image src={img} alt="" width={900} height={680} loading="lazy" unoptimized />
          </div>
        ) : null}
      </div>
    </section>
  );
}
