import { StoreShell } from "@/components/store-shell";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreShell>{children}</StoreShell>;
}
