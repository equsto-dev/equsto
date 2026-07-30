import type { Metadata } from "next";
import Link from "next/link";
import OdemeSonucCartClear from "@/components/shop/OdemeSonucCartClear";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopStyles from "@/components/shop/ShopStyles";

export const metadata: Metadata = {
  title: "Ödeme sonucu · Equsto",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return String(v[0] || "");
  return String(v || "");
}

export default async function OdemeSonucPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ok = one(sp.ok) === "1";
  const no = one(sp.no);
  const msg = one(sp.msg);

  return (
    <>
      <ShopStyles variant="cart" />
      <ShopBodyClass className="eq-shop eq-cart-page" />
      <ShopEqustoChrome activeDept={null} />
      <OdemeSonucCartClear ok={ok} />
      <main className="pg eq-cart-page" style={{ padding: "2.5rem 1.25rem" }}>
        <div className="pg-inner" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            {ok ? "Provizyon alındı" : "Ödeme tamamlanamadı"}
          </h1>
          <p style={{ lineHeight: 1.55, color: "var(--muted, #555)" }}>
            {ok
              ? "Kartınızda geçici bloke oluştu. Equsto siparişi kontrol edip onayladığında tutar tahsil edilir; iptalde bloke aynı gün kalkar."
              : msg || "İşlem başarısız veya iptal edildi. Sepetten yeniden deneyebilirsiniz."}
          </p>
          {no ? (
            <p style={{ marginTop: "1rem" }}>
              Sipariş no: <strong>{no}</strong>
            </p>
          ) : null}
          <p style={{ marginTop: "1.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/sepet" className="eq-cart-page__btn eq-cart-page__btn--outline">
              Sepete dön
            </Link>
            <Link href="/" className="eq-cart-page__btn eq-cart-page__btn--primary">
              Anasayfa
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
