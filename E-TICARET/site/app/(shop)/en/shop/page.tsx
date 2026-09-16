import type { Metadata } from "next";
import { ShopHubPage, buildShopHubMetadata } from "@/components/shop/ShopHubPage";

export const metadata: Metadata = buildShopHubMetadata("en");

export default function ShopHubEnPage() {
  return <ShopHubPage lang="en" />;
}
