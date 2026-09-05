/**
 * Semantik ürün özelliklerini katalog verisinden çıkarır.
 * P0 keyword'leri (konveksiyonlu fırın, kombi fırın, sanayi tipi ocak, gazlı/elektrikli/indüksiyon, GN kapasite, vb.)
 * ürün title, schema, feed için kullanılabilir hale getirir.
 */

export interface ProductSemantics {
  /** Ürün tipi normalizasyonu: konveksiyonlu-firin, kombi-firin, sanayi-tipi-ocak, induksiyonlu-ocak, fritoz, ızgara, kuzine, benmari, salamander, pizza-firini, tost-makineleri, pilic-cevirme, vb. */
  productType: string | null;
  /** Enerji tipi: elektrikli, gazli, dogalgazli, lpg, induksiyon, trifaz, monofaz */
  energyType: string | null;
  /** Birleşik tip + enerji: "gazlı fırın", "elektrikli ocak", "indüksiyonlu ocak", "gazlı kuzine", vb. */
  productTypeWithEnergy: string | null;
  /** Kapasite: "10 GN 1/1", "20 GN 2/1", "8+8 L", "6 Gözlü", "40x60 cm", "4 Tepsi" */
  capacity: string | null;
  /** Model ailesi: iCombi Pro, iCombi Classic, Cheftop, Bakerlux, OKFE, OKFG, vb. */
  modelFamily: string | null;
  /** Seri: 700 Seri, 900 Seri, Optimum, Plus, One, Compact */
  series: string | null;
  /** Endüstriyel/sanayi tipi bayrağı */
  isIndustrial: boolean;
}

/** Türkçe karakterleri normalize et */
function normalizeTr(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i");
}

/** Specs/name/category metin birleşimi */
function getHaystack(row: Record<string, unknown>): string {
  const parts = [
    String(row.name || ""),
    String(row.specs || row.aciklama || row.description || ""),
    String(row.category || ""),
    String(row.urun_kategori || ""),
    String(row.urun_alt_kategori || ""),
    String(row.kategori || ""),
    String(row.alt_kategori || ""),
  ];
  return normalizeTr(parts.join(" "));
}

/** Enerji tipi tespiti */
function detectEnergyType(hay: string): string | null {
  if (/\b(indüksiyon|induction)\b/.test(hay)) return "indüksiyon";
  if (/\b(trifaz|3\s*faz|3faz|400v|380v)\b/.test(hay) && /\b(elektrik|electric)\b/.test(hay)) return "trifaz elektrikli";
  if (/\b(monofaz|1\s*faz|1faz|230v|220v)\b/.test(hay) && /\b(elektrik|electric)\b/.test(hay)) return "monofaz elektrikli";
  if (/\b(elektrik|electric|elektrikli)\b/.test(hay) && !/\b(gaz|dogalgaz|lpg|indüksiyon)\b/.test(hay)) return "elektrikli";
  if (/\b(doğalgaz|dogalgaz|dgaz|natural gas|ng\b)/.test(hay)) return "doğalgazlı";
  if (/\b(lpg|tube gaz|tüp gaz)\b/.test(hay)) return "lpg";
  if (/\b(gaz|gazli|gas\b)/.test(hay) && !/\b(elektrik|indüksiyon)\b/.test(hay)) return "gazlı";
  return null;
}

/** Ürün tipi normalizasyonu - Cafemarkt terminolojisiyle uyumlu */
function detectProductType(hay: string, category: string): { productType: string | null; productTypeWithEnergy: string | null; isIndustrial: boolean } {
  let productType: string | null = null;
  let isIndustrial = false;

  // Fırın tipleri - en spesifikten genele
  if (/\b(kombi fırın|kombi firin|kombine fırın|kombine firin|combi oven|combi firin)\b/.test(hay)) productType = "kombi fırın";
  else if (/\b(konveksiyonlu fırın|konveksiyonlu firin|konveksiyonel fırın|konveksiyonel firin|convection oven)\b/.test(hay)) productType = "konveksiyonlu fırın";
  else if (/\b(pizza fırın|pizza firin|pizza oven)\b/.test(hay)) productType = "pizza fırın";
  else if (/\b(patisserie fırın|patisserie firin|pastane fırın|pastane firin|bakery oven)\b/.test(hay)) productType = "patisserie fırın";
  else if (/\b(mayalama dolab|mayalama dolabi|proofer)\b/.test(hay)) productType = "mayalama dolabı";
  else if (/\b(mikrodalga fırın|mikrodalga firin|microwave|jet fırın|jet firin)\b/.test(hay)) productType = "mikrodalga fırın";
  else if (/\b(fırın|firin|oven)\b/.test(hay)) productType = "fırın";

  // Ocak tipleri
  else if (/\b(indüksiyonlu ocak|indüksiyon ocak|induction hob|induction cooktop)\b/.test(hay)) productType = "indüksiyonlu ocak";
  else if (/\b(wok ocak|wok induction|wok burner)\b/.test(hay)) productType = "wok ocak";
  else if (/\b(kuzine|kuzine ocak|range cooker|cooking range)\b/.test(hay)) productType = "kuzine";
  else if (/\b(salamander|salamander ızgara|salamander izgara|overhead grill|broiler)\b/.test(hay)) productType = "salamander";
  else if (/\b(set.?üstü ocak|setustu ocak|countertop range|tabletop range)\b/.test(hay)) productType = "set üstü ocak";
  else if (/\b(yer ocak|yer ocak|floor range|floor cooker)\b/.test(hay)) productType = "yer ocak";
  else if (/\b(sanayi tipi ocak|sanayi ocak|endüstriyel ocak|endustriyel ocak|commercial range|industrial range)\b/.test(hay)) { productType = "sanayi tipi ocak"; isIndustrial = true; }
  else if (/\b(ocak|range|burner|burner)\b/.test(hay)) productType = "ocak";

  // Fritöz
  else if (/\b(fritöz|fritoz|deep fryer|fryer)\b/.test(hay)) { productType = "fritöz"; if (/\b(endüstriyel|endustriyel|sanayi|industrial)\b/.test(hay)) isIndustrial = true; }

  // Izgara
  else if (/\b(lav taşlı ızgara|lav tasli izgara|lavta ızgara|lavta izgara|lavastone grill)\b/.test(hay)) productType = "lav taşlı ızgara";
  else if (/\b(pleyt ızgara|pleyt izgara|pleyt griddle|plancha|steel griddle|chrome griddle)\b/.test(hay)) productType = "pleyt ızgara";
  else if (/\b(char ızgara|char izgara|char grill|kömürlü ızgara|kömürlü izgara|charcoal grill)\b/.test(hay)) productType = "char ızgara";
  else if (/\b(asansörlü ızgara|asansorlu izgara|lift grill)\b/.test(hay)) productType = "asansörlü ızgara";
  else if (/\b(ocakbaşı ızgara|ocakbasi izgara|ocakbaşı|ocakbasi|mangal grill)\b/.test(hay)) productType = "ocakbaşı ızgara";
  else if (/\b(döner ızgara|doner izgara|doner grill)\b/.test(hay)) productType = "döner ızgara";
  else if (/\b(sanayi tipi ızgara|sanayi izgara|endüstriyel ızgara|endustriyel izgara|industrial grill)\b/.test(hay)) { productType = "sanayi tipi ızgara"; isIndustrial = true; }
  else if (/\b(ızgara|izgara|griddle|grill)\b/.test(hay)) productType = "ızgara";

  // Diğer pişirme
  else if (/\b(döner ocağı|doner ocak|doner machine|doner kebab)\b/.test(hay)) productType = "döner ocağı";
  else if (/\b(döner makinesi|doner makinesi|vertical rotisserie)\b/.test(hay)) productType = "döner makinesi";
  else if (/\b(piliç çevirme|pilic cevirme|rotisserie|chicken rotisserie)\b/.test(hay)) productType = "piliç çevirme";
  else if (/\b(tost makinesi|tost makinesi|contact grill|sandwich grill|panini grill)\b/.test(hay)) productType = "tost makinesi";
  else if (/\b(waffle makinesi|waffle makinesi|waffle iron|waffle baker)\b/.test(hay)) productType = "waffle makinesi";
  else if (/\b(benmari|bain marie|chafing dish|hot holding|sıcak teşhir|sicak teshir|servis ünitesi|servis uniteleri)\b/.test(hay)) productType = "benmari";
  else if (/\b(kaynatma tenceresi|kaynatma tencere|boiling kettle|tilting kettle)\b/.test(hay)) productType = "kaynatma tenceresi";

  // Kategori bazlı fallback
  if (!productType) {
    const cat = String(category || "").toLowerCase();
    if (cat === "firinlar") productType = "fırın";
    else if (cat === "sanayi-ocaklari") { productType = "sanayi tipi ocak"; isIndustrial = true; }
    else if (cat === "sanayi-tipi-izgaralar") { productType = "sanayi tipi ızgara"; isIndustrial = true; }
    else if (cat === "kuzineler") productType = "kuzine";
    else if (cat === "fritozler") productType = "fritöz";
    else if (cat === "doner-ocaklari-") productType = "döner ocağı";
    else if (cat === "tost-makineleri") productType = "tost makinesi";
    else if (cat === "pilic-cevirme-makineleri") productType = "piliç çevirme";
    else if (cat === "ocakbasi-izgara") productType = "ocakbaşı ızgara";
    else if (cat === "benmariler-yemeklikler") productType = "benmari";
  }

  // Birleşik tip + enerji (P0 keyword kombinasyonları için)
  let productTypeWithEnergy: string | null = null;
  if (productType && /\b(fırın|ocak|kuzine|fritöz|ızgara)\b/.test(productType)) {
    const energy = detectEnergyType(hay);
    if (energy) {
      // "gazlı fırın", "elektrikli ocak", "indüksiyonlu ocak", "gazlı kuzine", "gazlı fritöz", "elektrikli ızgara"
      productTypeWithEnergy = `${energy} ${productType}`;
    }
  }

  return { productType, productTypeWithEnergy, isIndustrial };
}

/** Kapasite tespiti */
function detectCapacity(hay: string, row: Record<string, unknown>): string | null {
  // GN kapasitesi: "10 GN 1/1", "20 GN 2/1", "40 GN 1/1"
  const gnMatch = hay.match(/(\d+)\s*gn\s*(1\/?1|2\/?1|1\/?2)/i);
  if (gnMatch) {
    const count = gnMatch[1];
    const size = gnMatch[2].replace("/", "/");
    return `${count} GN ${size}`;
  }
  // "10 tepsi", "20 tepsi", "6 tepsili"
  const tepsiMatch = hay.match(/(\d+)\s*tepsi/i);
  if (tepsiMatch) return `${tepsiMatch[1]} Tepsi`;
  // "40x60 cm", "60x40 cm"
  const dimMatch = hay.match(/(\d+)\s*[x×]\s*(\d+)\s*cm/i);
  if (dimMatch) return `${dimMatch[1]}x${dimMatch[2]} cm`;
  // "X Gözlü", "X gazlı", "X elektrikli" (ocak için)
  const gozMatch = hay.match(/(\d+)\s*(gözlü|gozlu|burner)/i);
  if (gozMatch) return `${gozMatch[1]} Gözlü`;
  // Litre: "8+8 L", "10 L", "5+5 litre"
  const litreMatch = hay.match(/(\d+)\s*\+\s*(\d+)\s*(l|litre|lt)\b/i);
  if (litreMatch) return `${litreMatch[1]}+${litreMatch[2]} L`;
  const singleLitre = hay.match(/(\d+)\s*(l|litre|lt)\b/i);
  if (singleLitre && !hay.match(/\d+\s*\+\s*\d+\s*l/i)) return `${singleLitre[1]} L`;
  // Dilim: "20 dilim"
  const dilimMatch = hay.match(/(\d+)\s*dilim/i);
  if (dilimMatch) return `${dilimMatch[1]} Dilim`;

  // olculer/olçuler alanından
  const olculer = (row.olculer || row.olçuler || {}) as Record<string, unknown>;
  if (olculer.kapasite_lt) return `${olculer.kapasite_lt} L`;
  if (olculer.kapasite_gn) return `${olculer.kapasite_gn}`;

  return null;
}

/** Model ailesi tespiti */
function detectModelFamily(hay: string, name: string): string | null {
  const combined = `${hay} ${normalizeTr(name)}`;
  if (/\b(icom|icombi|i combi)\b/.test(combined)) return "iCombi";
  if (/\b(icombi pro|icombipro)\b/.test(combined)) return "iCombi Pro";
  if (/\b(icombi classic|icombiclassic)\b/.test(combined)) return "iCombi Classic";
  if (/\b(cheftop|chef top)\b/.test(combined)) return "Cheftop";
  if (/\b(bakertop|baker top)\b/.test(combined)) return "Bakertop";
  if (/\b(bakerlux|baker lux)\b/.test(combined)) return "Bakerlux";
  if (/\b(okfe|okfg|okfbe)\b/.test(combined)) return "OKFE/OKFG";
  if (/\b(selfcooking|self cooking)\b/.test(combined)) return "SelfCookingCenter";
  if (/\b(cheflux|chef lux)\b/.test(combined)) return "Cheflux";
  if (/\b(shop\.?pro|shoppro)\b/.test(combined)) return "SHOP.Pro";
  if (/\b(rosella|arianna|vittoria|domenica|anna)\b/.test(combined)) return "Bakerlux SHOP.Pro";
  if (/\b(linemicro|line micro)\b/.test(combined)) return "Linemicro";
  return null;
}

/** Seri tespiti */
function detectSeries(hay: string): string | null {
  if (/\b(700\s*seri|700 seri|seri 700)\b/.test(hay)) return "700 Seri";
  if (/\b(900\s*seri|900 seri|seri 900)\b/.test(hay)) return "900 Seri";
  if (/\b(optimum|optimum seri)\b/.test(hay)) return "Optimum";
  if (/\b(plus|plus seri)\b/.test(hay)) return "Plus";
  if (/\b(one|one seri)\b/.test(hay)) return "One";
  if (/\b(compact|compact plus|compact seri)\b/.test(hay)) return "Compact";
  if (/\b(shop\.?pro|shoppro|shop pro)\b/.test(hay)) return "SHOP.Pro";
  return null;
}

/** Ana fonksiyon: üründen semantik özellikleri çıkar */
export function extractProductSemantics(row: Record<string, unknown>): ProductSemantics {
  const hay = getHaystack(row);
  const category = String(row.category || "");
  const name = String(row.name || "");

  const productTypeResult = detectProductType(hay, category);
  const energyType = detectEnergyType(hay);

  return {
    productType: productTypeResult.productType,
    energyType,
    productTypeWithEnergy: productTypeResult.productTypeWithEnergy,
    capacity: detectCapacity(hay, row),
    modelFamily: detectModelFamily(hay, name),
    series: detectSeries(hay),
    isIndustrial: productTypeResult.isIndustrial,
  };
}

/** Semantik bilgileri title'a uygun formatta birleştir */
export function buildSemanticTitleParts(semantics: ProductSemantics): string[] {
  const parts: string[] = [];
  
  if (semantics.modelFamily) parts.push(semantics.modelFamily);
  if (semantics.series) parts.push(semantics.series);
  if (semantics.productType) parts.push(semantics.productType);
  if (semantics.capacity) parts.push(semantics.capacity);
  if (semantics.energyType) parts.push(semantics.energyType);
  
  return parts;
}

/** SEO title için kısa versiyon (max ~60 char) */
export function buildSeoTitle(rawName: string, brand: string, semantics: ProductSemantics): string {
  const semanticParts = buildSemanticTitleParts(semantics);
  
  // Marka zaten isimde varsa tekrar etme
  let baseName = rawName;
  if (brand && !baseName.toLowerCase().includes(brand.toLowerCase())) {
    baseName = `${brand} ${baseName}`;
  }
  
  // Semantik parçaları ekle (zaten isimde yoksa)
  for (const part of semanticParts) {
    const partLower = part.toLowerCase();
    if (!baseName.toLowerCase().includes(partLower)) {
      baseName += ` ${part}`;
    }
  }
  
  // Max 60 karakter (Google SERP için)
  return baseName.replace(/\.$/, "").slice(0, 60);
}

/** Merchant feed title için (max 150 char) */
export function buildMerchantTitle(rawName: string, brand: string, semantics: ProductSemantics): string {
  const semanticParts = buildSemanticTitleParts(semantics);
  
  let baseName = rawName;
  if (brand && !baseName.toLowerCase().includes(brand.toLowerCase().slice(0, 12))) {
    baseName = `${brand} ${baseName}`;
  }
  
  for (const part of semanticParts) {
    const partLower = part.toLowerCase();
    if (!baseName.toLowerCase().includes(partLower)) {
      baseName += ` ${part}`;
    }
  }
  
  return baseName.slice(0, 150);
}

/** JSON-LD Product name için */
export function buildJsonLdName(rawName: string, brand: string, semantics: ProductSemantics): string {
  const semanticParts = buildSemanticTitleParts(semantics);
  
  let baseName = rawName;
  if (brand && !baseName.toLowerCase().includes(brand.toLowerCase())) {
    baseName = `${brand} ${baseName}`;
  }
  
  for (const part of semanticParts) {
    const partLower = part.toLowerCase();
    if (!baseName.toLowerCase().includes(partLower)) {
      baseName += ` ${part}`;
    }
  }
  
  return baseName;
}