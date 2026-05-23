import Link from "next/link";
import type { BesosHero as HeroData, BesosHeroVideo, BesosStat } from "@/lib/besos/types";

type Props = {
  video: BesosHeroVideo;
  hero: HeroData;
  stats: BesosStat[];
};

export default function BesosVitrumVideo({ video, hero, stats }: Props) {
  return (
    <section
      className="bd-vitrum-mid-video bd-vitrum-mid-video--overlay"
      id="bd-vitrum-video"
      aria-label="Bar stüdyo videosu"
    >
      <div className="bd-vitrum-mid-video-inner">
        <video
          className="bd-hero-native-video"
          autoPlay
          muted
          loop
          playsInline
          poster={video.poster}
        >
          <source src={video.webm} type="video/webm" />
          <source src={video.mp4} type="video/mp4" />
        </video>
        <div className="bd-vitrum-mid-video-shade" aria-hidden="true" />
        <div className="bd-vitrum-mid-video-copy">
          {hero.kicker ? <p className="bd-vl-kicker">{hero.kicker}</p> : null}
          <h2 className="bd-vl-title">{hero.title}</h2>
          <p className="bd-vl-lead">{hero.lead}</p>
          <div className="bd-vl-stats">
            {stats.map((s) => (
              <div key={s.label} className="bd-vl-stat">
                <span className="bd-vl-stat-v">{s.value}</span>
                <span className="bd-vl-stat-l">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="bd-vl-cta-row">
            <Link className="bd-btn bd-btn-primary" href="#bd-stations">
              Modülleri incele
            </Link>
            <Link className="bd-btn" href="/pfos">
              {hero.ctaProject ?? "Proje teklifi al"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
