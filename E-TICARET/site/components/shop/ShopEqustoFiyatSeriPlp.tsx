import type { EqustoFiyatSeriProduct } from "@/lib/shop/equsto-fiyat-seri";
import { formatConsumerPriceTry } from "@/lib/shop/consumer-price";
import { stripOlcuUnitSuffix } from "@/lib/pfos/teklif/olcu-mm";

function fmtPrice(p: EqustoFiyatSeriProduct): string {
  return formatConsumerPriceTry(p, { quoteLabel: "Teklif için iletişim" });
}

function CardLink({
  href,
  className,
  children,
}: {
  href?: string;
  className: string;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }
  return <div className={className}>{children}</div>;
}

export default function ShopEqustoFiyatSeriPlp({
  title,
  lead,
  deptTitle,
  deptHref,
  products,
  heroImage,
}: {
  title: string;
  lead: string;
  deptTitle: string;
  deptHref: string;
  products: EqustoFiyatSeriProduct[];
  heroImage?: string;
}) {
  const vitrin = products.filter((p) => p.vitrin);
  const pfosOnly = products.length > 0 && vitrin.length === 0;

  return (
    <div className="pg">
      <div className="eq-dept-plp-layout">
        <main className="eq-dept-plp-main" style={{ maxWidth: "100%" }}>
          <nav className="eq-dept-plp-title" style={{ fontSize: 12, fontWeight: 400, marginBottom: 8 }}>
            <a href="/shop">Mağaza</a>
            {" › "}
            <a href="/shop/fiyat-listesi-2026">Fiyat Listesi 2026</a>
            {" › "}
            <a href={deptHref}>{deptTitle}</a>
            {" › "}
            <span>{title}</span>
          </nav>
          <h1 className="eq-dept-plp-title">{title}</h1>
          <p className="eq-dept-plp-lead">{lead}</p>
          {heroImage ? (
            <div style={{ marginBottom: 16, maxWidth: 420 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/${heroImage}`}
                alt={title}
                style={{ width: "100%", background: "#fff", padding: 12, borderRadius: 8 }}
              />
            </div>
          ) : null}
          {pfosOnly ? (
            <p style={{ fontSize: 13, color: "var(--eq-text-muted)", marginBottom: 12 }}>
              Bu seri yalnızca PFOS teklif listesinde — online vitrin ölçüsü yok. Fiyatlar referans
              içindir.
            </p>
          ) : null}
          <div className="eq-dept-plp-count" style={{ marginBottom: 12 }}>
            {products.length} ölçü
            {vitrin.length > 0 ? ` · ${vitrin.length} vitrin` : ""}
          </div>
          <div className="eq-dept-plp-grid" role="list">
            {products.map((p) => (
              <article key={p.id} className="eq-dept-plp-card" role="listitem">
                <CardLink href={p.href} className="eq-dept-plp-card__img">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/${p.image}`} alt={p.name} loading="lazy" />
                  ) : (
                    <span>Görsel yok</span>
                  )}
                </CardLink>
                <CardLink href={p.href} className="eq-dept-plp-card__name">
                  {p.name}
                </CardLink>
                <div className="eq-dept-plp-card__brand">{p.brand}</div>
                <div className="eq-dept-plp-card__code">{p.sku}</div>
                {p.olcu_etiket ? (
                  <div className="eq-dept-plp-card__dims">{stripOlcuUnitSuffix(p.olcu_etiket)}</div>
                ) : null}
                <div className="eq-dept-plp-card__price">{fmtPrice(p)}</div>
                <div className="eq-dept-plp-card__price-note">
                  {p.vitrin ? "KDV dahil · vitrin" : "PFOS liste fiyatı"}
                </div>
                {p.href ? (
                  <a className="eq-dept-plp-card__btn" href={p.href}>
                    ÜRÜNÜ İNCELE
                  </a>
                ) : (
                  <span
                    className="eq-dept-plp-card__btn"
                    style={{ opacity: 0.55, cursor: "default", textAlign: "center" }}
                  >
                    PFOS TEKLİF
                  </span>
                )}
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
