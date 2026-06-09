import Link from "next/link";
import styles from "./pfos-public.module.css";

export default function PfosPublicChrome() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        EQUSTO<span>Proje Fabrikası</span>
      </Link>
      <Link href="/iletisim" className={styles.headerLink}>
        İletişim
      </Link>
    </header>
  );
}
