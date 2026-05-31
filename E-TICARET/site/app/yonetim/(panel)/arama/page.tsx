import { redirect } from "next/navigation";

export default function YonetimAramaRedirectPage() {
  redirect("/yonetim/eticaret?tab=arama");
}
