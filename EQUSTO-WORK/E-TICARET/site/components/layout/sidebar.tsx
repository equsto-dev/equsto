"use client";

import { useState } from "react";
import styles from "./sidebar.module.css";

/**
 * Sidebar — sol kategori navigasyonu, sağa açılan flyout sub-kategoriler
 * Hover (desktop) ile sub-kategoriler sağa açılır.
 * İskelet aşamasıdır.
 */

type Category = {
  id: string;
  label: string;
  subs?: string[];
};

const CATEGORIES: Category[] = [
  { id: "pfos", label: "Proje Fabrikası" },
  {
    id: "pisirme",
    label: "Pişirme Ekipmanları",
    subs: [
      "Ocak & Setüstü",
      "Fritöz",
      "Izgara & Mangal",
      "Salamander",
      "Combi Fırın",
      "Pizza Fırını",
      "Pasta Cooker",
    ],
  },
  {
    id: "sogutma",
    label: "Soğutma Ekipmanları",
    subs: [
      "Dik Tip Buzdolabı",
      "Tezgah Tipi Buzdolabı",
      "Derin Dondurucu",
      "Saladette",
      "Setaltı Buzdolabı",
      "Soğuk Oda",
    ],
  },
  {
    id: "hazirlik",
    label: "Hazırlık Ekipmanları",
    subs: ["Çalışma Tezgahı", "Sebze Yıkama", "Kıyma Makinesi", "Dilimleme", "Vakum"],
  },
  {
    id: "yikama",
    label: "Yıkama Ekipmanları",
    subs: ["Bulaşık Makinesi", "Glass Washer", "Çöp Sıyırma", "Evye"],
  },
  {
    id: "kahve",
    label: "Kahve & Espresso",
    subs: ["Espresso Makinesi", "Kahve Değirmeni", "Filter Kahve", "Türk Kahvesi"],
  },
  {
    id: "icecek",
    label: "İçecek Ekipmanları",
    subs: ["Blender", "Buz Makinesi", "Buz Kıyıcı", "Soğutucu Vitrin"],
  },
  {
    id: "bar",
    label: "Bar Ekipmanları",
    subs: ["Bar Tezgahı", "Şarapdolabı", "Cocktail Station", "Mobil Bar"],
  },
  {
    id: "pastane",
    label: "Pastane & Tatlı",
    subs: ["Mikser", "Hamur Açıcı", "Pastane Vitrin", "Konveksiyonlu Fırın"],
  },
  {
    id: "pizza",
    label: "Pizza Ekipmanları",
    subs: ["Pizza Fırını", "Hamur Mikseri", "Pizza Prep Tezgahı"],
  },
  {
    id: "catering",
    label: "Catering Ekipmanları",
    subs: ["Chafing Dish", "Mobil Sıcak Dolap", "Bain-Marie"],
  },
  {
    id: "soguk-oda",
    label: "Soğuk Oda",
    subs: ["Panel & Kapı", "Soğutma Ünitesi", "Raflama"],
  },
  {
    id: "mobilya",
    label: "Mutfak Mobilyaları",
    subs: ["Tezgah", "Raf", "Davlumbaz", "Yer Giderleri"],
  },
  {
    id: "hijyen",
    label: "Hijyen & Temizlik",
    subs: ["Hijyen Paspası", "Bone Galoş Ünitesi", "Sinek Öldürücü"],
  },
  { id: "besos", label: "Bar Design — Besos" },
];

export default function Sidebar() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>☰ Tüm Kategoriler</div>
      <ul className={styles.list}>
        {CATEGORIES.map((cat) => (
          <li
            key={cat.id}
            className={styles.item}
            onMouseEnter={() => setOpenId(cat.id)}
            onMouseLeave={() => setOpenId(null)}
          >
            <button type="button" className={styles.itemBtn}>
              <span>{cat.label}</span>
              {cat.subs && <span className={styles.arrow}>›</span>}
            </button>

            {cat.subs && openId === cat.id && (
              <div className={styles.flyout}>
                <div className={styles.flyoutTitle}>{cat.label}</div>
                <ul className={styles.flyoutList}>
                  {cat.subs.map((sub) => (
                    <li key={sub} className={styles.flyoutItem}>
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
