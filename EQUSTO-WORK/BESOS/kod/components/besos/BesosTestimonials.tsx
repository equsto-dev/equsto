import type { BesosTestimonial } from "@/lib/besos/types";

type Props = {
  items: BesosTestimonial[];
};

export default function BesosTestimonials({ items }: Props) {
  if (!items.length) return null;

  return (
    <section className="bd-vl-quote" aria-label="Referanslar">
      <div className="bd-vl-quote-grid">
        {items.map((t) => (
          <blockquote key={t.author} className="bd-vl-quote-card">
            <p>“{t.quote}”</p>
            <footer>
              <strong>{t.author}</strong>
              {t.roleTr ? ` · ${t.roleTr}` : ""}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
