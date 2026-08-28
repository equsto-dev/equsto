import Image from "next/image";
import { besosAssetPath } from "@/lib/besos/asset-path";

const ICE_STRIP_IMAGES = [
  { src: besosAssetPath("images/besos/besos-ice-bar.png"), alt: "Buz çubuğu" },
  { src: besosAssetPath("images/besos/besos-ice-diamond.png"), alt: "Buz elması" },
  { src: besosAssetPath("images/besos/besos-ice-mint.png"), alt: "Berrak buz küpü" },
  { src: besosAssetPath("images/besos/besos-ice-sphere.png"), alt: "Buz küresi" },
  { src: besosAssetPath("images/besos/besos-ice-tong.png"), alt: "Buz küpü servisi" },
] as const;

export default function BesosIceStrip() {
  return (
    <section
      className="bd-ice-strip bd-ice-strip--five"
      aria-label="Buz ve servis görselleri"
      data-i18n-attr="aria-label:besos.ice_strip_aria"
    >
      <div className="bd-ice-strip-inner">
        {ICE_STRIP_IMAGES.map((img) => (
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            width={640}
            height={800}
            loading="lazy"
            unoptimized
          />
        ))}
      </div>
    </section>
  );
}