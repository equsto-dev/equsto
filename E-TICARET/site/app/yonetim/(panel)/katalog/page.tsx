import { redirect } from "next/navigation";

export default function YonetimKatalogRedirectPage() {
  redirect("/yonetim/eticaret?tab=katalog");
}
