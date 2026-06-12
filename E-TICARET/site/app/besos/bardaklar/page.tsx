import type { Metadata } from "next";
import BesosUrbanBarSectionPage, {
  besosUrbanBarMetadata,
} from "@/components/besos/urbanbar/BesosUrbanBarSectionPage";

export const metadata: Metadata = besosUrbanBarMetadata("bardaklar", "tr");

export default function BesosBardaklarPage() {
  return <BesosUrbanBarSectionPage section="bardaklar" locale="tr" />;
}
