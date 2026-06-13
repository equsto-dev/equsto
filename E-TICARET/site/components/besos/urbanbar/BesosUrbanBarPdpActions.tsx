"use client";

type Props = {
  title: string;
  url: string;
  locale?: "tr" | "en";
};

export default function BesosUrbanBarPdpActions({ title, url, locale = "tr" }: Props) {
  const shareLabel = locale === "en" ? "Share on" : "Paylaş";
  const wishLabel = locale === "en" ? "Add to Wishlist" : "İstek listesine ekle";

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* kullanıcı iptal */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* yoksay */
    }
  }

  return (
    <div className="ub-pdp-actions">
      <button type="button" className="ub-pdp-actions__btn" onClick={share}>
        <span className="ub-pdp-actions__icon" aria-hidden="true">
          ↗
        </span>
        {shareLabel}
      </button>
      <button type="button" className="ub-pdp-actions__btn ub-pdp-actions__btn--wish" disabled title={locale === "en" ? "Coming soon" : "Yakında"}>
        <span className="ub-pdp-actions__icon" aria-hidden="true">
          ♡
        </span>
        {wishLabel}
      </button>
    </div>
  );
}
