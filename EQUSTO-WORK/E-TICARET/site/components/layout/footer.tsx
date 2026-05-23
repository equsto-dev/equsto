import styles from "./footer.module.css";

/**
 * Footer — minimal link gruplar + iletişim
 * İskelet aşamasıdır.
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.colTitle}>EQUSTO</div>
          <ul className={styles.list}>
            <li>Hakkımızda</li>
            <li>Referans Projeler</li>
            <li>İletişim</li>
          </ul>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Hizmetler</div>
          <ul className={styles.list}>
            <li>Proje Fabrikası</li>
            <li>Yer Sofrası</li>
            <li>Bar Design — Besos</li>
            <li>Equsto Atölyesi</li>
          </ul>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Yardım</div>
          <ul className={styles.list}>
            <li>Sipariş & Teslimat</li>
            <li>İade & Değişim</li>
            <li>Ödeme & Taksit</li>
            <li>Sıkça Sorulanlar</li>
          </ul>
        </div>

        <div className={styles.col}>
          <div className={styles.colTitle}>Rehber</div>
          <ul className={styles.list}>
            <li>Mutfak m² Rehberi</li>
            <li>Steakhouse Kurulum</li>
            <li>Site Haritası</li>
            <li>llms.txt</li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© 2026 Equsto Teknoloji Limited</span>
        <span>info@equsto.com</span>
      </div>
    </footer>
  );
}
