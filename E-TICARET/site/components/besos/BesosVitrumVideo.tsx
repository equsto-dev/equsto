import Link from "next/link";
import type { BesosLocale } from "@/lib/besos/locale";
import { localizeHero, localizeStat } from "@/lib/besos/locale";
import { besosUi } from "@/lib/besos/ui-strings";
import type { BesosHero as HeroData, BesosHeroVideo, BesosStat } from "@/lib/besos/types";

type Props = {
  video: BesosHeroVideo;
  hero: HeroData;
  stats: BesosStat[];
  locale?: BesosLocale;
};

export default function BesosVitrumVideo({ video, hero, stats, locale = "tr" }: Props) {
  const h = localizeHero(hero, locale);
  const projectHref = locale === "en" ? "/en/pfos" : "/pfos";

  return (
    <section
      className="bd-vitrum-mid-video bd-vitrum-mid-video--overlay"
      id="bd-vitrum-video"
      aria-label={besosUi("videoAria", locale)}
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
          <h2 className="bd-vl-title">{h.title}</h2>
          <p className="bd-vl-lead">{h.lead}</p>
          <div className="bd-vl-stats">
            {stats.map((s) => {
              const stat = localizeStat(s, locale);
              return (
                <div key={s.label} className="bd-vl-stat">
                  <span className="bd-vl-stat-v">{stat.value}</span>
                  <span className="bd-vl-stat-l">{stat.label}</span>
                </div>
              );
            })}
          </div>
          <div className="bd-vl-cta-row">
            <Link className="bd-btn bd-btn-primary" href="#bd-stations">
              {besosUi("browseModules", locale)}
            </Link>
            <Link className="bd-btn" href={projectHref}>
              {h.ctaProject ?? besosUi("requestQuote", locale)}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
