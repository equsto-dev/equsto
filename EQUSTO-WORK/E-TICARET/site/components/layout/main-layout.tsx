import { ReactNode } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import Footer from "./footer";
import styles from "./main-layout.module.css";

/**
 * MainLayout — Equsto ana shell
 *
 * Grid:
 *  ┌─────────────────────────────────────────────────┐
 *  │                  HEADER                          │
 *  ├──────────┬──────────────────────────────────────┤
 *  │          │                                       │
 *  │ SIDEBAR  │            MAIN CONTENT               │
 *  │          │                                       │
 *  ├──────────┴──────────────────────────────────────┤
 *  │                  FOOTER                          │
 *  └─────────────────────────────────────────────────┘
 *
 * İskelet aşamasıdır — siyah/beyaz/gri, kenar çizgileri.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>{children}</main>
      </div>
      <Footer />
    </div>
  );
}
