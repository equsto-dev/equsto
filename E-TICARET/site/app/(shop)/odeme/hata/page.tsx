import type { Metadata } from "next";
import Link from "next/link";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopStyles from "@/components/shop/ShopStyles";

export const metadata: Metadata = {
  title: "Ödeme tamamlanamadı · Equsto",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] || "");
  return String(v || "");
}

export default async function OdemeHataPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orderRef = one(sp.orderRef) || one(sp.ref) || one(sp.no);

  return (
    <>
      <ShopStyles variant="cart" />
      <ShopBodyClass className="eq-shop eq-cart-page" />
      <ShopEqustoChrome activeDept={null} />
      <main className="pg eq-cart-page" style={{ padding: "2.5rem 1.25rem" }}>
        <div className="pg-inner" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Ödeme tamamlanamadı
          </h1>
          <p style={{ lineHeight: 1.55, color: "var(--muted, #555)" }}>
            İşlem başarısız, iptal edildi veya süresi doldu. Sepetiniz duruyor; tekrar
            deneyebilir veya WhatsApp / sipariş talebi ile devam edebilirsiniz.
          </p>
          {orderRef ? (
            <p style={{ marginTop: "1rem" }}>
              Sipariş ref: <strong>{orderRef}</strong>
            </p>
          ) : null}
          <p style={{ marginTop: "1.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/sepet" className="eq-cart-page__btn eq-cart-page__btn--primary">
              Sepete dön
            </Link>
            <Link href="/" className="eq-cart-page__btn eq-cart-page__btn--outline">
              Anasayfa
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
