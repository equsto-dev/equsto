import type { Metadata } from "next";
import { ShopHubPage, buildShopHubMetadata } from "@/components/shop/ShopHubPage";

export const metadata: Metadata = buildShopHubMetadata("tr");

export default function ShopHubTrPage() {
  return <ShopHubPage lang="tr" />;
}
