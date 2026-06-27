"use client";

import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import type { LiveSummaryData } from "./pfos-workspace.types";
import ws from "./pfos-workspace.module.css";

type Props = {
  data: LiveSummaryData;
};

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCompactTry(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2).replace(".", ",")} M ₺`;
  }
  return formatTry(n);
}

export default function PfosLiveSummary({ data }: Props) {
  const { t } = usePfosLabel();
  const eslesmePct =
    data.toplamZorunlu > 0
      ? Math.round((data.eslesen / data.toplamZorunlu) * 100)
      : null;

  return (
    <aside className={ws.liveSummary} aria-label={t("Canlı özet")}>
      <header className={ws.summaryHeader}>
        <span className={ws.summaryKicker}>{t("Proje")}</span>
        <h2 className={ws.summaryTitle}>{data.projeAdi}</h2>
      </header>

      <dl className={ws.summaryStats}>
        <div className={ws.summaryRow}>
          <dt>{t("Ürün")}</dt>
          <dd>{data.urunSayisi}</dd>
        </div>
        <div className={ws.summaryRow}>
          <dt>{t("Marka")}</dt>
          <dd>{data.markaSayisi}</dd>
        </div>
        <div className={ws.summaryRow}>
          <dt>{t("Kategori")}</dt>
          <dd>{data.kategoriSayisi}</dd>
        </div>
      </dl>

      {data.tahminiFiyat != null && data.tahminiFiyat > 0 ? (
        <div className={ws.summaryPrice}>
          <span className={ws.summaryPriceLabel}>{t("Tahmini")}</span>
          <strong className={ws.summaryPriceValue}>
            {formatCompactTry(data.tahminiFiyat)}
          </strong>
          <small>{t("KDV hariç")}</small>
        </div>
      ) : data.wizardPct != null ? (
        <div className={ws.summaryProgress}>
          <span className={ws.summaryPriceLabel}>{t("İlerleme")}</span>
          <div className={ws.summaryProgressTrack}>
            <div
              className={ws.summaryProgressFill}
              style={{ width: `${data.wizardPct}%` }}
            />
          </div>
          <small>{data.wizardPct}%</small>
        </div>
      ) : null}

      <div className={ws.summaryMatch}>
        <div className={ws.summaryMatchRow}>
          <span className={ws.summaryOk}>✔ {data.eslesen}</span>
          <span>{t("eşleşti")}</span>
        </div>
        {data.bekleyen > 0 ? (
          <div className={ws.summaryMatchRow}>
            <span className={ws.summaryWarn}>⚠ {data.bekleyen}</span>
            <span>{t("bekliyor")}</span>
          </div>
        ) : null}
        {eslesmePct != null && data.toplamZorunlu > 0 ? (
          <p className={ws.summaryPct}>%{eslesmePct} {t("eşleşme")}</p>
        ) : null}
      </div>
    </aside>
  );
}
