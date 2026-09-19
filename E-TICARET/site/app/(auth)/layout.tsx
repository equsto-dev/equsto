import AuthVitrinChrome from "@/components/auth/AuthVitrinChrome";
import ShopCoreScripts from "@/components/shop/ShopCoreScripts";

/** Üye girişi — vitrin üst bant + drawer + ortak JS */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthVitrinChrome />
      {children}
      <ShopCoreScripts />
    </>
  );
}
