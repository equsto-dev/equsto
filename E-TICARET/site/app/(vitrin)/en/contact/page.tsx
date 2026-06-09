import { redirect } from "next/navigation";

/** Geriye dönük: /en/contact → /en/iletisim */
export default function EnContactRedirectPage() {
  redirect("/en/iletisim");
}
