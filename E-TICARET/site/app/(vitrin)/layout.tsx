import ShopCoreScripts from "@/components/shop/ShopCoreScripts";
import ShopDrawerShell from "@/components/shop/ShopDrawerShell";

/** Vitrin içerik sayfaları — drawer + ortak JS */
export default function VitrinLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ShopDrawerShell />
      <ShopCoreScripts />
    </>
  );
}
