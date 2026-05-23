"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./instant-search.module.css";

type SearchHit = {
  id?: string;
  name?: string;
  brand?: string;
  sku?: string;
  model?: string;
  dept?: string;
  category?: string;
  image?: string;
  url?: string;
};

function hitLabel(h: SearchHit) {
  return h.name || h.id || "Ürün";
}

function hitMeta(h: SearchHit) {
  const parts = [h.brand, h.sku || h.model].filter(Boolean);
  return parts.join(" · ");
}

export default function InstantSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setWarning("");
      return;
    }
    const ac = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`, {
        signal: ac.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          setResults(Array.isArray(data.hits) ? data.hits : []);
          setWarning(typeof data.warning === "string" ? data.warning : "");
        })
        .catch(() => {
          setResults([]);
          setWarning("Arama geçici olarak kullanılamıyor.");
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.inputWrap}>
        <input
          type="search"
          className={styles.input}
          placeholder="Ürün adı, marka veya SKU ara — örn. 'ızg', 'combi', 'OZT'"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        <span className={styles.icon} aria-hidden>
          🔍
        </span>
      </div>

      {showDropdown && (
        <div className={styles.dropdown}>
          {loading ? (
            <div className={styles.empty}>Aranıyor…</div>
          ) : results.length === 0 ? (
            <div className={styles.empty}>Sonuç bulunamadı</div>
          ) : (
            <>
              <ul className={styles.results}>
                {results.map((r) => {
                  const href = r.url || `/shop/${r.dept || "pisirme"}`;
                  const rawImg = String(r.image || "").replace(/\\/g, "/");
                  const img = rawImg
                    ? rawImg.startsWith("/")
                      ? rawImg
                      : rawImg.startsWith("images/")
                        ? `/${rawImg}`
                        : `/images/${rawImg}`
                    : "";
                  return (
                    <li key={r.id || r.sku || hitLabel(r)} className={styles.resultItem}>
                      <Link href={href} className={styles.resultLink} onClick={() => setOpen(false)}>
                        <div className={styles.thumb} aria-hidden>
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" loading="lazy" />
                          ) : null}
                        </div>
                        <div className={styles.resultText}>
                          <div className={styles.resultName}>{hitLabel(r)}</div>
                          <div className={styles.resultMeta}>{hitMeta(r)}</div>
                        </div>
                        <div className={styles.resultCat}>{r.dept || r.category || ""}</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/arama?q=${encodeURIComponent(query)}`}
                className={styles.viewAll}
                onClick={() => setOpen(false)}
              >
                Tüm sonuçları gör →
              </Link>
            </>
          )}
          {warning ? <div className={styles.warn}>{warning}</div> : null}
        </div>
      )}
    </div>
  );
}
