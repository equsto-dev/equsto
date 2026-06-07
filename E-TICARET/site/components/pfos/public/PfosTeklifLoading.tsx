type Props = {
  label: string;
};

/** Teklif hesaplanıyor — üç çizgi (global CSS: eq-pfos-wizard.css) */
export default function PfosTeklifLoading({ label }: Props) {
  return (
    <div
      className="pfos-teklif-loading pfos-teklif-loading--card"
      role="status"
      aria-live="polite"
    >
      <div className="pfos-teklif-loading__graphic" aria-hidden="true">
        <span className="pfos-teklif-loading__bar" />
        <span className="pfos-teklif-loading__bar pfos-teklif-loading__bar--mid" />
        <span className="pfos-teklif-loading__bar pfos-teklif-loading__bar--short" />
      </div>
      <span className="pfos-teklif-loading__label">{label}</span>
    </div>
  );
}
