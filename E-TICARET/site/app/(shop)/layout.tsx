import ShopCoreScripts from "@/components/shop/ShopCoreScripts";
import ShopDrawerShell from "@/components/shop/ShopDrawerShell";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ShopDrawerShell />
      <ShopCoreScripts />
    </>
  );
}
