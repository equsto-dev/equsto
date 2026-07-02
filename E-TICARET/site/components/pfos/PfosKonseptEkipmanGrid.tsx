"use client";

import { useEffect, useState } from "react";
import type { YardimciKatalogKart } from "@/app/api/pfos/yardimci-katalog/route";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "@/components/pfos/public/pfos-public.module.css";

type Props = {
  dukkanTuru: string;
  ustSegment?: string;
  /** Seçilen konsept adı (ör. Steakhouse) — rail başlığı */
  konseptLabel?: string;
  /** Teklifte zaten olan urunTipi / tip_kodu */
  mevcutTipKodlari?: string[];
  /** Eşleşmemiş zorunlu kalemlerin urunTipi listesi */
  eksikZorunluTipKodlari?: string[];
  m2?: number;
  /** grid: kart vitrini; rows: ürün sayfası family-rail düzeni */
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

function isMatchedKart(kart: YardimciKatalogKart): boolean {
  return Boolean(kart.ad && kart.href);
}

/** PDP family-rail ile aynı kısa etiket */
function shortModelLabel(name: string, max = 56): string {
  const s = name.trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  if (sp > max * 0.55) return `${cut.slice(0, sp)}…`;
  return `${cut}…`;
}

export default function PfosKonseptEkipmanGrid({
  dukkanTuru,
  ustSegment = "",
  konseptLabel = "",
  mevcutTipKodlari = [],
  eksikZorunluTipKodlari = [],
  m2,
  layout = "grid",
  limit,
  hideHeader = false,
}: Props) {
  const { t } = usePfosLabel();
  const [items, setItems] = useState<YardimciKatalogKart[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rowLimit = limit ?? 5;
  const tipsKey = mevcutTipKodlari.join("|");
  const eksikKey = eksikZorunluTipKodlari.join("|");
  const showGridHeader = !hideHeader && layout !== "rows";

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams();
    if (dukkanTuru) q.set("dukkan", dukkanTuru);
    if (ustSegment) q.set("segment", ustSegment);
    if (konseptLabel) q.set("konseptLabel", konseptLabel);
    if (mevcutTipKodlari.length) q.set("tips", mevcutTipKodlari.join(","));
    if (eksikZorunluTipKodlari.length) q.set("eksik", eksikZorunluTipKodlari.join(","));
    if (m2 != null && m2 > 0) q.set("m2", String(Math.round(m2)));
    if (layout === "rows") {
      q.set("matched", "1");
      q.set("limit", String(rowLimit));
    }
    setItems(null);
    setError(null);
    void fetch(`/api/pfos/yardimci-katalog?${q}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Katalog yüklenemedi");
        return res.json() as Promise<{ items: YardimciKatalogKart[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          const raw = data.items ?? [];
          setItems(
            layout === "rows"
              ? raw.filter(isMatchedKart).slice(0, rowLimit)
              : raw,
          );
        }
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
  }, [dukkanTuru, ustSegment, konseptLabel, tipsKey, eksikKey, m2, layout, rowLimit]);

  const visibleItems =
    items == null
      ? null
      : layout === "rows"
        ? items
        : limit != null
          ? items.slice(0, limit)
          : items;

  function renderRailThumb(kart: YardimciKatalogKart) {
    if (kart.gorselUrl) {
      return (
        <img src={kart.gorselUrl} alt="" loading="lazy" decoding="async" />
      );
    }
    return <span className="eq-img-ph" aria-hidden="true" />;
  }

  function renderRailItem(kart: YardimciKatalogKart) {
    const href = kart.href!;
    const title = shortModelLabel(kart.ad!);

    return (
      <div key={kart.id ?? kart.label} className="eq-product-family-item" role="listitem">
        <a href={href}>
          <div className="eq-product-family-thumb">{renderRailThumb(kart)}</div>
          <div className="eq-product-family-lbl">{title}</div>
        </a>
      </div>
    );
  }

  function renderRail(items: YardimciKatalogKart[]) {
    const lineTitle = konseptLabel.trim() || t("Konsept");
    return (
      <div className="eq-product-family" aria-label={lineTitle}>
        <div className="eq-product-family-row">
          <div className="eq-product-family-lineblock">
            <div className="eq-product-family-line">{lineTitle}</div>
            <div className="eq-product-family-hint">{t("Öneriler")}</div>
          </div>
          <div className="eq-product-family-scroll" role="list">
            {items.map((kart) => renderRailItem(kart))}
          </div>
        </div>
      </div>
    );
  }

  if (layout === "rows" && items && items.length === 0 && !error) {
    return null;
  }

  return (
    <section
      className={
        layout === "rows"
          ? styles.konseptEkipmanRailWrap
          : styles.konseptEkipmanPanel
      }
      aria-label={t("Konsept ekipman önerileri")}
    >
      {showGridHeader ? (
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
        renderRail(visibleItems)
      ) : (
        <div className={`products ${styles.konseptEkipmanGrid}`}>
          {visibleItems.map((kart) => {
            const price = formatFiyat(kart);
            const href = kart.href ?? "#";
            const hasProduct = isMatchedKart(kart);
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
                        <span className="eq-img-ph" aria-hidden="true" />
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
