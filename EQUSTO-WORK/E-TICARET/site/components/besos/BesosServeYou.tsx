import Image from "next/image";
import Link from "next/link";
import { besosAssetPath } from "@/lib/besos/asset-path";
import type { BesosServeYou } from "@/lib/besos/types";

type Props = {
  serve: BesosServeYou;
};

export default function BesosServeYou({ serve }: Props) {
  const img = serve.image ? besosAssetPath(serve.image) : "";

  return (
    <section className="bes-vitrum-serve" aria-label="Size hizmet etmek için tasarlanmış sistem">
      <div className="bes-vitrum-serve-inner">
        <div className="bes-vitrum-serve-copy">
          <p className="bd-vl-kicker">{serve.kicker}</p>
          <h2>{serve.title}</h2>
          <p>{serve.body}</p>
          <div className="bes-vitrum-serve-actions">
            <Link className="bd-btn bd-btn-primary" href={serve.ctaCatalogHref}>
              {serve.ctaCatalog}
            </Link>
            <Link className="bd-btn" href={serve.ctaInfoHref}>
              {serve.ctaInfo}
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
