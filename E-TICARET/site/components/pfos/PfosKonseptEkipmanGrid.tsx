"use client";

import { useEffect, useState } from "react";
import type { YardimciKatalogKart } from "@/app/api/pfos/yardimci-katalog/route";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "@/components/pfos/public/pfos-public.module.css";

type Props = {
  dukkanTuru: string;
  ustSegment?: string;
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

  return (
    <section
      className={styles.konseptEkipmanPanel}
      aria-label={t("Konsept ekipman önerileri")}
    >
      <h3 className={styles.konseptEkipmanTitle}>
        {t("Konseptinize uygun yardımcı ekipmanlar")}
      </h3>
      <p className={styles.konseptEkipmanLead}>
        {t(
          "Aşağıdaki ürünler vitrin fiyatlarıyla gösterilir — sepete ekleyebilir veya ürün sayfasından inceleyebilirsiniz.",
        )}
      </p>
      {error ? <p className={styles.konseptEkipmanErr}>{error}</p> : null}
      {!items ? (
        <p className={styles.konseptEkipmanLoading}>{t("Ürünler yükleniyor…")}</p>
      ) : (
        <div className={`products ${styles.konseptEkipmanGrid}`}>
          {items.map((kart) => {
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
