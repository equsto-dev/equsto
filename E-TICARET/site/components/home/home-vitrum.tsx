import Link from "next/link";
import {
  heroPillars,
  homeAbout,
  homeAlsoOffer,
  homeCta,
  homeHero,
  homePartners,
  homeProjects,
  homeRegions,
  homeSolutions,
  homeStats,
} from "@/lib/home-content";

function HeroPillar({
  pillar,
}: {
  pillar: (typeof heroPillars)[number];
}) {
  const visualClass = `eq-v-pillar-visual eq-v-pillar-visual--${pillar.visual}`;
  const body = (
    <>
      {pillar.soon ? <span className="eq-v-soon">PEK YAKINDA</span> : null}
      <div className={visualClass}>
        {pillar.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pillar.image}
            alt=""
            className="eq-v-pillar-img"
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
      <div className="eq-v-pillar-body">
        <div className="eq-v-pillar-tag">{pillar.tag}</div>
        <h2 className="eq-v-pillar-title">{pillar.title}</h2>
        <p className="eq-v-pillar-pitch">{pillar.pitch}</p>
        {pillar.cta ? <span className="eq-v-pillar-cta">{pillar.cta}</span> : null}
      </div>
    </>
  );

  if (!pillar.href || pillar.soon) {
    return (
      <div className="eq-v-pillar eq-v-pillar--static eq-v-pillar--soon" aria-disabled>
        {body}
      </div>
    );
  }

  return (
    <Link href={pillar.href} className="eq-v-pillar">
      {body}
    </Link>
  );
}

export function HomeVitrum() {
  return (
    <div className="eq-v-home w-screen max-w-[100vw] overflow-x-hidden relative left-1/2 -translate-x-1/2">
      {/* Vitrum: büyük başlık + CTA — video yok */}
      <section className="eq-v-hero-top">
        <div className="eq-v-inner">
          <h1>{homeHero.title}</h1>
          <p className="eq-v-lead">{homeHero.subtitle}</p>
          <div className="eq-v-hero-actions">
            {homeHero.ctas.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={c.primary ? "eq-v-btn eq-v-btn--primary" : "eq-v-btn eq-v-btn--ghost"}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Kilitli üçlü: PFOS · Yer Sofrası · Bar Design */}
      <section className="eq-v-pillars" aria-label="Equsto vitrin">
        {heroPillars.map((p) => (
          <HeroPillar key={p.id} pillar={p} />
        ))}
      </section>

      <section id={homeAbout.id} className="eq-v-section">
        <div className="eq-v-inner">
          <p className="eq-v-eyebrow">{homeAbout.eyebrow}</p>
          <h2 className="eq-v-h2">{homeAbout.title}</h2>
          <p className="eq-v-lead">{homeAbout.body}</p>
        </div>
      </section>

      <section className="eq-v-section eq-v-section--soft">
        <div className="eq-v-inner">
          <p className="eq-v-eyebrow">{homeSolutions.eyebrow}</p>
          <h2 className="eq-v-h2">{homeSolutions.title}</h2>
          <div className="eq-v-solutions-grid mt-8">
            {homeSolutions.items.map((item) => (
              <Link key={item.slug} href={item.href} className="eq-v-solution-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <span className="eq-v-link-arrow">Keşfet →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="eq-v-section">
        <div className="eq-v-inner">
          <h2 className="eq-v-h2">{homeAlsoOffer.title}</h2>
          <div className="eq-v-also mt-6">
            {homeAlsoOffer.items.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="eq-v-section eq-v-section--dark">
        <div className="eq-v-inner">
          <p className="eq-v-eyebrow">{homeStats.eyebrow}</p>
          <h2 className="eq-v-h2">{homeStats.title}</h2>
          <div className="eq-v-stats mt-10">
            {homeStats.items.map((s) => (
              <div key={s.label}>
                <div className="eq-v-stat-value">{s.value}</div>
                <div className="eq-v-stat-label">{s.label}</div>
                <div className="eq-v-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="eq-v-section eq-v-section--soft">
        <div className="eq-v-inner">
          <h2 className="eq-v-h2">{homeRegions.title}</h2>
          <p className="eq-v-lead mt-4">{homeRegions.body}</p>
          <Link href={homeRegions.cta.href} className="eq-v-btn eq-v-btn--primary mt-8 inline-flex">
            {homeRegions.cta.label}
          </Link>
        </div>
      </section>

      <section className="eq-v-section">
        <div className="eq-v-inner">
          <p className="eq-v-eyebrow">{homeProjects.eyebrow}</p>
          <h2 className="eq-v-h2">{homeProjects.title}</h2>
          <p className="text-sm text-neutral-500 mt-2 mb-8">{homeProjects.note}</p>
          <div className="eq-v-projects">
            {homeProjects.placeholders.map((p) => (
              <article key={p.title} className="eq-v-project-card">
                <div className="eq-v-project-visual" aria-hidden />
                <div className="eq-v-project-body">
                  <span className="eq-v-project-tag">
                    {p.tag} · {p.year}
                  </span>
                  <h3 className="eq-v-project-title">{p.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="eq-v-section eq-v-section--soft">
        <div className="eq-v-inner text-center">
          <h2 className="eq-v-h2">{homePartners.title}</h2>
          <p className="text-sm text-neutral-500 mt-2 mb-8">{homePartners.note}</p>
          <div className="eq-v-partners">
            {homePartners.names.map((name) => (
              <span key={name} className="eq-v-partner-pill">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="eq-v-cta-band">
        <h2>{homeCta.title}</h2>
        <p>{homeCta.body}</p>
        <div className="eq-v-hero-actions justify-center">
          <Link href={homeCta.primary.href} className="eq-v-btn eq-v-btn--primary">
            {homeCta.primary.label}
          </Link>
          <Link href={homeCta.secondary.href} className="eq-v-btn eq-v-btn--ghost border-neutral-600 text-white hover:bg-neutral-800">
            {homeCta.secondary.label}
          </Link>
        </div>
      </section>
    </div>
  );
}
