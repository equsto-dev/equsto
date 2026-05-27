import Link from "next/link";
import MainLayout from "@/components/layout/main-layout";
import { heroPillars } from "@/lib/home-content";
import { loadShowroomProducts } from "@/lib/showroom-sample";
import styles from "./page.module.css";

export const metadata = {
  title: "Equsto Showroom — Yeni ana sayfa iskeleti",
  description: "Showroom modeli: hero üçlü + vitrin grid",
};

export default function ShowroomPage() {
  const products = loadShowroomProducts(12);

  return (
    <MainLayout>
      <section className={styles.hero}>
        <div className={styles.heroIntro}>
          <div className={styles.heroEyebrow}>
            EQUSTO ENDÜSTRIYEL MUTFAK & GASTRONOMI PLATFORMU
          </div>
          <h1 className={styles.heroTitle}>DÜNYADA BİR İLK</h1>
          <p className={styles.heroNote}>
            Bu sayfa <code>files.zip</code> iskeletidir. Canlı vitrin:{" "}
            <Link href="/">index.html ana sayfa</Link> · PLP:{" "}
            <Link href="/shop/pisirme">Pişirme</Link>
          </p>
        </div>

        <div className={styles.cards}>
          {heroPillars.map((pillar) => {
            const inner = (
              <>
                {pillar.soon ? <div className={styles.badge}>PEK YAKINDA</div> : null}
                <div
                  className={styles.cardImage}
                  style={
                    pillar.image
                      ? {
                          backgroundImage: `url(${pillar.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <div className={styles.cardBody}>
                  <div className={styles.cardEyebrow}>{pillar.tag}</div>
                  <h2 className={styles.cardTitle}>{pillar.title}</h2>
                  <p className={styles.cardDesc}>{pillar.pitch}</p>
                  {pillar.cta ? <div className={styles.cardCta}>{pillar.cta}</div> : null}
                </div>
              </>
            );
            return pillar.href ? (
              <Link key={pillar.id} href={pillar.href} className={styles.card}>
                {inner}
              </Link>
            ) : (
              <article key={pillar.id} className={styles.card}>
                {inner}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.showroom}>
        <h2 className={styles.sectionTitle}>Vitrin</h2>
        <div className={styles.productGrid}>
          {products.length
            ? products.map((p, i) => (
                <Link key={p.sku + i} href={p.href} className={styles.productCard}>
                  <div
                    className={styles.productImage}
                    style={{
                      backgroundImage: p.image ? `url(${p.image})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className={styles.productBody}>
                    <div className={styles.productName}>{p.name}</div>
                    <div className={styles.productMeta}>
                      {p.brand} · {p.sku}
                    </div>
                    <div className={styles.productPrice}>{p.price || "Teklif için iletişim"}</div>
                  </div>
                </Link>
              ))
            : Array.from({ length: 12 }).map((_, i) => (
                <article key={i} className={styles.productCard}>
                  <div className={styles.productImage} />
                  <div className={styles.productBody}>
                    <div className={styles.productName}>Ürün Adı {i + 1}</div>
                    <div className={styles.productMeta}>Marka · SKU</div>
                    <div className={styles.productPrice}>—</div>
                  </div>
                </article>
              ))}
        </div>
      </section>
    </MainLayout>
  );
}
