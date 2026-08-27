import { CatalogRow } from "./google-merchant-feed";

export interface ProductDetail {
  sectionName: string;
  attributeName: string;
  attributeValue: string;
}

export function extractTechnicalDetails(row: CatalogRow): ProductDetail[] {
  const details: ProductDetail[] = [];
  const dept = String(row.dept || "").toLowerCase();
  const category = String(row.category || "").toLowerCase();
  const isFridge = dept === "sogutma" || category.includes("buz") || String(row.name || "").toLowerCase().includes("buzdolab");

  // We only target refrigerators/cooling for now, but this can be generic
  if (!isFridge) return details;

  let width: string | null = null;
  let depth: string | null = null;
  let height: string | null = null;
  let tempRange: string | null = null;
  let doorCount: string | null = null;
  let volume: string | null = null;
  let power: string | null = null;
  let material: string | null = null;

  // 1. Electrolux Parsing (teknik_ozellikler)
  if (Array.isArray(row.teknik_ozellikler)) {
    for (const spec of row.teknik_ozellikler) {
      const s = String(spec).trim();
      if (s.includes("Genişlik:")) width = s.split("Genişlik:")[1]?.trim();
      if (s.includes("Derinlik:")) depth = s.split("Derinlik:")[1]?.trim();
      if (s.includes("Yükseklik:")) height = s.split("Yükseklik:")[1]?.trim();
      if (s.includes("Net hacim:")) volume = s.split("Net hacim:")[1]?.trim();
      if (s.includes("Güç:")) power = s.split("Güç:")[1]?.trim();
    }
  }

  // 2. Yuksel / Portabianco / General Specs Parsing
  const specs = String(row.specs || row.aciklama || "");
  if (specs) {
    // Dimension matching like : 176.5*70*60 (W*D*H)
    const dimMatch = specs.match(/:?\s*(\d+(?:\.\d+)?)\s*[\*x]\s*(\d+(?:\.\d+)?)\s*[\*x]\s*(\d+(?:\.\d+)?)/);
    if (dimMatch) {
      if (!width) width = `${dimMatch[1]} cm`;
      if (!depth) depth = `${dimMatch[2]} cm`;
      if (!height) height = `${dimMatch[3]} cm`;
    }

    // Temperature matching like (-10/-20) or (-2/+8)
    const tempMatch = specs.match(/\(\s*([+-]?\d+)\s*\/\s*([+-]?\d+)\s*\)/);
    if (tempMatch) {
      tempRange = `${tempMatch[1]}°C / ${tempMatch[2]}°C`;
    }

    // Material
    if (specs.includes("304 Kalite")) material = "304 Paslanmaz Çelik";
    else if (specs.includes("430 Kalite")) material = "430 Paslanmaz Çelik";
    else if (specs.toLowerCase().includes("galvaniz")) material = "Galvaniz";
    else if (specs.toLowerCase().includes("boyalı sac")) material = "Boyalı Sac";

    // Volume explicitly listed in generic text?
    const volMatch = specs.match(/(\d+)\s*(Lt|Litre|L)\b/i);
    if (volMatch && !volume) {
      volume = `${volMatch[1]} L`;
    }
    
    // Power (W / kW)
    const powerMatch = specs.match(/(\d+(?:\.\d+)?)\s*(kW|W)\b/i);
    if (powerMatch && !power) {
      power = `${powerMatch[1]} ${powerMatch[2]}`;
    }
  }

  // Door Count heuristics from name or specs
  const combinedText = (String(row.name || "") + " " + specs).toUpperCase();
  if (combinedText.includes("BİR KAPILI") || combinedText.includes("TEK KAPILI") || combinedText.match(/\b1\s*KAPI/)) doorCount = "1";
  else if (combinedText.includes("İKİ KAPILI") || combinedText.includes("2 KAPILI") || combinedText.match(/\b2\s*KAPI/)) doorCount = "2";
  else if (combinedText.includes("ÜÇ KAPILI") || combinedText.includes("3 KAPILI") || combinedText.match(/\b3\s*KAPI/)) doorCount = "3";
  else if (combinedText.includes("DÖRT KAPILI") || combinedText.includes("4 KAPILI") || combinedText.match(/\b4\s*KAPI/)) doorCount = "4";
  else if (combinedText.includes("BEŞ KAPILI") || combinedText.includes("5 KAPILI") || combinedText.match(/\b5\s*KAPI/)) doorCount = "5";
  else if (combinedText.includes("ALTI KAPILI") || combinedText.includes("6 KAPILI") || combinedText.match(/\b6\s*KAPI/)) doorCount = "6";

  // Build the details array
  const add = (sectionName: string, attributeName: string, attributeValue: string | null) => {
    if (attributeValue && attributeValue.trim()) {
      details.push({ sectionName, attributeName, attributeValue: attributeValue.trim() });
    }
  };

  add("Dimensions", "Genişlik (Width)", width);
  add("Dimensions", "Derinlik (Depth)", depth);
  add("Dimensions", "Yükseklik (Height)", height);
  add("Technical", "Kapı Sayısı", doorCount);
  add("Technical", "Çalışma Sıcaklığı", tempRange);
  add("Technical", "Kapasite", volume);
  add("Technical", "Güç", power);
  add("Material", "Malzeme", material);

  return details;
}
