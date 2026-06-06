"use client";

/** Hero kutuları KİLİTLİ — public/home-cafemarkt-hero-KILIT.txt · npm run verify:home-cafemarkt-hero-kilit */

import {
  cafemarktBentoTiles,
  cafemarktCategories,
  cafemarktHeroMain,
  cafemarktHeroSide,
  type CafemarktBentoTile,
  type CafemarktPromoCard,
} from "@/lib/home-cafemarkt-content";
import { HomeCafemarktCategoriesSlider } from "@/components/home/HomeCafemarktCategoriesSlider";
import { publicAssetUrl } from "@/lib/public-asset-url";

function goLink(
  e: React.MouseEvent,
  card: { href: string; legacyGo?: string; dept?: string },
) {
  e.preventDefault();
  const w = window as Window & {
    eqGo?: (key: string) => void;
    eqDeptGo?: (dept: string) => void;
  };
  if (card.legacyGo && typeof w.eqGo === "function") {
    w.eqGo(card.legacyGo);
    return;
  }
  if (card.dept && typeof w.eqDeptGo === "function") {
    w.eqDeptGo(card.dept);
    return;
  }
  window.location.href = card.href;
}

function isSplitPromo(
  card: CafemarktPromoCard,
): card is CafemarktPromoCard & {
  layout: "split";
  promoKicker: string;
  titleEm: string;
  promoLead: string;
  promoBadges: readonly string[];
  promoPoints?: readonly string[];
  image: string;
} {
  return card.layout === "split";
}

function SplitPromoCard({
  card,
  className,
}: {
  card: CafemarktPromoCard & {
    layout: "split";
    promoKicker: string;
    titleEm: string;
    promoLead: string;
    promoBadges: readonly string[];
    image: string;
    promoPoints?: readonly string[];
  };
  className?: string;
}) {
  return (
    <a
      className={`eq-cmkt-promo eq-cmkt-promo--split ${className ?? ""}${card.textLight ? " eq-cmkt-promo--light" : ""}`}
      href={card.href}
      style={{ backgroundColor: card.bg }}
      onClick={(e) => goLink(e, card)}
    >
      <div className="eq-cmkt-promo__panel">
        <p className="eq-cmkt-promo__kicker">{card.promoKicker}</p>
        <h3 className="eq-cmkt-promo__title">
          {card.title}{" "}
          <em className="eq-cmkt-promo__em">{card.titleEm}</em>
        </h3>
        <p className="eq-cmkt-promo__lead">{card.promoLead}</p>
        <ul className="eq-cmkt-promo__badges">
          {card.promoBadges.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
        {card.promoPoints?.length ? (
          <ul className="eq-cmkt-promo__points">
            {card.promoPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : null}
        <span className="eq-cmkt-promo__cta">{card.cta}</span>
      </div>
      <div className="eq-cmkt-promo__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="eq-cmkt-promo__media-img"
          src={publicAssetUrl(card.image)}
          alt="Öztiryakiler TAG 370 NMV — 9 çekmeceli yatay tip buzdolabı"
          loading="lazy"
          decoding="async"
        />
      </div>
    </a>
  );
}

function PromoCard({
  card,
  className,
}: {
  card: CafemarktPromoCard;
  className?: string;
}) {
  return (
    <a
      className={`eq-cmkt-promo ${className ?? ""}${card.textLight ? " eq-cmkt-promo--light" : ""}`}
      href={card.href}
      style={{ background: card.bg }}
      onClick={(e) => goLink(e, card)}
    >
      {card.brand ? <span className="eq-cmkt-promo__brand">{card.brand}</span> : null}
      <h3 className="eq-cmkt-promo__title">{card.title}</h3>
      {card.subtitle ? <p className="eq-cmkt-promo__sub">{card.subtitle}</p> : null}
      {card.cta ? <span className="eq-cmkt-promo__cta">{card.cta}</span> : null}
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="eq-cmkt-promo__img"
          src={publicAssetUrl(card.image)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </a>
  );
}

function OztiMarkaTile({ tile }: { tile: CafemarktBentoTile }) {
  return (
    <a
      className="eq-cmkt-bento__tile eq-cmkt-bento__tile--sm eq-cmkt-bento__tile--ozti-marka"
      href={tile.href}
      style={{ background: tile.bg }}
      onClick={(e) => goLink(e, tile)}
    >
      <p className="eq-cmkt-bento__footnote">
        {tile.footnote ?? "Projeni/ listeni gönder fiyatlandıralım."}
      </p>
      <p className="eq-cmkt-bento__tagline eq-cmkt-bento__tagline--stack">
        <span className="eq-cmkt-bento__tagline-line1">Sadece sana özel...</span>
        <span className="eq-cmkt-bento__tagline-line2">Hayal et.</span>
      </p>
    </a>
  );
}

function BentoTile({ tile }: { tile: CafemarktBentoTile }) {
  if (tile.id === "ozti-marka") {
    return <OztiMarkaTile tile={tile} />;
  }

  return (
    <a
      className={`eq-cmkt-bento__tile eq-cmkt-bento__tile--${tile.variant} eq-cmkt-bento__tile--${tile.id}${tile.textLight ? " eq-cmkt-bento__tile--light" : ""}${tile.imageLayout === "cover" ? " eq-cmkt-bento__tile--photo" : ""}`}
      href={tile.href}
      style={{ background: tile.bg }}
      onClick={(e) => goLink(e, tile)}
    >
      {(tile.brand || tile.title || tile.subtitle || tile.badge) ? (
        <div className="eq-cmkt-bento__copy">
          {tile.brand ? <span className="eq-cmkt-bento__brand">{tile.brand}</span> : null}
          {tile.title ? <h3 className="eq-cmkt-bento__title">{tile.title}</h3> : null}
          {tile.subtitle ? <p className="eq-cmkt-bento__sub">{tile.subtitle}</p> : null}
          {tile.badge ? <span className="eq-cmkt-bento__badge">{tile.badge}</span> : null}
        </div>
      ) : null}
      {tile.tagline ? <p className="eq-cmkt-bento__tagline">{tile.tagline}</p> : null}
      {tile.showcase?.length ? (
        <div className="eq-cmkt-bento__showcase" aria-hidden="true">
          {tile.showcase.map((item) => (
            <figure key={item.tag} className="eq-cmkt-bento__showcase-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicAssetUrl(item.image)} alt="" loading="lazy" decoding="async" />
              <figcaption>{item.tag}</figcaption>
            </figure>
          ))}
        </div>
      ) : tile.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={`eq-cmkt-bento__img${tile.imageAnchor === "top-right" ? " eq-cmkt-bento__img--top-right" : ""}${tile.imageLayout === "cover" ? " eq-cmkt-bento__img--cover" : ""}`}
          src={publicAssetUrl(tile.image)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
    </a>
  );
}

export function HomeCafemarktBlock() {
  return (
    <section className="eq-cmkt" aria-label="Equsto vitrin">
      <div className="eq-cmkt-inner">
        <div className="eq-cmkt-hero-grid">
          {isSplitPromo(cafemarktHeroMain) ? (
            <SplitPromoCard card={cafemarktHeroMain} className="eq-cmkt-promo--main" />
          ) : (
            <PromoCard card={cafemarktHeroMain} className="eq-cmkt-promo--main" />
          )}
          <div className="eq-cmkt-hero-side">
            {cafemarktHeroSide.map((c) => (
              <PromoCard key={c.id} card={c} className="eq-cmkt-promo--compact" />
            ))}
          </div>
        </div>

        <HomeCafemarktCategoriesSlider categories={cafemarktCategories} />

        <div className="eq-cmkt-bento" aria-label="Öne çıkan fırsatlar">
          {cafemarktBentoTiles.map((tile) => (
            <BentoTile key={tile.id} tile={tile} />
          ))}
        </div>
      </div>
    </section>
  );
}
