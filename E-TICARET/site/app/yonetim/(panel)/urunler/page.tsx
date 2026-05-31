import { redirect } from "next/navigation";

export default function YonetimUrunlerRedirectPage() {
  redirect("/yonetim/eticaret?tab=urunler");
}
