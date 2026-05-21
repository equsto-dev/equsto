import { StoreShell } from "@/components/store-shell";
import { formatTcmbKurShort, getTcmbEurForPricing } from "@/lib/tcmb-kur";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const kur = await getTcmbEurForPricing();
  const kurNote = formatTcmbKurShort(kur);
  return (
    <StoreShell kurNote={kurNote}>
      {children}
    </StoreShell>
  );
}
