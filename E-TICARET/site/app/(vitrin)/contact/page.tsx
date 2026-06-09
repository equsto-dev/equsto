import { redirect } from "next/navigation";

/** Geriye dönük: /contact → /iletisim */
export default function ContactRedirectPage() {
  redirect("/iletisim");
}
