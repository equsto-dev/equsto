import InstantSearch from "@/components/search/instant-search";
import styles from "./header.module.css";

/**
 * Header — logo (sol) + arama (merkez, prominent) + aksiyonlar (sağ)
 * İskelet aşamasıdır.
 */
export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoText}>EQUSTO</span>
      </div>

      <div className={styles.searchSlot}>
        <InstantSearch />
      </div>

      <nav className={styles.actions}>
        <button type="button" className={styles.actionBtn}>
          Hesabım
        </button>
        <button type="button" className={styles.actionBtn}>
          Sepet (0)
        </button>
      </nav>
    </header>
  );
}
