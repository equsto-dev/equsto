/**
 * AVATHERM ürünleri → dept tasima (Taşıma ekipmanları).
 * KİLİT: public/yukselendustriyel-araba-KILIT.txt
 */

export function isAvathermRow(row) {
  const name = String(row?.name || "");
  const brand = String(row?.brand || "");
  const cat = String(row?.category || "");
  const id = String(row?.id || "");
  const sku = String(row?.sku || "");
  if (/avatherm/i.test(name) || /avatherm/i.test(brand)) return true;
  if (cat === "avatherm") return true;
  if (/^avatherm-/i.test(sku)) return true;
  if (/^av\d/i.test(sku)) return true;
  if (/\bAV[-\s]?\d{2}\b/i.test(name)) return true;
  if (/^yukselsatis__av/i.test(id)) return true;
  return false;
}

export function avathermTasimaCategory(name, subcatSlug = "") {
  const sub = String(subcatSlug || "").toLocaleLowerCase("tr");
  if (/tepsi-tasima-arabasi/.test(sub)) return "servis-arabalar";
  const n = String(name || "").toLocaleLowerCase("tr");
  if (/tepsi taşıma araba|tepsi tasima araba/.test(n)) return "servis-arabalar";
  if (/trolley|600m|601m|601\b|600x2|kulplu|kulpsuz|tekerlek/i.test(n)) return "servis-arabalar";
  return "tasima-ekipmanlari-yemek-tasima-kaplari";
}

const CAT_LABELS = {
  "servis-arabalar": "Servis Arabalar",
  "tasima-ekipmanlari-yemek-tasima-kaplari": "Yemek Taşıma Kapları",
};

export function applyAvathermTasimaMeta(row, subcatSlug = "") {
  const category = avathermTasimaCategory(row.name, subcatSlug || row.alt_kategori_1 || "");
  const catLabel = CAT_LABELS[category] || "Taşıma Ekipmanları";
  row.dept = "tasima";
  row.category = category;
  row.urun_kategori = "Taşıma";
  row.urun_alt_kategori = catLabel;
  row.kategori_yolu = ["Taşıma", catLabel];
  if (!row.brand || /yuksel/i.test(row.brand)) row.brand = "Yüksel Endüstriyel";
  return row;
}
