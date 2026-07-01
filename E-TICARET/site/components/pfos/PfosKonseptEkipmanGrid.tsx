"use client";

import { useEffect, useState } from "react";
import type { YardimciKatalogKart } from "@/app/api/pfos/yardimci-katalog/route";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "@/components/pfos/public/pfos-public.module.css";

type Props = {
  dukkanTuru: string;
  ustSegment?: string;
  /** grid: kart vitrini; rows: kompakt satır listesi */
  layout?: "grid" | "rows";
  /** rows modunda gösterilecek üst sınır (varsayılan 5) */
  limit?: number;
  /** Başlık ve açıklama metnini gizle */
  hideHeader?: boolean;
};

function formatFiyat(kart: YardimciKatalogKart): string {
  if (kart.fiyat == null || kart.fiyat <= 0) return "";
  const cur = kart.doviz === "EUR" ? "€" : kart.doviz === "USD" ? "$" : "₺";
  if (kart.doviz === "TRY") {
    return `${kart.fiyat.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ${cur} + KDV`;
  }
  return `${kart.fiyat.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
}

export default function PfosKonseptEkipmanGrid({
  dukkanTuru,
  ustSegment = "",
  layout = "grid",
  limit,
  hideHeader = false,
}: Props) {
  const { t } = usePfosLabel();
  const [items, setItems] = useState<YardimciKatalogKart[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams();
    if (dukkanTuru) q.set("dukkan", dukkanTuru);
    if (ustSegment) q.set("segment", ustSegment);
    setItems(null);
    setError(null);
    void fetch(`/api/pfos/yardimci-katalog?${q}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Katalog yüklenemedi");
        return res.json() as Promise<{ items: YardimciKatalogKart[] }>;
      })
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Hata");
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dukkanTuru, ustSegment]);

  const visibleItems =
    items == null
      ? null
      : layout === "rows"
        ? items.slice(0, limit ?? 5)
        : limit != null
          ? items.slice(0, limit)
          : items;

  function renderRow(kart: YardimciKatalogKart) {
    const price = formatFiyat(kart);
    const href = kart.href ?? "#";
    const hasProduct = Boolean(kart.ad && kart.href);
    const title = hasProduct ? kart.ad! : kart.label;

    return (
      <article key={kart.label} className={styles.konseptEkipmanRow}>
        {hasProduct ? (
          <a className={styles.konseptEkipmanRowImg} href={href}>
            {kart.gorselUrl ? (
              <img src={kart.gorselUrl} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className={styles.konseptEkipmanNoImg}>📷</span>
            )}
          </a>
        ) : (
          <div className={`${styles.konseptEkipmanRowImg} ${styles.konseptEkipmanPlaceholder}`}>
            <span>{kart.label}</span>
          </div>
        )}
        <div className={styles.konseptEkipmanRowBody}>
          {hasProduct ? (
            <a className={styles.konseptEkipmanRowName} href={href}>
              {title}
            </a>
          ) : (
            <div className={styles.konseptEkipmanRowName}>{title}</div>
          )}
          {kart.marka ? (
            <div className={styles.konseptEkipmanRowBrand}>{kart.marka}</div>
          ) : null}
          {!hasProduct ? (
            <div className={styles.konseptEkipmanRowNote}>
              {t("Katalog eşlemesi hazırlanıyor")}
            </div>
          ) : null}
        </div>
        {price ? <div className={styles.konseptEkipmanRowPrice}>{price}</div> : null}
      </article>
    );
  }

  return (
    <section
      className={`${styles.konseptEkipmanPanel}${layout === "rows" ? ` ${styles.konseptEkipmanPanelRows}` : ""}`}
      aria-label={t("Konsept ekipman önerileri")}
    >
      {!hideHeader ? (
        <>
          <h3 className={styles.konseptEkipmanTitle}>
            {t("Konseptinize uygun yardımcı ekipmanlar")}
          </h3>
          <p className={styles.konseptEkipmanLead}>
            {t(
              "Aşağıdaki ürünler vitrin fiyatlarıyla gösterilir — sepete ekleyebilir veya ürün sayfasından inceleyebilirsiniz.",
            )}
          </p>
        </>
      ) : null}
      {error ? <p className={styles.konseptEkipmanErr}>{error}</p> : null}
      {!visibleItems ? (
        <p className={styles.konseptEkipmanLoading}>{t("Ürünler yükleniyor…")}</p>
      ) : layout === "rows" ? (
        <div className={styles.konseptEkipmanRowList}>
          {visibleItems.map((kart) => renderRow(kart))}
        </div>
      ) : (
        <div className={`products ${styles.konseptEkipmanGrid}`}>
          {visibleItems.map((kart) => {
            const price = formatFiyat(kart);
            const href = kart.href ?? "#";
            const hasProduct = Boolean(kart.ad && kart.href);
            return (
              <article key={kart.label} className="eq-dept-plp-card">
                {hasProduct ? (
                  <>
                    <a className="eq-dept-plp-card__img" href={href}>
                      {kart.gorselUrl ? (
                        <img
                          src={kart.gorselUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className={styles.konseptEkipmanNoImg}>📷</span>
                      )}
                    </a>
                    <a className="eq-dept-plp-card__name" href={href}>
                      {kart.ad}
                    </a>
                    {kart.marka ? (
                      <div className="eq-dept-plp-card__brand">{kart.marka}</div>
                    ) : null}
                    {price ? (
                      <div className="eq-dept-plp-card__price">{price}</div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className={`eq-dept-plp-card__img ${styles.konseptEkipmanPlaceholder}`}>
                      <span>{kart.label}</span>
                    </div>
                    <div className="eq-dept-plp-card__name">{kart.label}</div>
                    <div className="eq-dept-plp-card__price-note">
                      {t("Katalog eşlemesi hazırlanıyor")}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
