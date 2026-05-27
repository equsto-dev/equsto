import Image from "next/image";
import Link from "next/link";
import { besosAssetPath } from "@/lib/besos/asset-path";
import type { BesosModular as ModularData, BesosProduct } from "@/lib/besos/types";

type Props = {
  modular: ModularData;
  products: BesosProduct[];
};

export default function BesosModular({ modular, products }: Props) {
  const images = products
    .filter((p) => p.image)
    .slice(0, 24)
    .map((p) => besosAssetPath(p.image));

  const marquee = [...images, ...images];

  return (
    <section className="bes-vitrum-modular" aria-label="Modüler sistem">
      <div className="bes-vitrum-modular-head">
        <p className="bd-vl-kicker">{modular.kicker}</p>
        <h2>{modular.title}</h2>
      </div>
      <div className="bes-vitrum-modular-marquee" aria-hidden="true">
        <div className="bes-vitrum-modular-track">
          {marquee.map((src, i) => (
            <div key={`${src}-${i}`} className="bes-vitrum-modular-tile">
              <Image src={src} alt="" width={280} height={210} loading="lazy" unoptimized />
            </div>
          ))}
        </div>
        <p className="bes-vitrum-modular-more">+ daha fazlası</p>
      </div>
      <div className="bes-vitrum-modular-cta-wrap">
        <Link className="bd-vl-modular-cta" href="#bd-stations">
          42 modülü keşfet →
        </Link>
      </div>
    </section>
  );
}
