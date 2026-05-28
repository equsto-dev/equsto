"use client";

import { useEffect } from "react";

type Props = { slug: string };

export default function MarkaPlpBoot({ slug }: Props) {
  useEffect(() => {
    document.body.classList.add("eq-marka-plp");

    const EQ_CAT_LABELS: Record<string, string> = {
      "sanayi-ocaklari": "Endüstriyel Ocaklar",
      "sanayi-tipi-izgaralar": "Endüstriyel Izgaralar",
      kuzineler: "Kuzineler",
      fritozler: "Fritözler",
      "doner-ocaklari-": "Döner Ocakları",
      "tost-makineleri": "Tost Makineleri",
      "pilic-cevirme-makineleri": "Piliç Çevirme",
      "ocakbasi-izgara": "Ocakbaşı Izgaralar",
      "sogutma-ekipmanlari": "Soğutma Ekipmanları",
      "kahve-makineleri": "Kahve Makineleri",
      "bulasik-makineleri": "Bulaşık Makineleri",
      "hamur-hazirlik-makineleri": "Hamur Hazırlık",
      "et-hazirlik-makineleri": "Et Hazırlık",
      "cay-kazanlari-cay-makineleri-cay-otomatlari": "Çay & Otomatlar",
      "yiyecek-ve-icecek-otomatlari-": "Yiyecek & İçecek Otomatları",
    };

    function eqCatLabel(s: string) {
      return EQ_CAT_LABELS[s] || String(s || "").replace(/-+$/, "").replace(/-/g, " ");
    }

    const brand =
      (typeof window.eqBrandFromSlug === "function" ? window.eqBrandFromSlug(slug) : "") ||
      slug.replace(/-/g, " ");
    const displayName = brand || slug.replace(/-/g, " ");

    const crumb = document.getElementById("eq-brand-crumb");
    if (crumb) crumb.textContent = displayName;
    document.title = displayName + " · Equsto";

    const loadAll =
      window.EqustoShopCatalog && typeof window.EqustoShopCatalog.loadMergedCatalog === "function"
        ? window.EqustoShopCatalog.loadMergedCatalog()
        : window.EqustoShopCatalog?.load?.();

    if (!loadAll || !window.EqCategoryShell) return;

    loadAll.then(function (all: unknown[]) {
      const nameMatch = function (x: { brand?: string; marka?: string; name?: string }) {
        if (!x) return false;
        if (typeof window.eqBrandMatchesRow === "function") {
          return window.eqBrandMatchesRow(x, brand || slug);
        }
        const n = String(x.brand || x.marka || x.name || "").toLowerCase();
        return n.includes(String(brand).toLowerCase());
      };

      const rows = (all || []).filter((x): x is { brand?: string; marka?: string; name?: string; cat?: string; category?: string } =>
        nameMatch(x as { brand?: string; marka?: string; name?: string })
      );
      const catCounts: Record<string, number> = {};
      rows.forEach(function (r) {
        const c = String(r.cat || r.category || "").trim();
        if (c) catCounts[c] = (catCounts[c] || 0) + 1;
      });
      const cats = Object.keys(catCounts).sort(function (a, b) {
        return catCounts[b] - catCounts[a];
      });

      const subLabels: Record<string, string> = {};
      cats.forEach(function (c) {
        subLabels[c] = eqCatLabel(c);
      });

      const tiles = cats.map(function (c) {
        return { id: c, label: eqCatLabel(c), slug: c };
      });

      const shell = window.EqCategoryShell;
      if (!shell) return;

      shell.mount({
        root: document.getElementById("eq-cat-shell"),
        catLabel: displayName,
        catDesc: displayName + " markalı tüm ürünler — kategoriye göre incele.",
        catSlugs: cats,
        subLabels,
        tiles,
        tilesHdr: "Kategoriye göre incele",
        hideBrandStrip: true,
        productPredicate: nameMatch,
      });
    });
  }, [slug]);

  return null;
}
