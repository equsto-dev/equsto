import type { Metadata } from "next";
import BesosUrbanBarSectionPage, {
  besosUrbanBarMetadata,
} from "@/components/besos/urbanbar/BesosUrbanBarSectionPage";

export const metadata: Metadata = besosUrbanBarMetadata("bardaklar", "en");

export default function EnBesosBardaklarPage() {
  return <BesosUrbanBarSectionPage section="bardaklar" locale="en" />;
}
